import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  DSButton,
  DSCard,
  DSChip,
  DSIcon,
  DSListCell,
  DSText,
  DSTextField,
} from '@/design-system/components';
import { colors, spacing } from '@/theme';

const swatches = [
  { name: 'Primary', color: colors.primary },
  { name: 'Success', color: colors.success },
  { name: 'Warning', color: colors.warning },
  { name: 'Error', color: colors.error },
  { name: 'Surface', color: colors.surface },
];

export const DesignSystemCatalog = () => (
  <ScrollView
    contentContainerStyle={styles.container}
    testID="design-system-catalog">
    <DSText variant="heading3">Design System Catalog</DSText>

    <DSCard variant="outlined" style={styles.section}>
      <DSText variant="bodyBold">Buttons</DSText>
      <View style={styles.row}>
        <DSButton label="Primary" size="medium" />
        <DSButton label="Outlined" variant="outlined" size="medium" />
      </View>
      <View style={styles.row}>
        <DSButton label="Text" variant="text" size="small" />
        <DSButton label="Loading" size="medium" loading />
        <DSButton label="Disabled" size="medium" disabled />
      </View>
    </DSCard>

    <DSCard variant="outlined" style={styles.section}>
      <DSText variant="bodyBold">Icon Slots</DSText>
      <View style={styles.row}>
        <DSButton
          label="Refresh"
          size="small"
          leading={
            <DSIcon name="rotate-right" size="small" color="textOnPrimary" />
          }
        />
        <DSButton
          label="Open"
          variant="outlined"
          size="small"
          trailing={<DSIcon name="angle-right" size="small" color="primary" />}
        />
        <DSChip
          label="Available"
          tone="success"
          size="small"
          leading={<DSIcon name="circle" size="xsmall" color="success" />}
        />
      </View>
      <DSTextField
        leading={
          <DSIcon name="magnifying-glass" size="small" color="textTertiary" />
        }
        placeholder="Search with leading slot"
      />
    </DSCard>

    <DSCard variant="outlined" style={styles.section}>
      <DSText variant="bodyBold">Chips</DSText>
      <View style={styles.row}>
        <DSChip label="Neutral" />
        <DSChip label="Primary" tone="primary" />
        <DSChip label="Success" tone="success" />
      </View>
      <View style={styles.row}>
        <DSChip label="Warning" tone="warning" variant="outlined" />
        <DSChip label="Error" tone="error" variant="outlined" />
        <DSChip label="Selected" selected onPress={() => undefined} />
      </View>
    </DSCard>

    <DSCard variant="outlined" style={styles.section}>
      <DSText variant="bodyBold">Text Fields</DSText>
      <DSTextField
        label="Email"
        placeholder="food@example.com"
        keyboardType="email-address"
      />
      <DSTextField
        label="Error"
        value="bad-input"
        status="error"
        caption="확인해주세요"
      />
      <DSTextField label="Disabled" value="읽기 전용" disabled />
    </DSCard>

    <DSCard variant="outlined" style={styles.section}>
      <DSText variant="bodyBold">List Cells</DSText>
      <DSListCell
        title="동네 위치 재설정"
        caption="현재 동네를 바꿉니다"
        chevron
        divider
      />
      <DSListCell
        title="선택된 항목"
        caption="선택 상태는 primary 컬러"
        selected
      />
    </DSCard>

    <DSCard variant="outlined" style={styles.section}>
      <DSText variant="bodyBold">Selected Cards</DSText>
      <View style={styles.cardRow}>
        <DSCard
          variant="outlined"
          onPress={() => undefined}
          style={styles.sampleCard}>
          <View style={styles.cardTitleRow}>
            <DSText variant="bodyBold">Map card default</DSText>
            <DSChip label="운영중" tone="primary" size="xsmall" />
          </View>
          <DSText variant="small" color="textSecondary">
            Selectable map card pattern
          </DSText>
        </DSCard>
        <DSCard
          variant="plain"
          onPress={() => undefined}
          style={[styles.sampleCard, styles.sampleSelectedCard]}>
          <View style={styles.cardTitleRow}>
            <DSText
              variant="bodyBold"
              color="textOnPrimary"
              style={styles.selectedCardText}>
              Map card selected
            </DSText>
            <DSChip label="운영중" tone="primary" size="xsmall" />
          </View>
          <DSText
            variant="small"
            color="textOnPrimary"
            style={styles.selectedCardText}>
            Primary-filled selected state
          </DSText>
        </DSCard>
        <DSListCell
          title="Selected fridge list row"
          caption="Opens the detail list"
          selected
          trailing={<DSIcon name="angle-right" size="small" color="primary" />}
          style={styles.sampleListCell}
          onPress={() => undefined}
        />
      </View>
    </DSCard>

    <DSCard variant="outlined" style={styles.section}>
      <DSText variant="bodyBold">Palette</DSText>
      <View style={styles.swatchGrid}>
        {swatches.map(swatch => (
          <View key={swatch.name} style={styles.swatchItem}>
            <View
              accessibilityLabel={`${swatch.name} swatch`}
              style={[styles.swatch, { backgroundColor: swatch.color }]}
            />
            <DSText variant="small" color="textSecondary">
              {swatch.name}
            </DSText>
          </View>
        ))}
      </View>
    </DSCard>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    gap: spacing.lg,
    padding: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cardRow: {
    gap: spacing.sm,
  },
  cardTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  sampleCard: {
    gap: spacing.sm,
  },
  sampleSelectedCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectedCardText: {
    color: colors.textOnPrimary,
  },
  sampleListCell: {
    borderColor: colors.primary,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  swatchItem: {
    gap: spacing.xs,
  },
  swatch: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 36,
    width: 64,
  },
});
