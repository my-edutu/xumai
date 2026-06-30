// Shim for missing exports in react-native-web that some expo-modules expect
import { Alert } from 'react-native-web';

export * from 'react-native-web';

export default {
    Alert,
};

export const TurboModuleRegistry = {
    get: () => null,
    getEnforcing: () => null,
};

export const NativeModules = {};
