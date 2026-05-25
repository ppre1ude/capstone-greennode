import React from 'react';
import { View } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { DSScreenFooter } from '@/design-system';

const renderWithBottomInset = (bottom: number) => (
  <SafeAreaInsetsContext.Provider
    value={{
      top: 0,
      right: 0,
      bottom,
      left: 0,
    }}>
    <DSScreenFooter testID="screen-footer">
      <View />
    </DSScreenFooter>
  </SafeAreaInsetsContext.Provider>
);

const flattenStyle = (style: unknown) =>
  Array.isArray(style) ? Object.assign({}, ...style) : style;

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
});
