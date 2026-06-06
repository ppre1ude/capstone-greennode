export {};

import path from 'path';

const fs = jest.requireActual('fs') as {
  readFileSync: (filePath: string, encoding: 'utf8') => string;
};

const resolveProjectPath = (relativePath: string) => path.resolve(__dirname, '..', relativePath);

const activeFlowContractFiles = [
  'src/screens/post/FridgeSelectScreen.tsx',
  'docs/INVENTORY_QR_PRD_V0.md',
].map(resolveProjectPath);

const appLifecycleFiles = ['src/api/posts.ts', 'src/screens/profile/MySharesScreen.tsx'].map(
  resolveProjectPath,
);

const backendContractHarnessPath = resolveProjectPath(
  'scripts/validate-backend-feature-contracts.js',
);

describe('post creation flow contract', () => {
  it('does not expose direct creation as a product flow', () => {
    const filesWithDirectFlow = activeFlowContractFiles.filter(relativePath =>
      /\bdirect\b/.test(fs.readFileSync(relativePath, 'utf8')),
    );

    expect(filesWithDirectFlow).toEqual([]);
  });

  it('does not expose author manual completion as an app lifecycle action', () => {
    const filesWithManualCompletion = [
      ...appLifecycleFiles,
      backendContractHarnessPath,
    ].filter(relativePath =>
      /completePost|\/complete\b/.test(fs.readFileSync(relativePath, 'utf8')),
    );

    expect(filesWithManualCompletion).toEqual([]);
  });

  it('validates backend mutations through the QR lifecycle instead of direct flow', () => {
    const harness = fs.readFileSync(backendContractHarnessPath, 'utf8');

    expect(harness).not.toMatch(/flow:\s*['"]direct['"]/);
    expect(harness).toMatch(/flow:\s*['"]fridge_qr['"]/);
    expect(harness).toContain('/api/v1/inventory/confirm-store');
    expect(harness).toContain('/api/v1/inventory/confirm-pickup');
    expect(harness).toContain('/api/v1/share-requests/');
    expect(harness).toContain('/review');
    expect(harness).toContain('/report');
  });
});
