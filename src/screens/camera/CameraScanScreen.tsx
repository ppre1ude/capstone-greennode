/**
 * CameraScanScreen — AI 신선도 스캔 화면 (Phase 3)
 *
 * Vision AI 분석을 위한 식재료 촬영 화면.
 * 카메라 뷰, 스캔 프레임 애니메이션, 촬영/갤러리 전환.
 *
 * @wireframe wireframe-foodlink/scanpage1.html
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Animated,
  Alert,
  Linking,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import {
  Camera,
  type CameraRef,
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
} from 'react-native-vision-camera';
import { launchImageLibrary } from 'react-native-image-picker';
import { DSButton, DSChip, DSText } from '@/design-system';
import { styles } from './CameraScanScreen.styles';
import { generatePost } from '@/api/posts';
import { getApiErrorMessage } from '@/utils/apiError';
import { validateImageForUpload } from '@/utils/imageUploadPolicy';

type Props = NativeStackScreenProps<RootStackParamList, 'CameraScan'>;

const CameraScanScreen = ({ navigation }: Props) => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const device = useCameraDevice('back');
  const photoOutput = usePhotoOutput({ containerFormat: 'jpeg' });
  const camera = useRef<CameraRef>(null);

  // 스캔 라인 애니메이션
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    if (hasPermission && device) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [hasPermission, device, scanLineAnim]);

  const handleGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 0.8,
      });

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const validation = validateImageForUpload({
          uri: asset.uri,
          type: asset.type,
          fileSize: asset.fileSize,
        });

        if (!validation.ok) {
          Alert.alert('업로드 불가', validation.reason);
          return;
        }

        if (asset.uri) {
          await processImage(asset.uri, asset.type, asset.fileName);
        }
      }
    } catch (error) {
      console.warn('Gallery error', error);
    }
  };

  const handleRequestCameraPermission = async () => {
    const granted = await requestPermission();
    if (!granted) {
      Alert.alert(
        '카메라 권한 필요',
        '설정에서 카메라 권한을 허용하거나 갤러리에서 사진을 선택해주세요.',
        [
          { text: '취소', style: 'cancel' },
          { text: '설정 열기', onPress: () => Linking.openSettings() },
        ],
      );
    }
  };

  const handleCapture = async () => {
    if (!camera.current) {
      Alert.alert(
        '카메라 준비 실패',
        '카메라를 사용할 수 없습니다. 갤러리에서 사진을 선택할 수 있습니다.',
        [
          { text: '취소', style: 'cancel' },
          { text: '갤러리 선택', onPress: handleGallery },
        ],
      );
      return;
    }

    try {
      const photo = await photoOutput.capturePhotoToFile(
        {
          flashMode: 'off',
        },
        {},
      );
      processImage(`file://${photo.filePath}`);
    } catch (error) {
      console.warn('Capture error', error);
      Alert.alert(
        '촬영 오류',
        '사진 촬영에 실패했습니다. 갤러리에서 기존 사진을 선택할 수 있습니다.',
        [
          { text: '취소', style: 'cancel' },
          { text: '갤러리 선택', onPress: handleGallery },
        ],
      );
    }
  };

  const processImage = async (
    uri: string,
    type: string = 'image/jpeg',
    name: string = 'photo.jpg',
  ) => {
    setIsAnalyzing(true);
    try {
      const response = await generatePost({ uri, type, name });

      if (response.success && response.data) {
        navigation.replace('AnalysisResult', {
          result: response.data,
          imageUri: uri,
        });
      } else {
        Alert.alert('분석 실패', response.message || 'AI 분석에 실패했습니다.');
      }
    } catch (error: any) {
      console.warn('Generate post failed', {
        message: error?.message,
        status: error?.response?.status,
        response: error?.response?.data,
        image: { uri, type, name },
      });
      const message = getApiErrorMessage(error, 'AI 분석에 실패했습니다.', {
        preferDetail: true,
      });
      Alert.alert('분석 실패', message, [
        { text: '다시 촬영', style: 'cancel' },
        { text: '갤러리 선택', onPress: handleGallery },
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.centerContainer}>
        <DSText
          variant="body"
          color="textOnPrimary"
          align="center"
          style={styles.permissionText}>
          카메라 권한이 필요합니다.
        </DSText>
        <DSButton
          label="권한 다시 요청"
          size="medium"
          style={styles.galleryFallbackButton}
          onPress={handleRequestCameraPermission}
        />
        <DSButton
          label="설정 열기"
          variant="outlined"
          color="assistive"
          size="medium"
          style={styles.secondaryFallbackButton}
          textStyle={styles.secondaryFallbackText}
          onPress={() => Linking.openSettings()}
        />
        <DSButton
          label="갤러리에서 선택하기"
          size="medium"
          style={styles.galleryFallbackButton}
          onPress={handleGallery}
        />
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.centerContainer}>
        <DSText
          variant="body"
          color="textOnPrimary"
          align="center"
          style={styles.permissionText}>
          사용 가능한 카메라가 없습니다.
        </DSText>
        {/* 에뮬레이터 환경을 위한 갤러리 버튼 폴백 */}
        <DSButton
          label="갤러리에서 선택하기"
          size="medium"
          style={styles.galleryFallbackButton}
          onPress={handleGallery}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}>
          <Text style={styles.headerIcon}>✕</Text>
        </TouchableOpacity>

        {isAnalyzing ? (
          <DSChip
            label="신선도를 분석 중입니다..."
            tone="neutral"
            size="medium"
            leading={
              <ActivityIndicator
                size="small"
                color="#1A1A1A"
                style={styles.statusSpinner}
              />
            }
            style={styles.statusBadge}
          />
        ) : (
          <DSChip
            label="식재료를 스캔해주세요"
            tone="neutral"
            size="medium"
            style={styles.statusBadge}
          />
        )}

        <TouchableOpacity style={styles.headerButton}>
          <Text style={styles.headerIcon}>⚡️</Text>
        </TouchableOpacity>
      </View>

      {/* 카메라 뷰 */}
      <View style={styles.cameraContainer}>
        <Camera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={!isAnalyzing}
          outputs={[photoOutput]}
        />

        {/* 스캔 프레임 UI */}
        <View style={styles.overlay}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [
                    {
                      translateY: scanLineAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 240], // 프레임 높이 기준
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* 하단 컨트롤 */}
      <View style={styles.controls}>
        <View style={styles.captureRow}>
          <TouchableOpacity
            style={styles.sideButton}
            onPress={handleGallery}
            disabled={isAnalyzing}>
            <Text style={styles.sideButtonIcon}>🖼️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.shutterContainer,
              isAnalyzing && styles.shutterDisabled,
            ]}
            onPress={handleCapture}
            disabled={isAnalyzing}>
            <View style={styles.shutterButton} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.sideButton} disabled={isAnalyzing}>
            <Text style={styles.sideButtonIcon}>🔄</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default CameraScanScreen;
