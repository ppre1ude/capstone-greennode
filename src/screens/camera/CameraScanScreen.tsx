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
  Platform,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '@/navigation/types';
import {Camera, useCameraDevice, useCameraPermission} from 'react-native-vision-camera';
import {launchImageLibrary} from 'react-native-image-picker';
import {colors} from '@/theme';
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
  }, [hasPermission, device]);

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
      // TODO: 추후 food_name을 유저에게 물어보는 UI가 필요할 수 있음
      // 현재 MVP에서는 AI가 추론하거나 더미 텍스트로 넘김
      const foodName = 'food'; 
      
      const response = await generatePost(
        {uri, type, name},
        foodName,
      );

      if (response.success && response.data) {
        navigation.replace('AnalysisResult', {
          result: response.data,
          imageUri: uri,
        });
      } else {
        Alert.alert('분석 실패', response.message || 'AI 분석에 실패했습니다.');
      }
    } catch (error: any) {
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
            <ActivityIndicator size="small" color="#FFFFFF" style={{marginRight: 6}} />
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
        <TouchableOpacity style={styles.sideButton} onPress={handleGallery} disabled={isAnalyzing}>
          <Text style={styles.sideButtonIcon}>🖼️</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.shutterContainer, isAnalyzing && {opacity: 0.5}]} 
          onPress={handleCapture}
          disabled={isAnalyzing}>
          <View style={styles.shutterButton} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideButton} disabled={isAnalyzing}>
          <Text style={styles.sideButtonIcon}>🔄</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 24,
  },
  galleryFallbackButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  galleryFallbackText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  // 헤더
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 22,
    color: '#FFFFFF',
  },
  statusBadge: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  // 카메라 뷰
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 260,
    height: 260,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(52,211,153,0.3)',
    borderRadius: 24,
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: colors.success, // #22C55E
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 24,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 24,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 24,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 24,
  },
  scanLine: {
    width: '100%',
    height: 2,
    backgroundColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  // 하단 컨트롤
  controls: {
    height: 160,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 20,
  },
  sideButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideButtonIcon: {
    fontSize: 20,
  },
  shutterContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
  },
});

export default CameraScanScreen;
