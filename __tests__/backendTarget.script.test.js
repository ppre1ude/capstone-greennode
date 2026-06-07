const {
  classifyDocsText,
  classifyOpenApiBody,
  fetchBackendTargetIdentity,
} = require('../scripts/backend-target');

const response = (status, body) => ({
  status,
  ok: status >= 200 && status < 300,
  text: jest.fn().mockResolvedValue(body),
});

describe('backend target identity helper', () => {
  it('classifies local mock docs responses', () => {
    expect(
      classifyDocsText('<h1>FoodLink Mock API</h1><p>Mock server is running.</p>'),
    ).toEqual({
      kind: 'local-mock',
      evidence: '/docs contains FoodLink Mock API',
    });
  });

  it('classifies non-mock OpenAPI JSON responses', () => {
    expect(
      classifyOpenApiBody({
        openapi: '3.0.0',
        info: {title: 'FoodLink API'},
        paths: {'/api/v1/posts/nearby': {}},
      }),
    ).toEqual({
      kind: 'openapi-json',
      evidence: '/openapi.json title=FoodLink API',
    });
  });

  it('prefers local mock identity when docs reveal a mock target', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(response(404, '{"message":"not found"}'))
      .mockResolvedValueOnce(
        response(200, '<h1>FoodLink Mock API</h1><p>Mock server is running.</p>'),
      );

    await expect(
      fetchBackendTargetIdentity('http://localhost:8080/', fetchImpl),
    ).resolves.toEqual(
      expect.objectContaining({
        baseUrl: 'http://localhost:8080',
        kind: 'local-mock',
        evidence: '/docs contains FoodLink Mock API',
        probes: expect.arrayContaining([
          expect.objectContaining({path: '/openapi.json', status: 404}),
          expect.objectContaining({path: '/docs', status: 200}),
        ]),
      }),
    );
  });

  it('records unreachable targets without throwing', async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new Error('connect failed'));

    await expect(
      fetchBackendTargetIdentity('http://localhost:8080', fetchImpl),
    ).resolves.toEqual(
      expect.objectContaining({
        kind: 'unreachable',
        evidence: 'no backend identity endpoint reachable',
      }),
    );
  });
});
