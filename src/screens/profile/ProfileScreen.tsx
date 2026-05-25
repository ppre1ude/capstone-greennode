/**
 * ProfileScreen — 내 정보 탭 (Phase 6)
 *
 * 유저 정보, 준비 중인 활동 지표, 설정 메뉴 표시.
 * 로그아웃 기능을 포함.
 *
 * @wireframe wireframe-foodlink/profile.html
 */
import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { DSButton, DSCard, DSChip, DSListCell, DSText } from '@/design-system';
import { colors } from '@/theme';
import type { User } from '@/types';

const MENU_ITEMS = [
  { id: 'location', title: '동네 위치 재설정', icon: '📍' },
  { id: 'operator-console', title: '냉장고 운영자 콘솔 (실험)', icon: '🧪' },
  { id: 'inventory-qr-prototype', title: '냉장고 QR 흐름 테스트', icon: '▣' },
  { id: 'my-posts', title: '내 나눔 내역', icon: '📝' },
  { id: 'bookmark', title: '관심 식재료', icon: '❤️' },
  { id: 'history', title: '받은 나눔 내역', icon: '🎁' },
  { id: 'settings', title: '설정', icon: '⚙️' },
  { id: 'help', title: '고객센터', icon: '🎧' },
];

const OPERATOR_ROLES = new Set(['operator', 'admin', 'fridge_operator']);

const canAccessOperatorConsole = (user: User | null): boolean => {
  if (!user) {
    return false;
  }

  if (
    user.isOperator === true ||
    (typeof user.operatorRole === 'string' &&
      OPERATOR_ROLES.has(user.operatorRole))
  ) {
    return true;
  }

  if (
    Array.isArray(user.operatorFridgeIds) &&
    user.operatorFridgeIds.length > 0
  ) {
    return true;
  }

  return (
    Array.isArray(user.roles) &&
    user.roles.some(role => OPERATOR_ROLES.has(role))
  );
};

const ProfileScreen = () => {
  const user = useAuthStore(state => state.user);
  const logoutStore = useAuthStore(state => state.logout);
  const navigation = useNavigation<any>();
  const visibleMenuItems = MENU_ITEMS.filter(
    item => item.id !== 'operator-console' || canAccessOperatorConsole(user),
  );

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await logoutStore();
        },
      },
    ]);
  };

  const handleMenuPress = (id: string) => {
    if (id === 'location') {
      navigation.getParent()?.navigate('LocationSetup', { allowBack: true });
      return;
    }

    if (id === 'operator-console') {
      if (!canAccessOperatorConsole(user)) {
        Alert.alert(
          '운영자 권한 필요',
          '운영자로 등록된 계정만 사용할 수 있습니다.',
        );
        return;
      }

      navigation.getParent()?.navigate('FridgeOperatorConsole');
      return;
    }

    if (id === 'inventory-qr-prototype') {
      navigation.getParent()?.navigate('InventoryQrPrototype');
      return;
    }

    Alert.alert('준비 중', '아직 연결되지 않은 메뉴입니다.');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 헤더 */}
      <View style={styles.header}>
        <DSText variant="heading2" style={styles.headerTitle}>
          내 정보
        </DSText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 프로필 정보 */}
        <DSCard variant="plain" padded={false} style={styles.profileSection}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <DSText
                variant="heading2"
                color="primary"
                style={styles.avatarText}>
                {user?.nickname?.[0] || 'G'}
              </DSText>
            </View>
            <View style={styles.info}>
              <DSText variant="heading3" style={styles.nickname}>
                {user?.nickname || '게스트'}
              </DSText>
              <DSText
                variant="caption"
                color="textSecondary"
                style={styles.email}>
                {user?.email}
              </DSText>
            </View>
            <DSButton
              label="프로필 수정"
              color="assistive"
              size="small"
              style={styles.editButton}
              textStyle={styles.editButtonText}
            />
          </View>

          {/* 신뢰도 온도 (프로그레스) */}
          <DSCard variant="plain" style={styles.trustBox}>
            <View style={styles.trustHeader}>
              <DSText variant="bodyBold" style={styles.trustTitle}>
                신선도 온도 🌡️
              </DSText>
              <DSChip
                label="준비 중"
                tone="primary"
                size="small"
                style={styles.trustScore}
              />
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, styles.progressBarEmpty]} />
            </View>
            <DSText
              variant="small"
              color="textTertiary"
              style={styles.trustDesc}>
              나눔 기록이 쌓이면 활동 지표가 표시됩니다.
            </DSText>
          </DSCard>

          {/* 포인트 & 탄소절감량 */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <DSText
                variant="caption"
                color="textSecondary"
                style={styles.statTitle}>
                보유 포인트
              </DSText>
              <DSChip label="준비 중" size="large" style={styles.statValue} />
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <DSText
                variant="caption"
                color="textSecondary"
                style={styles.statTitle}>
                탄소 절감량
              </DSText>
              <DSChip label="준비 중" size="large" style={styles.statValue} />
            </View>
          </View>
        </DSCard>

        {/* 메뉴 리스트 */}
        <DSCard variant="plain" padded={false} style={styles.menuSection}>
          {visibleMenuItems.map((item, index) => (
            <DSListCell
              key={item.id}
              title={item.title}
              leading={<DSText style={styles.menuIcon}>{item.icon}</DSText>}
              chevron
              divider={index !== visibleMenuItems.length - 1}
              verticalPadding="large"
              onPress={() => handleMenuPress(item.id)}
              style={styles.menuItem}
            />
          ))}
        </DSCard>

        {/* 하단 로그아웃 */}
        <DSButton
          label="로그아웃"
          variant="outlined"
          color="danger"
          size="medium"
          style={styles.logoutButton}
          textStyle={styles.logoutText}
          onPress={handleLogout}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 22,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    padding: 24,
    marginBottom: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
  },
  info: {
    flex: 1,
  },
  nickname: {
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
  },
  editButton: {
    borderRadius: 16,
    minHeight: 32,
  },
  editButtonText: {
    fontSize: 12,
  },
  trustBox: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  trustHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trustTitle: {
    fontSize: 14,
  },
  trustScore: {
    alignSelf: 'center',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressBarEmpty: {
    width: '0%',
  },
  trustDesc: {
    fontSize: 11,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  statValue: {
    alignSelf: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.borderLight,
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginBottom: 24,
  },
  menuItem: {
    paddingVertical: 16,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  logoutButton: {
    marginHorizontal: 24,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderColor: colors.borderLight,
  },
  logoutText: {
    fontSize: 15,
  },
});

export default ProfileScreen;
