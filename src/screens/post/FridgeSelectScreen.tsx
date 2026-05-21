/**
 * FridgeSelectScreen — 나눔을 등록할 공유 냉장고 선택 화면
 *
 * PostCreateScreen에서 전달받은 postData에
 * 사용자가 선택한 fridgeId를 더해 최종적으로 서버에 나눔 식재료 등록 요청(createPost)
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { getAvailableFridges } from '@/api/fridges';
import { createPost } from '@/api/posts';
import { useAuthStore } from '@/store/authStore';
import type { Fridge, PostCreateFlow } from '@/types';
import { getApiErrorMessage } from '@/utils/apiError';
import {
  getRegisteredLocation,
  LOCATION_REQUIRED_CTA,
  LOCATION_REQUIRED_MESSAGE,
  LOCATION_REQUIRED_TITLE,
} from '@/utils/locationGuard';
import { isShareableCategory } from '@/utils/postPolicy';
import { DSButton, DSCard, DSText } from '@/design-system';
import { colors } from '@/theme';
import { styles } from './FridgeSelectScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'FridgeSelect'>;

const PENDING_STORE_TIMEOUT_MS = 10 * 60 * 1000;

const toValidTimestamp = (value?: string | null): number | null => {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
};

const resolvePendingStoreExpiresAt = (
  storeExpiresAt?: string | null,
  createdAt?: string | null,
) => {
  const storeExpiresAtTimestamp = toValidTimestamp(storeExpiresAt);
  if (storeExpiresAt && storeExpiresAtTimestamp !== null) {
    return storeExpiresAt;
  }

  const createdAtTimestamp = toValidTimestamp(createdAt);
  if (createdAtTimestamp === null) {
    return undefined;
  }

  return new Date(createdAtTimestamp + PENDING_STORE_TIMEOUT_MS).toISOString();
};

const FridgeSelectScreen = ({ route, navigation }: Props) => {
  const { postData, qualityCategory, qualityCanShare } = route.params;
  const user = useAuthStore(state => state.user);
  const location = getRegisteredLocation(user);

  const [fridges, setFridges] = useState<Fridge[]>([]);
  const [selectedFridgeId, setSelectedFridgeId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fridgeError, setFridgeError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const selectedFridge = fridges.find(fridge => fridge.id === selectedFridgeId);

  const fetchFridges = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    setFridgeError(null);
    try {
      const response = await getAvailableFridges(lat, lng);
      if (response.success && response.data) {
        setFridges(response.data);
      } else {
        setFridges([]);
        setFridgeError(
          response.message || '등록 가능한 냉장고를 불러오지 못했습니다.',
        );
      }
    } catch (error) {
      console.warn('Failed to fetch fridges', error);
      setFridges([]);
      setFridgeError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openLocationSetup = useCallback(() => {
    navigation.navigate('LocationSetup', { allowBack: true });
  }, [navigation]);

  useEffect(() => {
    const registeredLocation = getRegisteredLocation(user);
    if (!registeredLocation) {
      setIsLoading(false);
      setFridges([]);
      setFridgeError(LOCATION_REQUIRED_MESSAGE);
      return;
    }

    fetchFridges(registeredLocation.latitude, registeredLocation.longitude);
  }, [fetchFridges, user]);

  const handleComplete = async (flow: PostCreateFlow = 'direct') => {
    if (!selectedFridgeId || !postData) {
      return;
    }
    if (isSubmittingRef.current) {
      return;
    }

    if (qualityCanShare === false || !isShareableCategory(qualityCategory)) {
      Alert.alert(
        '나눔 기준에 맞지 않아요',
        '이 식재료는 나눔 기준에 맞는 상태로 확인되지 않았어요. 다시 촬영해주세요.',
      );
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const response = await createPost({
        ...postData,
        fridgeId: selectedFridgeId,
        ...(flow === 'fridge_qr' ? {flow} : {}),
      });

      if (response.success && response.data) {
        if (flow === 'fridge_qr') {
          navigation.replace('InventoryQrPrototype', {
            mode: 'store',
            postId: response.data.id,
            fridgePublicCode: selectedFridge?.publicCode,
            fridgeName: selectedFridge?.name,
            fridgeLocation: selectedFridge?.address,
            pendingExpiresAt: resolvePendingStoreExpiresAt(
              response.data.storeExpiresAt,
              response.data.createdAt,
            ),
          });
          return;
        }

        navigation.replace('PostComplete', { postId: response.data.id });
      } else {
        Alert.alert(
          '등록 실패',
          response.message || '나눔 등록에 실패했습니다.',
        );
      }
    } catch (error) {
      Alert.alert('오류', getApiErrorMessage(error));
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: Fridge }) => {
    const isSelected = selectedFridgeId === item.id;
    return (
      <DSCard
        variant="outlined"
        padded={false}
        accessibilityState={{ selected: isSelected }}
        style={[styles.fridgeCard, isSelected && styles.fridgeCardSelected]}
        onPress={() => setSelectedFridgeId(item.id)}>
        <View style={styles.fridgeInfo}>
          <DSText
            variant="bodyBold"
            color={isSelected ? 'textOnPrimary' : 'textPrimary'}
            style={styles.fridgeName}>
            {item.name}
          </DSText>
          <DSText
            variant="caption"
            color={isSelected ? 'textOnPrimary' : 'textSecondary'}
            style={styles.fridgeAddress}>
            {item.address}
          </DSText>
          {item.distance !== undefined && (
            <DSText
              variant="small"
              color={isSelected ? 'textOnPrimary' : 'primary'}
              style={styles.fridgeDistance}>
              {item.distance.toFixed(2)}km
            </DSText>
          )}
        </View>
        <View style={[styles.radio, isSelected && styles.radioSelected]}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
      </DSCard>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <DSText
          variant="bodyBold"
          color="textPrimary"
          style={styles.headerTitle}>
          냉장고 선택
        </DSText>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <DSText variant="heading2" color="textPrimary" style={styles.title}>
          나눔을 진행할{'\n'}
          <DSText variant="heading2" color="primary">
            공유 냉장고
          </DSText>
          를 선택해주세요
        </DSText>

        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <DSText
              variant="body"
              color="textSecondary"
              style={styles.loadingText}>
              주변 냉장고를 찾는 중...
            </DSText>
          </View>
        ) : fridgeError ? (
          <View style={styles.centerBox}>
            <DSText
              variant="bodyBold"
              color="textPrimary"
              style={styles.errorTitle}>
              {location
                ? '냉장고를 불러오지 못했습니다'
                : LOCATION_REQUIRED_TITLE}
            </DSText>
            <DSText
              variant="caption"
              color="textSecondary"
              align="center"
              style={styles.errorSubtitle}>
              {fridgeError}
            </DSText>
            <DSButton
              label={location ? '다시 시도' : LOCATION_REQUIRED_CTA}
              size="small"
              onPress={() => {
                const registeredLocation = getRegisteredLocation(user);
                if (!registeredLocation) {
                  openLocationSetup();
                  return;
                }
                fetchFridges(
                  registeredLocation.latitude,
                  registeredLocation.longitude,
                );
              }}
            />
          </View>
        ) : fridges.length === 0 ? (
          <View style={styles.centerBox}>
            <Text style={styles.emptyEmoji}>🏢</Text>
            <DSText
              variant="body"
              color="textSecondary"
              align="center"
              style={styles.emptyText}>
              반경 2km 이내에{'\n'}사용 가능한 냉장고가 없습니다.
            </DSText>
          </View>
        ) : (
          <FlatList
            data={fridges}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {location ? (
        <View style={styles.footer}>
          <DSButton
            label="나눔 완료하기"
            fullWidth
            loading={isSubmitting}
            loadingLabel="처리 중"
            onPress={() => handleComplete('direct')}
            disabled={!selectedFridgeId || !postData || isSubmitting}
          />

          <DSButton
            testID="fridge-select-qr-submit"
            label="QR 입고로 등록하기"
            variant="outlined"
            fullWidth
            loading={isSubmitting}
            loadingLabel="처리 중"
            onPress={() => handleComplete('fridge_qr')}
            disabled={!selectedFridgeId || !postData || isSubmitting}
            style={styles.qrSubmitButton}
            textStyle={styles.qrSubmitButtonText}
          />
        </View>
      ) : null}
    </View>
  );
};

export default FridgeSelectScreen;
