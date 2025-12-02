const axios = require("axios");
const API_CONFIG = require("../config/api");

class NewsService {
  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.baseUrl,
      headers: {
        "X-Naver-Client-Id": API_CONFIG.clientId,
        "X-Naver-Client-Secret": API_CONFIG.clientSecret,
      },
    });
  }

  /**
   * 뉴스 검색
   * @param {string} query - 검색어
   * @param {Object} options - 검색 옵션
   * @param {number} options.display - 검색 결과 개수 (기본값: 10, 최대: 100)
   * @param {number} options.start - 검색 시작 위치 (기본값: 1, 최대: 1000)
   * @param {string} options.sort - 정렬 방식 (sim: 정확도순, date: 날짜순)
   * @returns {Promise<Object>} 뉴스 검색 결과
   */
  async searchNews(query, options = {}) {
    try {
      if (!query || query.trim().length === 0) {
        throw new Error("검색어는 필수입니다.");
      }

      const { display = 10, start = 1, sort = "date" } = options;

      // 파라미터 검증
      if (display < 1 || display > 100) {
        throw new Error("display는 1~100 사이의 값이어야 합니다.");
      }

      if (start < 1 || start > 1000) {
        throw new Error("start는 1~1000 사이의 값이어야 합니다.");
      }

      if (!["sim", "date"].includes(sort)) {
        throw new Error('sort는 "sim" 또는 "date"이어야 합니다.');
      }

      const response = await this.client.get(API_CONFIG.endpoints.news, {
        params: {
          query,
          display,
          start,
          sort,
        },
      });

      return this._formatResponse(response.data);
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * 응답 형식 변환
   * @private
   */
  _formatResponse(data) {
    return {
      success: true,
      total: data.total,
      start: data.start,
      display: data.display,
      lastBuildDate: data.lastBuildDate,
      items: data.items.map((item) => ({
        title: this._stripHtmlTags(item.title),
        originalLink: item.originallink,
        link: item.link,
        description: this._stripHtmlTags(item.description),
        pubDate: item.pubDate,
      })),
    };
  }

  /**
   * HTML 태그 제거
   * @private
   */
  _stripHtmlTags(text) {
    return text.replace(/<[^>]*>/g, "");
  }

  /**
   * 에러 처리
   * @private
   */
  _handleError(error) {
    if (error.response) {
      const status = error.response.status;
      const errorCode = error.response.data?.errorCode || "UNKNOWN";
      const errorMessage = error.response.data?.errorMessage || "API 요청 실패";

      const errorMap = {
        SE01: "잘못된 쿼리 요청입니다.",
        SE02: "display 값이 허용 범위(1~100)를 벗어났습니다.",
        SE03: "start 값이 허용 범위(1~1000)를 벗어났습니다.",
        SE04: "sort 값이 유효하지 않습니다.",
        SE06: "검색어 인코딩이 잘못되었습니다.",
        SE05: "존재하지 않는 검색 API입니다.",
        SE99: "서버 내부 오류가 발생했습니다.",
      };

      const message = errorMap[errorCode] || errorMessage;
      return new Error(`[${status}] ${message}`);
    } else if (
      error.message.includes("검색어") ||
      error.message.includes("display") ||
      error.message.includes("start") ||
      error.message.includes("sort")
    ) {
      return error;
    } else if (error.code === "ECONNREFUSED") {
      return new Error("API 서버에 연결할 수 없습니다.");
    } else if (error.code === "ENOTFOUND") {
      return new Error("API 서버 주소를 찾을 수 없습니다.");
    } else {
      return new Error(`요청 중 오류가 발생했습니다: ${error.message}`);
    }
  }
}

module.exports = new NewsService();
