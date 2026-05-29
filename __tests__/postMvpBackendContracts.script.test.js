const {
  buildAuthenticatedProbePlan,
  evaluateOpenApiContracts,
  findOpenApiOperation,
  hasQueryParameter,
  pathTemplatesMatch,
  stripApiPrefix,
  validateImpactSummaryResponse,
  validateNearbyFridgesResponse,
  validateNearbyPostsResponse,
  validateNotificationsResponse,
} = require('../scripts/validate-post-mvp-backend-contracts');

const openApi = {
  paths: {
    '/api/v1/notifications': {
      get: {
        parameters: [
          {name: 'unreadOnly', in: 'query'},
          {name: 'skip', in: 'query'},
          {name: 'limit', in: 'query'},
        ],
      },
    },
    '/api/v1/notifications/{notification_id}/read': {
      patch: {},
    },
    '/api/v1/notifications/read-all': {
      patch: {},
    },
    '/api/v1/notifications/{notification_id}': {
      delete: {},
    },
    '/api/v1/users/me/impact/summary': {
      get: {
        parameters: [{name: 'period', in: 'query'}],
      },
    },
    '/api/v1/posts/nearby': {
      get: {
        parameters: [{name: 'q', in: 'query'}],
      },
    },
    '/api/v1/fridges/nearby': {
      parameters: [{name: 'radius_km', in: 'query'}],
      get: {
        parameters: [
          {$ref: '#/components/parameters/SearchQuery'},
          {name: 'skip', in: 'query'},
        ],
      },
    },
  },
  components: {
    parameters: {
      SearchQuery: {name: 'q', in: 'query'},
    },
  },
};

describe('post-MVP backend contract helpers', () => {
  it('matches OpenAPI path templates across api prefix and param names', () => {
    expect(stripApiPrefix('/api/v1/notifications')).toBe('/notifications');
    expect(
      pathTemplatesMatch(
        '/api/v1/notifications/{notificationId}/read',
        '/notifications/{notification_id}/read',
      ),
    ).toBe(true);
    expect(
      pathTemplatesMatch(
        '/api/v1/notifications/{notificationId}',
        '/api/v1/notifications/read-all',
      ),
    ).toBe(false);
  });

  it('finds OpenAPI operations and query parameters', () => {
    expect(
      findOpenApiOperation(openApi, 'PATCH', '/api/v1/notifications/{id}/read'),
    ).not.toBeNull();
    expect(hasQueryParameter(openApi, 'GET', '/api/v1/fridges/nearby', 'q')).toBe(
      true,
    );
  });

  it('evaluates required OpenAPI Post-MVP contracts', () => {
    expect(evaluateOpenApiContracts(openApi)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'notifications list openapi',
          status: 'passed',
        }),
        expect.objectContaining({
          id: 'fridges search q openapi',
          status: 'passed',
        }),
      ]),
    );
  });

  it('fails missing OpenAPI q parameter contracts', () => {
    const results = evaluateOpenApiContracts({
      paths: {
        ...openApi.paths,
        '/api/v1/posts/nearby': {
          get: {parameters: [{name: 'q', in: 'header'}]},
        },
      },
      components: openApi.components,
    });

    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'posts search q openapi',
          status: 'failed',
        }),
      ]),
    );
  });

  it('skips authenticated probes when token is missing', () => {
    expect(buildAuthenticatedProbePlan('   ')).toEqual([
      expect.objectContaining({id: 'notifications probe', status: 'skipped'}),
      expect.objectContaining({id: 'impact summary probe', status: 'skipped'}),
      expect.objectContaining({id: 'posts search probe', status: 'skipped'}),
      expect.objectContaining({id: 'fridges search probe', status: 'skipped'}),
    ]);
  });

  it('builds read-only authenticated probes when token exists', () => {
    const probes = buildAuthenticatedProbePlan('access-token');

    expect(probes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'notifications probe',
          method: 'GET',
          pathname: '/api/v1/notifications?unreadOnly=false&skip=0&limit=50',
        }),
        expect.objectContaining({
          id: 'impact summary probe',
          method: 'GET',
          pathname: '/api/v1/users/me/impact/summary?period=month',
        }),
      ]),
    );
  });

  it('validates server notification response shape', () => {
    const result = validateNotificationsResponse({
      success: true,
      data: [
        {
          id: '1',
          type: 'share_created',
          postId: 10,
          title: 'New share',
          body: 'Banana is available',
          createdAt: '2026-05-29T00:00:00Z',
        },
      ],
    });

    expect(result.status).toBe('passed');
    expect(validateNotificationsResponse({success: false}).status).toBe('failed');
  });

  it('validates impact summary response shape', () => {
    expect(
      validateImpactSummaryResponse({
        success: true,
        data: {
          totalShared: 0,
          totalReceived: 0,
          completedShares: 0,
          estimatedFoodSavedGrams: 0,
          estimatedCarbonSavedGrams: 0,
          calculationVersion: 'impact-v1',
          computedAt: '2026-05-29T00:00:00Z',
        },
      }).status,
    ).toBe('passed');

    expect(
      validateImpactSummaryResponse({
        success: true,
        data: {
          completedShares: 0,
          estimatedFoodSavedGrams: 0,
          estimatedCarbonSavedGrams: 0,
          calculationVersion: 'impact-v1',
          computedAt: 'not-a-date',
        },
      }).status,
    ).toBe('failed');
  });

  it('validates nearby post and fridge response shapes', () => {
    expect(
      validateNearbyPostsResponse({
        success: true,
        data: [
          {
            id: 1,
            status: 'available',
            fridgeId: 2,
            fridgeName: 'Station fridge',
            imageUrl: '/static/posts/1.jpg',
            expirationDate: '2026-06-01',
            createdAt: '2026-05-29T00:00:00Z',
          },
        ],
      }).status,
    ).toBe('passed');

    expect(
      validateNearbyFridgesResponse({
        success: true,
        data: [
          {
            id: 2,
            name: 'Station fridge',
            address: 'Gwangju',
            latitude: 35.1595,
            longitude: 126.9136,
            isActive: true,
          },
        ],
      }).status,
    ).toBe('passed');

    expect(validateNearbyPostsResponse({success: true, data: {}}).status).toBe(
      'failed',
    );
    expect(
      validateNearbyFridgesResponse({
        success: true,
        data: [{id: 1, name: 'broken'}],
      }).status,
    ).toBe('failed');
  });
});
