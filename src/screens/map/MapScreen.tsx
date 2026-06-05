/**
 * MapScreen - 지도 화면 (Phase 5)
 *
 * 사용자 반경 2km 이내의 공유 냉장고 위치를 지도에 마커로 표시.
 * 하단에 냉장고 리스트를 캐러셀로 제공하여 마커와 연동.
 *
 * @wireframe wireframe-foodlink/map.html
 */
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import { getFridgePosts, getNearbyFridges } from '@/api/fridges';
import { getImageUrl } from '@/api/posts';
import { useAuthStore } from '@/store/authStore';
import { useFeedRefreshStore } from '@/store/feedRefreshStore';
import type { Fridge, PostNearbyRead } from '@/types';
import { filterFridges } from '@/utils/fridgeSearch';
import {
  getRegisteredLocation,
  LOCATION_REQUIRED_CTA,
  LOCATION_REQUIRED_MESSAGE,
  LOCATION_REQUIRED_TITLE,
} from '@/utils/locationGuard';
import { getPostDisplayName, getQualityMeta } from '@/utils/postPolicy';
import { colors } from '@/theme';
import {
  DSButton,
  DSCard,
  DSChip,
  DSIcon,
  DSListCell,
  DSText,
  DSTextField,
} from '@/design-system/components';
import { styles } from './MapScreen.styles';

const FALLBACK_MARKER_POSITIONS = [
  { top: '42%', left: '52%' },
  { top: '56%', left: '33%' },
  { top: '34%', left: '70%' },
  { top: '64%', left: '62%' },
] as const;

const MapScreen = () => {
  const user = useAuthStore(state => state.user);
  const requestedPostId = useFeedRefreshStore(state => state.requestedPostId);
  const navigation = useNavigation<any>();
  const [fridges, setFridges] = useState<Fridge[]>([]);
  const [fridgeState, setFridgeState] = useState<
    'loading' | 'ready' | 'empty' | 'error'
  >('loading');
  const [fridgeError, setFridgeError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFridgeId, setSelectedFridgeId] = useState<number | null>(null);
  const [fridgePosts, setFridgePosts] = useState<PostNearbyRead[]>([]);
  const [fridgePostsState, setFridgePostsState] = useState<
    'idle' | 'loading' | 'ready' | 'empty' | 'error'
  >('idle');
  const [fridgePostsError, setFridgePostsError] = useState<string | null>(null);
  const [nativeMapLoaded, setNativeMapLoaded] = useState(false);
  const mapRef = useRef<MapView>(null);
  const flatListRef = useRef<FlatList>(null);
  const fridgePostsRequestId = useRef(0);
  const fridgeSearchRequestId = useRef(0);
  const didMountFridgeSearch = useRef(false);
  const unfilteredFridgesRef = useRef<Fridge[]>([]);
  const hasLoadedUnfilteredFridgesRef = useRef(false);
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
    navigation.getParent()?.navigate('LocationSetup', { allowBack: true });
  }, [navigation]);

  const handleNativeMapLoaded = useCallback(() => {
    setNativeMapLoaded(true);
  }, []);

  useEffect(() => {
    if (!nativeMapLoaded || displayedFridges.length === 0) {
      return;
    }

    mapRef.current?.fitToCoordinates?.(
      displayedFridges.map(fridge => ({
        latitude: fridge.latitude,
        longitude: fridge.longitude,
      })),
      {
        edgePadding: { top: 180, right: 80, bottom: 390, left: 80 },
        animated: true,
      },
    );
  }, [displayedFridges, nativeMapLoaded]);

  const resetFridgePosts = useCallback(() => {
    fridgePostsRequestId.current += 1;
    setFridgePosts([]);
    setFridgePostsState('idle');
    setFridgePostsError(null);
  }, []);

  const clearSelectedFridge = useCallback(() => {
    setSelectedFridgeId(null);
    resetFridgePosts();
  }, [resetFridgePosts]);

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
    const requestId = fridgeSearchRequestId.current + 1;
    fridgeSearchRequestId.current = requestId;
    const registeredLocation = getRegisteredLocation(user);
    if (!registeredLocation) {
      setFridges([]);
      unfilteredFridgesRef.current = [];
      hasLoadedUnfilteredFridgesRef.current = false;
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
      if (fridgeSearchRequestId.current !== requestId) {
        return;
      }
      if (response.success && response.data) {
        setFridges(response.data);
        unfilteredFridgesRef.current = response.data;
        hasLoadedUnfilteredFridgesRef.current = true;
        setFridgeState(response.data.length > 0 ? 'ready' : 'empty');
      } else {
        setFridges([]);
        unfilteredFridgesRef.current = [];
        hasLoadedUnfilteredFridgesRef.current = false;
        setSelectedFridgeId(null);
        resetFridgePosts();
        setFridgeState('error');
        setFridgeError(
          response.message || '주변 냉장고를 불러오지 못했습니다.',
        );
      }
    } catch (error) {
      if (fridgeSearchRequestId.current !== requestId) {
        return;
      }
      console.warn('Map: Failed to fetch fridges', error);
      setFridges([]);
      unfilteredFridgesRef.current = [];
      hasLoadedUnfilteredFridgesRef.current = false;
      setSelectedFridgeId(null);
      resetFridgePosts();
      setFridgeState('error');
      setFridgeError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
    }
  }, [resetFridgePosts, user]);

  const searchFridges = useCallback(
    async (query: string) => {
      const registeredLocation = getRegisteredLocation(user);
      if (!registeredLocation) {
        return;
      }

      const requestId = fridgeSearchRequestId.current + 1;
      fridgeSearchRequestId.current = requestId;
      setFridgeState('loading');
      setFridgeError(null);

      try {
        const response = await getNearbyFridges(
          registeredLocation.latitude,
          registeredLocation.longitude,
          2.0,
          query,
          0,
          20,
        );
        if (fridgeSearchRequestId.current !== requestId) {
          return;
        }

        if (response.success && response.data) {
          setFridges(response.data);
          setFridgeState(response.data.length > 0 ? 'ready' : 'empty');
        } else {
          throw new Error(response.message || 'search failed');
        }
      } catch (error) {
        if (fridgeSearchRequestId.current !== requestId) {
          return;
        }

        console.warn('Map: Failed to search fridges', error);
        if (hasLoadedUnfilteredFridgesRef.current) {
          const fallbackFridges = filterFridges(
            unfilteredFridgesRef.current,
            query,
          );
          setFridges(fallbackFridges);
          setFridgeState(fallbackFridges.length > 0 ? 'ready' : 'empty');
          setFridgeError(null);
          return;
        }

        setFridges([]);
        setSelectedFridgeId(null);
        resetFridgePosts();
        setFridgeState('error');
        setFridgeError(
          '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
        );
      }
    },
    [resetFridgePosts, user],
  );

  useEffect(() => {
    fetchFridges();
  }, [fetchFridges]);

  useEffect(() => {
    if (!didMountFridgeSearch.current) {
      didMountFridgeSearch.current = true;
      return;
    }

    const query = searchQuery.trim();
    const timeout = setTimeout(() => {
      if (query) {
        searchFridges(query).catch(() => undefined);
      } else {
        fetchFridges().catch(() => undefined);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [fetchFridges, searchFridges, searchQuery]);

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

  useEffect(() => {
    if (requestedPostId == null) {
      return;
    }

    const nextPosts = fridgePosts.filter(post => post.id !== requestedPostId);
    if (nextPosts.length === fridgePosts.length) {
      return;
    }

    setFridgePosts(nextPosts);
    setFridgePostsState(nextPosts.length > 0 ? 'ready' : 'empty');
  }, [fridgePosts, requestedPostId]);

  const focusFridge = (fridge: Fridge, index?: number) => {
    setSelectedFridgeId(fridge.id);
    if (index != null) {
      flatListRef.current?.scrollToIndex?.({ index, animated: true });
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

  const renderFridgeCard = ({ item }: { item: Fridge }) => {
    const isSelected = selectedFridgeId === item.id;
    return (
      <DSCard
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => focusFridge(item)}>
        <View style={styles.cardHeader}>
          <DSText
            variant="bodyBold"
            style={[styles.cardTitle, isSelected && styles.textSelected]}>
            {item.name}
          </DSText>
          <DSChip label="운영중" tone="primary" size="xsmall" />
        </View>
        <DSText
          variant="caption"
          style={[styles.cardAddress, isSelected && styles.textSelected]}>
          {item.address}
        </DSText>
        <View style={styles.cardFooter}>
          <DSText
            variant="caption"
            style={[styles.cardDistance, isSelected && styles.textSelected]}>
            {item.distance ? `${item.distance.toFixed(2)}km` : ''}
          </DSText>
          <DSButton
            label="내부 보기"
            variant="solid"
            color="assistive"
            size="small"
            style={styles.detailButton}
            textStyle={styles.detailButtonText}
            trailing={
              <DSIcon name="angle-right" size="small" color="textPrimary" />
            }
            onPress={() => focusFridge(item)}
          />
        </View>
      </DSCard>
    );
  };

  const renderFridgePostItem = ({ item }: { item: PostNearbyRead }) => {
    const displayName = getPostDisplayName(item);
    const quality = getQualityMeta(item.freshnessLabel);

    return (
      <DSListCell
        title={displayName}
        caption={quality.label}
        titleNumberOfLines={1}
        captionNumberOfLines={1}
        verticalPadding="small"
        style={styles.fridgePostItem}
        leading={
          <Image
            source={{ uri: getImageUrl(item.imageUrl) }}
            style={styles.fridgePostImage}
            resizeMode="cover"
          />
        }
        trailing={
          <DSIcon name="angle-right" size="small" color="textTertiary" />
        }
        onPress={() =>
          navigation.getParent()?.navigate('PostDetail', { postId: item.id })
        }
      />
    );
  };

  const renderSelectedFridgePosts = () => {
    if (!selectedFridge) {
      return null;
    }

    return (
      <DSCard
        testID="map-selected-fridge-sheet"
        style={styles.selectedFridgeSheet}>
        <View style={styles.selectedFridgeActionRow}>
          <DSButton
            label="다른 냉장고 보기"
            variant="solid"
            color="assistive"
            size="small"
            style={styles.switchFridgeButton}
            textStyle={styles.switchFridgeButtonText}
            leading={
              <DSIcon name="angle-left" size="small" color="textPrimary" />
            }
            onPress={clearSelectedFridge}
          />
          <DSButton
            label="새로고침"
            variant="solid"
            size="small"
            style={styles.panelRetryButton}
            textStyle={styles.panelRetryButtonText}
            leading={
              <DSIcon name="rotate-right" size="small" color="primary" />
            }
            onPress={() => fetchFridgePosts(selectedFridge.id)}
          />
        </View>

        <View style={styles.selectedFridgeSummary}>
          <DSText
            variant="bodyBold"
            style={styles.selectedFridgeName}
            numberOfLines={1}>
            {selectedFridge.name}
          </DSText>
          <DSText
            variant="caption"
            color="textSecondary"
            style={styles.selectedFridgeAddress}
            numberOfLines={1}>
            {selectedFridge.address}
          </DSText>
          <View style={styles.selectedFridgeMetaRow}>
            <DSChip label="운영중" tone="primary" size="xsmall" />
            <DSText variant="small" style={styles.selectedFridgeDistance}>
              {selectedFridge.distance
                ? `${selectedFridge.distance.toFixed(2)}km`
                : '거리 확인 중'}
            </DSText>
          </View>
        </View>

        <View style={styles.fridgePostsHeader}>
          <DSText variant="bodyBold" style={styles.fridgePostsTitle}>
            지금 가능한 나눔 식재료
          </DSText>
        </View>

        {fridgePostsState === 'idle' || fridgePostsState === 'loading' ? (
          <View style={styles.fridgePostsStateBox}>
            <ActivityIndicator color={colors.primary} />
            <DSText
              variant="caption"
              color="textSecondary"
              style={styles.fridgePostsStateText}>
              냉장고 안 나눔을 불러오는 중입니다
            </DSText>
          </View>
        ) : fridgePostsState === 'error' ? (
          <View style={styles.fridgePostsStateBox}>
            <DSText variant="caption" style={styles.fridgePostsStateTitle}>
              내부 목록을 불러오지 못했습니다
            </DSText>
            <DSText
              variant="caption"
              color="textSecondary"
              style={styles.fridgePostsStateText}>
              {fridgePostsError}
            </DSText>
          </View>
        ) : fridgePostsState === 'empty' ? (
          <View style={styles.fridgePostsStateBox}>
            <DSText variant="caption" style={styles.fridgePostsStateTitle}>
              지금 가능한 나눔 식재료가 없습니다
            </DSText>
            <DSText
              variant="caption"
              color="textSecondary"
              style={styles.fridgePostsStateText}>
              다른 냉장고를 선택하거나 잠시 후 다시 확인해주세요.
            </DSText>
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
      </DSCard>
    );
  };

  const renderMapFallbackLayer = () => (
    <View
      pointerEvents="none"
      style={styles.mapFallbackLayer}
      testID="map-visual-fallback">
      <View style={styles.mapDistrictNorth} />
      <View style={styles.mapDistrictSouth} />
      <View
        style={[styles.mapFallbackRoad, styles.mapFallbackRoadPrimary]}
        testID="map-visual-fallback-road"
      />
      <View
        style={[styles.mapFallbackRoad, styles.mapFallbackRoadSecondary]}
        testID="map-visual-fallback-road"
      />
      <View
        style={[styles.mapFallbackRoad, styles.mapFallbackRoadTertiary]}
        testID="map-visual-fallback-road"
      />
      <View style={styles.mapFallbackGpsRing}>
        <View style={styles.mapFallbackGpsDot} />
      </View>
      {displayedFridges.slice(0, 4).map((fridge, index) => (
        <View
          key={fridge.id}
          style={[
            styles.mapFallbackMarker,
            FALLBACK_MARKER_POSITIONS[index % FALLBACK_MARKER_POSITIONS.length],
          ]}
          testID="map-visual-fallback-marker">
          <View style={styles.mapFallbackMarkerIcon}>
            <DSIcon name="building" size="xsmall" color="textOnPrimary" />
          </View>
          <DSText
            numberOfLines={1}
            variant="small"
            style={styles.mapFallbackMarkerLabel}>
            {fridge.name}
          </DSText>
        </View>
      ))}
    </View>
  );

  if (!location || !initialRegion) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
          translucent={false}
        />
        <View style={styles.locationRequiredContainer}>
          <DSText variant="bodyBold" style={styles.locationRequiredTitle}>
            {LOCATION_REQUIRED_TITLE}
          </DSText>
          <DSText
            variant="body"
            color="textSecondary"
            style={styles.locationRequiredText}>
            {LOCATION_REQUIRED_MESSAGE}
          </DSText>
          <DSButton
            label={LOCATION_REQUIRED_CTA}
            size="medium"
            style={styles.retryButton}
            textStyle={styles.retryButtonText}
            leading={
              <DSIcon
                name="map-location-dot"
                size="small"
                color="textOnPrimary"
              />
            }
            onPress={openLocationSetup}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* 헤더 검색창 (오버레이) */}
      <View style={styles.header}>
        <DSTextField
          leading={
            <DSIcon
              name="magnifying-glass"
              size="small"
              color="textTertiary"
              style={styles.searchIcon}
            />
          }
          containerStyle={styles.searchFieldContainer}
          inputContainerStyle={styles.searchBar}
          inputStyle={styles.searchInput}
          placeholder="동네 이름이나 냉장고 이름 검색"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* 지도 영역 */}
      <MapView
        ref={mapRef}
        testID="map-native-view"
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        onMapLoaded={handleNativeMapLoaded}
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
              <DSIcon
                name="building"
                size="small"
                color={
                  selectedFridgeId === fridge.id ? 'textOnPrimary' : 'primary'
                }
                style={styles.markerIcon}
              />
            </View>
          </Marker>
        ))}
      </MapView>

      {!nativeMapLoaded ? renderMapFallbackLayer() : null}

      {/* 내 위치 이동 버튼 */}
      <TouchableOpacity
        style={styles.myLocationButton}
        onPress={() => {
          mapRef.current?.animateToRegion(initialRegion, 500);
        }}>
        <DSIcon name="location-crosshairs" size="large" color="primary" />
      </TouchableOpacity>

      {/* 하단 primary surface */}
      <View testID="map-bottom-surface" style={styles.bottomSurface}>
        {selectedFridge ? (
          renderSelectedFridgePosts()
        ) : fridgeState === 'loading' ? (
          <DSCard style={styles.emptyCard}>
            <ActivityIndicator color={colors.primary} />
            <DSText variant="caption" style={styles.emptyTitle}>
              주변 냉장고를 불러오는 중입니다
            </DSText>
          </DSCard>
        ) : fridgeState === 'error' ? (
          <DSCard style={styles.emptyCard}>
            <DSText variant="caption" style={styles.emptyTitle}>
              냉장고를 불러오지 못했습니다
            </DSText>
            <DSText
              variant="body"
              color="textSecondary"
              style={styles.emptyText}>
              {fridgeError}
            </DSText>
            <DSButton
              label="다시 시도"
              size="small"
              style={styles.retryButton}
              textStyle={styles.retryButtonText}
              leading={
                <DSIcon
                  name="rotate-right"
                  size="small"
                  color="textOnPrimary"
                />
              }
              onPress={() => {
                fetchFridges();
              }}
            />
          </DSCard>
        ) : displayedFridges.length > 0 ? (
          <FlatList
            testID="map-fridge-carousel"
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
          <DSCard style={styles.emptyCard}>
            <DSText variant="caption" style={styles.emptyTitle}>
              {searchQuery.trim() || fridges.length > 0
                ? '검색 결과가 없습니다'
                : '근처에 냉장고가 없습니다'}
            </DSText>
            <DSText
              variant="body"
              color="textSecondary"
              style={styles.emptyText}>
              {searchQuery.trim() || fridges.length > 0
                ? '다른 동네 이름이나 냉장고 이름으로 검색해보세요.'
                : '동네 위치를 다시 설정하거나 잠시 후 다시 확인해주세요.'}
            </DSText>
            {searchQuery ? (
              <DSButton
                label="검색 초기화"
                size="small"
                style={styles.retryButton}
                textStyle={styles.retryButtonText}
                leading={
                  <DSIcon name="xmark" size="small" color="textOnPrimary" />
                }
                onPress={() => setSearchQuery('')}
              />
            ) : null}
          </DSCard>
        )}
      </View>
    </View>
  );
};

export default MapScreen;
