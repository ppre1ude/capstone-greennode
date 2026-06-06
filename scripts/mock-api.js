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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
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
  latitude: 35.1595,
  longitude: 126.9136,
  fcmToken: null,
  isOperator: true,
  operatorRole: 'fridge_operator',
  operatorFridgeIds: [1],
  roles: ['fridge_operator'],
  isActive: true,
  createdAt: now(),
  updatedAt: now(),
};

const fridges = [
  {
    id: 1,
    name: '용봉동 공유 냉장고',
    address: '광주광역시 북구 용봉동',
    publicCode: 'FL-YONGBONG-01',
    latitude: 35.1595,
    longitude: 126.9136,
    isActive: true,
    distance: 0.24,
  },
  {
    id: 2,
    name: '전남대 후문 나눔 냉장고',
    address: '광주광역시 북구 우치로',
    publicCode: 'FL-HUMUN-02',
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
    fridgePublicCode: 'FL-YONGBONG-01',
    fridgeAddress: '광주광역시 북구 용봉동',
    authorId: 2,
    userId: 2,
    labelCode: '#0001',
    storageZone: 'GENERAL',
    storageDeadlineAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    storedAt: now(),
    createdAt: now(),
    updatedAt: now(),
  },
];

let nextPostId = 2;
let nextRequestId = 1;
let nextReviewId = 1;
let nextReportId = 1;
const imageTokens = new Set();
const shareRequests = [];
const shareReviews = [];
const shareReports = [];
const notifications = [];

const positiveReviewTagIds = new Set([
  'good_condition',
  'matched_photo',
  'easy_to_find',
  'want_again',
]);
const issueReviewTagIds = new Set([
  'different_from_photo',
  'label_hard_to_find',
  'pickup_location_unclear',
  'condition_needs_check',
]);
const shareReportReasonIds = new Set([
  'different_from_photo',
  'condition_needs_check',
  'label_or_zone_mismatch',
  'missing_or_not_found',
  'inappropriate_listing',
]);

const addMinutes = minutes => new Date(Date.now() + minutes * 60 * 1000).toISOString();
const addDays = days => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
const getFridge = fridgeId => fridges.find(fridge => fridge.id === Number(fridgeId));
const getFridgeByPublicCode = publicCode =>
  fridges.find(fridge => fridge.publicCode === publicCode);
const parseStatusFilter = url =>
  (url.searchParams.get('status') || '')
    .split(',')
    .map(status => status.trim())
    .filter(Boolean);
const matchesStatusFilter = (status, filter) =>
  filter.length === 0 || filter.includes(status);
const toUserShareRequestItem = request => {
  const post = posts.find(item => item.id === request.postId);
  const fridge = post ? getFridge(post.fridgeId) : null;

  return post
    ? {
        request,
        post,
        fridge: fridge
          ? {
              id: fridge.id,
              name: fridge.name,
              address: fridge.address,
              publicCode: fridge.publicCode,
            }
          : null,
      }
    : null;
};
const getShareRequestContext = requestId => {
  const request = shareRequests.find(item => item.id === Number(requestId));
  const post = request ? posts.find(item => item.id === request.postId) : null;
  return {request, post};
};
const findUnsupportedValue = (values, allowedValues) =>
  (Array.isArray(values) ? values : []).find(value => !allowedValues.has(value));
const validateFeedbackContext = (res, request, post) => {
  if (!request || !post) {
    fail(res, 'Share request not found.', 404);
    return false;
  }
  if (request.requesterId !== currentUser.id) {
    fail(res, 'Only the requester can leave feedback.', 403);
    return false;
  }
  if (request.status !== 'completed' || post.status !== 'completed') {
    fail(res, 'Feedback is allowed only after confirmed pickup.', 409);
    return false;
  }
  return true;
};
const addNotification = notification => {
  notifications.unshift({
    id: String(notifications.length + 1),
    readAt: null,
    receivedAt: now(),
    createdAt: now(),
    ...notification,
  });
};

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

      const createdAt = now();
      const fridge = getFridge(data.fridgeId);
      const post = {
        ...data,
        id: nextPostId++,
        status: 'pending_store',
        imageUrl: '/static/mock/food.jpg',
        detectedFruit: 'banana',
        detectedFruitKo: '바나나',
        expirationDate: data.expirationDate || addDays(2),
        freshnessLabel: 'Fresh',
        confidenceScore: 92,
        fridgeId: data.fridgeId,
        fridgeName: fridge?.name || '근처 공유 냉장고',
        fridgePublicCode: fridge?.publicCode,
        fridgeAddress: fridge?.address,
        authorId: currentUser.id,
        userId: currentUser.id,
        storeExpiresAt: addMinutes(10),
        requestExpiresAt: null,
        createdAt,
        updatedAt: createdAt,
      };
      posts = [post, ...posts];
      addNotification({
        type: 'post_created',
        postId: String(post.id),
        fruitName: post.detectedFruitKo,
        fridgeName: post.fridgeName,
        title: '나눔 등록 준비',
        body: '보관 QR 인증을 완료하면 주변 이웃에게 노출됩니다.',
      });
      return ok(res, [post], '게시글이 등록되었습니다.', 201);
    }

    if (req.method === 'GET' && path === '/api/v1/posts/nearby') {
      return ok(
        res,
        posts.filter(
          post =>
            post.status === 'available' &&
            (post.authorId ?? post.userId) !== currentUser.id,
        ),
        '근처 게시글 조회 성공',
      );
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

    const postCancelMatch = path.match(/^\/api\/v1\/posts\/(\d+)\/cancel$/);
    if (postCancelMatch && req.method === 'POST') {
      const post = posts.find(item => item.id === Number(postCancelMatch[1]));
      if (!post) {
        return fail(res, '게시글을 찾을 수 없습니다.', 404);
      }
      post.status = 'cancelled';
      post.updatedAt = now();
      return ok(res, post, '나눔이 취소되었습니다.');
    }

    const postRequestMatch = path.match(/^\/api\/v1\/posts\/(\d+)\/requests$/);
    if (postRequestMatch && req.method === 'POST') {
      const post = posts.find(item => item.id === Number(postRequestMatch[1]));
      if (!post) {
        return fail(res, '게시글을 찾을 수 없습니다.', 404);
      }
      if ((post.authorId ?? post.userId) === currentUser.id) {
        return fail(res, '내가 등록한 나눔 식재료입니다.', 403);
      }
      if (post.status !== 'available') {
        return fail(res, '이미 신청된 나눔입니다.', 409);
      }

      const request = {
        id: nextRequestId++,
        postId: post.id,
        requesterId: currentUser.id,
        status: 'requested',
        createdAt: now(),
        updatedAt: now(),
      };
      shareRequests.push(request);
      post.status = 'requested';
      post.requestExpiresAt = addMinutes(30);
      post.updatedAt = now();
      addNotification({
        type: 'share_requested',
        postId: String(post.id),
        requestId: String(request.id),
        fruitName: post.detectedFruitKo ?? post.detectedFruit ?? '식재료',
        fridgeName: post.fridgeName ?? '',
        title: '나눔 신청 접수',
        body: '수령 QR 인증 대기 상태입니다.',
      });

      return ok(res, {request, post}, '나눔 신청이 접수되었습니다.', 201);
    }

    const shareRequestCancelMatch = path.match(
      /^\/api\/v1\/users\/me\/share-requests\/(\d+)\/cancel$/,
    );
    if (shareRequestCancelMatch && req.method === 'POST') {
      const request = shareRequests.find(
        item => item.id === Number(shareRequestCancelMatch[1]),
      );
      if (!request) {
        return fail(res, '신청을 찾을 수 없습니다.', 404);
      }
      const post = posts.find(item => item.id === request.postId);
      request.status = 'cancelled';
      request.updatedAt = now();
      if (post && post.status === 'requested') {
        post.status = 'available';
        post.requestExpiresAt = null;
        post.updatedAt = now();
      }
      return ok(res, {request, post}, '신청을 취소했습니다.');
    }

    if (req.method === 'GET' && path === '/api/v1/users/me/posts') {
      const statusFilter = parseStatusFilter(url);
      return ok(
        res,
        posts.filter(
          post =>
            (post.authorId ?? post.userId) === currentUser.id &&
            matchesStatusFilter(post.status, statusFilter),
        ),
        '내 나눔 조회 성공',
      );
    }

    if (req.method === 'GET' && path === '/api/v1/users/me/share-requests') {
      const statusFilter = parseStatusFilter(url);
      return ok(
        res,
        shareRequests
          .filter(
            request =>
              request.requesterId === currentUser.id &&
              matchesStatusFilter(request.status, statusFilter),
          )
          .map(toUserShareRequestItem)
          .filter(Boolean),
        '내 신청 조회 성공',
      );
    }

    const trustSummaryMatch = path.match(/^\/api\/v1\/users\/(\d+)\/trust-summary$/);
    if (trustSummaryMatch && req.method === 'GET') {
      const userId = Number(trustSummaryMatch[1]);
      return ok(res, {
        userId,
        completedShares: userId === currentUser.id ? 3 : 12,
        positiveReviewCount: userId === currentUser.id ? 2 : 8,
        matchedPhotoCount: 7,
        easyToFindCount: 6,
        badges: ['store_qr_verified', 'completed_pickup', 'positive_reviews'],
        computedAt: now(),
      });
    }

    if (req.method === 'GET' && path === '/api/v1/users/me/impact/summary') {
      return ok(res, {
        completedShares: 4,
        totalShared: 3,
        totalReceived: 1,
        estimatedFoodSavedGrams: 1200,
        estimatedCarbonSavedGrams: 3100,
        calculationVersion: 'mock-v1',
        computedAt: now(),
      });
    }

    const shareReviewMatch = path.match(
      /^\/api\/v1\/share-requests\/(\d+)\/review$/,
    );
    if (shareReviewMatch && req.method === 'POST') {
      const requestId = Number(shareReviewMatch[1]);
      const {request, post} = getShareRequestContext(requestId);
      const body = await readJson(req);
      if (!validateFeedbackContext(res, request, post)) {
        return;
      }
      if (
        shareReviews.some(
          item =>
            item.requestId === requestId && item.requesterId === currentUser.id,
        )
      ) {
        return fail(res, 'Review already exists for this share request.', 409);
      }
      const unsupportedPositiveTag = findUnsupportedValue(
        body.positiveTagIds,
        positiveReviewTagIds,
      );
      const unsupportedIssueTag = findUnsupportedValue(
        body.issueTagIds,
        issueReviewTagIds,
      );
      if (unsupportedPositiveTag || unsupportedIssueTag) {
        return fail(
          res,
          `Unsupported review tag: ${unsupportedPositiveTag || unsupportedIssueTag}`,
          422,
        );
      }
      const review = {
        id: nextReviewId++,
        requestId,
        postId: post?.id ?? 0,
        providerId: post?.authorId ?? post?.userId ?? 0,
        requesterId: currentUser.id,
        positiveTagIds: body.positiveTagIds ?? [],
        issueTagIds: body.issueTagIds ?? [],
        createdAt: now(),
        updatedAt: now(),
      };
      shareReviews.push(review);
      return ok(res, review, '수령 경험 평가가 저장되었습니다.', 201);
    }

    const shareReportMatch = path.match(
      /^\/api\/v1\/share-requests\/(\d+)\/report$/,
    );
    if (shareReportMatch && req.method === 'POST') {
      const requestId = Number(shareReportMatch[1]);
      const {request, post} = getShareRequestContext(requestId);
      const body = await readJson(req);
      if (!validateFeedbackContext(res, request, post)) {
        return;
      }
      if (!shareReportReasonIds.has(body.reasonId)) {
        return fail(res, `Unsupported report reason: ${body.reasonId}`, 422);
      }
      const report = {
        id: nextReportId++,
        requestId,
        postId: post?.id ?? 0,
        providerId: post?.authorId ?? post?.userId ?? 0,
        requesterId: currentUser.id,
        reasonId: body.reasonId ?? 'quality_issue',
        status: 'open',
        resolution: 'pending',
        action: 'none',
        createdAt: now(),
        updatedAt: now(),
      };
      shareReports.push(report);
      return ok(res, report, '신고가 접수되었습니다.', 201);
    }

    if (req.method === 'GET' && path === '/api/v1/admin/share-reports') {
      if (
        currentUser.isOperator !== true &&
        !currentUser.roles?.includes('admin')
      ) {
        return fail(res, 'Operator permission is required.', 403);
      }
      const status = url.searchParams.get('status');
      return ok(
        res,
        shareReports.filter(report => !status || report.status === status),
        'Share reports fetched.',
      );
    }

    if (req.method === 'POST' && path === '/api/v1/inventory/confirm-store') {
      const body = await readJson(req);
      const post = posts.find(item => item.id === Number(body.postId));
      const fridge = getFridgeByPublicCode(body.fridgePublicCode);
      if (!post) {
        return fail(res, '게시글을 찾을 수 없습니다.', 404);
      }
      if (fridge && Number(post.fridgeId) !== Number(fridge.id)) {
        return fail(res, '선택한 냉장고 QR이 아닙니다.', 409);
      }

      post.status = 'available';
      post.labelCode = post.labelCode || `#${String(post.id).padStart(4, '0')}`;
      post.storageZone = 'GENERAL';
      post.storedAt = now();
      post.storageDeadlineAt = addDays(2);
      post.storeExpiresAt = null;
      post.updatedAt = now();
      addNotification({
        type: 'store_confirmed',
        postId: String(post.id),
        fruitName: post.detectedFruitKo ?? post.detectedFruit ?? '식재료',
        fridgeName: post.fridgeName ?? '',
        title: '입고 QR 인증 완료',
        body: '주변 이웃에게 나눔이 노출됩니다.',
      });

      return ok(res, {
        postId: post.id,
        status: 'available',
        labelCode: post.labelCode,
        storageZone: post.storageZone,
        storageDeadlineAt: post.storageDeadlineAt,
        storedAt: post.storedAt,
      }, '입고 인증이 완료되었습니다.');
    }

    if (req.method === 'POST' && path === '/api/v1/inventory/confirm-pickup') {
      const body = await readJson(req);
      const post = posts.find(item => item.id === Number(body.postId));
      if (!post) {
        return fail(res, '게시글을 찾을 수 없습니다.', 404);
      }
      const request = shareRequests.find(
        item => item.postId === post.id && item.requesterId === currentUser.id,
      );
      if (request) {
        request.status = 'completed';
        request.updatedAt = now();
      }
      post.status = 'completed';
      post.pickedUpAt = now();
      post.updatedAt = now();

      return ok(res, {
        postId: post.id,
        status: 'completed',
        labelCode: post.labelCode,
        storageZone: post.storageZone,
        pickedUpAt: post.pickedUpAt,
      }, '수령 인증이 완료되었습니다.');
    }

    const fridgePostsMatch = path.match(/^\/api\/v1\/fridges\/(\d+)\/posts$/);
    if (fridgePostsMatch && req.method === 'GET') {
      const status = url.searchParams.get('status') || 'available';
      return ok(
        res,
        posts.filter(
          post =>
            Number(post.fridgeId) === Number(fridgePostsMatch[1]) &&
            post.status === status &&
            (post.authorId ?? post.userId) !== currentUser.id,
        ),
        '냉장고 게시글 조회 성공',
      );
    }

    const operatorSummaryMatch = path.match(
      /^\/api\/v1\/operator\/fridges\/(\d+)\/inventory\/summary$/,
    );
    if (operatorSummaryMatch && req.method === 'GET') {
      const fridgeId = Number(operatorSummaryMatch[1]);
      const fridgePosts = posts.filter(post => Number(post.fridgeId) === fridgeId);
      return ok(res, {
        fridgeId,
        fridgeName: getFridge(fridgeId)?.name,
        totalItems: fridgePosts.length,
        availableItems: fridgePosts.filter(post => post.status === 'available').length,
        requestedItems: fridgePosts.filter(post => post.status === 'requested').length,
        expiringSoonItems: 1,
        expiredItems: 0,
        needsReviewItems: 0,
        ethyleneSeparatedItems: 0,
        disposedItems: fridgePosts.filter(post => post.status === 'disposed').length,
        lastSyncedAt: now(),
      }, '운영자 재고 요약 조회 성공');
    }

    const operatorItemsMatch = path.match(
      /^\/api\/v1\/operator\/fridges\/(\d+)\/inventory\/items$/,
    );
    if (operatorItemsMatch && req.method === 'GET') {
      const fridgeId = Number(operatorItemsMatch[1]);
      return ok(
        res,
        posts
          .filter(post => Number(post.fridgeId) === fridgeId)
          .map(post => ({
            postId: post.id,
            labelCode: post.labelCode,
            itemName: post.detectedFruitKo ?? post.detectedFruit,
            detectedFruitKo: post.detectedFruitKo,
            detectedFruit: post.detectedFruit,
            status: post.status,
            freshnessLabel: post.freshnessLabel,
            confidenceScore: post.confidenceScore,
            storageZone: post.storageZone,
            storageDeadlineAt: post.storageDeadlineAt,
            expirationDate: post.expirationDate,
            updatedAt: post.updatedAt,
          })),
        '운영자 재고 목록 조회 성공',
      );
    }

    const operatorDisposeMatch = path.match(/^\/api\/v1\/operator\/items\/(\d+)\/dispose$/);
    if (operatorDisposeMatch && req.method === 'PATCH') {
      const post = posts.find(item => item.id === Number(operatorDisposeMatch[1]));
      if (!post) {
        return fail(res, '재고를 찾을 수 없습니다.', 404);
      }
      post.status = 'disposed';
      post.updatedAt = now();
      return ok(res, {
        post,
        postId: post.id,
        status: post.status,
        disposedAt: post.updatedAt,
      }, '폐기 처분이 완료되었습니다.');
    }

    if (req.method === 'GET' && path === '/api/v1/notifications') {
      return ok(res, notifications, '알림 조회 성공');
    }

    const notificationReadMatch = path.match(/^\/api\/v1\/notifications\/([^/]+)\/read$/);
    if (notificationReadMatch && req.method === 'PATCH') {
      const notification = notifications.find(
        item => item.id === notificationReadMatch[1],
      );
      if (notification) {
        notification.readAt = now();
      }
      return ok(res, notification ?? null, '알림을 읽음 처리했습니다.');
    }

    if (req.method === 'PATCH' && path === '/api/v1/notifications/read-all') {
      notifications.forEach(notification => {
        notification.readAt = notification.readAt || now();
      });
      return ok(res, null, '모든 알림을 읽음 처리했습니다.');
    }

    const notificationDeleteMatch = path.match(/^\/api\/v1\/notifications\/([^/]+)$/);
    if (notificationDeleteMatch && req.method === 'DELETE') {
      const index = notifications.findIndex(
        item => item.id === notificationDeleteMatch[1],
      );
      if (index >= 0) {
        notifications.splice(index, 1);
      }
      return ok(res, null, '알림이 삭제되었습니다.');
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
