/**
 * LocationSetupScreen — 최초 1회 위치 등록
 *
 * GPS 권한 요청 → 현재 위치 탐색 → 지도에 표시 → 서버 등록
 * 위치가 설정되어야 근처 나눔 식재료/냉장고 조회 가능
 *
 * @wireframe wireframe-foodlink/location-setup.html
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Alert,
  Linking,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { updateLocation } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { styles } from './LocationSetupScreen.styles';
import { getFcmToken } from '@/services/deviceRegistration';
import { DSButton, DSCard, DSIcon } from '@/design-system';

type Props = NativeStackScreenProps<RootStackParamList, 'LocationSetup'>;

interface LocationCoords {
  latitude: number;
  longitude: number;
}

type NotificationSetupStatus = 'idle' | 'requesting' | 'ready' | 'unavailable';
type LocationIssue =
  | 'permissionDenied'
  | 'permissionBlocked'
  | 'positionUnavailable';

const LOCATION_ISSUE_COPY: Record<
  LocationIssue,
  {
    title: string;
    message: string;
    primaryAction: string;
    secondaryAction: string;
  }
> = {
  permissionDenied: {
    title: '위치 권한이 필요해요',
    message:
      '내 주변 공유 냉장고와 나눔 식재료를 찾으려면 위치 접근을 허용해야 합니다.',
    primaryAction: '권한 다시 요청',
    secondaryAction: '설정 열기',
  },
  permissionBlocked: {
    title: '설정에서 위치 권한을 켜주세요',
    message:
      '권한 요청 창을 다시 띄울 수 없는 상태입니다. 앱 설정에서 위치 권한을 허용한 뒤 다시 확인해주세요.',
    primaryAction: '설정 열기',
    secondaryAction: '다시 확인',
  },
  positionUnavailable: {
    title: '현재 위치를 찾지 못했어요',
    message:
      '기기의 위치 서비스가 켜져 있는지 확인한 뒤 현재 위치를 다시 찾아주세요.',
    primaryAction: '위치 다시 찾기',
    secondaryAction: '설정 열기',
  },
};

const LocationSetupScreen = ({ route, navigation }: Props) => {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [locationName, setLocationName] = useState('위치를 탐색 중...');
  const [locationIssue, setLocationIssue] = useState<LocationIssue | null>(
    null,
  );
  const [fcmToken, setFcmToken] = useState<string | undefined>();
  const [notificationStatus, setNotificationStatus] =
    useState<NotificationSetupStatus>('idle');
  const setUser = useAuthStore(state => state.setUser);
  const allowBack = route.params?.allowBack === true;

  const handleEnableNotifications = useCallback(async () => {
    setNotificationStatus('requesting');
    const token = await getFcmToken();
    if (token) {
      setFcmToken(token);
      setNotificationStatus('ready');
      return;
    }

    setFcmToken(undefined);
    setNotificationStatus('unavailable');
  }, []);

  const getCurrentPosition = useCallback(() => {
    setIsFetching(true);
    setLocationIssue(null);
    setLocationName('위치를 탐색 중...');
    Geolocation.getCurrentPosition(
      position => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(coords);
        setLocationName(
          `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
        );
        setIsFetching(false);
        setLocationIssue(null);
      },
      error => {
        console.warn('Geolocation error:', error);
        setLocation(null);
        setIsFetching(false);
        setLocationName('현재 위치를 가져올 수 없습니다');
        setLocationIssue('positionUnavailable');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        forceRequestLocation: true,
        showLocationDialog: true,
      },
    );
  }, []);

  const requestLocationPermission = useCallback(async () => {
    try {
      setLocation(null);
      setIsFetching(true);
      setLocationIssue(null);
      setLocationName('위치를 탐색 중...');

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
          const blocked =
            granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;
          setLocationName(
            blocked
              ? '설정에서 위치 권한을 허용해주세요'
              : '위치 권한이 거부되었습니다',
          );
          setLocationIssue(blocked ? 'permissionBlocked' : 'permissionDenied');
        }
      } else {
        const auth = await Geolocation.requestAuthorization('whenInUse');
        if (auth === 'granted') {
          getCurrentPosition();
        } else {
          setIsFetching(false);
          setLocationName(
            auth === 'disabled'
              ? '위치 서비스를 사용할 수 없습니다'
              : '위치 권한이 거부되었습니다',
          );
          setLocationIssue(
            auth === 'disabled' ? 'positionUnavailable' : 'permissionBlocked',
          );
        }
      }
    } catch (err) {
      setLocation(null);
      setIsFetching(false);
      setLocationName('위치 권한을 확인할 수 없습니다');
      setLocationIssue('positionUnavailable');
      console.warn('Permission error:', err);
    }
  }, [getCurrentPosition]);

  useEffect(() => {
    requestLocationPermission();
  }, [requestLocationPermission]);

  const handleSetLocation = async () => {
    if (!location) {
      setLocationIssue(current => current ?? 'positionUnavailable');
      return;
    }

    setIsLoading(true);
    try {
      const response = await updateLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        fcmToken,
      });

      if (response.success && response.data) {
        setUser(response.data);
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      } else {
        Alert.alert('오류', response.message || '위치 등록에 실패했습니다.');
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message || '서버에 연결할 수 없습니다.';
      Alert.alert('오류', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSettings = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch {
      Alert.alert(
        '설정을 열 수 없습니다',
        '기기 설정에서 FoodLink의 위치 권한을 직접 확인해주세요.',
      );
    }
  }, []);

  const locationIssueCopy = locationIssue
    ? LOCATION_ISSUE_COPY[locationIssue]
    : null;
  const notificationButtonLabel =
    notificationStatus === 'requesting'
      ? ''
      : notificationStatus === 'ready'
      ? '설정 완료'
      : '나눔 알림 받기';
  const notificationAccessibilityLabel =
    notificationStatus === 'requesting'
      ? '나눔 알림 설정 중'
      : notificationStatus === 'ready'
      ? '설정 완료'
      : '나눔 알림 받기';

  const handlePrimaryLocationIssueAction = () => {
    if (locationIssue === 'permissionBlocked') {
      void handleOpenSettings();
      return;
    }

    void requestLocationPermission();
  };

  const handleSecondaryLocationIssueAction = () => {
    if (locationIssue === 'permissionBlocked') {
      void requestLocationPermission();
      return;
    }

    void handleOpenSettings();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 헤더 */}
      <View style={styles.header}>
        {allowBack && (
          <TouchableOpacity
            style={styles.headerBackButton}
            accessibilityRole="button"
            accessibilityLabel="뒤로가기"
            onPress={() => navigation.goBack()}>
            <DSIcon name="angle-left" size="large" color="primary" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>동네 설정</Text>
      </View>

      {/* 지도 영역 */}
      <View style={styles.mapArea}>
        {/* 배경 (실제 지도는 Phase 5에서 react-native-maps로 교체) */}
        <View style={styles.mapPlaceholder}>
          <DSIcon
            name="map-location-dot"
            size={60}
            color="primary"
            style={styles.mapEmoji}
          />

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
        <DSCard padded={false} style={styles.locationCard}>
          <View style={styles.locationRow}>
            <DSIcon
              name="location-dot"
              size="small"
              color="primary"
              style={styles.locationPin}
            />
            <Text style={styles.locationName}>
              {isFetching ? '위치를 탐색 중...' : locationName}
            </Text>
          </View>
          <Text style={styles.locationHint}>
            설정하신 위치를 중심으로 2km 이내 이웃과 연결됩니다.
          </Text>
          {locationIssueCopy ? (
            <View style={styles.locationIssueBox}>
              <Text style={styles.locationIssueTitle}>
                {locationIssueCopy.title}
              </Text>
              <Text style={styles.locationIssueMessage}>
                {locationIssueCopy.message}
              </Text>
              <View style={styles.locationIssueActions}>
                <TouchableOpacity
                  style={styles.locationIssuePrimaryButton}
                  onPress={handlePrimaryLocationIssueAction}>
                  <Text style={styles.locationIssuePrimaryButtonText}>
                    {locationIssueCopy.primaryAction}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.locationIssueSecondaryButton}
                  onPress={handleSecondaryLocationIssueAction}>
                  <Text style={styles.locationIssueSecondaryButtonText}>
                    {locationIssueCopy.secondaryAction}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </DSCard>
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <DSCard
          variant="outlined"
          padded={false}
          style={styles.notificationPanel}>
          <View style={styles.notificationTextGroup}>
            <Text style={styles.notificationTitle}>나눔 알림</Text>
            <Text style={styles.notificationHint}>
              {notificationStatus === 'ready'
                ? '알림 받을 준비가 됐어요'
                : notificationStatus === 'unavailable'
                ? '알림 권한이 꺼져 있어요'
                : '근처 나눔과 신청 소식을 알려드릴게요'}
            </Text>
          </View>
          <DSButton
            label={notificationButtonLabel}
            accessibilityLabel={notificationAccessibilityLabel}
            loading={notificationStatus === 'requesting'}
            loadingLabel=""
            size="small"
            onPress={handleEnableNotifications}
            disabled={
              notificationStatus === 'requesting' ||
              notificationStatus === 'ready'
            }
            style={styles.notificationButton}
            textStyle={styles.notificationButtonText}
          />
        </DSCard>

        <DSButton
          label={isLoading ? '' : '이 위치로 설정하기'}
          accessibilityLabel="이 위치로 설정하기"
          loading={isLoading}
          loadingLabel=""
          onPress={handleSetLocation}
          disabled={isLoading || isFetching || !location}
          style={styles.submitButton}
          textStyle={styles.submitButtonText}
        />
      </View>
    </View>
  );
};

export default LocationSetupScreen;
