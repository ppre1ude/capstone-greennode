const fs = jest.requireActual('fs') as {
  existsSync: (filePath: string) => boolean;
  readFileSync: (filePath: string, encoding: 'utf8') => string;
};

const emojiPattern = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

const iconPolicyFiles = [
  'src/design-system/catalog/DesignSystemCatalog.tsx',
  'src/navigation/MainTab.tsx',
  'src/screens/auth/OnboardingScreen.tsx',
  'src/screens/auth/LoginEmailScreen.tsx',
  'src/screens/auth/LoginScreen.tsx',
  'src/screens/auth/SignupScreen.tsx',
  'src/screens/camera/CameraScanScreen.tsx',
  'src/screens/chat/ChatListScreen.tsx',
  'src/screens/home/HomeScreen.tsx',
  'src/screens/location/LocationSetupScreen.tsx',
  'src/screens/map/MapScreen.tsx',
  'src/screens/post/FridgeSelectScreen.tsx',
  'src/screens/post/PostCompleteScreen.tsx',
  'src/screens/post/PostCreateScreen.tsx',
  'src/screens/post/PostDetailScreen.tsx',
  'src/screens/profile/ProfileScreen.tsx',
];

const fontAwesome6Fonts = [
  'FontAwesome6_Brands.ttf',
  'FontAwesome6_Regular.ttf',
  'FontAwesome6_Solid.ttf',
];

const pretendardFonts = [
  'Pretendard-Black.ttf',
  'Pretendard-Bold.ttf',
  'Pretendard-ExtraBold.ttf',
  'Pretendard-Medium.ttf',
  'Pretendard-Regular.ttf',
  'Pretendard-SemiBold.ttf',
];

describe('design system icon policy', () => {
  it('keeps main and login surfaces free from system emoji icons', () => {
    const filesWithEmoji = iconPolicyFiles.filter(relativePath => {
      const source = fs.readFileSync(relativePath, 'utf8');
      return emojiPattern.test(source);
    });

    expect(filesWithEmoji).toEqual([]);
  });

  it('keeps FridgeSelect navigation glyphs out of Text nodes', () => {
    const source = fs.readFileSync(
      'src/screens/post/FridgeSelectScreen.tsx',
      'utf8',
    );

    expect(source).not.toMatch(/<Text\b[^>]*>\s*(?:←|›|✓)\s*<\/Text>/u);
  });

  it('bundles FontAwesome6 fonts in native targets', () => {
    const androidGradle = fs.readFileSync('android/app/build.gradle', 'utf8');
    const iosInfoPlist = fs.readFileSync('ios/greennode/Info.plist', 'utf8');

    expect(androidGradle).toContain('react-native-vector-icons/fonts.gradle');
    expect(iosInfoPlist).toContain('<key>UIAppFonts</key>');

    fontAwesome6Fonts.forEach(fontName => {
      expect(androidGradle).toContain(fontName);
      expect(iosInfoPlist).toContain(`<string>${fontName}</string>`);
    });
  });

  it('bundles Pretendard fonts in native targets', () => {
    const androidManifest = fs.readFileSync(
      'android/link-assets-manifest.json',
      'utf8',
    );
    const iosManifest = fs.readFileSync(
      'ios/link-assets-manifest.json',
      'utf8',
    );
    const iosInfoPlist = fs.readFileSync('ios/greennode/Info.plist', 'utf8');
    const reactNativeConfig = fs.readFileSync('react-native.config.js', 'utf8');

    expect(reactNativeConfig).toContain('./assets/fonts');
    expect(androidManifest).not.toContain('Pretendard-LICENSE');
    expect(iosManifest).not.toContain('Pretendard-LICENSE');

    pretendardFonts.forEach(fontName => {
      expect(fs.existsSync(`assets/fonts/${fontName}`)).toBe(true);
      expect(
        fs.existsSync(`android/app/src/main/assets/fonts/${fontName}`),
      ).toBe(true);
      expect(androidManifest).toContain(`assets/fonts/${fontName}`);
      expect(iosManifest).toContain(`assets/fonts/${fontName}`);
      expect(iosInfoPlist).toContain(`<string>${fontName}</string>`);
    });
  });
});
