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
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useAuthStore} from '@/store/authStore';
import {colors} from '@/theme';

const MENU_ITEMS = [
  {id: 'location', title: '동네 위치 재설정', icon: '📍'},
  {id: 'operator-console', title: '냉장고 운영자 콘솔', icon: '🧪'},
  {id: 'my-posts', title: '내 나눔 내역', icon: '📝'},
  {id: 'bookmark', title: '관심 식재료', icon: '❤️'},
  {id: 'history', title: '받은 나눔 내역', icon: '🎁'},
  {id: 'settings', title: '설정', icon: '⚙️'},
  {id: 'help', title: '고객센터', icon: '🎧'},
];

const ProfileScreen = () => {
  const user = useAuthStore(state => state.user);
  const logoutStore = useAuthStore(state => state.logout);
  const navigation = useNavigation<any>();

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      {text: '취소', style: 'cancel'},
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
      navigation.getParent()?.navigate('LocationSetup', {allowBack: true});
      return;
    }

    if (id === 'operator-console') {
      navigation.getParent()?.navigate('FridgeOperatorConsole');
      return;
    }

    Alert.alert('준비 중', '아직 연결되지 않은 메뉴입니다.');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 정보</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 프로필 정보 */}
        <View style={styles.profileSection}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.nickname?.[0] || 'G'}
              </Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.nickname}>{user?.nickname || '게스트'}</Text>
              <Text style={styles.email}>{user?.email}</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>프로필 수정</Text>
            </TouchableOpacity>
          </View>

          {/* 신뢰도 온도 (프로그레스) */}
          <View style={styles.trustBox}>
            <View style={styles.trustHeader}>
              <Text style={styles.trustTitle}>신선도 온도 🌡️</Text>
              <Text style={styles.trustScore}>준비 중</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, {width: '0%'}]} />
            </View>
            <Text style={styles.trustDesc}>
              나눔 기록이 쌓이면 활동 지표가 표시됩니다.
            </Text>
          </View>

          {/* 포인트 & 탄소절감량 */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>보유 포인트</Text>
              <Text style={styles.statValue}>준비 중</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>탄소 절감량</Text>
              <Text style={styles.statValue}>준비 중</Text>
            </View>
          </View>
        </View>

        {/* 메뉴 리스트 */}
        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleMenuPress(item.id)}
              style={[
                styles.menuItem,
                index === MENU_ITEMS.length - 1 && styles.menuItemLast,
              ]}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 하단 로그아웃 */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
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
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
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
    fontWeight: '700',
    color: colors.primary,
  },
  info: {
    flex: 1,
  },
  nickname: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
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
    fontWeight: '600',
    color: colors.textPrimary,
  },
  trustScore: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
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
  trustDesc: {
    fontSize: 11,
    color: colors.textTertiary,
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
    color: colors.textSecondary,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.borderLight,
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  menuChevron: {
    fontSize: 20,
    color: colors.textTertiary,
  },
  logoutButton: {
    marginHorizontal: 24,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.error,
  },
});

export default ProfileScreen;
