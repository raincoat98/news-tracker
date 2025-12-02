# News Tracker - 실시간 뉴스 추적 시스템

Naver Open API를 사용하여 **실시간으로 뉴스를 수집하고 추적**하는 Node.js 애플리케이션입니다.

## 주요 기능

### 🚀 REST API
- **뉴스 검색**: 검색어를 기반으로 뉴스 검색
- **페이지네이션**: 검색 결과 페이징 지원
- **정렬**: 날짜순/정확도순 정렬 옵션
- **인기 뉴스**: 실시간 인기 검색어 뉴스 조회

### 🔄 WebSocket 실시간 뉴스 푸시
- **자동 수집**: 설정한 검색어를 일정 시간마다 자동으로 수집
- **실시간 푸시**: 새로운 뉴스가 수집되면 즉시 클라이언트에 푸시
- **다중 구독**: 여러 검색어를 동시에 구독 가능
- **효율적 캐싱**: 중복된 뉴스 제거 및 메모리 캐싱
- **웹 대시보드**: 실시간 뉴스 확인용 웹 UI 제공

## 설치 및 설정

### 1. 네이버 개발자 센터에서 API 등록

1. [네이버 개발자 센터](https://developers.naver.com/apps)에 접속
2. 애플리케이션 등록 (뉴스 검색 API 사용 설정)
3. 클라이언트 아이디와 클라이언트 시크릿 복사

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 정보를 입력합니다:

```bash
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
PORT=3000
```

### 3. 의존성 설치

```bash
npm install
```

### 4. 서버 실행

```bash
npm start
```

서버가 `http://localhost:3000`에서 실행됩니다.

## 프로젝트 구조

```
news-tracker/
├── src/
│   ├── config/
│   │   └── api.js                      # Naver API 설정
│   ├── services/
│   │   ├── newsService.js             # 뉴스 검색 서비스
│   │   └── realtimeNewsService.js     # 실시간 뉴스 수집 서비스
│   ├── routes/
│   │   └── news.js                   # REST API 엔드포인트
│   └── app.js                         # Express 애플리케이션
├── public/
│   └── index.html                     # 웹 대시보드
├── index.js                           # WebSocket 서버 및 진입점
├── test.js                            # API 테스트 스크립트
├── .env                               # 환경 변수 (실제 파일)
├── .env.example                       # 환경 변수 템플릿
└── package.json
```

## API 엔드포인트

### REST API

#### 뉴스 검색

```bash
GET /api/news/search?query=검색어&display=10&start=1&sort=date
```

**파라미터:**
- `query` (필수): 검색어
- `display` (선택): 검색 결과 개수 (기본값: 10, 최대: 100)
- `start` (선택): 검색 시작 위치 (기본값: 1, 최대: 1000)
- `sort` (선택): 정렬 방식
  - `date`: 날짜순 (최신순, 기본값)
  - `sim`: 정확도순

**응답 예:**
```json
{
  "success": true,
  "total": 2566589,
  "start": 1,
  "display": 10,
  "lastBuildDate": "Mon, 26 Sep 2016 11:01:35 +0900",
  "items": [
    {
      "title": "국내 주식형펀드서 사흘째 자금 순유출",
      "originalLink": "http://...",
      "link": "http://...",
      "description": "국내 주식형 펀드에서...",
      "pubDate": "Mon, 26 Sep 2016 07:50:00 +0900"
    }
  ]
}
```

#### 실시간 인기 뉴스

```bash
GET /api/news/trending
```

**응답 예:**
```json
{
  "success": true,
  "data": [
    {
      "keyword": "뉴스",
      "count": 5,
      "items": [...]
    }
  ]
}
```

### WebSocket 실시간 뉴스

#### 연결 및 구독

```javascript
const socket = io('http://localhost:3000');

// 뉴스 구독
socket.emit('subscribe', {
  keyword: 'JavaScript',
  interval: '*/5 * * * *',  // 5분마다 수집 (Cron 형식)
  display: 10
});

// 새로운 뉴스 수신
socket.on('news', (data) => {
  console.log(data.type);        // 'new' | 'updated'
  console.log(data.keyword);     // '뉴스 구독어'
  console.log(data.news);        // 뉴스 배열
  console.log(data.timestamp);   // 수집 시간
});

// 구독 확인
socket.on('subscribed', (data) => {
  console.log(data.keyword, '구독 성공');
});
```

#### 구독 취소

```javascript
socket.emit('unsubscribe', {
  keyword: 'JavaScript',
  subscriptionId: 'subscription_id'
});

socket.on('unsubscribed', (data) => {
  console.log(data.keyword, '구독 취소됨');
});
```

#### 캐시된 뉴스 조회

```javascript
socket.emit('get-cached-news', {
  keyword: 'JavaScript'
});

socket.on('cached-news', (data) => {
  console.log(data.keyword);
  console.log(data.news);  // 캐시된 뉴스 배열
  console.log(data.count); // 뉴스 개수
});
```

#### 서비스 상태 조회

```javascript
socket.emit('get-status');

socket.on('status', (data) => {
  console.log(data.isRunning);      // 서비스 실행 여부
  console.log(data.keywords);       // 구독 중인 키워드 목록
  console.log(data.subscribers);    // 키워드별 구독자 수
  console.log(data.cache);          // 캐시된 키워드 목록
});
```

## 사용 방법

### 웹 대시보드 (추천)

1. 서버 실행: `npm start`
2. 브라우저에서 `http://localhost:3000` 접속
3. 검색어 입력 후 "구독" 버튼 클릭
4. 실시간으로 뉴스가 표시됩니다

### REST API 테스트

```bash
# 기본 검색
curl "http://localhost:3000/api/news/search?query=JavaScript"

# 날짜순 정렬, 20개 결과
curl "http://localhost:3000/api/news/search?query=AI&sort=date&display=20"

# 페이지네이션
curl "http://localhost:3000/api/news/search?query=technology&start=11&display=10"
```

### Node.js 클라이언트

```javascript
const axios = require('axios');

async function searchNews(query) {
  try {
    const response = await axios.get('http://localhost:3000/api/news/search', {
      params: {
        query,
        display: 10,
        sort: 'date'
      }
    });
    console.log(response.data);
  } catch (error) {
    console.error('검색 실패:', error.message);
  }
}

searchNews('뉴스');
```

### WebSocket 클라이언트

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('서버에 연결됨');

  // JavaScript 관련 뉴스 구독
  socket.emit('subscribe', {
    keyword: 'JavaScript',
    interval: '*/5 * * * *', // 5분마다
    display: 10
  });
});

socket.on('news', (data) => {
  console.log(`[${data.keyword}] 새로운 뉴스 ${data.count}개`);
  data.news.forEach(news => {
    console.log(`- ${news.title}`);
  });
});

socket.on('subscribed', (data) => {
  console.log(`${data.message}`);
});

socket.on('disconnect', () => {
  console.log('연결 해제됨');
});
```

## Cron 표현식 (Interval 옵션)

실시간 뉴스 수집 간격을 설정하려면 Cron 형식을 사용합니다:

```
┌───────────── 분 (0 - 59)
│ ┌───────────── 시간 (0 - 23)
│ │ ┌───────────── 일 (1 - 31)
│ │ │ ┌───────────── 월 (1 - 12)
│ │ │ │ ┌───────────── 요일 (0 - 7) (0과 7은 일요일)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

**예제:**

| 표현식 | 설명 |
|--------|------|
| `*/5 * * * *` | 매 5분마다 |
| `0 * * * *` | 매 시간마다 |
| `0 0 * * *` | 매일 자정 |
| `0 9 * * 1-5` | 평일 오전 9시 |
| `*/10 * * * *` | 매 10분마다 |

## 오류 처리

API는 다음과 같은 오류 코드를 반환할 수 있습니다:

| 상태 코드 | 오류 코드 | 메시지 | 해결 방법 |
|---------|---------|--------|---------|
| 400 | SE01 | 잘못된 쿼리 요청 | URL 파라미터 확인 |
| 400 | SE02 | display 값 범위 오류 | display를 1~100 사이로 설정 |
| 400 | SE03 | start 값 범위 오류 | start를 1~1000 사이로 설정 |
| 400 | SE04 | sort 값 오류 | sort를 "sim" 또는 "date"로 설정 |
| 400 | SE06 | 인코딩 오류 | 검색어를 UTF-8로 인코딩 |
| 404 | SE05 | API 주소 오류 | API 요청 URL 확인 |
| 500 | SE99 | 시스템 오류 | 나중에 재시도 |

## 아키텍처

### 컴포넌트 다이어그램

```
┌─────────────────────────────────────────────┐
│        웹 브라우저 (WebSocket Client)       │
└──────────────────┬──────────────────────────┘
                   │
                   │ (WebSocket)
                   ▼
┌─────────────────────────────────────────────┐
│    Express Server + Socket.IO (index.js)   │
├─────────────────────────────────────────────┤
│ ┌────────────────────────────────────────┐ │
│ │   RealtimeNewsService (백그라운드)    │ │
│ │  - 일정 시간마다 뉴스 자동 수집       │ │
│ │  - 캐시 관리 및 변화 감지             │ │
│ │  - 구독자에게 실시간 푸시             │ │
│ └────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ ┌────────────────────────────────────────┐ │
│ │     NewsService (검색 서비스)         │ │
│ │  - Naver API 호출                      │ │
│ │  - 응답 파싱 및 포맷팅                │ │
│ │  - 에러 처리                           │ │
│ └────────────────────────────────────────┘ │
└──────────────┬───────────────────────┬─────┘
               │                       │
               │ (REST API)           │ (Static Files)
               ▼                       ▼
        HTTP Clients              웹 대시보드
                                  (HTML/CSS/JS)
                   │
                   ▼
      ┌──────────────────────────┐
      │  Naver Open API          │
      │  (뉴스 검색 API)         │
      └──────────────────────────┘
```

## 성능 및 확장성

### 최적화 기능

- **메모리 캐싱**: 최근 뉴스 캐시로 DB 조회 없음
- **중복 제거**: 제목 기반 중복 뉴스 자동 필터링
- **효율적 폴링**: Cron 기반 스케줄링으로 리소스 절약
- **선택적 구독**: 필요한 키워드만 모니터링

### 확장 가능성

더 나은 성능과 확장성을 위해 다음을 추가할 수 있습니다:

1. **데이터베이스 추가**
   ```bash
   npm install mongodb # 또는 postgresql, sqlite3
   ```
   - 뉴스 영구 저장
   - 검색 기록 저장
   - 사용자 구독 목록 저장

2. **Redis 캐싱**
   ```bash
   npm install redis
   ```
   - 분산 캐싱
   - 세션 관리
   - Pub/Sub 기능

3. **로깅 및 모니터링**
   ```bash
   npm install winston
   ```
   - 상세 로깅
   - 성능 모니터링

4. **인증 추가**
   ```bash
   npm install passport jsonwebtoken
   ```
   - 사용자 인증
   - API 토큰 관리

## 테스트

```bash
# API 기능 테스트
node test.js
```

## 라이선스

ISC

## 참고

- [Naver Open API 문서](https://developers.naver.com/docs/search/news/)
- [Socket.IO 문서](https://socket.io/docs/)
- [Node-Cron 문서](https://github.com/kelektiv/node-cron)
- [Express 문서](https://expressjs.com/)

## 문제 해결

### WebSocket 연결 실패
- 방화벽 설정 확인
- CORS 설정 확인
- 서버가 실행 중인지 확인

### API 인증 오류
- `.env` 파일의 `NAVER_CLIENT_ID`와 `NAVER_CLIENT_SECRET` 확인
- Naver 개발자 센터에서 뉴스 검색 API 활성화 확인

### 뉴스가 실시간으로 수집되지 않음
- 서버 로그 확인
- Cron 표현식 문법 확인
- 네트워크 연결 상태 확인

## 기여하기

버그 리포트나 기능 제안은 이슈를 통해 제출해주세요.

---

**마지막 업데이트:** 2024년 12월 2일
