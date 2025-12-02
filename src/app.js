const express = require('express');
const cors = require('cors');
const path = require('path');
const newsRoutes = require('./routes/news');

const app = express();

// 미들웨어
app.use(cors());
app.use(express.json());

// 정적 파일 제공
app.use(express.static(path.join(__dirname, '..', 'public')));

// API 라우트
app.use('/api/news', newsRoutes);

// 기본 라우트
app.get('/api', (req, res) => {
  res.json({
    message: 'News Tracker API',
    version: '1.0.0',
    endpoints: {
      searchNews: 'GET /api/news/search?query=검색어&display=10&start=1&sort=date',
      trendingNews: 'GET /api/news/trending'
    }
  });
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '요청한 엔드포인트를 찾을 수 없습니다.'
  });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: '서버 내부 오류가 발생했습니다.'
  });
});

module.exports = app;
