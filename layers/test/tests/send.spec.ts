import 'dotenv/config'
import crypto from 'crypto';
import {Account, Ed25519PrivateKey} from "@aptos-labs/ts-sdk";
import nacl, {BoxKeyPair, SignKeyPair} from "tweetnacl";
import nacl_util from 'tweetnacl-util'
import {aptos} from "contract";
import {INVITATION, validator} from "validation";
import {getClient} from "client";

interface UserAccount {
    account: Account
    signer_key_pair: SignKeyPair
    encrypt_key_pair: BoxKeyPair
}

async function generateUserAccount (args: {
    aptos_private_key: string
    signer: string,
    encryption_key: string,
}) {

    const account = await aptos.deriveAccountFromPrivateKey({
        privateKey: new Ed25519PrivateKey(Buffer.from(args.aptos_private_key?.replace('0x', ''), 'hex'))
    })

    const skp = nacl.sign.keyPair.fromSecretKey(Buffer.from(args.signer, 'hex'))
    const ekp = nacl.box.keyPair.fromSecretKey(Buffer.from(args.encryption_key, 'hex').subarray(0,32))

    return {
        account,
        encrypt_key_pair: ekp,
        signer_key_pair: skp
    } satisfies UserAccount
}

const alice = await generateUserAccount({
    signer: '8cfc82f0ad4cad0b299f31ac207f04e539adc6cac6a026098a273ec3e7f5ece17a83e81cf028d0b09e51e435147af9599a94c5f34d7eca9389922da94dd884fb',
    encryption_key: 'fe7c23cb69d4f24b5e7c96db047b676ba8373c55e7c624b04123ead801f1ab6270df5b0216632dc8cbb349c660dee42d90a64ff0022f92d439c2af7f20aea6cb',
    aptos_private_key: '0xe8fe155bf93952cf6b787d120362aed690f17564dba0d68724da6960da856a20'
})

const bob = await generateUserAccount({
    signer: '18e894d4279e587bc524aa41ab18be8c861701bec7b5078cbfbd5d0125b171baea28e95a4dcf47e09aff3aba841daee068614cf1ba6c6695ed4babec5c80b37d',
    encryption_key: '7a1271e8954a0a57f30cf12ba3ff84ee17c82d2eb885aa237baa2de38d2d9ad1b29de0b11baa0faf3c8d81365e78428b57d0f7e71b69da835986a4548f1224a3',
    aptos_private_key: '0xa1a70f9dc2a1b7ac30d9a05ab2fe3e01b68220810b774613cc7910ada2b00f06'
})

const clara = await generateUserAccount({
    signer: '18eecc492d2ea2d9e2243e58ee161d96edf5849b3ac4d0ff0c57b5e4692ac92a0b63c9406070fbff5431303603efc7d17e690777ab4876e519d4598076d3ba13',
    encryption_key: 'ba99cd44424d28d0ff9c3ceaefd903f7817bcc800a59d465c18b8daad90817314d6fdc28202dea7c0479209ae0490a6427ab5b7803aaa12a1391745fd6f23bd9',
    aptos_private_key: '0xbef260463579e7b5dbf09316763a7678772177c84af7cefb783052a6c16b4994'
})

const alice_bob = nacl.box.before(bob.encrypt_key_pair.publicKey, alice.encrypt_key_pair.secretKey)
const alice_clara = nacl.box.before(clara.encrypt_key_pair.publicKey, alice.encrypt_key_pair.secretKey)

const bob_clara = nacl.box.before(clara.encrypt_key_pair.publicKey, bob.encrypt_key_pair.secretKey)

const generateConversationRequest = (args: {
    originator: string,
    conversation_id?: string,
    conversation_key?: string,
}) => {
    const id = args.conversation_id ?? crypto.randomBytes(16).toString('hex')
    const key = args.conversation_key ?? crypto.randomBytes(32).toString('hex')
    return (
        "FGS CONVERSATION INVITE\n"+
        `ORIGINATOR: ${args.originator}\n`+
        `CONVERSATION_ID: ${id}\n`+
        `CONVERSATION_KEY: ${key}\n`
    )
}


const mainClient = getClient("http://localhost:4000")

describe("FGS MESSAGE DELIVERY", () => {

    it('send conversation invites', async ()=>{

        console.log("Alice ::", Buffer.from(alice.signer_key_pair.publicKey).toString('hex'))
        const conversation_request = generateConversationRequest({
            originator: alice.account.accountAddress.toString()
        })

        const nonce = nacl.randomBytes(nacl.box.nonceLength)
        const encrypted_request = nacl.secretbox(Buffer.from(conversation_request, 'utf-8'), nonce, alice_bob)

        const invitation: Omit<INVITATION, 'id' | 'type'> = {
            to: bob.account.accountAddress.toString(),
            from: alice.account.accountAddress.toString(),
            published: Date.now(),
            encrypted_conversation_id: Buffer.from(encrypted_request).toString('hex')
        }
        const MESSAGE = nacl_util.decodeUTF8(JSON.stringify(invitation))
        const signature = nacl.sign.detached(
            MESSAGE,
            alice.signer_key_pair.secretKey
        )

        console.log(Buffer.from(MESSAGE).toString('hex'))

        const valid = await validator.verifySignedActivity({
            activity: invitation,
            type: 'user',
            signature: Buffer.from(signature).toString('base64'),
            identity: alice.account.accountAddress.toString(),
        })

        console.log("Valid:: ", valid)

        const ack = await mainClient.submitSignedActivity({
            input: {
                type: 'user',
                signature: Buffer.from(signature).toString('base64'),
                identity: alice.account.accountAddress.toString(),
                activity: {
                    invitation
                }
            }
        })


        console.log("Acknowledgement::", ack.submitSignedActivity)


    })

})