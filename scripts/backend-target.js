/* eslint-env node */

const collapseWhitespace = text =>
  String(text || '')
    .replace(/\s+/g, ' ')
    .trim();

const previewText = text => collapseWhitespace(text).slice(0, 160);

const classifyOpenApiBody = body => {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const title = collapseWhitespace(body.info?.title);
  if (body.openapi && body.paths && typeof body.paths === 'object') {
    if (/mock/i.test(title)) {
      return {
        kind: 'local-mock',
        evidence: title
          ? `/openapi.json title=${title}`
          : '/openapi.json exposes mock OpenAPI',
      };
    }

    return {
      kind: 'openapi-json',
      evidence: title
        ? `/openapi.json title=${title}`
        : '/openapi.json exposes OpenAPI paths',
    };
  }

  return null;
};

const classifyDocsText = text => {
  const normalized = collapseWhitespace(text);
  if (!normalized) {
    return null;
  }

  if (/FoodLink Mock API/i.test(normalized) || /Mock server is running/i.test(normalized)) {
    return {
      kind: 'local-mock',
      evidence: '/docs contains FoodLink Mock API',
    };
  }

  if (/Swagger UI/i.test(normalized) || /ReDoc/i.test(normalized) || /openapi\.json/i.test(normalized)) {
    return {
      kind: 'openapi-docs',
      evidence: '/docs looks like OpenAPI documentation',
    };
  }

  return null;
};

const classifyProbe = (path, text) => {
  if (path.endsWith('openapi.json')) {
    try {
      const openApiIdentity = classifyOpenApiBody(JSON.parse(text));
      if (openApiIdentity) {
        return openApiIdentity;
      }
    } catch {
      return null;
    }
  }

  if (path === '/docs') {
    return classifyDocsText(text);
  }

  return null;
};

const fetchProbe = async (baseUrl, path, fetchImpl) => {
  try {
    const response = await fetchImpl(`${baseUrl}${path}`, {method: 'GET'});
    const text = await response.text();
    const identity = classifyProbe(path, text);

    return {
      path,
      status: response.status,
      ok: response.ok,
      kind: identity?.kind || null,
      evidence: identity?.evidence || null,
      preview: previewText(text),
    };
  } catch (error) {
    return {
      path,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

const chooseIdentity = probes => {
  const localMock = probes.find(probe => probe.kind === 'local-mock');
  if (localMock) {
    return {
      kind: 'local-mock',
      evidence: localMock.evidence,
    };
  }

  const openApiJson = probes.find(probe => probe.kind === 'openapi-json');
  if (openApiJson) {
    return {
      kind: 'openapi-json',
      evidence: openApiJson.evidence,
    };
  }

  const openApiDocs = probes.find(probe => probe.kind === 'openapi-docs');
  if (openApiDocs) {
    return {
      kind: 'openapi-docs',
      evidence: openApiDocs.evidence,
    };
  }

  const reachable = probes.find(probe => probe.ok);
  if (reachable) {
    return {
      kind: 'reachable-unknown',
      evidence: `${reachable.path} reachable without recognizable API identity`,
    };
  }

  return {
    kind: 'unreachable',
    evidence: 'no backend identity endpoint reachable',
  };
};

const fetchBackendTargetIdentity = async (baseUrl, fetchImpl = fetch) => {
  const normalizedBaseUrl = String(baseUrl || '').replace(/\/+$/, '');
  const probes = [];

  for (const path of ['/openapi.json', '/docs']) {
    probes.push(await fetchProbe(normalizedBaseUrl, path, fetchImpl));
  }

  const identity = chooseIdentity(probes);
  return {
    baseUrl: normalizedBaseUrl,
    ...identity,
    probes,
  };
};

module.exports = {
  classifyDocsText,
  classifyOpenApiBody,
  fetchBackendTargetIdentity,
};
