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
  Image,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import MapView, {Marker, Circle, PROVIDER_DEFAULT} from 'react-native-maps';
import {getFridgePosts, getNearbyFridges} from '@/api/fridges';
import {getImageUrl} from '@/api/posts';
import {useAuthStore} from '@/store/authStore';
import type {Fridge, Post} from '@/types';
import {filterFridges} from '@/utils/fridgeSearch';
import {
  getRegisteredLocation,
  LOCATION_REQUIRED_CTA,
  LOCATION_REQUIRED_MESSAGE,
  LOCATION_REQUIRED_TITLE,
} from '@/utils/locationGuard';
import {
  getConfidencePercent,
  getPostDisplayName,
  getQualityMeta,
} from '@/utils/postPolicy';
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
  const [fridgePosts, setFridgePosts] = useState<Post[]>([]);
  const [fridgePostsState, setFridgePostsState] = useState<
    'idle' | 'loading' | 'ready' | 'empty' | 'error'
  >('idle');
  const [fridgePostsError, setFridgePostsError] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  const flatListRef = useRef<FlatList>(null);
  const fridgePostsRequestId = useRef(0);
  const location = getRegisteredLocation(user);
  const displayedFridges = useMemo(
    () => filterFridges(fridges, searchQuery),
    [fridges, searchQuery],
  );
  const selectedFridge = useMemo(
    () => fridges.find(fridge => fridge.id === selectedFridgeId) ?? null,
    [fridges, selectedFridgeId],
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

  const resetFridgePosts = useCallback(() => {
    fridgePostsRequestId.current += 1;
    setFridgePosts([]);
    setFridgePostsState('idle');
    setFridgePostsError(null);
  }, []);

  const fetchFridgePosts = useCallback(async (fridgeId: number) => {
    const requestId = fridgePostsRequestId.current + 1;
    fridgePostsRequestId.current = requestId;
    setFridgePosts([]);
    setFridgePostsState('loading');
    setFridgePostsError(null);

    try {
      const response = await getFridgePosts(fridgeId, 'available');
      if (fridgePostsRequestId.current !== requestId) {
        return;
      }

      if (response.success && response.data) {
        setFridgePosts(response.data);
        setFridgePostsState(response.data.length > 0 ? 'ready' : 'empty');
      } else {
        setFridgePosts([]);
        setFridgePostsState('error');
        setFridgePostsError(
          response.message || '냉장고 안 나눔을 불러오지 못했습니다.',
        );
      }
    } catch (error) {
      if (fridgePostsRequestId.current !== requestId) {
        return;
      }

      console.warn('Map: Failed to fetch fridge posts', error);
      setFridgePosts([]);
      setFridgePostsState('error');
      setFridgePostsError(
        '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
      );
    }
  }, []);

  const fetchFridges = useCallback(async () => {
    const registeredLocation = getRegisteredLocation(user);
    if (!registeredLocation) {
      setFridges([]);
      setSelectedFridgeId(null);
      resetFridgePosts();
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
        setSelectedFridgeId(null);
        resetFridgePosts();
        setFridgeState('error');
        setFridgeError(response.message || '주변 냉장고를 불러오지 못했습니다.');
      }
    } catch (error) {
      console.warn('Map: Failed to fetch fridges', error);
      setFridges([]);
      setSelectedFridgeId(null);
      resetFridgePosts();
      setFridgeState('error');
      setFridgeError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
    }
  }, [resetFridgePosts, user]);

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

  useEffect(() => {
    if (selectedFridgeId == null) {
      resetFridgePosts();
      return;
    }

    void fetchFridgePosts(selectedFridgeId);
  }, [fetchFridgePosts, resetFridgePosts, selectedFridgeId]);

  const focusFridge = (fridge: Fridge, index?: number) => {
    setSelectedFridgeId(fridge.id);
    if (index != null) {
      flatListRef.current?.scrollToIndex?.({index, animated: true});
    }
    mapRef.current?.animateToRegion?.(
      {
        latitude: fridge.latitude,
        longitude: fridge.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      500,
    );
  };

  const handleMarkerPress = (fridge: Fridge, index: number) => {
    focusFridge(fridge, index);
  };

  const renderFridgeCard = ({item}: {item: Fridge}) => {
    const isSelected = selectedFridgeId === item.id;
    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => focusFridge(item)}>
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
          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => focusFridge(item)}>
            <Text style={styles.detailButtonText}>
              {isSelected ? '목록 확인 중' : '내부 보기'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFridgePostItem = ({item}: {item: Post}) => {
    const displayName = getPostDisplayName(item);
    const quality = getQualityMeta(item.freshnessLabel);
    const confidencePercent = getConfidencePercent(item.confidenceScore);

    return (
      <TouchableOpacity
        style={styles.fridgePostItem}
        activeOpacity={0.8}
        onPress={() =>
          navigation.getParent()?.navigate('PostDetail', {postId: item.id})
        }>
        <Image
          source={{uri: getImageUrl(item.imageUrl)}}
          style={styles.fridgePostImage}
          resizeMode="cover"
        />
        <View style={styles.fridgePostInfo}>
          <Text style={styles.fridgePostTitle} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.fridgePostMeta} numberOfLines={1}>
            {confidencePercent != null
              ? `${quality.label} · AI 신뢰도 ${confidencePercent}%`
              : quality.label}
          </Text>
        </View>
        <Text style={styles.fridgePostChevron}>›</Text>
      </TouchableOpacity>
    );
  };

  const renderSelectedFridgePosts = () => {
    if (!selectedFridge) {
      return null;
    }

    return (
      <View style={styles.fridgePostsPanel}>
        <View style={styles.fridgePostsHeader}>
          <View style={styles.fridgePostsHeaderText}>
            <Text style={styles.fridgePostsTitle} numberOfLines={1}>
              {selectedFridge.name}
            </Text>
            <Text style={styles.fridgePostsSubtitle}>
              지금 가능한 나눔 식재료
            </Text>
          </View>
          <TouchableOpacity
            style={styles.panelRetryButton}
            onPress={() => fetchFridgePosts(selectedFridge.id)}>
            <Text style={styles.panelRetryButtonText}>새로고침</Text>
          </TouchableOpacity>
        </View>

        {fridgePostsState === 'idle' || fridgePostsState === 'loading' ? (
          <View style={styles.fridgePostsStateBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.fridgePostsStateText}>
              냉장고 안 나눔을 불러오는 중입니다
            </Text>
          </View>
        ) : fridgePostsState === 'error' ? (
          <View style={styles.fridgePostsStateBox}>
            <Text style={styles.fridgePostsStateTitle}>
              내부 목록을 불러오지 못했습니다
            </Text>
            <Text style={styles.fridgePostsStateText}>{fridgePostsError}</Text>
          </View>
        ) : fridgePostsState === 'empty' ? (
          <View style={styles.fridgePostsStateBox}>
            <Text style={styles.fridgePostsStateTitle}>
              지금 가능한 나눔 식재료가 없습니다
            </Text>
            <Text style={styles.fridgePostsStateText}>
              다른 냉장고를 선택하거나 잠시 후 다시 확인해주세요.
            </Text>
          </View>
        ) : (
          <FlatList
            data={fridgePosts}
            keyExtractor={item => item.id.toString()}
            renderItem={renderFridgePostItem}
            style={styles.fridgePostsList}
            scrollEnabled={fridgePosts.length > 3}
            nestedScrollEnabled
          />
        )}
      </View>
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
        {renderSelectedFridgePosts()}
      </View>
    </View>
  );
};

export default MapScreen;
