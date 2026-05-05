/* eslint-env jest */

require('react-native-gesture-handler/jestSetup');

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-geolocation-service', () => ({
  getCurrentPosition: jest.fn(),
  requestAuthorization: jest.fn(),
}));

jest.mock('@react-native-firebase/messaging', () => () => ({
  requestPermission: jest.fn(),
  registerDeviceForRemoteMessages: jest.fn(),
  getToken: jest.fn(),
}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));

jest.mock('react-native-vision-camera', () => {
  const React = require('react');
  const {View} = require('react-native');

  return {
    Camera: React.forwardRef((props, ref) =>
      React.createElement(View, {...props, ref}),
    ),
    useCameraDevice: jest.fn(() => ({id: 'back-camera'})),
    useCameraPermission: jest.fn(() => ({
      hasPermission: true,
      requestPermission: jest.fn(),
    })),
  };
});

jest.mock('react-native-maps', () => {
  const React = require('react');
  const {View} = require('react-native');
  const MockMapView = React.forwardRef((props, ref) =>
    React.createElement(View, {...props, ref}),
  );

  return {
    __esModule: true,
    default: MockMapView,
    Marker: props => React.createElement(View, props),
    Circle: props => React.createElement(View, props),
    PROVIDER_DEFAULT: 'default',
  };
});
