/**
 * FridgeSelectScreen — 나눔을 등록할 공유 냉장고 선택 화면
 *
 * PostCreateScreen에서 전달받은 postData에
 * 사용자가 선택한 fridgeId를 더해 최종적으로 서버에 게시글 등록 요청(createPost)
 */
import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '@/navigation/types';
import {getAvailableFridges} from '@/api/fridges';
import {createPost} from '@/api/posts';
import {useAuthStore} from '@/store/authStore';
import type {Fridge} from '@/types';
import {colors} from '@/theme';
import {styles} from './FridgeSelectScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'FridgeSelect'>;

const FridgeSelectScreen = ({route, navigation}: Props) => {
  const {postData} = route.params;
  const user = useAuthStore(state => state.user);

  const [fridges, setFridges] = useState<Fridge[]>([]);
  const [selectedFridgeId, setSelectedFridgeId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFridges = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await getAvailableFridges(lat, lng);
      if (response.success && response.data) {
        setFridges(response.data);
      }
    } catch (error) {
      console.warn('Failed to fetch fridges', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.latitude && user?.longitude) {
      fetchFridges(user.latitude, user.longitude);
    } else {
      Alert.alert('위치 정보 없음', '위치 정보를 확인할 수 없습니다.');
      navigation.goBack();
    }
  }, [fetchFridges, navigation, user]);

  const handleComplete = async () => {
    if (!selectedFridgeId || !postData) {return;}

    setIsSubmitting(true);
    try {
      const response = await createPost({
        ...postData,
        fridgeId: selectedFridgeId,
      });

      if (response.success && response.data) {
        navigation.replace('PostComplete', {postId: response.data.id});
      } else {
        Alert.alert('등록 실패', response.message || '나눔 등록에 실패했습니다.');
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || '서버 오류가 발생했습니다.';
      Alert.alert('오류', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderItem = ({item}: {item: Fridge}) => {
    const isSelected = selectedFridgeId === item.id;
    return (
      <TouchableOpacity
        style={[styles.fridgeCard, isSelected && styles.fridgeCardSelected]}
        onPress={() => setSelectedFridgeId(item.id)}>
        <View style={styles.fridgeInfo}>
          <Text style={[styles.fridgeName, isSelected && styles.textSelected]}>
            {item.name}
          </Text>
          <Text style={[styles.fridgeAddress, isSelected && styles.textSelected]}>
            {item.address}
          </Text>
          {item.distance !== undefined && (
            <Text style={[styles.fridgeDistance, isSelected && styles.textSelected]}>
              {item.distance.toFixed(2)}km
            </Text>
          )}
        </View>
        <View style={[styles.radio, isSelected && styles.radioSelected]}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>냉장고 선택</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          나눔을 진행할{'\n'}
          <Text style={styles.highlight}>공유 냉장고</Text>를 선택해주세요
        </Text>

        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>주변 냉장고를 찾는 중...</Text>
          </View>
        ) : fridges.length === 0 ? (
          <View style={styles.centerBox}>
            <Text style={styles.emptyEmoji}>🏢</Text>
            <Text style={styles.emptyText}>반경 2km 이내에{'\n'}사용 가능한 냉장고가 없습니다.</Text>
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

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, (!selectedFridgeId || isSubmitting) && styles.submitDisabled]}
          onPress={handleComplete}
          disabled={!selectedFridgeId || isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>나눔 완료하기</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default FridgeSelectScreen;
