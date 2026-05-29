#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const baseUrl = (process.env.FOODLINK_API_BASE_URL || 'http://localhost:8080').replace(
  /\/$/,
  '',
);
const token = process.env.FOODLINK_ACCESS_TOKEN?.trim();
const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+$/, 'Z');
const reportPath = path.join(
  repoRoot,
  'temp',
  `post-mvp-backend-contracts-${timestamp}.json`,
);

const report = {
  baseUrl,
  timestamp,
  results: [],
};

const stripApiPrefix = pathname => {
  const normalized = `/${String(pathname || '').trim().replace(/^\/+/, '')}`.replace(
    /\/+$/,
    '',
  );
  return normalized.replace(/^\/api\/v1(?=\/|$)/, '') || '/';
};

const isPathParam = segment => /^\{[^/{}]+\}$/.test(segment);

const pathTemplatesMatch = (expectedPath, actualPath) => {
  const expectedSegments = stripApiPrefix(expectedPath).split('/').filter(Boolean);
  const actualSegments = stripApiPrefix(actualPath).split('/').filter(Boolean);
  if (expectedSegments.length !== actualSegments.length) {
    return false;
  }

  return expectedSegments.every((expectedSegment, index) => {
    const actualSegment = actualSegments[index];
    if (isPathParam(expectedSegment) || isPathParam(actualSegment)) {
      return isPathParam(expectedSegment) && isPathParam(actualSegment);
    }
    return expectedSegment === actualSegment;
  });
};

const resolveOpenApiRef = (openApi, maybeRef) => {
  if (!maybeRef?.$ref || !maybeRef.$ref.startsWith('#/')) {
    return maybeRef;
  }

  return maybeRef.$ref
    .slice(2)
    .split('/')
    .reduce((cursor, rawKey) => {
      if (cursor == null) {
        return undefined;
      }
      return cursor[rawKey.replace(/~1/g, '/').replace(/~0/g, '~')];
    }, openApi);
};

const findOpenApiPathEntry = (openApi, pathname) => {
  if (!openApi?.paths || typeof openApi.paths !== 'object') {
    return null;
  }

  const matchedPath = Object.keys(openApi.paths).find(candidate =>
    pathTemplatesMatch(pathname, candidate),
  );
  if (!matchedPath) {
    return null;
  }
  return {path: matchedPath, item: openApi.paths[matchedPath]};
};

const findOpenApiOperation = (openApi, method, pathname) => {
  const pathEntry = findOpenApiPathEntry(openApi, pathname);
  if (!pathEntry?.item || typeof pathEntry.item !== 'object') {
    return null;
  }

  const operation = pathEntry.item[String(method).toLowerCase()];
  return operation && typeof operation === 'object'
    ? {path: pathEntry.path, operation, pathItem: pathEntry.item}
    : null;
};

const getOpenApiParameters = (openApi, method, pathname) => {
  const match = findOpenApiOperation(openApi, method, pathname);
  if (!match) {
    return [];
  }

  return [
    ...(Array.isArray(match.pathItem.parameters) ? match.pathItem.parameters : []),
    ...(Array.isArray(match.operation.parameters) ? match.operation.parameters : []),
  ]
    .map(parameter => resolveOpenApiRef(openApi, parameter))
    .filter(parameter => parameter && typeof parameter === 'object');
};

const hasQueryParameter = (openApi, method, pathname, name) =>
  getOpenApiParameters(openApi, method, pathname).some(
    parameter => parameter.in === 'query' && parameter.name === name,
  );

const hasAnyQueryParameter = (openApi, method, pathname, names) =>
  names.some(name => hasQueryParameter(openApi, method, pathname, name));

const pass = (id, detail) => ({status: 'passed', id, detail});
const fail = (id, detail) => ({status: 'failed', id, detail});
const skip = (id, detail) => ({status: 'skipped', id, detail});

const evaluateOpenApiContracts = openApi => {
  const endpointChecks = [
    ['notifications list openapi', 'GET', '/api/v1/notifications'],
    [
      'notification read openapi',
      'PATCH',
      '/api/v1/notifications/{notificationId}/read',
    ],
    ['notifications read-all openapi', 'PATCH', '/api/v1/notifications/read-all'],
    [
      'notification delete openapi',
      'DELETE',
      '/api/v1/notifications/{notificationId}',
    ],
    ['impact summary openapi', 'GET', '/api/v1/users/me/impact/summary'],
  ];

  const results = endpointChecks.map(([id, method, pathname]) =>
    findOpenApiOperation(openApi, method, pathname)
      ? pass(id, `${method} ${pathname} exposed`)
      : fail(id, `${method} ${pathname} missing`),
  );

  results.push(
    hasAnyQueryParameter(openApi, 'GET', '/api/v1/notifications', [
      'unreadOnly',
      'unread_only',
    ])
      ? pass(
          'notifications unread filter openapi',
          'GET /api/v1/notifications exposes unread filter query parameter',
        )
      : fail(
          'notifications unread filter openapi',
          'GET /api/v1/notifications missing unreadOnly or unread_only query parameter',
        ),
  );

  for (const name of ['skip', 'limit']) {
    results.push(
      hasQueryParameter(openApi, 'GET', '/api/v1/notifications', name)
        ? pass(
            `notifications ${name} openapi`,
            `GET /api/v1/notifications exposes query parameter ${name}`,
          )
        : fail(
            `notifications ${name} openapi`,
            `GET /api/v1/notifications missing query parameter ${name}`,
          ),
    );
  }

  for (const [id, pathname] of [
    ['posts search q openapi', '/api/v1/posts/nearby'],
    ['fridges search q openapi', '/api/v1/fridges/nearby'],
  ]) {
    results.push(
      hasQueryParameter(openApi, 'GET', pathname, 'q')
        ? pass(id, `GET ${pathname} exposes query parameter q`)
        : fail(id, `GET ${pathname} missing query parameter q`),
    );
  }

  return results;
};

const getData = body => {
  if (body && typeof body === 'object' && Object.prototype.hasOwnProperty.call(body, 'data')) {
    return body.data;
  }
  return body;
};

const getListData = body => {
  const data = getData(body);
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === 'object') {
    for (const key of ['items', 'notifications', 'results']) {
      if (Array.isArray(data[key])) {
        return data[key];
      }
    }
  }

  return null;
};

const failIfApiFailure = (body, id) => {
  if (body?.success === false) {
    return fail(id, body.message || body.detail || 'API response success=false');
  }
  return null;
};

const expectArrayBody = (body, id, options = {}) => {
  const apiFailure = failIfApiFailure(body, id);
  if (apiFailure) {
    return apiFailure;
  }
  const data = options.allowListWrapper ? getListData(body) : getData(body);
  if (!Array.isArray(data)) {
    return fail(
      id,
      options.allowListWrapper
        ? 'response data must be an array or list wrapper'
        : 'response data must be an array',
    );
  }
  return {data};
};

const hasValue = (object, field) =>
  object && Object.prototype.hasOwnProperty.call(object, field) && object[field] != null;

const hasAnyValue = (object, fields) => fields.some(field => hasValue(object, field));
const hasAnyOwnKey = (object, fields) =>
  fields.some(
    field => object && Object.prototype.hasOwnProperty.call(object, field),
  );

const validateNotificationsResponse = body => {
  const arrayResult = expectArrayBody(body, 'notifications response', {
    allowListWrapper: true,
  });
  if (arrayResult.status === 'failed') {
    return arrayResult;
  }

  const invalid = arrayResult.data.find(item => {
    if (!item || typeof item !== 'object') {
      return true;
    }
    return !(
      hasValue(item, 'id') &&
      hasValue(item, 'type') &&
      hasAnyValue(item, ['postId', 'post_id']) &&
      hasAnyValue(item, ['fruitName', 'fruit_name']) &&
      hasAnyValue(item, ['fridgeName', 'fridge_name']) &&
      hasValue(item, 'title') &&
      hasValue(item, 'body') &&
      hasAnyOwnKey(item, ['readAt', 'read_at']) &&
      (item.type !== 'share_requested' ||
        hasAnyValue(item, ['requestId', 'request_id'])) &&
      hasAnyValue(item, ['createdAt', 'created_at', 'receivedAt', 'received_at'])
    );
  });

  return invalid
    ? fail('notifications response', 'notification item missing required fields')
    : pass('notifications response', `notifications=${arrayResult.data.length}`);
};

const validateImpactSummaryResponse = body => {
  const apiFailure = failIfApiFailure(body, 'impact summary response');
  if (apiFailure) {
    return apiFailure;
  }

  const data = getData(body);
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return fail('impact summary response', 'response data must be an object');
  }

  for (const field of [
    'completedShares',
    'estimatedFoodSavedGrams',
    'estimatedCarbonSavedGrams',
  ]) {
    if (typeof data[field] !== 'number') {
      return fail('impact summary response', `${field} must be a number`);
    }
  }

  for (const field of ['totalShared', 'totalReceived']) {
    if (field in data && typeof data[field] !== 'number') {
      return fail('impact summary response', `${field} must be a number when present`);
    }
  }

  if (!data.calculationVersion || typeof data.calculationVersion !== 'string') {
    return fail('impact summary response', 'calculationVersion must be a string');
  }
  if (!data.computedAt || Number.isNaN(Date.parse(data.computedAt))) {
    return fail('impact summary response', 'computedAt must be a valid date string');
  }

  return pass(
    'impact summary response',
    `completedShares=${data.completedShares}, version=${data.calculationVersion}`,
  );
};

const validateNearbyPostsResponse = body => {
  const arrayResult = expectArrayBody(body, 'nearby posts response');
  if (arrayResult.status === 'failed') {
    return arrayResult;
  }

  const requiredFields = [
    'id',
    'status',
    'fridgeId',
    'fridgeName',
    'imageUrl',
    'expirationDate',
    'createdAt',
  ];
  const invalid = arrayResult.data.find(
    item =>
      !item ||
      typeof item !== 'object' ||
      requiredFields.some(field => !hasValue(item, field)),
  );

  return invalid
    ? fail('nearby posts response', 'post item missing required fields')
    : pass('nearby posts response', `posts=${arrayResult.data.length}`);
};

const validateNearbyFridgesResponse = body => {
  const arrayResult = expectArrayBody(body, 'nearby fridges response');
  if (arrayResult.status === 'failed') {
    return arrayResult;
  }

  const requiredFields = [
    'id',
    'name',
    'address',
    'latitude',
    'longitude',
    'isActive',
  ];
  const invalid = arrayResult.data.find(
    item =>
      !item ||
      typeof item !== 'object' ||
      requiredFields.some(field => !hasValue(item, field)) ||
      typeof item.latitude !== 'number' ||
      typeof item.longitude !== 'number',
  );

  return invalid
    ? fail('nearby fridges response', 'fridge item missing required fields')
    : pass('nearby fridges response', `fridges=${arrayResult.data.length}`);
};

const buildAuthenticatedProbePlan = accessToken => {
  if (!accessToken?.trim()) {
    return [
      skip('notifications probe', 'FOODLINK_ACCESS_TOKEN not set'),
      skip('impact summary probe', 'FOODLINK_ACCESS_TOKEN not set'),
      skip('posts search probe', 'FOODLINK_ACCESS_TOKEN not set'),
      skip('fridges search probe', 'FOODLINK_ACCESS_TOKEN not set'),
    ];
  }

  const postParams = new URLSearchParams({
    latitude: '35.1595',
    longitude: '126.9136',
    radius_km: '2',
    q: '바나나',
    skip: '0',
    limit: '20',
  });
  const fridgeParams = new URLSearchParams({
    latitude: '35.1595',
    longitude: '126.9136',
    radius_km: '2',
    q: '광주역',
    skip: '0',
    limit: '20',
  });

  return [
    {
      id: 'notifications probe',
      method: 'GET',
      pathname:
        '/api/v1/notifications?unreadOnly=false&unread_only=false&skip=0&limit=50',
      validate: validateNotificationsResponse,
    },
    {
      id: 'impact summary probe',
      method: 'GET',
      pathname: '/api/v1/users/me/impact/summary?period=month',
      validate: validateImpactSummaryResponse,
    },
    {
      id: 'posts search probe',
      method: 'GET',
      pathname: `/api/v1/posts/nearby?${postParams.toString()}`,
      validate: validateNearbyPostsResponse,
    },
    {
      id: 'fridges search probe',
      method: 'GET',
      pathname: `/api/v1/fridges/nearby?${fridgeParams.toString()}`,
      validate: validateNearbyFridgesResponse,
    },
  ];
};

const addResult = result => {
  report.results.push(result);
  console.log(`[${result.status}] ${result.id}: ${result.detail}`);
};

const writeReport = () => {
  fs.mkdirSync(path.dirname(reportPath), {recursive: true});
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
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
    throw new Error(`${label} returned non-JSON response (${response.status}): ${preview}`);
  }
};

const requestJson = async (method, pathname, accessToken) => {
  const headers = accessToken ? {Authorization: `Bearer ${accessToken}`} : {};
  const response = await fetch(`${baseUrl}${pathname}`, {method, headers});
  const body = await parseJson(response, `${method} ${pathname}`);
  return {response, body};
};

const runAuthenticatedProbe = async probe => {
  try {
    const {response, body} = await requestJson(probe.method, probe.pathname, token);
    if (!response.ok) {
      return fail(probe.id, `${response.status}: ${body?.message || body?.detail || 'request failed'}`);
    }
    const validation = probe.validate(body);
    return validation.status === 'passed'
      ? pass(probe.id, validation.detail)
      : fail(probe.id, validation.detail);
  } catch (error) {
    return fail(probe.id, error instanceof Error ? error.message : String(error));
  }
};

const main = async () => {
  try {
    const {response, body} = await requestJson('GET', '/openapi.json');
    if (!response.ok) {
      addResult(fail('openapi fetch', `${response.status}: unable to fetch /openapi.json`));
    } else {
      addResult(pass('openapi fetch', '/openapi.json reachable'));
      evaluateOpenApiContracts(body).forEach(addResult);
    }
  } catch (error) {
    addResult(fail('openapi fetch', error instanceof Error ? error.message : String(error)));
  }

  for (const probe of buildAuthenticatedProbePlan(token)) {
    if (probe.status === 'skipped') {
      addResult(probe);
    } else {
      addResult(await runAuthenticatedProbe(probe));
    }
  }

  writeReport();
  process.exitCode = report.results.some(result => result.status === 'failed') ? 1 : 0;
};

if (require.main === module) {
  main();
}

module.exports = {
  buildAuthenticatedProbePlan,
  evaluateOpenApiContracts,
  findOpenApiOperation,
  getOpenApiParameters,
  hasQueryParameter,
  pathTemplatesMatch,
  stripApiPrefix,
  validateImpactSummaryResponse,
  validateNearbyFridgesResponse,
  validateNearbyPostsResponse,
  validateNotificationsResponse,
};
