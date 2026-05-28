import React from 'react';
import { View } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DSScreenFooter } from '@/design-system';

const fs = jest.requireActual('fs') as {
  readFileSync: (filePath: string, encoding: 'utf8') => string;
};

const renderWithBottomInset = (bottom: number) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: {
        top: 0,
        right: 0,
        bottom,
        left: 0,
      },
    }}>
    <DSScreenFooter testID="screen-footer">
      <View />
    </DSScreenFooter>
  </SafeAreaProvider>
);

const flattenStyle = (style: unknown) =>
  Array.isArray(style) ? Object.assign({}, ...style) : style;

const ctaFooterScreenFiles = [
  {
    screenPath: 'src/screens/location/LocationSetupScreen.tsx',
    stylePath: 'src/screens/location/LocationSetupScreen.styles.ts',
  },
  {
    screenPath: 'src/screens/auth/OnboardingScreen.tsx',
    stylePath: 'src/screens/auth/OnboardingScreen.tsx',
  },
];

const getFooterStyleBody = (source: string) =>
  source.match(/footer:\s*\{([\s\S]*?)\n\s*\},/)?.[1] ?? '';

describe('DSScreenFooter', () => {
  it('keeps fixed CTA content above the native navigation area', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(renderWithBottomInset(34));
    });

    const footer = renderer!.root
      .findAllByType(View)
      .find(node => node.props.testID === 'screen-footer');
    expect(footer).toBeDefined();
    const style = flattenStyle(footer!.props.style) as {
      paddingBottom: number;
    };

    expect(style.paddingBottom).toBe(50);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('uses a practical minimum bottom padding when no inset is reported', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(renderWithBottomInset(0));
    });

    const footer = renderer!.root
      .findAllByType(View)
      .find(node => node.props.testID === 'screen-footer');
    expect(footer).toBeDefined();
    const style = flattenStyle(footer!.props.style) as {
      paddingBottom: number;
    };

    expect(style.paddingBottom).toBe(24);

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('keeps remaining fixed CTA screens on safe-area-aware footers', () => {
    ctaFooterScreenFiles.forEach(({ screenPath, stylePath }) => {
      const screenSource = fs.readFileSync(screenPath, 'utf8');
      const footerStyleBody = getFooterStyleBody(
        fs.readFileSync(stylePath, 'utf8'),
      );

      expect(screenSource).toContain('DSScreenFooter');
      expect(screenSource).toContain('<DSScreenFooter');
      expect(footerStyleBody).not.toContain('paddingBottom');
    });
  });
});
