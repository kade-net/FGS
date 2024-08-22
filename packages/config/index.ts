import { ConfigProvider } from "./provider";
import { Network } from "./types";

const config = await ConfigProvider.init({
    namespace: process.env.CONFIG_NAMESPACE!,
    rootDomain: process.env.CONFIG_ROOT_DOMAIN!,
    aptosPrivateKeyDoNotExpose: process.env.CONFIG_APTOS_PRIVATE_KEY!,
    keypairDoNotExpose: {
        publicKey: Buffer.from(process.env.CONFIG_PUBLIC_KEY!, 'hex'),
        secretKey: Buffer.from(process.env.CONFIG_SECRET_KEY!, 'hex')
    },
    network: process.env.CONFIG_NETWORK as Network,
    transactionHash: process.env.CONFIG_TRANSACTION_HASH!
})

export default config;