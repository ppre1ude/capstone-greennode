const fs = jest.requireActual('fs') as {
  readFileSync: (filePath: string, encoding: 'utf8') => string;
};

const emojiPattern = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

const iconPolicyFiles = [
  'src/design-system/catalog/DesignSystemCatalog.tsx',
  'src/navigation/MainTab.tsx',
  'src/screens/auth/LoginScreen.tsx',
  'src/screens/home/HomeScreen.tsx',
];

const fontAwesome6Fonts = [
  'FontAwesome6_Brands.ttf',
  'FontAwesome6_Regular.ttf',
  'FontAwesome6_Solid.ttf',
];

describe('design system icon policy', () => {
  it('keeps main and login surfaces free from system emoji icons', () => {
    const filesWithEmoji = iconPolicyFiles.filter(relativePath => {
      const source = fs.readFileSync(relativePath, 'utf8');
      return emojiPattern.test(source);
    });

    expect(filesWithEmoji).toEqual([]);
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
});
