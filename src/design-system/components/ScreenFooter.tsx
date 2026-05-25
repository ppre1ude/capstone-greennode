import React, { ReactNode, useContext } from 'react';
import {
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { colors } from '@/theme';

export interface DSScreenFooterProps extends ViewProps {
  children: ReactNode;
  minBottomPadding?: number;
  bottomInsetGap?: number;
  style?: StyleProp<ViewStyle>;
}

export const DSScreenFooter = ({
  children,
  minBottomPadding = 24,
  bottomInsetGap = 16,
  style,
  ...props
}: DSScreenFooterProps) => {
  const insets = useContext(SafeAreaInsetsContext) ?? {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };
  const paddingBottom = Math.max(
    insets.bottom + bottomInsetGap,
    minBottomPadding,
  );

  return (
    <View {...props} style={[styles.footer, { paddingBottom }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
