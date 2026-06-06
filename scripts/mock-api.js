/* eslint-env node */
const http = require('http');
const fs = require('fs');
const path = require('path');
const {URL} = require('url');

const PORT = Number(process.env.MOCK_API_PORT || 8080);
const HOST = process.env.MOCK_API_HOST || '0.0.0.0';
const QA_FIXTURES_DIR = path.join(__dirname, '..', 'docs', 'qa-fixtures');
const staticAssets = new Map([
  [
    '/static/mock/apple.jpg',
    path.join(QA_FIXTURES_DIR, 'fresh-single-fresh-20260505.jpg'),
  ],
  [
    '/static/mock/banana.jpg',
    path.join(QA_FIXTURES_DIR, 'fresh-single-fresh-20260505.jpg'),
  ],
  [
    '/static/mock/food.jpg',
    path.join(QA_FIXTURES_DIR, 'fresh-single-fresh-20260505.jpg'),
  ],
]);

const now = () => new Date().toISOString();
const json = (res, status, body) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  });
  res.end(JSON.stringify(body));
};

const ok = (res, data, message = 'OK', status = 200) =>
  json(res, status, {success: true, message, data});

const fail = (res, message, status = 400) =>
  json(res, status, {success: false, message, data: null});

const image = (res, filePath) => {
  if (!fs.existsSync(filePath)) {
    return fail(res, 'Mock image not found.', 404);
  }

  res.writeHead(200, {
    'Content-Type': 'image/jpeg',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=3600',
  });
  fs.createReadStream(filePath).pipe(res);
};

let currentUser = {
  id: 1,
  email: 'cjh5110@naver.com',
  nickname: '푸드링커',
  profileImageUrl: null,
  latitude: null,
  longitude: null,
  fcmToken: null,
  isActive: true,
  createdAt: now(),
  updatedAt: now(),
};

const fridges = [
  {
    id: 1,
    name: '용봉동 공유 냉장고',
    address: '광주광역시 북구 용봉동',
    latitude: 35.1595,
    longitude: 126.9136,
    isActive: true,
    distance: 0.24,
  },
  {
    id: 2,
    name: '전남대 후문 나눔 냉장고',
    address: '광주광역시 북구 우치로',
    latitude: 35.1613,
    longitude: 126.9151,
    isActive: true,
    distance: 0.58,
  },
];

let posts = [
  {
    id: 1,
    title: '신선한 바나나 나눔합니다',
    description: '어제 산 바나나가 조금 남아서 공유 냉장고에 넣어둘게요.',
    category: '과일',
    detectedFruit: 'banana',
    detectedFruitKo: '바나나',
    freshnessLabel: 'Fresh',
    confidenceScore: 0.92,
    imageUrl: '/static/mock/banana.jpg',
    expirationDate: '2026-06-30',
    status: 'available',
    fridgeId: 1,
    fridgeName: '용봉동 공유 냉장고',
    userId: 2,
    createdAt: now(),
    updatedAt: now(),
  },
];

let nextPostId = 2;
const imageTokens = new Set();

const readBody = req =>
  new Promise(resolve => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });

const readJson = async req => {
  const body = await readBody(req);
  if (!body) {
    return {};
  }
  return JSON.parse(body);
};

const parsePostDataField = body => {
  const multipartMatch = body.match(/name="data"\r?\n\r?\n([\s\S]*?)\r?\n--/);
  if (multipartMatch) {
    return JSON.parse(multipartMatch[1]);
  }

  const encodedData = new URLSearchParams(body).get('data');
  return encodedData ? JSON.parse(encodedData) : null;
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    return ok(res, null);
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    if (req.method === 'GET' && staticAssets.has(path)) {
      return image(res, staticAssets.get(path));
    }

    if (req.method === 'GET' && path === '/docs') {
      res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
      res.end('<h1>FoodLink Mock API</h1><p>Mock server is running.</p>');
      return;
    }

    if (req.method === 'POST' && path === '/api/v1/auth/signup') {
      const body = await readJson(req);
      currentUser = {
        ...currentUser,
        id: 1,
        email: body.email,
        nickname: body.nickname,
        updatedAt: now(),
      };
      return ok(res, currentUser, '회원가입이 완료되었습니다.', 201);
    }

    if (req.method === 'POST' && path === '/api/v1/auth/login') {
      return ok(res, {accessToken: 'mock-access-token', tokenType: 'bearer'}, '로그인 성공');
    }

    if (req.method === 'GET' && path === '/api/v1/auth/me') {
      return ok(res, currentUser, '내 정보 조회 성공');
    }

    if (req.method === 'PUT' && path === '/api/v1/auth/me/location') {
      const body = await readJson(req);
      currentUser = {
        ...currentUser,
        latitude: body.latitude,
        longitude: body.longitude,
        fcmToken: body.fcmToken || currentUser.fcmToken,
        updatedAt: now(),
      };
      return ok(res, currentUser, '위치 정보가 갱신되었습니다.');
    }

    if (req.method === 'POST' && path === '/api/v1/posts/generate') {
      const token = `mock-image-token-${Date.now()}`;
      imageTokens.add(token);
      return ok(res, {
        suggestedTitle: '신선한 바나나 나눔합니다',
        suggestedDescription: 'AI 분석 결과 나눔 가능한 신선한 바나나입니다.',
        suggestedCategory: '과일',
        detectedFruit: 'banana',
        detectedFruitKo: '바나나',
        freshnessLabel: 'Fresh',
        confidenceScore: 92,
        aiAnalysis: {
          isFresh: true,
          confidenceScore: 92,
          detectedFruit: 'banana',
          detectedFruitKo: '바나나',
          category: 'Fresh',
          analysisMessage: '식재료가 신선합니다.',
        },
        isAutoGenerated: true,
        imageToken: token,
      });
    }

    if (req.method === 'POST' && path === '/api/v1/posts') {
      const raw = await readBody(req);
      const data = parsePostDataField(raw);
      if (!data || !imageTokens.has(data.imageToken)) {
        return fail(res, '이미지가 만료되었거나 유효하지 않습니다. 다시 촬영해주세요.');
      }

      const post = {
        ...data,
        id: nextPostId++,
        status: 'pending_store',
        imageUrl: '/static/mock/food.jpg',
        freshnessLabel: 'Fresh',
        fridgeName:
          fridges.find(fridge => fridge.id === data.fridgeId)?.name ||
          '근처 공유 냉장고',
        userId: currentUser.id,
        createdAt: now(),
        updatedAt: now(),
      };
      posts = [post, ...posts];
      return ok(res, post, '게시글이 등록되었습니다.', 201);
    }

    if (req.method === 'GET' && path === '/api/v1/posts/nearby') {
      return ok(res, posts, '근처 게시글 조회 성공');
    }

    const postDetailMatch = path.match(/^\/api\/v1\/posts\/(\d+)$/);
    if (postDetailMatch && req.method === 'GET') {
      const post = posts.find(item => item.id === Number(postDetailMatch[1]));
      return post ? ok(res, post, '게시글 상세 조회 성공') : fail(res, '게시글을 찾을 수 없습니다.', 404);
    }

    if (postDetailMatch && req.method === 'DELETE') {
      posts = posts.filter(item => item.id !== Number(postDetailMatch[1]));
      return ok(res, null, '게시글이 삭제되었습니다.');
    }

    if (req.method === 'GET' && path === '/api/v1/fridges/nearby') {
      return ok(res, fridges, '근처 냉장고 조회 성공');
    }

    if (req.method === 'GET' && path === '/api/v1/fridges/available') {
      return ok(res, fridges.filter(fridge => fridge.isActive), '등록 가능 냉장고 조회 성공');
    }

    return fail(res, `No mock route for ${req.method} ${path}`, 404);
  } catch (error) {
    console.error(error);
    return fail(res, 'Mock server error', 500);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`FoodLink mock API listening on http://${HOST}:${PORT}`);
  console.log('Android emulator URL: http://10.0.2.2:8080');
});
