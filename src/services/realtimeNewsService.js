const cron = require('node-cron');
const newsService = require('./newsService');

class RealtimeNewsService {
  constructor() {
    this.subscribers = new Map(); // 구독자 저장
    this.newsCache = new Map(); // 키워드별 뉴스 캐시
    this.scheduledTasks = new Map(); // 스케줄된 작업
    this.isRunning = false;
  }

  /**
   * 특정 검색어를 구독
   * @param {string} keyword - 구독할 검색어
   * @param {Function} callback - 새로운 뉴스 수신 콜백
   * @param {Object} options - 구독 옵션
   * @returns {Promise<string>} 구독 ID
   */
  async subscribe(keyword, callback, options = {}) {
    if (!this.subscribers.has(keyword)) {
      this.subscribers.set(keyword, []);
      await this._startFetching(keyword, options);
    }

    const subscriptionId = `${keyword}_${Date.now()}_${Math.random()}`;
    this.subscribers.get(keyword).push({
      id: subscriptionId,
      callback,
      options
    });

    // 캐시된 뉴스 즉시 전송 제거
    // (클라이언트에서 getNewsPage로 명시적으로 요청하게 함)
    // if (this.newsCache.has(keyword)) {
    //   callback({
    //     type: 'cached',
    //     keyword,
    //     news: this.newsCache.get(keyword)
    //   });
    // }

    console.log(`[구독] ${keyword} - ID: ${subscriptionId}`);
    return subscriptionId;
  }

  /**
   * 구독 취소
   * @param {string} subscriptionId - 구독 ID
   */
  unsubscribe(subscriptionId) {
    for (const [keyword, subscribers] of this.subscribers.entries()) {
      const index = subscribers.findIndex(sub => sub.id === subscriptionId);
      if (index !== -1) {
        subscribers.splice(index, 1);
        console.log(`[구독 취소] ${subscriptionId}`);

        // 마지막 구독자가 없으면 수집 중지 (캐시는 유지)
        if (subscribers.length === 0) {
          this._stopFetching(keyword);
        }
        return true;
      }
    }
    return false;
  }

  /**
   * 뉴스 수집 시작
   * @private
   */
  async _startFetching(keyword, options = {}) {
    const {
      interval = '*/5 * * * *', // 기본 5분마다
      display = 10,
      sort = 'date'
    } = options;

    console.log(`[수집 시작] ${keyword} (간격: ${interval})`);

    // 즉시 한 번 실행 (첫 뉴스 데이터가 도착할 때까지 대기)
    await this._fetchNews(keyword, { display, sort });

    // 스케줄 설정
    const task = cron.schedule(interval, () => {
      this._fetchNews(keyword, { display, sort });
    });

    this.scheduledTasks.set(keyword, task);
  }

  /**
   * 뉴스 수집 중지
   * @private
   */
  _stopFetching(keyword) {
    const task = this.scheduledTasks.get(keyword);
    if (task) {
      task.stop();
      this.scheduledTasks.delete(keyword);
      console.log(`[수집 중지] ${keyword}`);
    }
  }

  /**
   * 뉴스 가져오기 및 배포
   * @private
   */
  async _fetchNews(keyword, options) {
    try {
      const result = await newsService.searchNews(keyword, options);
      const news = result.items;

      // 이전 뉴스와 비교해서 새로운 뉴스만 추출
      const cachedNews = this.newsCache.get(keyword) || [];
      const newNews = this._findNewNews(news, cachedNews);

      // 캐시 업데이트
      this.newsCache.set(keyword, news);

      // 구독자에게 알림
      if (newNews.length > 0) {
        this._notifySubscribers(keyword, newNews, 'new');
      }

      // 모든 뉴스도 함께 전송 (UI 업데이트용)
      this._notifySubscribers(keyword, news, 'updated');

      console.log(`[수집 완료] ${keyword}: 새로운 뉴스 ${newNews.length}개, 총 ${news.length}개`);
    } catch (error) {
      console.error(`[수집 오류] ${keyword}: ${error.message}`);
      this._notifySubscribersError(keyword, error);
    }
  }

  /**
   * 새로운 뉴스 찾기
   * @private
   */
  _findNewNews(currentNews, cachedNews) {
    // title을 기준으로 중복 확인
    const cachedTitles = new Set(cachedNews.map(n => n.title));
    return currentNews.filter(n => !cachedTitles.has(n.title));
  }

  /**
   * 구독자에게 알림
   * @private
   */
  _notifySubscribers(keyword, news, type = 'new') {
    const subscribers = this.subscribers.get(keyword) || [];
    subscribers.forEach(sub => {
      try {
        sub.callback({
          type,
          keyword,
          timestamp: new Date(),
          news,
          count: news.length
        });
      } catch (error) {
        console.error(`[알림 오류] ${sub.id}:`, error.message);
      }
    });
  }

  /**
   * 구독자에게 에러 알림
   * @private
   */
  _notifySubscribersError(keyword, error) {
    const subscribers = this.subscribers.get(keyword) || [];
    subscribers.forEach(sub => {
      try {
        sub.callback({
          type: 'error',
          keyword,
          error: error.message
        });
      } catch (err) {
        console.error(`[오류 알림 실패] ${sub.id}:`, err.message);
      }
    });
  }

  /**
   * 캐시된 뉴스 조회
   * @param {string} keyword - 검색어
   * @returns {Array} 뉴스 배열
   */
  getCache(keyword) {
    return this.newsCache.get(keyword) || [];
  }

  /**
   * 모든 캐시 조회
   * @returns {Object} 키워드별 뉴스
   */
  getAllCache() {
    const result = {};
    for (const [keyword, news] of this.newsCache.entries()) {
      result[keyword] = news;
    }
    return result;
  }

  /**
   * 더 많은 뉴스 페이지 가져오기
   * @param {string} keyword - 검색어
   * @param {number} pageNumber - 페이지 번호 (1부터 시작)
   * @param {Object} options - 추가 옵션
   * @returns {Promise<Object>} 페이지 뉴스 데이터
   */
  async getNewsPage(keyword, pageNumber = 1, options = {}) {
    try {
      const { display = 10, sort = 'date' } = options;
      const start = (pageNumber - 1) * display + 1;

      if (start > 1000) {
        throw new Error('최대 1000개까지의 뉴스만 조회 가능합니다.');
      }

      const result = await newsService.searchNews(keyword, {
        display,
        start,
        sort
      });

      return {
        success: true,
        keyword,
        page: pageNumber,
        start: result.start,
        display: result.display,
        total: result.total,
        items: result.items,
        hasNextPage: result.start + result.display - 1 < result.total,
        totalPages: Math.ceil(result.total / display)
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 구독자 정보 조회
   * @returns {Object} 키워드별 구독자 수
   */
  getSubscriberInfo() {
    const info = {};
    for (const [keyword, subscribers] of this.subscribers.entries()) {
      info[keyword] = subscribers.length;
    }
    return info;
  }

  /**
   * 서비스 상태 조회
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      keywords: Array.from(this.subscribers.keys()),
      subscribers: this.getSubscriberInfo(),
      cache: Object.keys(this.newsCache)
    };
  }
}

module.exports = new RealtimeNewsService();
