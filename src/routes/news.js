const express = require('express');
const router = express.Router();
const newsService = require('../services/newsService');

/**
 * GET /api/news/search
 * 뉴스 검색
 *
 * Query Parameters:
 * - query (필수): 검색어
 * - display (선택): 검색 결과 개수 (기본값: 10, 최대: 100)
 * - start (선택): 검색 시작 위치 (기본값: 1, 최대: 1000)
 * - sort (선택): 정렬 방식 (sim: 정확도순, date: 날짜순, 기본값: date)
 */
router.get('/search', async (req, res) => {
  try {
    const { query, display, start, sort } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: '검색어(query)는 필수 파라미터입니다.'
      });
    }

    const options = {};
    if (display) options.display = parseInt(display, 10);
    if (start) options.start = parseInt(start, 10);
    if (sort) options.sort = sort;

    const result = await newsService.searchNews(query, options);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/news/trending
 * 실시간 인기 검색어 뉴스
 */
router.get('/trending', async (req, res) => {
  try {
    const trendingKeywords = ['뉴스', '속보', '이슈'];
    const results = [];

    for (const keyword of trendingKeywords) {
      const result = await newsService.searchNews(keyword, {
        display: 5,
        sort: 'date'
      });
      results.push({
        keyword,
        count: result.items.length,
        items: result.items
      });
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
