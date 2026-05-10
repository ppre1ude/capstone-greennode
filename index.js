/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { registerBackgroundNotificationHandler } from './src/services/notifications';

registerBackgroundNotificationHandler();
AppRegistry.registerComponent(appName, () => App);
