const fs = jest.requireActual('fs') as {
  readFileSync: (filePath: string, encoding: 'utf8') => string;
};

export {};

describe('MapScreen safe-area header', () => {
  it('positions the floating search field with the shared header safe-area helper', () => {
    const styleSource = fs.readFileSync(
      'src/screens/map/MapScreen.styles.ts',
      'utf8',
    );

    expect(styleSource).toContain(
      "import { getHeaderTopPadding } from '@/utils/safeArea';",
    );
    expect(styleSource).toContain('top: getHeaderTopPadding(');
    expect(styleSource).not.toContain("top: Platform.OS === 'ios' ? 56 : 24");
  });
});
