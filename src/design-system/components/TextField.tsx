import React from 'react';
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import {colors, layout, radius, spacing, textStyles} from '@/theme';
import {DSText} from './Text';

export type DSTextFieldStatus = 'normal' | 'success' | 'error';

export interface DSTextFieldProps
  extends Omit<TextInputProps, 'style' | 'editable'> {
  label?: string;
  required?: boolean;
  status?: DSTextFieldStatus;
  caption?: string;
  disabled?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputContainerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

const statusColor = (status: DSTextFieldStatus, focused?: boolean) => {
  switch (status) {
    case 'success':
      return colors.success;
    case 'error':
      return colors.error;
    case 'normal':
    default:
      return focused ? colors.primary : colors.border;
  }
};

export const DSTextField = ({
  label,
  required = false,
  status = 'normal',
  caption,
  disabled = false,
  leading,
  trailing,
  containerStyle,
  inputContainerStyle,
  inputStyle,
  placeholderTextColor = colors.textPlaceholder,
  accessibilityLabel,
  accessibilityState,
  accessibilityHint,
  onFocus,
  onBlur,
  ...props
}: DSTextFieldProps) => {
  const [focused, setFocused] = React.useState(false);
  const borderColor = statusColor(status, focused);
  const inputStateStyle = React.useMemo(
    () => ({
      borderColor,
      borderWidth: focused ? 2 : 1,
    }),
    [borderColor, focused],
  );
  const captionColor =
    status === 'error' ? 'error' : status === 'success' ? 'success' : 'textSecondary';

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelRow}>
          <DSText variant="caption" color="textPrimary">
            {label}
          </DSText>
          {required && (
            <DSText variant="caption" color="error">
              *
            </DSText>
          )}
        </View>
      )}
      <View
        style={[
          styles.inputContainer,
          disabled ? styles.inputContainerDisabled : null,
          inputStateStyle,
          inputContainerStyle,
        ]}>
        {leading && <View style={styles.side}>{leading}</View>}
        <TextInput
          {...props}
          accessibilityHint={
            accessibilityHint ?? (status === 'error' ? caption : undefined)
          }
          accessibilityLabel={accessibilityLabel ?? label ?? props.placeholder}
          accessibilityState={{
            disabled,
            ...accessibilityState,
          }}
          editable={!disabled}
          onBlur={event => {
            setFocused(false);
            onBlur?.(event);
          }}
          onFocus={event => {
            setFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={placeholderTextColor}
          style={[styles.input, disabled ? styles.inputDisabled : null, inputStyle]}
        />
        {trailing && <View style={styles.side}>{trailing}</View>}
      </View>
      {caption ? (
        <DSText variant="small" color={captionColor} style={styles.caption}>
          {caption}
        </DSText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  inputContainer: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    flexDirection: 'row',
    minHeight: layout.inputHeight,
    paddingHorizontal: spacing.md,
  },
  inputContainerDisabled: {
    backgroundColor: colors.surface,
  },
  input: {
    ...textStyles.body,
    color: colors.textPrimary,
    flex: 1,
    minHeight: 24,
    paddingHorizontal: spacing.xs,
    paddingVertical: 0,
  },
  inputDisabled: {
    color: colors.textTertiary,
  },
  side: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    marginTop: -spacing.xs,
  },
});
