import path from 'path';

const fs = jest.requireActual('fs') as {
  readFileSync: (filePath: string, encoding: 'utf8') => string;
};

const readSource = (relativePath: string) =>
  fs.readFileSync(path.resolve(__dirname, '..', relativePath), 'utf8');

describe('demo bypass guards', () => {
  it('keeps camera scan on the real permission, capture, and generate paths', () => {
    const cameraScanSource = readSource(
      'src/screens/camera/CameraScanScreen.tsx',
    );

    expect(cameraScanSource).not.toContain('FORCE_STATIC_SCAN_SURFACE');
    expect(cameraScanSource).not.toContain('FORCE_DEMO_AI_ANALYSIS');
    expect(cameraScanSource).not.toContain('buildDemoGenerateResult');
    expect(cameraScanSource).not.toContain('demo-image-token');
  });

  it('rejects unissued demo image tokens in the local mock API', () => {
    const mockApiSource = readSource('scripts/mock-api.js');

    expect(mockApiSource).not.toContain('demo-image-token');
    expect(mockApiSource).not.toContain('hasDemoImageToken');
  });
});
