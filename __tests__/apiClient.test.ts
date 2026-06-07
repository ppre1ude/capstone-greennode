let mockRequestFulfilled: ((config: {headers?: Record<string, string>}) => unknown) | undefined;
let mockResponseRejected: ((error: unknown) => Promise<never>) | undefined;

const mockGetToken = jest.fn();
const mockRemoveToken = jest.fn();
const mockEmitUnauthorized = jest.fn();

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      interceptors: {
        request: {
          use: jest.fn(fulfilled => {
            mockRequestFulfilled = fulfilled;
          }),
        },
        response: {
          use: jest.fn((_fulfilled, rejected) => {
            mockResponseRejected = rejected;
          }),
        },
      },
    })),
  },
}));

jest.mock('@/utils/storage', () => ({
  getToken: mockGetToken,
  removeToken: mockRemoveToken,
}));

jest.mock('@/api/authEvents', () => ({
  emitUnauthorized: mockEmitUnauthorized,
}));

describe('apiClient interceptors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      require('@/api/client');
    });
  });

  it('injects the stored JWT token as a Bearer header', async () => {
    mockGetToken.mockResolvedValue('access-token');

    const config = await mockRequestFulfilled?.({headers: {}});

    expect(config).toEqual({
      headers: {
        Authorization: 'Bearer access-token',
      },
    });
  });

  it('clears token state and emits unauthorized on 401 responses', async () => {
    const error = {response: {status: 401}};
    mockRemoveToken.mockResolvedValue(undefined);

    await expect(mockResponseRejected?.(error)).rejects.toBe(error);

    expect(mockRemoveToken).toHaveBeenCalledTimes(1);
    expect(mockEmitUnauthorized).toHaveBeenCalledTimes(1);
  });
});
