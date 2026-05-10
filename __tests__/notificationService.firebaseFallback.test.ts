describe('notification service Firebase fallback', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.dontMock('@react-native-firebase/messaging');
    jest.restoreAllMocks();
  });

  it('does not crash notification registration when Firebase is not configured', () => {
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
      registerBackgroundNotificationHandler,
      registerForegroundNotificationHandlers,
    } = require('@/services/notifications') as typeof import('@/services/notifications');

    expect(() => registerBackgroundNotificationHandler()).not.toThrow();
    expect(() => registerForegroundNotificationHandlers()).not.toThrow();
    expect(typeof registerForegroundNotificationHandlers()).toBe('function');
    expect(warnSpy).toHaveBeenCalledWith(
      'Firebase messaging is unavailable:',
      firebaseError,
    );
  });
});
