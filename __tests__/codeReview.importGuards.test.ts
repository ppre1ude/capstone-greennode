export {};

import path from 'path';

const fs = jest.requireActual('fs') as {
  readFileSync: (filePath: string, encoding: 'utf8') => string;
};

const resolveProjectPath = (relativePath: string) => path.resolve(__dirname, '..', relativePath);

const readSource = (relativePath: string) =>
  fs.readFileSync(resolveProjectPath(relativePath), 'utf8');

const expectNamedImport = (source: string, moduleName: string, importName: string) => {
  const escapedModuleName = moduleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const importPattern = new RegExp(
    `import\\s*\\{[\\s\\S]*?\\b${importName}\\b[\\s\\S]*?\\}\\s*from\\s*['"]${escapedModuleName}['"]`,
  );

  expect(source).toMatch(importPattern);
};

describe('code review import guards', () => {
  it('keeps DSChip imported where review chips are rendered', () => {
    const mySharesSource = readSource('src/screens/profile/MySharesScreen.tsx');
    const postDetailSource = readSource('src/screens/post/PostDetailScreen.tsx');

    expectNamedImport(mySharesSource, '@/design-system', 'DSChip');
    expectNamedImport(postDetailSource, '@/design-system', 'DSChip');
  });

  it('keeps useCameraDevice imported for native QR camera preview', () => {
    const qrScannerSource = readSource('src/features/qr/components/QrScannerShell.tsx');

    expectNamedImport(qrScannerSource, 'react-native-vision-camera', 'useCameraDevice');
  });
});
