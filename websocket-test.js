const io = require('socket.io-client');
const readline = require('readline');

const BASE_URL = 'http://localhost:3000';
let socket;
const subscriptions = new Map();

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

function logEvent(event, data, color = 'cyan') {
  log(`[${event}] ${JSON.stringify(data, null, 2)}`, color);
}

// WebSocket 연결
function connectSocket() {
  logSection('WebSocket 서버에 연결 중...');

  socket = io(BASE_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  });

  // 연결 성공
  socket.on('connect', () => {
    log(`✓ 서버에 연결됨 (ID: ${socket.id})`, 'green');
  });

  // 연결 해제
  socket.on('disconnect', (reason) => {
    log(`✗ 서버 연결 해제 (사유: ${reason})`, 'red');
  });

  // 뉴스 수신
  socket.on('news', (data) => {
    logEvent('NEWS', {
      type: data.type,
      keyword: data.keyword,
      count: data.count,
      timestamp: data.timestamp
    }, 'yellow');

    if (data.news && data.news.length > 0) {
      log(`\n📰 최신 뉴스 (${data.keyword}):`, 'bright');
      data.news.slice(0, 3).forEach((news, idx) => {
        console.log(`  ${idx + 1}. ${news.title}`);
      });
    }
  });

  // 구독 확인
  socket.on('subscribed', (data) => {
    subscriptions.set(data.keyword, data.subscriptionId);
    logEvent('SUBSCRIBED', data, 'green');
  });

  // 구독 취소 확인
  socket.on('unsubscribed', (data) => {
    subscriptions.delete(data.keyword);
    logEvent('UNSUBSCRIBED', data, 'blue');
  });

  // 캐시 뉴스
  socket.on('cached-news', (data) => {
    logEvent('CACHED-NEWS', {
      keyword: data.keyword,
      count: data.count
    }, 'magenta');

    if (data.news && data.news.length > 0) {
      log(`\n💾 캐시된 뉴스 (${data.keyword}):`, 'bright');
      data.news.slice(0, 5).forEach((news, idx) => {
        console.log(`  ${idx + 1}. ${news.title}`);
      });
    }
  });

  // 서비스 상태
  socket.on('status', (data) => {
    logEvent('STATUS', data, 'cyan');
  });

  // 에러
  socket.on('error', (error) => {
    logEvent('ERROR', error, 'red');
  });
}

// 뉴스 구독
function subscribe(keyword, interval = '*/5 * * * *', display = 10) {
  if (!socket) {
    log('✗ 서버에 연결되지 않았습니다', 'red');
    return;
  }

  log(`구독 요청: ${keyword}`, 'cyan');
  socket.emit('subscribe', {
    keyword,
    interval,
    display
  });
}

// 뉴스 구독 취소
function unsubscribe(keyword) {
  if (!socket) {
    log('✗ 서버에 연결되지 않았습니다', 'red');
    return;
  }

  const subscriptionId = subscriptions.get(keyword);
  if (!subscriptionId) {
    log(`✗ "${keyword}" 구독을 찾을 수 없습니다`, 'red');
    return;
  }

  log(`구독 취소 요청: ${keyword}`, 'cyan');
  socket.emit('unsubscribe', {
    keyword,
    subscriptionId
  });
}

// 캐시 뉴스 조회
function getCachedNews(keyword) {
  if (!socket) {
    log('✗ 서버에 연결되지 않았습니다', 'red');
    return;
  }

  log(`캐시 조회 요청: ${keyword}`, 'cyan');
  socket.emit('get-cached-news', { keyword });
}

// 서비스 상태 조회
function getStatus() {
  if (!socket) {
    log('✗ 서버에 연결되지 않았습니다', 'red');
    return;
  }

  log('서비스 상태 조회 중...', 'cyan');
  socket.emit('get-status');
}

// 도움말
function showHelp() {
  logSection('WebSocket 테스트 명령어');
  console.log(`
  subscribe <keyword> [interval] [display]
    - 뉴스 구독
    - 예: subscribe JavaScript "*/5 * * * *" 10

  unsubscribe <keyword>
    - 뉴스 구독 취소
    - 예: unsubscribe JavaScript

  cache <keyword>
    - 캐시된 뉴스 조회
    - 예: cache JavaScript

  status
    - 서비스 상태 조회

  list
    - 현재 구독 목록 표시

  clear
    - 화면 지우기

  help
    - 도움말 표시

  exit
    - 종료
  `);
}

// 현재 구독 목록
function listSubscriptions() {
  if (subscriptions.size === 0) {
    log('현재 구독 중인 키워드가 없습니다', 'dim');
    return;
  }

  logSection('현재 구독 목록');
  Array.from(subscriptions.keys()).forEach((keyword, idx) => {
    console.log(`  ${idx + 1}. ${keyword}`);
  });
}

// 테스트 자동 실행
function runAutoTest() {
  logSection('자동 테스트 시작 (30초)');

  setTimeout(() => {
    log('\n[테스트 1] JavaScript 구독', 'bright');
    subscribe('JavaScript', '*/5 * * * *', 10);
  }, 1000);

  setTimeout(() => {
    log('\n[테스트 2] Python 구독', 'bright');
    subscribe('Python', '*/5 * * * *', 10);
  }, 3000);

  setTimeout(() => {
    log('\n[테스트 3] 서비스 상태 조회', 'bright');
    getStatus();
  }, 5000);

  setTimeout(() => {
    log('\n[테스트 4] JavaScript 캐시 조회', 'bright');
    getCachedNews('JavaScript');
  }, 7000);

  setTimeout(() => {
    log('\n[테스트 5] 구독 목록 조회', 'bright');
    listSubscriptions();
  }, 9000);

  setTimeout(() => {
    log('\n[테스트 완료] 대화형 모드로 전환합니다', 'green');
    log('명령어를 입력하세요 (help 입력 시 도움말 표시)', 'cyan');
  }, 10000);
}

// 대화형 인터페이스
function setupREPL() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const prompt = () => {
    rl.question('> ', (input) => {
      const args = input.trim().split(/\s+/);
      const command = args[0];

      if (!command) {
        prompt();
        return;
      }

      switch (command) {
        case 'subscribe':
          if (args.length < 2) {
            log('사용법: subscribe <keyword> [interval] [display]', 'red');
          } else {
            subscribe(args[1], args[2] || '*/5 * * * *', parseInt(args[3]) || 10);
          }
          break;

        case 'unsubscribe':
          if (args.length < 2) {
            log('사용법: unsubscribe <keyword>', 'red');
          } else {
            unsubscribe(args[1]);
          }
          break;

        case 'cache':
          if (args.length < 2) {
            log('사용법: cache <keyword>', 'red');
          } else {
            getCachedNews(args[1]);
          }
          break;

        case 'status':
          getStatus();
          break;

        case 'list':
          listSubscriptions();
          break;

        case 'clear':
          console.clear();
          break;

        case 'help':
          showHelp();
          break;

        case 'exit':
          log('종료합니다', 'yellow');
          socket.disconnect();
          rl.close();
          process.exit(0);
          break;

        default:
          log(`알 수 없는 명령어: ${command}`, 'red');
          log('help 입력 시 도움말 표시', 'dim');
      }

      prompt();
    });
  };

  prompt();
}

// 메인
async function main() {
  logSection('🚀 WebSocket 테스트 도구');

  log('서버 URL: ' + BASE_URL, 'cyan');

  connectSocket();

  // 연결 대기
  await new Promise(resolve => {
    socket.on('connect', resolve);
    setTimeout(resolve, 3000);
  });

  if (socket.connected) {
    log('✓ 서버 연결 성공!', 'green');

    // 자동 테스트 실행
    runAutoTest();

    // 30초 후 대화형 모드로 전환
    setTimeout(() => {
      logSection('대화형 모드');
      log('명령어를 입력하세요 (help 입력 시 도움말 표시)', 'cyan');
      setupREPL();
    }, 11000);
  } else {
    log('✗ 서버에 연결할 수 없습니다', 'red');
    log('서버가 실행 중인지 확인하세요: npm start', 'yellow');
    process.exit(1);
  }
}

// 시작
main().catch(error => {
  log(`에러: ${error.message}`, 'red');
  process.exit(1);
});

// 프로세스 종료 처리
process.on('SIGINT', () => {
  log('\n프로세스 종료 중...', 'yellow');
  if (socket) {
    socket.disconnect();
  }
  process.exit(0);
});
