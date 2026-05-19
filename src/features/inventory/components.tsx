import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '@/theme';
import {
  formatInventoryHoldRemaining,
  getInventoryHoldRemainingMs,
  isInventoryHoldExpired,
  type InventoryDateInput,
} from './holdPolicy';
import {
  getInventoryProgressSteps,
  getInventoryStatusDisplay,
  type InventoryDisplayStatus,
  type InventoryProgressStepState,
  type InventoryStatusTone,
} from './status';

export type InventoryProgressStepperProps = {
  status: InventoryDisplayStatus;
  showDescription?: boolean;
  testID?: string;
};

export const InventoryProgressStepper = ({
  status,
  showDescription = true,
  testID,
}: InventoryProgressStepperProps) => {
  const display = getInventoryStatusDisplay(status);
  const steps = getInventoryProgressSteps(status);

  return (
    <View style={styles.panel} testID={testID}>
      <View style={styles.headerRow}>
        <Text style={styles.eyebrow}>재고 진행 상태</Text>
        <Text style={[styles.statusBadge, toneStyle(display.tone)]}>
          {display.label}
        </Text>
      </View>
      <View style={styles.stepRow}>
        {steps.map(step => (
          <View key={step.key} style={styles.stepItem}>
            <View style={[styles.stepDot, stepStateDotStyle(step.state)]} />
            <Text style={[styles.stepLabel, stepStateTextStyle(step.state)]}>
              {step.label}
            </Text>
          </View>
        ))}
      </View>
      {showDescription ? (
        <Text style={styles.description}>{display.description}</Text>
      ) : null}
    </View>
  );
};

export type InventoryCountdownBadgeProps = {
  expiresAt: InventoryDateInput;
  now?: InventoryDateInput;
  expiredLabel?: string;
  testID?: string;
};

export const InventoryCountdownBadge = ({
  expiresAt,
  now = Date.now(),
  expiredLabel = '만료됨',
  testID,
}: InventoryCountdownBadgeProps) => {
  const expired = isInventoryHoldExpired(expiresAt, now);
  const remainingMs = getInventoryHoldRemainingMs(expiresAt, now);

  return (
    <View
      style={[styles.countdownBadge, expired && styles.countdownExpired]}
      testID={testID}>
      <Text style={[styles.countdownText, expired && styles.countdownExpiredText]}>
        {expired ? expiredLabel : formatInventoryHoldRemaining(remainingMs)}
      </Text>
    </View>
  );
};

export type InventoryLabelInstructionCardProps = {
  labelCode: string;
  itemName: string;
  storageZone: string;
  deadlineLabel: string;
  testID?: string;
};

export const InventoryLabelInstructionCard = ({
  labelCode,
  itemName,
  storageZone,
  deadlineLabel,
  testID,
}: InventoryLabelInstructionCardProps) => (
  <View style={styles.panel} testID={testID}>
    <Text style={styles.eyebrow}>재고 라벨</Text>
    <Text style={styles.labelCode}>{labelCode}</Text>
    <View style={styles.fieldGrid}>
      <InstructionField label="식재료" value={itemName} />
      <InstructionField label="보관 구역" value={storageZone} />
      <InstructionField label="기한" value={deadlineLabel} />
    </View>
  </View>
);

type InstructionFieldProps = {
  label: string;
  value: string;
};

const InstructionField = ({label, value}: InstructionFieldProps) => (
  <View style={styles.fieldRow}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value}</Text>
  </View>
);

const toneStyle = (tone: InventoryStatusTone) => {
  if (tone === 'success') {
    return styles.successBadge;
  }

  if (tone === 'info') {
    return styles.infoBadge;
  }

  if (tone === 'danger') {
    return styles.dangerBadge;
  }

  if (tone === 'warning') {
    return styles.warningBadge;
  }

  return styles.neutralBadge;
};

const stepStateDotStyle = (state: InventoryProgressStepState) => {
  if (state === 'completed') {
    return styles.completedDot;
  }

  if (state === 'current') {
    return styles.currentDot;
  }

  if (state === 'problem') {
    return styles.problemDot;
  }

  return styles.upcomingDot;
};

const stepStateTextStyle = (state: InventoryProgressStepState) => {
  if (state === 'completed' || state === 'current') {
    return styles.activeStepLabel;
  }

  if (state === 'problem') {
    return styles.problemStepLabel;
  }

  return styles.upcomingStepLabel;
};

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.background,
    borderColor: colors.borderLight,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusBadge: {
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '800',
  },
  neutralBadge: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
  },
  successBadge: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  infoBadge: {
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8',
  },
  warningBadge: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  dangerBadge: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  stepRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  stepDot: {
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  completedDot: {
    backgroundColor: colors.primary,
  },
  currentDot: {
    backgroundColor: colors.info,
  },
  problemDot: {
    backgroundColor: colors.error,
  },
  upcomingDot: {
    backgroundColor: colors.border,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  activeStepLabel: {
    color: colors.textPrimary,
  },
  problemStepLabel: {
    color: colors.error,
  },
  upcomingStepLabel: {
    color: colors.textTertiary,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },
  countdownBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  countdownExpired: {
    backgroundColor: '#FEE2E2',
  },
  countdownText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '800',
  },
  countdownExpiredText: {
    color: '#991B1B',
  },
  labelCode: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 6,
  },
  fieldGrid: {
    gap: 8,
    marginTop: 14,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  fieldLabel: {
    color: colors.textSecondary,
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  fieldValue: {
    color: colors.textPrimary,
    flex: 2,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
  },
});
