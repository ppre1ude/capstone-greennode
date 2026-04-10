import React, { useState } from 'react';
import { StatusBar, StyleSheet, useColorScheme, SafeAreaView, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import htmlBundle from './htmlBundle';

type ScreenName = keyof typeof htmlBundle;

// 사용자가 요청한 주요 흐름 화면들
const SCREEN_FLOW: ScreenName[] = [
  'screen-onboarding',
  'screen-login',
  'screen-home',
  'screen-map',
  'screen-scan',
  'screen-scan2',
];

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('screen-onboarding');

  // 와이어프레임 내 기본 여백, 스크롤바 등 간섭을 최소화하는 CSS 주입
  const injectedJS = `
    const meta = document.createElement('meta');
    meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
    meta.setAttribute('name', 'viewport');
    document.getElementsByTagName('head')[0].appendChild(meta);
    true;
  `;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <WebView
        key={currentScreen}
        originWhitelist={['*']}
        source={{ html: htmlBundle[currentScreen] || '<h1>404 Not Found</h1>' }}
        style={styles.webview}
        injectedJavaScript={injectedJS}
        bounces={false}
      />

      {/* 하단 네비게이션 바 */}
      <View style={styles.navContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          {SCREEN_FLOW.map((screen) => (
            <TouchableOpacity 
              key={screen} 
              style={[
                styles.navButton, 
                currentScreen === screen && styles.navButtonActive
              ]}
              onPress={() => setCurrentScreen(screen)}
            >
              <Text style={[
                styles.navText,
                currentScreen === screen && styles.navTextActive
              ]}>
                {screen.replace('screen-', '')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  navContainer: {
    height: 60,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    justifyContent: 'center',
  },
  scrollContainer: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  navButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    marginHorizontal: 4,
  },
  navButtonActive: {
    backgroundColor: '#1E623B',
  },
  navText: {
    color: '#495057',
    fontWeight: '600',
    fontSize: 14,
  },
  navTextActive: {
    color: '#ffffff',
  },
});

export default App;
