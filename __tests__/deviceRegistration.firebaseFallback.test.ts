describe('device registration Firebase fallback', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.dontMock('@react-native-firebase/messaging');
    jest.restoreAllMocks();
  });

  it('does not crash FCM token lookup when Firebase is not configured', async () => {
    const firebaseError = new Error(
      "No Firebase App '[DEFAULT]' has been created",
    );

    jest.doMock('@react-native-firebase/messaging', () => ({
      __esModule: true,
      default: () => {
        throw firebaseError;
      },
    }));

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const {
      getFcmToken,
    } = require('@/services/deviceRegistration') as typeof import('@/services/deviceRegistration');

    await expect(getFcmToken()).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(
      'Firebase messaging is unavailable:',
      firebaseError,
    );
  });
});
