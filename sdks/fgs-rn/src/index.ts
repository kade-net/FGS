import 'react-native-get-random-values'
import {Buffer} from 'buffer'
import { requireNativeModule } from 'expo-modules-core'
import { FGSRNModule } from './FgsRn.types'
// @ts-expect-error - already defined
global.Buffer = Buffer
export * from '../lib/client'
export * from '../lib/contract'
export * from '../lib/serde'
export * from '../lib/function'
export default requireNativeModule<FGSRNModule>('FgsRn');