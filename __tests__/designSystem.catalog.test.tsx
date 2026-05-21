import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { DesignSystemCatalog } from '@/design-system';

describe('DesignSystemCatalog', () => {
  it('renders representative design system component states', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<DesignSystemCatalog />);
    });

    expect(
      renderer!.root.findAllByProps({ testID: 'design-system-catalog' }).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findAllByProps({ children: 'Buttons' }).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findAllByProps({ children: 'Icon Slots' }).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findAllByProps({ name: 'rotate-right' }).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findAllByProps({ name: 'magnifying-glass' }).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findAllByProps({ children: 'Chips' }).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findAllByProps({ children: 'Text Fields' }).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findAllByProps({ children: 'List Cells' }).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findAllByProps({ children: 'Selected Cards' }).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findAllByProps({ children: 'Map card selected' }).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findAllByProps({ children: 'Selected fridge list row' })
        .length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findAllByProps({ children: 'Palette' }).length,
    ).toBeGreaterThan(0);
  });
});
