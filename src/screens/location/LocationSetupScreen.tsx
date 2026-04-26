/**
 * LocationSetupScreen — 최초 1회 위치 등록
 *
 * GPS 권한 요청 → 현재 위치 탐색 → 지도에 표시 → 서버 등록
 * 위치가 설정되어야 근처 게시글/냉장고 조회 가능
 *
 * @wireframe wireframe-foodlink/location-setup.html
 */
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '@/navigation/types';
import {updateLocation} from '@/api/auth';
import {useAuthStore} from '@/store/authStore';
import {colors} from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LocationSetup'>;

interface LocationCoords {
  latitude: number;
  longitude: number;
}

const LocationSetupScreen = ({navigation}: Props) => {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [locationName, setLocationName] = useState('위치를 탐색 중...');
  const setUser = useAuthStore(state => state.setUser);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'FoodLink 위치 권한',
            message:
              '근처 이웃과 연결하기 위해 위치 권한이 필요합니다.\n반경 2km 이내 식재료 나눔을 찾아드려요.',
            buttonPositive: '허용',
            buttonNegative: '거부',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentPosition();
        } else {
          setIsFetching(false);
          setLocationName('위치 권한이 거부되었습니다');
          Alert.alert(
            '위치 권한 필요',
            'FoodLink는 위치 기반 서비스입니다. 설정에서 위치 권한을 허용해주세요.',
          );
        }
      } else {
        // iOS는 react-native-geolocation-service로 권한 요청
        // MVP에서는 기본 navigator.geolocation 사용
        getCurrentPosition();
      }
    } catch (err) {
      setIsFetching(false);
      console.warn('Permission error:', err);
    }
  };

  const getCurrentPosition = () => {
    // React Native에서는 @react-native-community/geolocation 또는
    // react-native-geolocation-service가 필요합니다.
    // MVP 단계에서는 기본 좌표를 사용하고, 추후 geolocation 라이브러리 추가 예정
    try {
      // 기본 좌표 사용 (광주 전남대)
      const defaultCoords = {latitude: 35.1595, longitude: 126.9136};
      setLocation(defaultCoords);
      setLocationName('광주광역시 북구 용봉동');
      setIsFetching(false);
    } catch (error) {
      console.warn('Geolocation error:', error);
      const fallback = {latitude: 35.1595, longitude: 126.9136};
      setLocation(fallback);
      setLocationName('광주광역시 북구 용봉동 (기본값)');
      setIsFetching(false);
    }
  };

  const handleSetLocation = async () => {
    if (!location) {
      Alert.alert('오류', '위치 정보를 가져올 수 없습니다.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await updateLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        // FCM 토큰은 Phase 6에서 추가
      });

      if (response.success && response.data) {
        setUser(response.data);
        navigation.reset({index: 0, routes: [{name: 'Main'}]});
      } else {
        Alert.alert('오류', response.message || '위치 등록에 실패했습니다.');
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || '서버에 연결할 수 없습니다.';
      Alert.alert('오류', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>동네 설정</Text>
      </View>

      {/* 지도 영역 */}
      <View style={styles.mapArea}>
        {/* 배경 (실제 지도는 Phase 5에서 react-native-maps로 교체) */}
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapEmoji}>🗺️</Text>

          {/* 2km 반경 원 */}
          <View style={styles.radiusCircle}>
            <View style={styles.centerDot} />
          </View>

          {/* 반경 라벨 */}
          <View style={styles.radiusLabel}>
            <Text style={styles.radiusText}>반경 2km</Text>
          </View>
        </View>

        {/* 위치 정보 카드 */}
        <View style={styles.locationCard}>
          <View style={styles.locationRow}>
            <Text style={styles.locationPin}>📍</Text>
            <Text style={styles.locationName}>
              {isFetching ? '위치를 탐색 중...' : locationName}
            </Text>
          </View>
          <Text style={styles.locationHint}>
            설정하신 위치를 중심으로 2km 이내 이웃과 연결됩니다.
          </Text>
        </View>
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (isLoading || isFetching) && styles.submitButtonDisabled,
          ]}
          onPress={handleSetLocation}
          disabled={isLoading || isFetching}>
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>이 위치로 설정하기</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  // 지도 영역
  mapArea: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
  },
  mapEmoji: {
    fontSize: 60,
    opacity: 0.3,
    position: 'absolute',
  },
  radiusCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'rgba(30, 98, 59, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  radiusLabel: {
    position: 'absolute',
    top: '30%',
    right: '15%',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  radiusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  // 위치 카드
  locationCard: {
    position: 'absolute',
    bottom: 32,
    left: 24,
    right: 24,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  locationPin: {
    fontSize: 16,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  locationHint: {
    fontSize: 14,
    color: colors.textTertiary,
    lineHeight: 20,
  },
  // 하단
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  submitButton: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default LocationSetupScreen;
