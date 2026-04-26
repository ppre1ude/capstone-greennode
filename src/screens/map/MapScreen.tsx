/**
 * MapScreen — 지도 탭 (Phase 5)
 *
 * 내 반경 2km 이내의 공유 냉장고 위치를 지도에 마커로 표시.
 * 하단에 냉장고 리스트를 캐러셀(가로 스크롤)로 제공하여 마커와 연동.
 *
 * @wireframe wireframe-foodlink/map.html
 */
import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  StatusBar,
} from 'react-native';
import MapView, {Marker, Circle, PROVIDER_DEFAULT} from 'react-native-maps';
import {getNearbyFridges} from '@/api/fridges';
import {useAuthStore} from '@/store/authStore';
import type {Fridge} from '@/types';
import {colors} from '@/theme';

const MapScreen = () => {
  const user = useAuthStore(state => state.user);
  const [fridges, setFridges] = useState<Fridge[]>([]);
  const [selectedFridgeId, setSelectedFridgeId] = useState<number | null>(null);
  const mapRef = useRef<MapView>(null);
  const flatListRef = useRef<FlatList>(null);

  // 기본 좌표 (유저 위치 없으면 광주 전남대)
  const initialRegion = {
    latitude: user?.latitude || 35.1595,
    longitude: user?.longitude || 126.9136,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  };

  useEffect(() => {
    fetchFridges();
  }, [user]);

  const fetchFridges = async () => {
    try {
      const lat = user?.latitude || 35.1595;
      const lng = user?.longitude || 126.9136;
      const response = await getNearbyFridges(lat, lng, 2.0);
      if (response.success && response.data) {
        setFridges(response.data);
      }
    } catch (error) {
      console.warn('Map: Failed to fetch fridges', error);
    }
  };

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
          />
        </View>
      </View>

      {/* 지도 영역 */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}>
        {/* 반경 표시 원 */}
        <Circle
          center={{
            latitude: user?.latitude || 35.1595,
            longitude: user?.longitude || 126.9136,
          }}
          radius={2000} // 2km
          fillColor="rgba(30, 98, 59, 0.1)"
          strokeColor={colors.primary}
          strokeWidth={1}
        />

        {/* 냉장고 마커 */}
        {fridges.map((fridge, index) => (
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
        {fridges.length > 0 ? (
          <FlatList
            ref={flatListRef}
            data={fridges}
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
            <Text style={styles.emptyText}>근처에 냉장고가 없습니다.</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 24,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  markerWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  markerWrapperSelected: {
    backgroundColor: colors.primary,
    borderColor: '#FFFFFF',
    transform: [{scale: 1.2}],
  },
  markerEmoji: {
    fontSize: 20,
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 200,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
  myLocationIcon: {
    fontSize: 20,
  },
  bottomCarousel: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardSelected: {
    backgroundColor: colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  cardAddress: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDistance: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  detailButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  detailButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  textSelected: {
    color: '#FFFFFF',
  },
  emptyCard: {
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default MapScreen;
