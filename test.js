require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/news';

/**
 * 테스트: 기본 뉴스 검색
 */
async function testBasicSearch() {
  console.log('\n=== 테스트 1: 기본 뉴스 검색 ===');
  try {
    const response = await axios.get(`${BASE_URL}/search`, {
      params: {
        query: 'JavaScript',
        display: 5,
        sort: 'date'
      }
    });
    console.log(`✓ 검색 성공`);
    console.log(`  - 총 결과: ${response.data.total}개`);
    console.log(`  - 반환된 항목: ${response.data.items.length}개`);
    console.log(`  - 첫 번째 기사: ${response.data.items[0]?.title}`);
  } catch (error) {
    console.error(`✗ 검색 실패: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * 테스트: 정렬 옵션 (정확도순)
 */
async function testSortByRelevance() {
  console.log('\n=== 테스트 2: 정렬 옵션 (정확도순) ===');
  try {
    const response = await axios.get(`${BASE_URL}/search`, {
      params: {
        query: 'Python',
        display: 3,
        sort: 'sim'
      }
    });
    console.log(`✓ 검색 성공 (정확도순 정렬)`);
    response.data.items.forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${item.title}`);
    });
  } catch (error) {
    console.error(`✗ 검색 실패: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * 테스트: 페이지네이션
 */
async function testPagination() {
  console.log('\n=== 테스트 3: 페이지네이션 ===');
  try {
    const page1 = await axios.get(`${BASE_URL}/search`, {
      params: {
        query: 'AI',
        display: 3,
        start: 1
      }
    });
    const page2 = await axios.get(`${BASE_URL}/search`, {
      params: {
        query: 'AI',
        display: 3,
        start: 4
      }
    });

    console.log(`✓ 페이지네이션 성공`);
    console.log(`  - 첫 번째 페이지 첫 기사: ${page1.data.items[0]?.title}`);
    console.log(`  - 두 번째 페이지 첫 기사: ${page2.data.items[0]?.title}`);
  } catch (error) {
    console.error(`✗ 페이지네이션 실패: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * 테스트: 실시간 인기 뉴스
 */
async function testTrendingNews() {
  console.log('\n=== 테스트 4: 실시간 인기 뉴스 ===');
  try {
    const response = await axios.get(`${BASE_URL}/trending`);
    console.log(`✓ 실시간 인기 뉴스 조회 성공`);
    response.data.data.forEach(trend => {
      console.log(`  - ${trend.keyword}: ${trend.count}개 기사`);
    });
  } catch (error) {
    console.error(`✗ 조회 실패: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * 테스트: 오류 처리 - 검색어 없음
 */
async function testErrorHandling() {
  console.log('\n=== 테스트 5: 오류 처리 - 검색어 없음 ===');
  try {
    await axios.get(`${BASE_URL}/search`);
  } catch (error) {
    if (error.response?.status === 400) {
      console.log(`✓ 올바른 에러 응답: ${error.response.data.error}`);
    } else {
      console.error(`✗ 예상 외 에러: ${error.message}`);
    }
  }
}

/**
 * 모든 테스트 실행
 */
async function runAllTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Naver News Search API 테스트        ║');
  console.log('╚════════════════════════════════════════╝');

  console.log('\n주의: 서버가 실행 중이어야 합니다.');
  console.log('실행 명령어: npm start\n');

  await testBasicSearch();
  await testSortByRelevance();
  await testPagination();
  await testTrendingNews();
  await testErrorHandling();

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║      테스트 완료                       ║');
  console.log('╚════════════════════════════════════════╝\n');
}

runAllTests();
