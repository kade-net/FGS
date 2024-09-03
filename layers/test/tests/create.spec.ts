import 'dotenv/config'
import nacl from 'tweetnacl'
import {Account} from "@aptos-labs/ts-sdk";
import {serde} from "validation";
import {aptos, contract} from "contract";
import {getClient} from "@kade-net/fgs-node-client";


describe("FGS PARTICIPANT REGISTRATION", ()=> {

    it('registers and send first message', async ()=> {

        const account = Account.generate()
        await aptos.faucet.fundAccount({
            accountAddress: account.accountAddress,
            amount: 1 * 10**8
        })
        const signing_key = nacl.sign.keyPair()
        const encryption_key = nacl.sign.keyPair()

        console.log("Encryption key:", encryption_key.secretKey.length)
        console.log("Hex ::", Buffer.from(encryption_key.secretKey).toString('hex'))
        console.log("Hex ::", Buffer.from(encryption_key.secretKey).toString('hex').length)

        const rand_auth = serde.generate_random_auth_string({
            inbox_owner: account.accountAddress.toString(),
        })

        const serialized_keys = serde.generate_serialized_key_set({
            signing_key: Buffer.from(signing_key.secretKey).toString('hex'),
            encryption_key: Buffer.from(encryption_key.secretKey).toString('hex'),
        })

        const secret_signature = account.sign(Buffer.from(rand_auth, 'utf-8')).toUint8Array().slice(0,32)

        console.log(secret_signature.length + 1)

        const nonce = nacl.randomBytes(nacl.secretbox.nonceLength)
        const encrypted_key_set = nacl.secretbox(Buffer.from(serialized_keys, 'utf-8'), nonce, secret_signature)

        const combined = new Uint8Array(nonce.length + encrypted_key_set.length)
        combined.set(nonce)
        combined.set(encrypted_key_set, nonce.length)

        const serialized = Buffer.from(serialized_keys).toString('hex')


        console.log("ACCOUNT ::", account.privateKey.toString(), "\n\n")
        console.log("RAND AUTH ::", rand_auth, "\n\n")
        console.log("SERIALIZED_KEYS ::", serialized_keys, "\n\n")
        console.log("Encrypted Keys ::", Buffer.from(combined).toString('hex'), "\n\n")


        // await contract.registerUser(
        //     account,
        //     {
        //         node: 'test',
        //         encrypt_public_key: Buffer.from(encryption_key.publicKey).toString('hex'),
        //         sign_public_key: Buffer.from(signing_key.publicKey).toString('hex'),
        //         randAuthString: rand_auth,
        //         encrypted_private_key_set: Buffer.from(combined).toString('hex'),
        //     }
        // )



    })
})