/**
 * LocationSetupScreen — 최초 1회 위치 등록
 *
 * GPS 권한 요청 → 현재 위치 탐색 → 지도에 표시 → 서버 등록
 * 위치가 설정되어야 근처 게시글/냉장고 조회 가능
 *
 * @wireframe wireframe-foodlink/location-setup.html
 */
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '@/navigation/types';
import {updateLocation} from '@/api/auth';
import {useAuthStore} from '@/store/authStore';
import {styles} from './LocationSetupScreen.styles';
import {getFcmToken} from '@/services/deviceRegistration';

type Props = NativeStackScreenProps<RootStackParamList, 'LocationSetup'>;

interface LocationCoords {
  latitude: number;
  longitude: number;
}

const LocationSetupScreen = ({route, navigation}: Props) => {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [locationName, setLocationName] = useState('위치를 탐색 중...');
  const [fcmToken, setFcmToken] = useState<string | undefined>();
  const setUser = useAuthStore(state => state.setUser);
  const allowBack = route.params?.allowBack === true;

  const preparePushToken = useCallback(async () => {
    const token = await getFcmToken();
    setFcmToken(token);
  }, []);

  const getCurrentPosition = useCallback(() => {
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
      },
      error => {
        console.warn('Geolocation error:', error);
        setIsFetching(false);
        setLocationName('현재 위치를 가져올 수 없습니다');
        Alert.alert(
          '위치 탐색 실패',
          '기기의 위치 서비스가 켜져 있는지 확인한 뒤 다시 시도해주세요.',
        );
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
        const auth = await Geolocation.requestAuthorization('whenInUse');
        if (auth === 'granted') {
          getCurrentPosition();
        } else {
          setIsFetching(false);
          setLocationName('위치 권한이 거부되었습니다');
        }
      }
    } catch (err) {
      setIsFetching(false);
      console.warn('Permission error:', err);
    }
  }, [getCurrentPosition]);

  useEffect(() => {
    requestLocationPermission();
    preparePushToken();
  }, [preparePushToken, requestLocationPermission]);

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
        fcmToken,
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
        {allowBack && (
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.headerBackText}>←</Text>
          </TouchableOpacity>
        )}
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

export default LocationSetupScreen;
