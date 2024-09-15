import 'dotenv/config'
// TODO: add register functionality
import {contract, aptos} from "contract";
import {Ed25519PrivateKey} from "@aptos-labs/ts-sdk";
import config from "./index";
import nacl from "tweetnacl";

const signerKeys = nacl.sign.keyPair()
const encryptionKeys = nacl.box.keyPair()

console.log("Signer Secret Key ::", Buffer.from(signerKeys.secretKey).toString("hex"));
console.log("Signer Public Key ::", Buffer.from(signerKeys.publicKey).toString("hex"));

console.log("Encryption Secret Key ::", Buffer.from(encryptionKeys.secretKey).toString("hex"));
console.log("Encryption Public Key ::", Buffer.from(encryptionKeys.publicKey).toString("hex"));

// const account = await aptos.deriveAccountFromPrivateKey({
//     privateKey: new Ed25519PrivateKey(Buffer.from(process.env.CONFIG_APTOS_PRIVATE_KEY!?.replace('0x',''), 'hex'))
// })
//
// await contract.registerNamespace(account, {
//     namespace: process.env.CONFIG_NAMESPACE!,
//     encrypt_public_key: Buffer.from(config.config.boxKeyPairDoNotExpose.publicKey).toString('hex'),
//     endpoint: config.config.rootDomain,
//     sign_public_key: Buffer.from(config.config.signKeyPairDoNotExpose.publicKey).toString('hex'),
// })