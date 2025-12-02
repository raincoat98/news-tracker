require('dotenv').config();

const API_CONFIG = {
  baseUrl: 'https://openapi.naver.com/v1/search',
  clientId: process.env.NAVER_CLIENT_ID,
  clientSecret: process.env.NAVER_CLIENT_SECRET,
  endpoints: {
    news: '/news.json'
  }
};

module.exports = API_CONFIG;
