import { BoxKeyPair } from 'tweetnacl-ts'

export enum Network {
    Mainnet = 'mainnet',
    Testnet = 'testnet'
}

export interface Config {
    // the namespace of the current node
    namespace: string
    // root domain of the current node
    rootDomain: string
    // the keypair of the current node to be used for encryption and signing of messages during inter-node communication
    keypairDoNotExpose: BoxKeyPair
    // aptos private key to be used when submitting transactions to the blockchain
    aptosPrivateKeyDoNotExpose: string
    // aptos network to be used
    network: Network
    // creation transaction hash
    transactionHash?: string
}