import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import ShareReviewPositiveTagSelector from '@/components/trust/ShareReviewPositiveTagSelector';
import { colors, fontFamily, radius } from '@/theme';

const findTagButton = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  label: string,
) => {
  const button = renderer.root.findAll(
    node =>
      node.type === TouchableOpacity &&
      node.findAllByProps({ children: label }).length > 0,
  )[0];

  if (!button) {
    throw new Error(`Tag button with label "${label}" not found`);
  }

  return button;
};

const findTagLabel = (
  renderer: ReactTestRenderer.ReactTestRenderer,
  label: string,
) => renderer.root.findByProps({ children: label });

describe('ShareReviewPositiveTagSelector', () => {
  it('renders positive review tags with neutral defaults and primary selected state', async () => {
    const onToggle = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <ShareReviewPositiveTagSelector
          selectedIds={['good_condition']}
          onToggle={onToggle}
        />,
      );
    });

    const tagButtons = renderer!.root.findAllByType(TouchableOpacity);
    const selectedTag = findTagButton(renderer!, '상태가 좋아요');
    const unselectedTag = findTagButton(renderer!, '사진과 비슷해요');
    const selectedStyle = StyleSheet.flatten(selectedTag.props.style);
    const unselectedStyle = StyleSheet.flatten(unselectedTag.props.style);
    const selectedLabelStyle = StyleSheet.flatten(
      findTagLabel(renderer!, '상태가 좋아요').props.style,
    );
    const unselectedLabelStyle = StyleSheet.flatten(
      findTagLabel(renderer!, '사진과 비슷해요').props.style,
    );

    expect(tagButtons).toHaveLength(4);
    expect(selectedTag.props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(selectedStyle.minHeight).toBe(40);
    expect(selectedStyle.borderRadius).toBe(radius.full);
    expect(selectedStyle.backgroundColor).toBe(colors.primaryLight);
    expect(selectedStyle.borderColor).toBe(colors.primary);
    expect(selectedLabelStyle.fontFamily).toBe(fontFamily.semiBold);
    expect(selectedLabelStyle.color).toBe(colors.primaryDark);
    expect(unselectedTag.props.accessibilityState).toMatchObject({
      selected: false,
    });
    expect(unselectedStyle.backgroundColor).toBe(colors.background);
    expect(unselectedStyle.borderColor).toBe(colors.border);
    expect(unselectedLabelStyle.fontFamily).toBe(fontFamily.semiBold);
    expect(unselectedLabelStyle.color).toBe(colors.textSecondary);
    expect(selectedTag.findAllByProps({ name: 'check' }).length).toBeGreaterThan(
      0,
    );

    await ReactTestRenderer.act(async () => {
      unselectedTag.props.onPress();
    });

    expect(onToggle).toHaveBeenCalledWith('matched_photo');

    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });
});
