import { requireNativeModule } from 'expo-modules-core';
import { FGSRNModule } from './FgsRn.types';

// It loads the native module object from the JSI or falls back to
// the bridge module (from NativeModulesProxy) if the remote debugger is on.
export default requireNativeModule<FGSRNModule>('FgsRn');
