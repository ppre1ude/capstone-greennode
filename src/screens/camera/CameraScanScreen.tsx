/**
 * CameraScanScreen — AI 신선도 스캔 화면 (Phase 3)
 *
 * Vision AI 분석을 위한 식재료 촬영 화면.
 * 카메라 뷰, 스캔 프레임 애니메이션, 촬영/갤러리 전환.
 * 
 * @wireframe wireframe-foodlink/scanpage1.html
 */
import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '@/navigation/types';
import {Camera, useCameraDevice, useCameraPermission} from 'react-native-vision-camera';
import {launchImageLibrary} from 'react-native-image-picker';
import {styles} from './CameraScanScreen.styles';
import {generatePost} from '@/api/posts';

type Props = NativeStackScreenProps<RootStackParamList, 'CameraScan'>;

const CameraScanScreen = ({navigation}: Props) => {
  const {hasPermission, requestPermission} = useCameraPermission();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const device = useCameraDevice('back');
  const camera = useRef<any>(null);

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

  const handleCapture = async () => {
    if (!camera.current) {return;}
    
    try {
      const photo = await camera.current.takePhoto({
        flash: 'off',
      });
      processImage(`file://${photo.path}`);
    } catch (error) {
      console.warn('Capture error', error);
      Alert.alert('촬영 오류', '사진을 촬영할 수 없습니다.');
    }
  };

  const handleGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.uri) {
          processImage(asset.uri, asset.type, asset.fileName);
        }
      }
    } catch (error) {
      console.warn('Gallery error', error);
    }
  };

  const processImage = async (
    uri: string,
    type: string = 'image/jpeg',
    name: string = 'photo.jpg',
  ) => {
    setIsAnalyzing(true);
    try {
      const response = await generatePost({uri, type, name});

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
        image: {uri, type, name},
      });
      const message = error?.response?.data?.message || '서버 오류가 발생했습니다.';
      Alert.alert('오류', message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.permissionText}>카메라 권한이 필요합니다.</Text>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.permissionText}>사용 가능한 카메라가 없습니다.</Text>
        {/* 에뮬레이터 환경을 위한 갤러리 버튼 폴백 */}
        <TouchableOpacity style={styles.galleryFallbackButton} onPress={handleGallery}>
          <Text style={styles.galleryFallbackText}>갤러리에서 선택하기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Text style={styles.headerIcon}>✕</Text>
        </TouchableOpacity>
        
        {isAnalyzing ? (
          <View style={styles.statusBadge}>
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
              style={styles.statusSpinner}
            />
            <Text style={styles.statusText}>신선도를 분석 중입니다...</Text>
          </View>
        ) : (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>식재료를 스캔해주세요</Text>
          </View>
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
          // @ts-ignore
          photo={true}
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
            style={[styles.shutterContainer, isAnalyzing && styles.shutterDisabled]}
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
