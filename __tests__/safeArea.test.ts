import {Platform, StatusBar} from 'react-native';
import {getHeaderTopPadding} from '@/utils/safeArea';

const originalPlatformOS = Platform.OS;
const originalStatusBarHeight = StatusBar.currentHeight;

const setPlatformOS = (os: typeof Platform.OS) => {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: os,
  });
};

const setStatusBarHeight = (height: number | undefined) => {
  Object.defineProperty(StatusBar, 'currentHeight', {
    configurable: true,
    value: height,
  });
};

describe('getHeaderTopPadding', () => {
  afterEach(() => {
    setPlatformOS(originalPlatformOS);
    setStatusBarHeight(originalStatusBarHeight);
  });

  it('uses only the design spacing on Android because native content starts below the status bar', () => {
    setPlatformOS('android');
    setStatusBarHeight(136);

    expect(getHeaderTopPadding()).toBe(16);
    expect(getHeaderTopPadding(8)).toBe(8);
  });

  it('keeps the iOS top spacing unchanged', () => {
    setPlatformOS('ios');

    expect(getHeaderTopPadding()).toBe(56);
  });
});
