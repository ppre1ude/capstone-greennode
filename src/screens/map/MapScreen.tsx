/**
 * MapScreen — 지도 탭 (Phase 5)
 *
 * 내 반경 2km 이내의 공유 냉장고 위치를 지도에 마커로 표시.
 * 하단에 냉장고 리스트를 캐러셀(가로 스크롤)로 제공하여 마커와 연동.
 *
 * @wireframe wireframe-foodlink/map.html
 */
import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import MapView, {Marker, Circle, PROVIDER_DEFAULT} from 'react-native-maps';
import {getNearbyFridges} from '@/api/fridges';
import {useAuthStore} from '@/store/authStore';
import type {Fridge} from '@/types';
import {filterFridges} from '@/utils/fridgeSearch';
import {
  getRegisteredLocation,
  LOCATION_REQUIRED_CTA,
  LOCATION_REQUIRED_MESSAGE,
  LOCATION_REQUIRED_TITLE,
} from '@/utils/locationGuard';
import {colors} from '@/theme';
import {styles} from './MapScreen.styles';

const MapScreen = () => {
  const user = useAuthStore(state => state.user);
  const navigation = useNavigation<any>();
  const [fridges, setFridges] = useState<Fridge[]>([]);
  const [fridgeState, setFridgeState] = useState<
    'loading' | 'ready' | 'empty' | 'error'
  >('loading');
  const [fridgeError, setFridgeError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFridgeId, setSelectedFridgeId] = useState<number | null>(null);
  const mapRef = useRef<MapView>(null);
  const flatListRef = useRef<FlatList>(null);
  const location = getRegisteredLocation(user);
  const displayedFridges = useMemo(
    () => filterFridges(fridges, searchQuery),
    [fridges, searchQuery],
  );

  const initialRegion = location
    ? {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      }
    : null;

  const openLocationSetup = useCallback(() => {
    navigation.getParent()?.navigate('LocationSetup', {allowBack: true});
  }, [navigation]);

  const fetchFridges = useCallback(async () => {
    const registeredLocation = getRegisteredLocation(user);
    if (!registeredLocation) {
      setFridges([]);
      setFridgeState('error');
      setFridgeError(LOCATION_REQUIRED_MESSAGE);
      return;
    }

    setFridgeState('loading');
    setFridgeError(null);
    try {
      const response = await getNearbyFridges(
        registeredLocation.latitude,
        registeredLocation.longitude,
        2.0,
      );
      if (response.success && response.data) {
        setFridges(response.data);
        setFridgeState(response.data.length > 0 ? 'ready' : 'empty');
      } else {
        setFridges([]);
        setFridgeState('error');
        setFridgeError(response.message || '주변 냉장고를 불러오지 못했습니다.');
      }
    } catch (error) {
      console.warn('Map: Failed to fetch fridges', error);
      setFridges([]);
      setFridgeState('error');
      setFridgeError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
    }
  }, [user]);

  useEffect(() => {
    fetchFridges();
  }, [fetchFridges]);

  useEffect(() => {
    if (
      selectedFridgeId != null &&
      !displayedFridges.some(fridge => fridge.id === selectedFridgeId)
    ) {
      setSelectedFridgeId(null);
    }
  }, [displayedFridges, selectedFridgeId]);

  const handleMarkerPress = (fridge: Fridge, index: number) => {
    setSelectedFridgeId(fridge.id);
    flatListRef.current?.scrollToIndex({index, animated: true});
    mapRef.current?.animateToRegion(
      {
        latitude: fridge.latitude,
        longitude: fridge.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      500,
    );
  };

  const renderFridgeCard = ({item}: {item: Fridge}) => {
    const isSelected = selectedFridgeId === item.id;
    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => {
          setSelectedFridgeId(item.id);
          mapRef.current?.animateToRegion(
            {
              latitude: item.latitude,
              longitude: item.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            500,
          );
        }}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, isSelected && styles.textSelected]}>
            {item.name}
          </Text>
          <Text style={styles.statusBadge}>운영중</Text>
        </View>
        <Text style={[styles.cardAddress, isSelected && styles.textSelected]}>
          {item.address}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={[styles.cardDistance, isSelected && styles.textSelected]}>
            {item.distance ? `${item.distance.toFixed(2)}km` : ''}
          </Text>
          <TouchableOpacity style={styles.detailButton}>
            <Text style={styles.detailButtonText}>상세보기</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (!location || !initialRegion) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
          translucent={false}
        />
        <View style={styles.locationRequiredContainer}>
          <Text style={styles.locationRequiredTitle}>{LOCATION_REQUIRED_TITLE}</Text>
          <Text style={styles.locationRequiredText}>{LOCATION_REQUIRED_MESSAGE}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={openLocationSetup}>
            <Text style={styles.retryButtonText}>{LOCATION_REQUIRED_CTA}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* 헤더 검색창 (오버레이) */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="동네 이름이나 냉장고 이름 검색"
            placeholderTextColor={colors.textPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* 지도 영역 */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        showsMyLocationButton={false}>
        {/* 반경 표시 원 */}
        <Circle
          center={location}
          radius={2000} // 2km
          fillColor="rgba(30, 98, 59, 0.1)"
          strokeColor={colors.primary}
          strokeWidth={1}
        />

        {/* 냉장고 마커 */}
        {displayedFridges.map((fridge, index) => (
          <Marker
            key={fridge.id}
            coordinate={{
              latitude: fridge.latitude,
              longitude: fridge.longitude,
            }}
            onPress={() => handleMarkerPress(fridge, index)}>
            <View
              style={[
                styles.markerWrapper,
                selectedFridgeId === fridge.id && styles.markerWrapperSelected,
              ]}>
              <Text style={styles.markerEmoji}>🏢</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* 내 위치 이동 버튼 */}
      <TouchableOpacity
        style={styles.myLocationButton}
        onPress={() => {
          mapRef.current?.animateToRegion(initialRegion, 500);
        }}>
        <Text style={styles.myLocationIcon}>📍</Text>
      </TouchableOpacity>

      {/* 하단 냉장고 리스트 캐러셀 */}
      <View style={styles.bottomCarousel}>
        {fridgeState === 'loading' ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.emptyTitle}>주변 냉장고를 불러오는 중입니다</Text>
          </View>
        ) : fridgeState === 'error' ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>냉장고를 불러오지 못했습니다</Text>
            <Text style={styles.emptyText}>{fridgeError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                fetchFridges();
              }}>
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        ) : displayedFridges.length > 0 ? (
          <FlatList
            ref={flatListRef}
            data={displayedFridges}
            keyExtractor={item => item.id.toString()}
            renderItem={renderFridgeCard}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            snapToInterval={280 + 16} // card width + margin
            decelerationRate="fast"
          />
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              {fridges.length > 0 ? '검색 결과가 없습니다' : '근처에 냉장고가 없습니다'}
            </Text>
            <Text style={styles.emptyText}>
              {fridges.length > 0
                ? '다른 동네 이름이나 냉장고 이름으로 검색해보세요.'
                : '동네 위치를 다시 설정하거나 잠시 후 다시 확인해주세요.'}
            </Text>
            {searchQuery ? (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => setSearchQuery('')}>
                <Text style={styles.retryButtonText}>검색 초기화</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
};

export default MapScreen;
