export {};

const fs = jest.requireActual('fs') as {
  readFileSync: (filePath: string, encoding: 'utf8') => string;
};

const activeFlowContractFiles = [
  'src/types/post.ts',
  'src/screens/post/FridgeSelectScreen.tsx',
  'docs/INVENTORY_QR_PRD_V0.md',
];

const appLifecycleFiles = ['src/api/posts.ts', 'src/screens/profile/MySharesScreen.tsx'];

describe('post creation flow contract', () => {
  it('does not expose direct creation as a product flow', () => {
    const filesWithDirectFlow = activeFlowContractFiles.filter(relativePath =>
      /\bdirect\b/.test(fs.readFileSync(relativePath, 'utf8')),
    );

    expect(filesWithDirectFlow).toEqual([]);
  });

  it('does not expose author manual completion as an app lifecycle action', () => {
    const filesWithManualCompletion = appLifecycleFiles.filter(relativePath =>
      /completePost|\/complete\b/.test(fs.readFileSync(relativePath, 'utf8')),
    );

    expect(filesWithManualCompletion).toEqual([]);
  });
});
