require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const realtimeNewsService = require('./src/services/realtimeNewsService');

const PORT = process.env.PORT || 3000;

// HTTP 서버 생성
const server = http.createServer(app);

// Socket.IO 설정
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 구독 상태를 관리할 Map
const clientSubscriptions = new Map();

// Socket.IO 연결 처리
io.on('connection', (socket) => {
  console.log(`[연결] 클라이언트 연결됨: ${socket.id}`);

  clientSubscriptions.set(socket.id, []);

  // 뉴스 구독
  socket.on('subscribe', async (data) => {
    const { keyword, interval = '*/5 * * * *', display = 10 } = data;

    if (!keyword) {
      socket.emit('error', { message: '검색어(keyword)가 필요합니다.' });
      return;
    }

    console.log(`[구독] ${socket.id} -> ${keyword}`);

    try {
      // 실시간 서비스에 구독 (첫 뉴스를 가져올 때까지 대기)
      const subscriptionId = await realtimeNewsService.subscribe(
        keyword,
        (newsData) => {
          socket.emit('news', newsData);
        },
        { interval, display }
      );

      // 클라이언트 구독 목록에 추가
      const subscriptions = clientSubscriptions.get(socket.id) || [];
      subscriptions.push({ keyword, subscriptionId });
      clientSubscriptions.set(socket.id, subscriptions);

      socket.emit('subscribed', {
        keyword,
        subscriptionId,
        message: `${keyword} 구독 성공`
      });
    } catch (error) {
      console.error(`[구독 오류] ${keyword}:`, error.message);
      socket.emit('error', {
        message: `${keyword} 구독 중 오류 발생: ${error.message}`
      });
    }
  });

  // 뉴스 구독 취소
  socket.on('unsubscribe', (data) => {
    const { keyword, subscriptionId } = data;

    if (subscriptionId) {
      realtimeNewsService.unsubscribe(subscriptionId);
    }

    const subscriptions = clientSubscriptions.get(socket.id) || [];
    const index = subscriptions.findIndex(sub => sub.keyword === keyword);
    if (index !== -1) {
      subscriptions.splice(index, 1);
      clientSubscriptions.set(socket.id, subscriptions);
    }

    socket.emit('unsubscribed', {
      keyword,
      message: `${keyword} 구독 취소됨`
    });
  });

  // 캐시된 뉴스 요청
  socket.on('get-cached-news', (data) => {
    const { keyword } = data;
    const news = realtimeNewsService.getCache(keyword);
    socket.emit('cached-news', {
      keyword,
      news,
      count: news.length
    });
  });

  // 특정 페이지의 뉴스 요청
  socket.on('get-news-page', async (data) => {
    try {
      const { keyword, pageNumber = 1, display = 10, sort = 'date' } = data;

      if (!keyword) {
        socket.emit('error', { message: '검색어(keyword)가 필요합니다.' });
        return;
      }

      const result = await realtimeNewsService.getNewsPage(keyword, pageNumber, { display, sort });

      socket.emit('news-page', result);
    } catch (error) {
      console.error(`[페이지 요청 오류] ${data?.keyword}:`, error.message);
      socket.emit('error', {
        message: `뉴스 페이지 로드 실패: ${error.message}`
      });
    }
  });

  // 서비스 상태 요청
  socket.on('get-status', () => {
    const status = realtimeNewsService.getStatus();
    socket.emit('status', status);
  });

  // 연결 해제
  socket.on('disconnect', () => {
    console.log(`[연결 해제] 클라이언트 연결 해제됨: ${socket.id}`);

    // 클라이언트의 모든 구독 취소
    const subscriptions = clientSubscriptions.get(socket.id) || [];
    subscriptions.forEach(sub => {
      realtimeNewsService.unsubscribe(sub.subscriptionId);
    });

    clientSubscriptions.delete(socket.id);
  });

  // 에러 처리
  socket.on('error', (error) => {
    console.error(`[Socket 에러] ${socket.id}:`, error);
  });
});

server.listen(PORT, () => {
  console.log(`뉴스 트래커 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`http://localhost:${PORT}`);
  console.log(`WebSocket 서버 활성화됨`);
});
