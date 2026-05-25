import React, { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export const renderWithSafeArea = (
  children: ReactElement,
  bottomInset = 0,
) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: {
        top: 0,
        right: 0,
        bottom: bottomInset,
        left: 0,
      },
    }}>
    {children}
  </SafeAreaProvider>
);
