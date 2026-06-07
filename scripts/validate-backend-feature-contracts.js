#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {fetchBackendTargetIdentity} = require('./backend-target');

const repoRoot = path.resolve(__dirname, '..');
const baseUrl = (process.env.FOODLINK_API_BASE_URL || 'http://localhost:8080').replace(
  /\/$/,
  '',
);
const shouldMutate = process.argv.includes('--mutate');
const qaPassword = process.env.FOODLINK_QA_PASSWORD || 'Password123';
const qaFridgeId = Number(process.env.FOODLINK_QA_FRIDGE_ID || 1);
const qaFridgePublicCode =
  process.env.FOODLINK_QA_FRIDGE_PUBLIC_CODE || 'GJ-STATION-001';
const operatorEmail = process.env.FOODLINK_OPERATOR_EMAIL || 'optest@foodlink.com';
const operatorPassword =
  process.env.FOODLINK_OPERATOR_PASSWORD || 'testpassword123';
const fixturePath = path.join(
  repoRoot,
  'docs',
  'qa-fixtures',
  'fresh-single-fresh-20260505.jpg',
);
const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+$/, 'Z');
const reportPath = path.join(
  repoRoot,
  'temp',
  `backend-feature-contract-e2e-${timestamp}.json`,
);

const report = {
  baseUrl,
  timestamp,
  mutate: shouldMutate,
  targetIdentity: null,
  results: [],
};

const tunnelHelp =
  'API is not reachable. Open the SSH tunnel first, for example: ssh -N -L 8080:<backend-host>:80 <vm-user>@<vm-host>, or set FOODLINK_API_BASE_URL.';

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

const addResult = (status, id, detail, extra = undefined) => {
  const result = {status, id, detail};
  if (extra !== undefined) {
    result.extra = extra;
  }
  report.results.push(result);
  console.log(`[${status}] ${id}: ${detail}`);
  return result;
};

const getServerMessage = body =>
  body?.message ||
  body?.detail ||
  body?.data?.message ||
  body?.data?.detail ||
  body?.error ||
  'no server message';

const writeReport = () => {
  fs.mkdirSync(path.dirname(reportPath), {recursive: true});
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, {
    encoding: 'utf8',
  });
  console.log(`Report written: ${reportPath}`);
};

const parseJson = async (response, label) => {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    const preview = text.slice(0, 300).replace(/\s+/g, ' ');
    throw new Error(
      `${label} returned non-JSON response (${response.status}): ${preview}`,
    );
  }
};

const request = async (method, pathname, options = {}) => {
  const headers = {...(options.headers || {})};
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  if (options.json !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers,
    body:
      options.body !== undefined
        ? options.body
        : options.json !== undefined
          ? JSON.stringify(options.json)
          : undefined,
  });
  const body = await parseJson(response, `${method} ${pathname}`);
  return {response, body};
};

const expectOk = async (id, method, pathname, options = {}) => {
  const result = await request(method, pathname, options);
  if (!result.response.ok) {
    throw new Error(
      `${result.response.status}: ${getServerMessage(result.body)}`,
    );
  }
  return result.body;
};

const expectHttpStatus = async (
  id,
  expectedStatus,
  method,
  pathname,
  options = {},
) => {
  const result = await request(method, pathname, options);
  const serverMessage = getServerMessage(result.body);
  if (result.response.status !== expectedStatus) {
    throw new Error(
      `${id} expected ${expectedStatus}, got ${result.response.status}: ${serverMessage}`,
    );
  }
  return {
    status: result.response.status,
    message: serverMessage,
    body: result.body,
  };
};

const getData = body => body?.data ?? body;

const normalizeUser = user => ({
  ...user,
  profileImageUrl: user.profileImageUrl ?? user.profile_image_url ?? null,
  isOperator: user.isOperator ?? user.is_operator ?? null,
  operatorRole: user.operatorRole ?? user.operator_role ?? null,
  operatorFridgeIds: user.operatorFridgeIds ?? user.operator_fridge_ids ?? null,
});

const hasAnyOwnKey = (object, keys) =>
  keys.some(key => Object.prototype.hasOwnProperty.call(object, key));

const expectObject = (value, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value;
};

const expectArray = (value, label) => {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  return value;
};

const getListData = body => {
  const data = getData(body);
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === 'object') {
    for (const key of ['items', 'reports', 'shareReports', 'results']) {
      if (Array.isArray(data[key])) {
        return data[key];
      }
    }
  }

  return null;
};

const expectListData = (body, label) => {
  const data = getListData(body);
  if (!data) {
    throw new Error(`${label} must be an array or list wrapper`);
  }
  return data;
};

const expectIsoUtcTimestamp = (value, label) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T.+Z$/.test(value)) {
    throw new Error(`${label} must be an ISO-8601 UTC timestamp ending in Z`);
  }
  return value;
};

const runStep = async (id, fn) => {
  try {
    const detail = await fn();
    addResult('passed', id, detail || 'ok');
  } catch (error) {
    addResult('failed', id, error instanceof Error ? error.message : String(error));
  }
};

const checkPreflight = async () => {
  const targetIdentity = await fetchBackendTargetIdentity(baseUrl);
  report.targetIdentity = targetIdentity;
  const reachable = targetIdentity.probes.find(probe => probe.ok);

  if (reachable) {
    addResult(
      'passed',
      'preflight',
      `${reachable.path} reachable (${reachable.status}), target=${targetIdentity.kind}, evidence=${targetIdentity.evidence}`,
    );
    return;
  }

  const failures = targetIdentity.probes.map(probe =>
    probe.status
      ? `${probe.path} -> ${probe.status}`
      : `${probe.path} -> ${probe.error || 'unreachable'}`,
  );

  throw new Error(`${tunnelHelp} Checked: ${failures.join('; ')}`);
};

const signup = async user => {
  const body = await expectOk('signup', 'POST', '/api/v1/auth/signup', {
    json: user,
  });
  return expectObject(getData(body), `signup ${user.email} data`);
};

const login = async (email, password) => {
  const form = new URLSearchParams();
  form.set('username', email);
  form.set('password', password);

  const body = await expectOk('login', 'POST', '/api/v1/auth/login', {
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: form.toString(),
  });
  const data = expectObject(getData(body), `login ${email} data`);
  const token = data.accessToken || data.access_token;
  if (!token) {
    throw new Error(`login ${email} response missing accessToken`);
  }
  return token;
};

const updateLocation = async (token, label) => {
  const body = await expectOk(
    `${label} location`,
    'PUT',
    '/api/v1/auth/me/location',
    {
      token,
      json: {
        latitude: 35.1595,
        longitude: 126.9136,
        fcmToken: `qa-contract-${label}-${timestamp}`,
      },
    },
  );
  return expectObject(getData(body), `${label} location data`);
};

const getMe = async token => {
  const body = await expectOk('getMe', 'GET', '/api/v1/auth/me', {token});
  const rawUser = expectObject(getData(body), 'auth/me data');
  return {rawUser, user: normalizeUser(rawUser)};
};

const validateOperatorFields = (rawUser, user) => {
  const fieldPairs = [
    ['isOperator', 'is_operator'],
    ['operatorRole', 'operator_role'],
    ['operatorFridgeIds', 'operator_fridge_ids'],
  ];

  for (const keys of fieldPairs) {
    if (!hasAnyOwnKey(rawUser, keys)) {
      throw new Error(`/auth/me missing ${keys.join(' or ')}`);
    }
  }

  if (
    user.operatorFridgeIds !== null &&
    user.operatorFridgeIds !== undefined &&
    !Array.isArray(user.operatorFridgeIds)
  ) {
    throw new Error('operatorFridgeIds must be an array, null, or undefined');
  }
};

const updateProfile = async token => {
  const body = await expectOk('patch profile', 'PATCH', '/api/v1/auth/me', {
    token,
    json: {
      nickname: `QA Author ${timestamp}`,
      profileImageUrl: `https://example.com/qa/${timestamp}.jpg`,
    },
  });
  const user = normalizeUser(expectObject(getData(body), 'PATCH /auth/me data'));
  if (user.nickname !== `QA Author ${timestamp}`) {
    throw new Error(`nickname was not updated: ${user.nickname}`);
  }
  if (!('profileImageUrl' in user)) {
    throw new Error('PATCH /auth/me response missing profileImageUrl');
  }
  return user;
};

const validatePostShape = item => {
  const post = expectObject(item, 'post');
  for (const field of ['id', 'status', 'fridgeId', 'expirationDate']) {
    if (!(field in post)) {
      throw new Error(`post missing ${field}`);
    }
  }
};

const validateShareRequestShape = item => {
  const wrapper = expectObject(item, 'share request item');
  const requestItem = expectObject(wrapper.request, 'share request item.request');
  expectObject(wrapper.post, 'share request item.post');
  if (!('id' in requestItem) || !('status' in requestItem)) {
    throw new Error('share request item.request missing id/status');
  }
};

const getMyPosts = async token => {
  const body = await expectOk(
    'my posts',
    'GET',
    '/api/v1/users/me/posts?status=available,requested,completed,cancelled,expired,pending_store,disposed&skip=0&limit=20',
    {token},
  );
  const data = expectArray(getData(body), 'GET /users/me/posts data');
  data.forEach(validatePostShape);
  return data;
};

const getMyShareRequests = async token => {
  const body = await expectOk(
    'my share requests',
    'GET',
    '/api/v1/users/me/share-requests?status=requested,completed,cancelled,expired&skip=0&limit=20',
    {token},
  );
  const data = expectArray(getData(body), 'GET /users/me/share-requests data');
  data.forEach(validateShareRequestShape);
  return data;
};

const generateImageToken = async token => {
  if (!fs.existsSync(fixturePath)) {
    throw new Error(`fixture missing: ${fixturePath}`);
  }

  const form = new FormData();
  const buffer = fs.readFileSync(fixturePath);
  form.append('image', new Blob([buffer], {type: 'image/jpeg'}), path.basename(fixturePath));

  const response = await fetch(`${baseUrl}/api/v1/posts/generate`, {
    method: 'POST',
    headers: {Authorization: `Bearer ${token}`},
    body: form,
  });
  const body = await parseJson(response, 'POST /api/v1/posts/generate');
  if (!response.ok) {
    throw new Error(`${response.status}: ${getServerMessage(body)}`);
  }
  const data = expectObject(getData(body), 'generate data');
  if (!data.imageToken) {
    throw new Error('generate response missing imageToken');
  }
  return data.imageToken;
};

const getExpirationDate = () => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 7);
  return date.toISOString().slice(0, 10);
};

const createPost = async token => {
  const imageToken = await generateImageToken(token);
  const data = {
    fridgeId: qaFridgeId,
    expirationDate: getExpirationDate(),
    imageToken,
    flow: 'fridge_qr',
  };
  const body = await expectOk('create post', 'POST', '/api/v1/posts', {
    token,
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: `data=${encodeURIComponent(JSON.stringify(data))}`,
  });
  const createPostData = getData(body);
  const post = expectObject(
    Array.isArray(createPostData) ? createPostData[0] : createPostData,
    'create post data',
  );
  if (!post.id) {
    throw new Error('create post response missing id');
  }
  if (post.status !== 'pending_store') {
    throw new Error(`expected pending_store status, got ${post.status}`);
  }
  expectIsoUtcTimestamp(
    post.storeExpiresAt ?? post.storageDeadlineAt,
    'create post storeExpiresAt',
  );
  return post;
};

const requestShare = async (token, postId) => {
  const body = await expectOk(
    'request share',
    'POST',
    `/api/v1/posts/${postId}/requests`,
    {token},
  );
  const data = expectObject(getData(body), 'request share data');
  const requestData = expectObject(data.request, 'request share data.request');
  if (!requestData.id) {
    throw new Error('request share response missing request.id');
  }
  expectIsoUtcTimestamp(
    data.post?.requestExpiresAt,
    'request share post.requestExpiresAt',
  );
  return data;
};

const confirmStore = async (token, postId) => {
  const body = await expectOk(
    'confirm store',
    'POST',
    '/api/v1/inventory/confirm-store',
    {
      token,
      json: {
        postId,
        fridgePublicCode: qaFridgePublicCode,
      },
    },
  );
  const data = expectObject(getData(body), 'confirm-store data');
  if (data.status !== 'available') {
    throw new Error(`expected available status after confirm-store, got ${data.status}`);
  }
  return data;
};

const confirmPickup = async (token, postId) => {
  const body = await expectOk(
    'confirm pickup',
    'POST',
    '/api/v1/inventory/confirm-pickup',
    {
      token,
      json: {
        postId,
        fridgePublicCode: qaFridgePublicCode,
      },
    },
  );
  const data = expectObject(getData(body), 'confirm-pickup data');
  if (data.status !== 'completed') {
    throw new Error(`expected completed status after confirm-pickup, got ${data.status}`);
  }
  return data;
};

const createStoredPost = async token => {
  const post = await createPost(token);
  await confirmStore(token, post.id);
  return getPostDetail(token, post.id);
};

const postMutation = async (token, pathname) => {
  const body = await expectOk(pathname, 'POST', pathname, {token});
  return expectObject(getData(body), `${pathname} data`);
};

const getPostDetail = async (token, postId) => {
  const body = await expectOk('post detail', 'GET', `/api/v1/posts/${postId}`, {
    token,
  });
  return expectObject(getData(body), `post ${postId} detail`);
};

const createShareReview = async (
  token,
  requestId,
  payload = {
    positiveTagIds: ['good_condition', 'matched_photo'],
    issueTagIds: ['label_hard_to_find'],
  },
) => {
  const body = await expectOk(
    'share review',
    'POST',
    `/api/v1/share-requests/${requestId}/review`,
    {
      token,
      json: payload,
    },
  );
  const data = expectObject(getData(body), 'share review data');
  if (data.requestId !== requestId) {
    throw new Error(`review requestId mismatch: ${data.requestId}`);
  }
  if (!Array.isArray(data.positiveTagIds) || !Array.isArray(data.issueTagIds)) {
    throw new Error('review response missing tag arrays');
  }
  return data;
};

const createShareReport = async (
  token,
  requestId,
  payload = {
    reasonId: 'missing_or_not_found',
  },
) => {
  const body = await expectOk(
    'share report',
    'POST',
    `/api/v1/share-requests/${requestId}/report`,
    {
      token,
      json: payload,
    },
  );
  const data = expectObject(getData(body), 'share report data');
  if (data.requestId !== requestId || data.reasonId !== payload.reasonId) {
    throw new Error('report response requestId/reasonId mismatch');
  }
  if (
    data.status !== 'open' ||
    data.resolution !== 'pending' ||
    data.action !== 'none'
  ) {
    throw new Error(
      `unexpected report state: ${data.status}/${data.resolution}/${data.action}`,
    );
  }
  return data;
};

const getTrustSummary = async (token, userId) => {
  const body = await expectOk(
    'trust summary',
    'GET',
    `/api/v1/users/${userId}/trust-summary`,
    {token},
  );
  const data = expectObject(getData(body), 'trust summary data');
  for (const field of ['userId', 'completedShares', 'positiveReviewCount', 'badges']) {
    if (!(field in data)) {
      throw new Error(`trust summary missing ${field}`);
    }
  }
  expectArray(data.badges, 'trust summary badges');
  if (hasAnyOwnKey(data, ['reports', 'reportCount', 'sanctions', 'actions'])) {
    throw new Error('trust summary must not expose report or sanction history');
  }
  return data;
};

const getAdminShareReports = async (token, status = 'open') => {
  const body = await expectOk(
    'admin share reports',
    'GET',
    `/api/v1/admin/share-reports?status=${encodeURIComponent(status)}`,
    {token},
  );
  const reports = expectListData(body, 'GET /admin/share-reports data');
  reports.forEach(report => expectObject(report, 'admin share report item'));
  return reports;
};

const getOperatorInventorySummary = async (token, fridgeId) => {
  const body = await expectOk(
    'operator inventory summary',
    'GET',
    `/api/v1/operator/fridges/${fridgeId}/inventory/summary`,
    {token},
  );
  return expectObject(getData(body), 'operator inventory summary data');
};

const getOperatorInventoryItems = async (token, fridgeId) => {
  const body = await expectOk(
    'operator inventory items',
    'GET',
    `/api/v1/operator/fridges/${fridgeId}/inventory/items`,
    {token},
  );
  return expectArray(getData(body), 'operator inventory items data');
};

const disposeOperatorItem = async (token, postId) => {
  const body = await expectOk(
    'operator dispose item',
    'PATCH',
    `/api/v1/operator/items/${postId}/dispose`,
    {token},
  );
  const data = expectObject(getData(body), 'operator dispose data');
  if (data.status !== 'disposed') {
    throw new Error(`expected disposed status, got ${data.status}`);
  }
  return data;
};

const cleanupActivePost = async (authorToken, postId) => {
  if (!postId) {
    return;
  }

  try {
    const detail = await getPostDetail(authorToken, postId);
    if (!['pending_store', 'available', 'requested'].includes(detail.status)) {
      return;
    }
  } catch (error) {
    console.warn(
      `[cleanup] post=${postId} status check failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  try {
    await postMutation(authorToken, `/api/v1/posts/${postId}/cancel`);
  } catch (error) {
    console.warn(
      `[cleanup] post=${postId} cancel failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
};

const runLifecycleScenario = async (id, fn) => {
  try {
    const detail = await fn();
    addResult('passed', id, detail || 'ok');
  } catch (error) {
    addResult(
      'failed',
      id,
      error instanceof Error ? error.message : String(error),
    );
  }
};

const loadOperatorContext = async () => {
  const token = await login(operatorEmail, operatorPassword);
  const {rawUser, user} = await getMe(token);
  validateOperatorFields(rawUser, user);
  if (user.isOperator !== true) {
    throw new Error(`expected isOperator true, got ${user.isOperator}`);
  }
  if (!user.operatorRole) {
    throw new Error('operatorRole is empty');
  }
  if (!Array.isArray(user.operatorFridgeIds) || user.operatorFridgeIds.length === 0) {
    throw new Error('operatorFridgeIds must contain at least one fridge id');
  }
  return {token, user};
};

const runOperatorProfileCheck = async () => {
  await runStep('operator profile', async () => {
    const {user} = await loadOperatorContext();
    return `role=${user.operatorRole}, fridgeIds=${user.operatorFridgeIds.join(',')}`;
  });
};

const runOperatorInventoryCheck = async authorToken => {
  let operatorContext;

  await runStep('operator inventory summary/items', async () => {
    operatorContext = await loadOperatorContext();
    const summary = await getOperatorInventorySummary(
      operatorContext.token,
      qaFridgeId,
    );
    const items = await getOperatorInventoryItems(operatorContext.token, qaFridgeId);
    if (!('total' in summary) && !('totalItems' in summary)) {
      throw new Error('operator summary missing total count');
    }
    return `fridge=${qaFridgeId}, items=${items.length}`;
  });

  await runLifecycleScenario('operator dispose available item', async () => {
    operatorContext = operatorContext || (await loadOperatorContext());
    let postId;
    try {
      const post = await createPost(authorToken);
      postId = post.id;
      await confirmStore(authorToken, post.id);
      const disposed = await disposeOperatorItem(operatorContext.token, post.id);
      return `post=${post.id}, status=${disposed.status}`;
    } finally {
      await cleanupActivePost(authorToken, postId);
    }
  });
};

const runMutationMatrix = async () => {
  const suffix = Date.now();
  const author = {
    email: `codex_contract_author_${suffix}@example.com`,
    nickname: `QA Author ${suffix}`,
    password: qaPassword,
  };
  const requester = {
    email: `codex_contract_requester_${suffix}@example.com`,
    nickname: `QA Requester ${suffix}`,
    password: qaPassword,
  };
  const observer = {
    email: `codex_contract_observer_${suffix}@example.com`,
    nickname: `QA Observer ${suffix}`,
    password: qaPassword,
  };
  const state = {};

  await runStep('auth signup author/requester/observer', async () => {
    state.authorUser = await signup(author);
    state.requesterUser = await signup(requester);
    state.observerUser = await signup(observer);
    return `${author.email}, ${requester.email}, ${observer.email}`;
  });

  await runStep('auth login author/requester/observer', async () => {
    state.authorToken = await login(author.email, author.password);
    state.requesterToken = await login(requester.email, requester.password);
    state.observerToken = await login(observer.email, observer.password);
    return 'tokens acquired';
  });

  if (!state.authorToken || !state.requesterToken || !state.observerToken) {
    addResult('skipped', 'mutation matrix', 'auth setup failed');
    return;
  }

  await runStep('auth location author/requester/observer', async () => {
    await updateLocation(state.authorToken, 'author');
    await updateLocation(state.requesterToken, 'requester');
    await updateLocation(state.observerToken, 'observer');
    return 'Gwangju coordinates saved';
  });

  await runStep('auth me operator fields', async () => {
    const {rawUser, user} = await getMe(state.authorToken);
    validateOperatorFields(rawUser, user);
    return `isOperator=${user.isOperator}, operatorRole=${user.operatorRole}, operatorFridgeIds=${JSON.stringify(user.operatorFridgeIds)}`;
  });

  await runStep('auth profile patch', async () => {
    const user = await updateProfile(state.authorToken);
    return `nickname=${user.nickname}`;
  });

  await runStep('my history APIs', async () => {
    const posts = await getMyPosts(state.authorToken);
    const requests = await getMyShareRequests(state.requesterToken);
    return `posts=${posts.length}, shareRequests=${requests.length}`;
  });

  await runLifecycleScenario(
    'lifecycle happy cancel available post',
    async () => {
      let postId;
      try {
        const post = await createStoredPost(state.authorToken);
        postId = post.id;
        const cancelled = await postMutation(
          state.authorToken,
          `/api/v1/posts/${post.id}/cancel`,
        );
        if (cancelled.status !== 'cancelled') {
          throw new Error(`expected cancelled status, got ${cancelled.status}`);
        }
        return `post=${post.id}, status=${cancelled.status}`;
      } finally {
        await cleanupActivePost(state.authorToken, postId);
      }
    },
  );

  await runLifecycleScenario(
    'lifecycle happy request then QR pickup',
    async () => {
      let postId;
      try {
        const post = await createStoredPost(state.authorToken);
        postId = post.id;
        const requested = await requestShare(state.requesterToken, post.id);
        const pickedUp = await confirmPickup(state.requesterToken, post.id);
        const detail = await getPostDetail(state.authorToken, post.id);
        if (detail.status !== 'completed') {
          throw new Error(`expected completed detail, got ${detail.status}`);
        }
        return [
          `post=${post.id}`,
          `request=${requested.request.id}`,
          `pickupStatus=${pickedUp.status}`,
        ].join(', ');
      } finally {
        await cleanupActivePost(state.authorToken, postId);
      }
    },
  );

  await runLifecycleScenario(
    'trust feedback after confirmed pickup',
    async () => {
      let postId;
      try {
        const post = await createStoredPost(state.authorToken);
        postId = post.id;
        const requested = await requestShare(state.requesterToken, post.id);
        await confirmPickup(state.requesterToken, post.id);
        const review = await createShareReview(
          state.requesterToken,
          requested.request.id,
        );
        const duplicateReview = await expectHttpStatus(
          'duplicate share review',
          409,
          'POST',
          `/api/v1/share-requests/${requested.request.id}/review`,
          {
            token: state.requesterToken,
            json: {
              positiveTagIds: ['good_condition'],
              issueTagIds: [],
            },
          },
        );
        const shareReport = await createShareReport(
          state.requesterToken,
          requested.request.id,
        );
        const summary = await getTrustSummary(
          state.requesterToken,
          post.authorId ?? state.authorUser.id,
        );
        return [
          `review=${review.id}`,
          `duplicate=${duplicateReview.status}`,
          `report=${shareReport.id}`,
          `completedShares=${summary.completedShares}`,
        ].join(', ');
      } finally {
        await cleanupActivePost(state.authorToken, postId);
      }
    },
  );

  await runLifecycleScenario(
    'trust feedback rejects requested state before pickup',
    async () => {
      let postId;
      try {
        const post = await createStoredPost(state.authorToken);
        postId = post.id;
        const requested = await requestShare(state.requesterToken, post.id);
        const reviewRejected = await expectHttpStatus(
          'review requested share request',
          409,
          'POST',
          `/api/v1/share-requests/${requested.request.id}/review`,
          {
            token: state.requesterToken,
            json: {
              positiveTagIds: [Array.from(positiveReviewTagIds)[0]],
              issueTagIds: [],
            },
          },
        );
        const reportRejected = await expectHttpStatus(
          'report requested share request',
          409,
          'POST',
          `/api/v1/share-requests/${requested.request.id}/report`,
          {
            token: state.requesterToken,
            json: {
              reasonId: Array.from(shareReportReasonIds)[0],
            },
          },
        );
        return [
          `request=${requested.request.id}`,
          `review=${reviewRejected.status}`,
          `report=${reportRejected.status}`,
        ].join(', ');
      } finally {
        await cleanupActivePost(state.authorToken, postId);
      }
    },
  );

  await runLifecycleScenario(
    'trust feedback rejects invalid actors and enums',
    async () => {
      let postId;
      try {
        const post = await createStoredPost(state.authorToken);
        postId = post.id;
        const requested = await requestShare(state.requesterToken, post.id);
        await confirmPickup(state.requesterToken, post.id);
        const authorReview = await expectHttpStatus(
          'author review own completed share',
          403,
          'POST',
          `/api/v1/share-requests/${requested.request.id}/review`,
          {
            token: state.authorToken,
            json: {
              positiveTagIds: [Array.from(positiveReviewTagIds)[0]],
              issueTagIds: [],
            },
          },
        );
        const observerReport = await expectHttpStatus(
          'observer report requester share',
          403,
          'POST',
          `/api/v1/share-requests/${requested.request.id}/report`,
          {
            token: state.observerToken,
            json: {
              reasonId: Array.from(shareReportReasonIds)[0],
            },
          },
        );
        const unsupportedReviewTag = await expectHttpStatus(
          'unsupported review tag',
          422,
          'POST',
          `/api/v1/share-requests/${requested.request.id}/review`,
          {
            token: state.requesterToken,
            json: {
              positiveTagIds: ['unsupported_positive_tag'],
              issueTagIds: [Array.from(issueReviewTagIds)[0]],
            },
          },
        );
        const unsupportedReportReason = await expectHttpStatus(
          'unsupported report reason',
          422,
          'POST',
          `/api/v1/share-requests/${requested.request.id}/report`,
          {
            token: state.requesterToken,
            json: {
              reasonId: 'unsupported_report_reason',
            },
          },
        );
        return [
          `request=${requested.request.id}`,
          `authorReview=${authorReview.status}`,
          `observerReport=${observerReport.status}`,
          `badTag=${unsupportedReviewTag.status}`,
          `badReason=${unsupportedReportReason.status}`,
        ].join(', ');
      } finally {
        await cleanupActivePost(state.authorToken, postId);
      }
    },
  );

  await runLifecycleScenario(
    'trust feedback report enters admin review list',
    async () => {
      let postId;
      try {
        const post = await createStoredPost(state.authorToken);
        postId = post.id;
        const requested = await requestShare(state.requesterToken, post.id);
        await confirmPickup(state.requesterToken, post.id);
        const report = await createShareReport(
          state.requesterToken,
          requested.request.id,
        );
        const operatorContext = await loadOperatorContext();
        const reports = await getAdminShareReports(operatorContext.token, 'open');
        const listedReport = reports.find(item => {
          const reportId = item.id ?? item.reportId ?? item.report_id;
          const requestId = item.requestId ?? item.request_id;
          return (
            Number(reportId) === Number(report.id) ||
            Number(requestId) === Number(requested.request.id)
          );
        });
        if (!listedReport) {
          throw new Error('admin share reports list missing created report');
        }
        const summary = await getTrustSummary(
          state.requesterToken,
          post.authorId ?? state.authorUser.id,
        );
        return [
          `report=${report.id}`,
          `listed=${listedReport.id ?? listedReport.reportId ?? 'by-request'}`,
          `badges=${summary.badges.length}`,
        ].join(', ');
      } finally {
        await cleanupActivePost(state.authorToken, postId);
      }
    },
  );

  await runLifecycleScenario(
    'lifecycle happy request then requester cancel',
    async () => {
      let postId;
      try {
        const post = await createStoredPost(state.authorToken);
        postId = post.id;
        const requested = await requestShare(state.requesterToken, post.id);
        await postMutation(
          state.requesterToken,
          `/api/v1/users/me/share-requests/${requested.request.id}/cancel`,
        );
        const detail = await getPostDetail(state.authorToken, post.id);
        if (detail.status !== 'available') {
          throw new Error(`expected post status restored to available, got ${detail.status}`);
        }
        return `post=${post.id}, request=${requested.request.id}, status=${detail.status}`;
      } finally {
        await cleanupActivePost(state.authorToken, postId);
      }
    },
  );

  await runLifecycleScenario(
    'lifecycle 409 requester cannot request pending store post',
    async () => {
      let postId;
      try {
        const post = await createPost(state.authorToken);
        postId = post.id;
        const result = await expectHttpStatus(
          'request pending-store post',
          409,
          'POST',
          `/api/v1/posts/${post.id}/requests`,
          {token: state.requesterToken},
        );
        return `post=${post.id}, status=${result.status}, message=${result.message}`;
      } finally {
        await cleanupActivePost(state.authorToken, postId);
      }
    },
  );

  await runLifecycleScenario(
    'lifecycle 403 author cannot request own post',
    async () => {
      let postId;
      try {
        const post = await createStoredPost(state.authorToken);
        postId = post.id;
        const result = await expectHttpStatus(
          'author request own post',
          403,
          'POST',
          `/api/v1/posts/${post.id}/requests`,
          {token: state.authorToken},
        );
        return `post=${post.id}, status=${result.status}, message=${result.message}`;
      } finally {
        await cleanupActivePost(state.authorToken, postId);
      }
    },
  );

  await runLifecycleScenario(
    'lifecycle 403 non-author cannot cancel available post',
    async () => {
      let postId;
      try {
        const post = await createStoredPost(state.authorToken);
        postId = post.id;
        const result = await expectHttpStatus(
          'non-author cancel available post',
          403,
          'POST',
          `/api/v1/posts/${post.id}/cancel`,
          {token: state.requesterToken},
        );
        return `post=${post.id}, status=${result.status}, message=${result.message}`;
      } finally {
        await cleanupActivePost(state.authorToken, postId);
      }
    },
  );

  await runLifecycleScenario(
    'lifecycle 403 non-requester cannot confirm pickup',
    async () => {
      let postId;
      try {
        const post = await createStoredPost(state.authorToken);
        postId = post.id;
        await requestShare(state.requesterToken, post.id);
        const result = await expectHttpStatus(
          'observer confirm pickup',
          403,
          'POST',
          '/api/v1/inventory/confirm-pickup',
          {
            token: state.observerToken,
            json: {
              postId: post.id,
              fridgePublicCode: qaFridgePublicCode,
            },
          },
        );
        return `post=${post.id}, status=${result.status}, message=${result.message}`;
      } finally {
        await cleanupActivePost(state.authorToken, postId);
      }
    },
  );

  await runLifecycleScenario(
    'lifecycle 403 non-owner cannot cancel another share request',
    async () => {
      let postId;
      try {
        const post = await createStoredPost(state.authorToken);
        postId = post.id;
        const requested = await requestShare(state.requesterToken, post.id);
        const result = await expectHttpStatus(
          'observer cancel requester share request',
          403,
          'POST',
          `/api/v1/users/me/share-requests/${requested.request.id}/cancel`,
          {token: state.observerToken},
        );
        return [
          `post=${post.id}`,
          `request=${requested.request.id}`,
          `status=${result.status}`,
          `message=${result.message}`,
        ].join(', ');
      } finally {
        await cleanupActivePost(state.authorToken, postId);
      }
    },
  );

  await runLifecycleScenario(
    'lifecycle 409 request already requested post',
    async () => {
      let postId;
      try {
        const post = await createStoredPost(state.authorToken);
        postId = post.id;
        await requestShare(state.requesterToken, post.id);
        const result = await expectHttpStatus(
          'observer request already requested post',
          409,
          'POST',
          `/api/v1/posts/${post.id}/requests`,
          {token: state.observerToken},
        );
        return `post=${post.id}, status=${result.status}, message=${result.message}`;
      } finally {
        await cleanupActivePost(state.authorToken, postId);
      }
    },
  );

  await runOperatorProfileCheck();
  await runOperatorInventoryCheck(state.authorToken);
};

const main = async () => {
  try {
    await checkPreflight();
  } catch (error) {
    addResult('failed', 'preflight', error instanceof Error ? error.message : String(error));
    writeReport();
    process.exitCode = 1;
    return;
  }

  if (!shouldMutate) {
    addResult(
      'skipped',
      'mutation matrix',
      'read-only preflight mode; rerun with --mutate to create QA accounts and exercise lifecycle mutations',
    );
  } else {
    await runMutationMatrix();
  }

  writeReport();
  process.exitCode = report.results.some(result => result.status === 'failed') ? 1 : 0;
};

main();
