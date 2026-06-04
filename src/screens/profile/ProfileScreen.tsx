/**
 * ProfileScreen — 내 정보 탭 (Phase 6)
 *
 * 유저 정보, 준비 중인 활동 지표, 설정 메뉴 표시.
 * 로그아웃 기능을 포함.
 *
 * @wireframe wireframe-foodlink/profile.html
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, StatusBar } from 'react-native';
import { useNavigation, type CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '@/store/authStore';
import { updateProfile } from '@/api/auth';
import {
  getUserTrustSummary,
  type ProviderTrustSummaryResponse,
} from '@/api/trust';
import {
  DSButton,
  DSCard,
  DSChip,
  DSIcon,
  DSListCell,
  DSText,
  DSTextField,
  type DSIconName,
} from '@/design-system';
import { colors } from '@/theme';
import type { User } from '@/types';
import { getProviderTrustBadges } from '@/features/trust/feedback';
import { getHeaderTopPadding } from '@/utils/safeArea';
import type { MainTabParamList, RootStackParamList } from '@/navigation/types';

type ProfileMenuItemId =
  | 'location'
  | 'operator-console'
  | 'inventory-qr'
  | 'my-posts'
  | 'history'
  | 'notifications';

type ProfileMenuItem = {
  id: ProfileMenuItemId;
  title: string;
  icon: DSIconName;
};

type ProfileNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const LIFECYCLE_MENU_ITEMS: ProfileMenuItem[] = [
  {
    id: 'my-posts',
    title: '내 나눔 관리',
    icon: 'clipboard-list',
  },
  {
    id: 'history',
    title: '받은 나눔 관리',
    icon: 'gift',
  },
  {
    id: 'notifications',
    title: '알림함',
    icon: 'bell',
  },
  {
    id: 'inventory-qr',
    title: '냉장고 QR 인증',
    icon: 'qrcode',
  },
];

const ACCOUNT_MENU_ITEMS: ProfileMenuItem[] = [
  {
    id: 'location',
    title: '동네 위치 재설정',
    icon: 'location-dot',
  },
  {
    id: 'operator-console',
    title: '냉장고 운영자 콘솔',
    icon: 'clipboard-list',
  },
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

const assertUnhandledMenuItem = (id: never): never => {
  throw new Error(`Unhandled profile menu item: ${id}`);
};

const ProfileScreen = () => {
  const user = useAuthStore(state => state.user);
  const setUser = useAuthStore(state => state.setUser);
  const logoutStore = useAuthStore(state => state.logout);
  const navigation = useNavigation<ProfileNavigation>();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [trustSummary, setTrustSummary] =
    useState<ProviderTrustSummaryResponse | null>(null);
  const [draftNickname, setDraftNickname] = useState(user?.nickname ?? '');
  const [draftProfileImageUrl, setDraftProfileImageUrl] = useState(
    user?.profileImageUrl ?? '',
  );
  const visibleAccountMenuItems = ACCOUNT_MENU_ITEMS.filter(
    item => item.id !== 'operator-console' || canAccessOperatorConsole(user),
  );
  const trustBadges = useMemo(
    () =>
      getProviderTrustBadges({
        completedShares: trustSummary?.completedShares ?? 0,
        positiveReviewCount: trustSummary?.positiveReviewCount ?? 0,
        badges: trustSummary?.badges ?? [],
      }),
    [trustSummary],
  );

  useEffect(() => {
    if (isEditingProfile) {
      return;
    }

    setDraftNickname(user?.nickname ?? '');
    setDraftProfileImageUrl(user?.profileImageUrl ?? '');
  }, [isEditingProfile, user?.nickname, user?.profileImageUrl]);

  useEffect(() => {
    let isMounted = true;

    if (!user?.id) {
      setTrustSummary(null);
      return () => {
        isMounted = false;
      };
    }

    getUserTrustSummary(user.id)
      .then(response => {
        if (isMounted) {
          setTrustSummary(response.data);
        }
      })
      .catch(error => {
        console.warn('Failed to fetch profile trust summary:', error);
        if (isMounted) {
          setTrustSummary(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

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

  const handleProfileEditPress = () => {
    setDraftNickname(user?.nickname ?? '');
    setDraftProfileImageUrl(user?.profileImageUrl ?? '');
    setIsEditingProfile(true);
  };

  const handleCancelProfileEdit = () => {
    setDraftNickname(user?.nickname ?? '');
    setDraftProfileImageUrl(user?.profileImageUrl ?? '');
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async () => {
    const nickname = draftNickname.trim();
    const profileImageUrl = draftProfileImageUrl.trim() || null;

    if (nickname.length < 2 || nickname.length > 50) {
      Alert.alert('닉네임 확인', '닉네임은 2~50자로 입력해 주세요.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const response = await updateProfile({ nickname, profileImageUrl });
      if (response.success && response.data) {
        setUser(response.data);
        setIsEditingProfile(false);
        Alert.alert('프로필 수정 완료', '변경된 프로필을 저장했습니다.');
        return;
      }

      Alert.alert(
        '프로필 수정 실패',
        response.message || '프로필을 저장하지 못했습니다.',
      );
    } catch (error) {
      console.warn('Failed to update profile:', error);
      Alert.alert(
        '프로필 수정 실패',
        '서버에서 프로필을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleMenuPress = (id: ProfileMenuItemId) => {
    const rootNavigation =
      navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();

    switch (id) {
      case 'location':
        rootNavigation?.navigate('LocationSetup', { allowBack: true });
        return;

      case 'operator-console':
        if (!canAccessOperatorConsole(user)) {
          Alert.alert(
            '운영자 권한 필요',
            '운영자로 등록된 계정만 사용할 수 있습니다.',
          );
          return;
        }

        rootNavigation?.navigate('FridgeOperatorConsole');
        return;

      case 'inventory-qr':
        rootNavigation?.navigate('InventoryQr');
        return;

      case 'my-posts':
        rootNavigation?.navigate('MyShares', { initialTab: 'posted' });
        return;

      case 'history':
        rootNavigation?.navigate('MyShares', { initialTab: 'received' });
        return;

      case 'notifications':
        navigation.navigate('Chat');
        return;

      default:
        assertUnhandledMenuItem(id);
    }
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
              disabled={isEditingProfile}
              onPress={handleProfileEditPress}
            />
          </View>

          {isEditingProfile ? (
            <View style={styles.profileEditBox}>
              <DSTextField
                label="닉네임"
                value={draftNickname}
                onChangeText={setDraftNickname}
                maxLength={50}
                status={
                  draftNickname.trim().length >= 2 &&
                  draftNickname.trim().length <= 50
                    ? 'normal'
                    : 'error'
                }
                caption="2~50자까지 사용할 수 있습니다."
                returnKeyType="next"
              />
              <DSTextField
                label="프로필 이미지 URL"
                value={draftProfileImageUrl}
                onChangeText={setDraftProfileImageUrl}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="/static/uploads/profile/avatar.jpg"
                caption="이미지 주소를 비우면 기본 아바타를 사용합니다."
              />
              <View style={styles.profileEditActions}>
                <DSButton
                  label="취소"
                  variant="outlined"
                  color="assistive"
                  size="small"
                  disabled={isSavingProfile}
                  onPress={handleCancelProfileEdit}
                />
                <DSButton
                  label="저장"
                  size="small"
                  loading={isSavingProfile}
                  onPress={handleSaveProfile}
                />
              </View>
            </View>
          ) : null}

          <DSCard variant="plain" style={styles.trustBox}>
            <View style={styles.trustHeader}>
              <DSText variant="bodyBold" style={styles.trustTitle}>
                공급자 신뢰
              </DSText>
              <DSChip
                label="QR 기반"
                tone="primary"
                size="small"
                style={styles.trustScore}
              />
            </View>
            <View style={styles.trustBadgeWrap}>
              {trustBadges.map(badge => (
                <DSChip
                  key={badge.id}
                  label={badge.label}
                  tone={badge.tone}
                  size="small"
                  variant="outlined"
                  style={styles.profileTrustBadge}
                />
              ))}
            </View>
            <DSText
              variant="small"
              color="textTertiary"
              style={styles.trustDesc}>
              QR 생명주기와 수령 경험 평가가 공급자 신뢰로 쌓입니다.
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

        {/* 나눔 관리 */}
        <DSCard variant="plain" padded={false} style={styles.menuSection}>
          <DSText variant="bodyBold" style={styles.menuSectionTitle}>
            나눔 관리
          </DSText>
          {LIFECYCLE_MENU_ITEMS.map((item, index) => (
            <DSListCell
              key={item.id}
              title={item.title}
              leading={
                <DSIcon
                  name={item.icon}
                  size="medium"
                  color="primary"
                  style={styles.menuIcon}
                />
              }
              chevron
              divider={index !== LIFECYCLE_MENU_ITEMS.length - 1}
              verticalPadding="large"
              onPress={() => handleMenuPress(item.id)}
              style={styles.menuItem}
            />
          ))}
        </DSCard>

        {/* 계정 및 운영 */}
        <DSCard variant="plain" padded={false} style={styles.menuSection}>
          <DSText variant="bodyBold" style={styles.menuSectionTitle}>
            계정 및 운영
          </DSText>
          {visibleAccountMenuItems.map((item, index) => (
            <DSListCell
              key={item.id}
              title={item.title}
              leading={
                <DSIcon
                  name={item.icon}
                  size="medium"
                  color="primary"
                  style={styles.menuIcon}
                />
              }
              chevron
              divider={index !== visibleAccountMenuItems.length - 1}
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
    paddingTop: getHeaderTopPadding(),
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
  profileEditBox: {
    gap: 12,
    marginBottom: 24,
  },
  profileEditActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
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
  trustBadgeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  profileTrustBadge: {
    backgroundColor: '#FFFFFF',
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
  menuSectionTitle: {
    fontSize: 15,
    paddingTop: 12,
    paddingBottom: 4,
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
