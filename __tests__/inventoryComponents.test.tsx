import React from 'react';
import {Text} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import {
  InventoryCountdownBadge,
  InventoryLabelInstructionCard,
  InventoryProgressStepper,
  getInventoryStatusDisplay,
} from '@/features/inventory';

const flattenText = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.map(flattenText).join('');
  }

  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '';
};

const getTextContent = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType(Text).map(node => flattenText(node.props.children));

describe('inventory components', () => {
  it('renders inventory progress for a pickup hold state', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <InventoryProgressStepper status="pickup_hold" />,
      );
    });

    const textContent = getTextContent(renderer!);

    expect(textContent).toContain('수령 대기');
    expect(textContent).toContain('보관');
    expect(textContent).toContain('수령 완료');

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('renders countdown time from props without starting an API workflow', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <InventoryCountdownBadge
          expiresAt={new Date('2026-05-19T00:05:00.000Z')}
          now={new Date('2026-05-19T00:00:00.000Z')}
        />,
      );
    });

    expect(getTextContent(renderer!)).toContain('05:00');

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('renders an expired countdown badge when the hold has elapsed', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <InventoryCountdownBadge
          expiresAt={new Date('2026-05-19T00:00:00.000Z')}
          now={new Date('2026-05-19T00:30:00.000Z')}
        />,
      );
    });

    expect(getTextContent(renderer!)).toContain('만료됨');

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('renders label instructions from props', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <InventoryLabelInstructionCard
          deadlineLabel="오늘 18:30"
          itemName="토마토"
          labelCode="#0042"
          storageZone="일반 구역"
        />,
      );
    });

    const textContent = getTextContent(renderer!);

    expect(textContent).toContain('#0042');
    expect(textContent).toContain('토마토');
    expect(textContent).toContain('일반 구역');
    expect(textContent).toContain('오늘 18:30');

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('maps inventory statuses to display metadata without API-specific names', () => {
    expect(getInventoryStatusDisplay('pending_store')).toMatchObject({
      label: '등록 대기',
      tone: 'warning',
    });
    expect(getInventoryStatusDisplay('dispose_needed')).toMatchObject({
      label: '폐기 필요',
      tone: 'danger',
    });
  });
});
