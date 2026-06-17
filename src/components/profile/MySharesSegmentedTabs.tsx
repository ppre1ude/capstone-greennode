import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { DSText } from '@/design-system';
import { colors, radius, spacing } from '@/theme';

export type MySharesTabKey = 'posted' | 'received';

type Props = {
  activeTab: MySharesTabKey;
  postedCount: number;
  receivedCount: number;
  onChange: (tab: MySharesTabKey) => void;
};

const tabs = [
  { key: 'posted' as const, label: '내 나눔' },
  { key: 'received' as const, label: '받은 나눔' },
];

const MySharesSegmentedTabs = ({
  activeTab,
  postedCount,
  receivedCount,
  onChange,
}: Props) => (
  <View style={styles.surface}>
    <View style={styles.track}>
      {tabs.map(tab => {
        const selected = activeTab === tab.key;
        const count = tab.key === 'posted' ? postedCount : receivedCount;

        return (
          <TouchableOpacity
            key={tab.key}
            accessibilityLabel={`${tab.label}, ${count}`}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            activeOpacity={0.82}
            onPress={() => onChange(tab.key)}
            style={[styles.tab, selected ? styles.tabSelected : null]}>
            <DSText
              variant="bodyBold"
              color={selected ? 'primary' : 'textSecondary'}>
              {tab.label}
            </DSText>
            <View
              style={[styles.countBadge, selected ? styles.countSelected : null]}>
              <DSText
                variant="small"
                color={selected ? 'primary' : 'textTertiary'}>
                {count}
              </DSText>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

const styles = StyleSheet.create({
  surface: {
    backgroundColor: colors.background,
    borderBottomColor: colors.borderLight,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  track: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  tab: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 44,
  },
  tabSelected: {
    backgroundColor: colors.background,
    borderColor: colors.primary,
  },
  countBadge: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.full,
    justifyContent: 'center',
    minHeight: 22,
    minWidth: 22,
    paddingHorizontal: 7,
  },
  countSelected: {
    backgroundColor: colors.primaryLight,
  },
});

export default MySharesSegmentedTabs;
