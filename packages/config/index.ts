import 'dotenv/config'
import { ConfigProvider } from "./provider";
import { Network } from "./types";
import nacl from 'tweetnacl'


const config = await ConfigProvider.init({
    namespace: process.env.CONFIG_NAMESPACE!,
    rootDomain: process.env.CONFIG_ROOT_DOMAIN!,
    aptosPrivateKeyDoNotExpose: process.env.CONFIG_APTOS_PRIVATE_KEY!,
    boxKeyPairDoNotExpose: nacl.box.keyPair.fromSecretKey(Buffer.from(process.env.ENCRYPTION_SECRET_KEY_DO_NOT_EXPOSE!, 'hex')),
    signKeyPairDoNotExpose: nacl.sign.keyPair.fromSecretKey(Buffer.from(process.env.SIGNING_SECRET_KEY_DO_NOT_EXPOSE!, 'hex')),
    network: process.env.CONFIG_NETWORK as Network,
    transactionHash: process.env.CONFIG_TRANSACTION_HASH!
})

export default config;