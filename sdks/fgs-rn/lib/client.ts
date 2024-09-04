import { Buffer } from 'buffer';
import { getInbox, getNode } from "./function";
import { FGS_NODE, INBOX } from "./contract";
import nacl, { BoxKeyPair, SignKeyPair } from "tweetnacl";
import nacl_util from 'tweetnacl-util'
import {
    CONVERSATION_DELIMITER,
    CONVERSATION_HEADER,
    deserialize_conversation_header,
    deserialize_serialized_key_set, deserializeMessage, generate_conversation_header,
    generate_random_auth_string,
    generate_serialized_key_set, MESSAGE, serializeMessage
} from "./serde";
import { AcceptInput, getClient, InvitationInput, MessageInput, RejectInput, SignedActivityInput, Invite_Type } from "@kade-net/fgs-node-client";
import {requireNativeModule} from "expo-modules-core";
import {FGSRNModule} from "../src/FgsRn.types";
const fgsRnModule = requireNativeModule<FGSRNModule>('FgsRn');

interface ClientInitOptions {
    inbox_address: string
    secret_signature: string
}

interface getAuthArgs {
    inbox: string
}

interface getNewAccountInboxArgs {
    address: string
    secret_signature: string
    node: string
    random_auth_string: string
}

export class Client {
    owner: string
    onChainInbox: INBOX
    onChainNode: FGS_NODE
    conversationList: Array<CONVERSATION_HEADER>
    encryptionKeyPair: BoxKeyPair
    signKeyPair: BoxKeyPair
    private secretSignature: string
    nodeClient: ReturnType<typeof getClient>

    constructor(onChainInbox: INBOX, onChainNode: FGS_NODE, box: BoxKeyPair, sign: SignKeyPair, secretSignature: string, conversationList: Array<CONVERSATION_HEADER>, owner: string) {
        this.onChainNode = onChainNode
        this.onChainInbox = onChainInbox
        this.secretSignature = secretSignature
        this.conversationList = conversationList
        this.encryptionKeyPair = box
        this.signKeyPair = sign
        this.owner = owner
        this.nodeClient = getClient(onChainNode.protocol_endpoint)
    }

    static async getAuthString(address: string) {
        const inbox = await getInbox(address)
        return inbox.rand_auth_string
    }

    static async init(options: ClientInitOptions) {

        const inbox = await getInbox(options.inbox_address)
        const node = await getNode(inbox.current_node)


        const key_set_serialized = Buffer.from(inbox.encrypted_private_key_set, 'hex')
        const nonce = key_set_serialized.subarray(0, nacl.secretbox.nonceLength)
        const keys = key_set_serialized.subarray(nacl.secretbox.nonceLength)

        const unencrypted = nacl.secretbox.open(keys, nonce, Buffer.from(options.secret_signature, 'hex').slice(0,32))

        if (!unencrypted) {
            throw new Error("Unencrypted encryption key")
        }

        const keyData = deserialize_serialized_key_set(Buffer.from(unencrypted).toString('utf-8'))

        const boxKey = nacl.box.keyPair.fromSecretKey(
            Buffer.from(keyData.encryption_key, 'hex').subarray(0, 32)
        )

        const signKey = nacl.sign.keyPair.fromSecretKey(
            Buffer.from(keyData.signing_key, 'hex')
        )

        if(inbox.encrypted_conversation_list?.trim()?.length == 0){

            return new Client(
                inbox,
                node,
                boxKey,
                signKey,
                options.secret_signature,
                [],
                options.inbox_address
            )
        }

        const conversationList = Buffer.from(
            inbox.encrypted_conversation_list,
            'hex'
        )

        const nonceData = conversationList.subarray(0, nacl.secretbox.nonceLength)
        const list = conversationList.subarray(nacl.secretbox.nonceLength)

        const unencryptedConversationList = nacl.secretbox.open(list, nonceData, boxKey.secretKey)


        const convList = !unencryptedConversationList ? "" : Buffer.from(unencryptedConversationList).toString('utf-8')

        const conversations = convList.split(
            CONVERSATION_DELIMITER // TODO: document this
        )?.filter(c => (c?.trim()?.length ?? 0) > 0  )?.map(c => deserialize_conversation_header(c))

        return new Client(
            inbox,
            node,
            boxKey,
            signKey,
            options.secret_signature,
            conversations,
            options.inbox_address
        )
    }

    static async getNewAccountAuthString(address: string) {
        return generate_random_auth_string({
            inbox_owner: address
        })
    }

    static async getNewAccountInbox(args: getNewAccountInboxArgs) {

        const box = nacl.box.keyPair()
        const sign = nacl.sign.keyPair()

        const serialized_key_set = generate_serialized_key_set({
            signing_key: Buffer.from(sign.secretKey).toString('hex'),
            encryption_key: Buffer.from(box.secretKey).toString('hex')
        })

        const nonce = nacl.randomBytes(nacl.secretbox.nonceLength)

        const encrypted_key_set = nacl.secretbox(
            Buffer.from(serialized_key_set, 'utf-8'),
            nonce,
            box.secretKey
        )

        const combined = new Uint8Array(nonce.length + encrypted_key_set.length)
        combined.set(nonce)
        combined.set(encrypted_key_set, nonce.length)


        return {
            encrypted_conversation_list: "",
            encrypted_private_key_set: Buffer.from(combined).toString('hex'),
            rand_auth_string: args.random_auth_string,
            encrypt_public_key: Buffer.from(box.publicKey).toString('hex'),
            current_node: args.node,
            sign_public_key: Buffer.from(sign.publicKey).toString('hex'),
            prev_nodes: []
        } as Omit<INBOX, 'timestamp'>

    }

    async conversation(conversation_id: string) {

        const conversation_header = this.conversationList.find(c => c.conversation_id == conversation_id)
        if (!conversation_header) {
            return null
        }

        const nodes = await Promise.all(conversation_header.participants?.map(async (p) => {
            const inbox = await getInbox(p)

            return inbox.current_node
        }))

        return new Conversation(
            conversation_header,
            this,
            nodes,
            getClient(this.onChainNode.protocol_endpoint)
        )
    }

    async loadInvites(type?: Invite_Type){
        const invitesResponse = await this.nodeClient.getInvitations({
            address: this.owner,
            type
        })

        return invitesResponse?.invitations
    }

    async getNewEncryptedConversationList(new_conversation_header: string){

        const headerList = this.conversationList.map(c => generate_conversation_header({
            participants: c.participants,
            conversation_id: c.conversation_id,
            secret_key: c.conversation_key,
            originator: c.originator
        })).join(CONVERSATION_DELIMITER)

        const newConversationList = headerList + CONVERSATION_DELIMITER + new_conversation_header

        const nonce = nacl.randomBytes(nacl.secretbox.nonceLength)
        const encryptedList = nacl.secretbox(
            Buffer.from(newConversationList, 'utf-8'),
            nonce,
            this.encryptionKeyPair.secretKey
        )

        const combined = new Uint8Array(nonce.length + encryptedList.length)
        combined.set(nonce)
        combined.set(encryptedList)

        return Buffer.from(combined).toString('hex')

    }


}

export class Conversation {
    header: CONVERSATION_HEADER
    client: Client
    nodes: string[]
    nodeClient: ReturnType<typeof getClient>

    // TODO: add support for a local cache provider with a predefined interface that can get passed in by the owner caller of the load conversations function
    constructor(header: CONVERSATION_HEADER, client: Client, nodes: string[], nodeClient: ReturnType<typeof getClient>) {
        this.header = header
        this.client = client
        this.nodes = nodes
        this.nodeClient = nodeClient
    }


    async loadConversation() {

        const history = await this.nodeClient.getConversation({
            conversation_id: this.header.conversation_id!
        })

        const decryptedMessages = (await Promise.all(history.conversation?.messages!?.map(async (_message) => {
            const decrypted = await fgsRnModule.AEAD_Decrypt(
                this.header.conversation_key,
                _message?.encrypted_content ?? '',
                Buffer.from(new Uint8Array()).toString('hex')
            )

            return deserializeMessage((decrypted as any)?.plaintext ?? decrypted ?? "")

        })))?.filter(a => a !== null)

        // TODO: interact with local cache for storage

        return decryptedMessages

    }

    async encryptFile(file_url: string) {
        const new_url: string = await fgsRnModule.EncryptFile(
            this.header.conversation_key,
            file_url,
        )

        return new_url
    }

    async decryptFile(file_url: string) {
        const new_url = await fgsRnModule.DecryptFile(this.header.conversation_key, file_url)
        return new_url
    }

    async sendMessage(message: Omit<MESSAGE, 'originator' | 'id' | 'timestamp' | 'random_delimiter'>) {

        const serializedMessage = serializeMessage({
            message: {
                ...message,
                originator: this.client.owner,

            }
        })

        const encryptedMessageContent = await fgsRnModule.AEAD_Encrypt(
            this.header.conversation_key,
            serializedMessage,
            Buffer.from(new Uint8Array()).toString('hex')
        )

        const messageInput: MessageInput = {
            conversation_id: this.header.conversation_id,
            encrypted_content: encryptedMessageContent,
            published: Date.now(),
            nodes: this.nodes,
        }

        const signature = nacl.sign.detached(
            nacl_util.decodeUTF8(JSON.stringify(messageInput)),
            this.client.signKeyPair.secretKey
        )

        const ack = await this.nodeClient.submitSignedActivity({
            input: {
                type: 'user',
                identity: this.client.owner,
                signature: Buffer.from(signature).toString('base64'),
                activity: {
                    message: messageInput
                }
            }
        })


        return ack

    }


    static async createConversation(client: Client, args: { participants: Array<string> }) {

        const participantInboxes = await Promise.all(
            args.participants.map(async (participant) => {
                const inbox = await getInbox(participant)

                return {
                    inbox,
                    address: participant
                }
            })
        )

        const conversation_header = generate_conversation_header({
            participants: args.participants,
            originator: client.owner,
            originator_node: client.onChainInbox.current_node
        })

        for (const participant of participantInboxes) {

            const sharedSecret = nacl.box.before(
                Buffer.from(participant.inbox.encrypt_public_key, 'hex'),
                client.encryptionKeyPair.secretKey.subarray(0,32)
            )

            const nonce = nacl.randomBytes(nacl.secretbox.nonceLength)

            const encryptedConversation = nacl.secretbox(
                Buffer.from(conversation_header, 'utf-8'),
                nonce,
                sharedSecret
            )

            const combined = new Uint8Array(nacl.secretbox.nonceLength + encryptedConversation.length)
            combined.set(nonce)
            combined.set(encryptedConversation,nacl.secretbox.nonceLength)


            const invitation: InvitationInput = {
                to: participant.address,
                from: client.owner,
                published: Date.now(),
                encrypted_conversation_id: Buffer.from(combined).toString('hex')
            }

            const signature = nacl.sign.detached(
                nacl_util.decodeUTF8(JSON.stringify(invitation)),
                client.signKeyPair.secretKey
            )

            const node = await getNode(participant.inbox.current_node)
            const nodeClient = getClient(node.protocol_endpoint)

            const ack = await nodeClient.submitSignedActivity({
                input: {
                    type: 'user',
                    signature: Buffer.from(signature).toString('base64'),
                    identity: client.owner,
                    activity: {
                        invitation
                    }
                }
            })

        }

        const nonce = nacl.randomBytes(nacl.secretbox.nonceLength)
        const prevConversationList = client.conversationList?.map(c=>generate_conversation_header({
            participants: c.participants,
            originator: c.originator,
            conversation_id: c.conversation_id,
            secret_key: c.conversation_key
        }))?.join(CONVERSATION_DELIMITER)

        const newConversationList = prevConversationList + CONVERSATION_DELIMITER + conversation_header

        const encryptedConversationList = nacl.secretbox(Buffer.from(newConversationList, 'utf-8'), nonce, client.encryptionKeyPair.secretKey)
        const combined = new Uint8Array(nonce.length + encryptedConversationList.length)

        combined.set(nonce)
        combined.set(encryptedConversationList, nonce.length)

        // !!! USER WILL NEED TO SUBMIT THIS ON-CHAIN
        return Buffer.from(combined).toString('hex')

    }


    static async acceptInvite(client: Client, args: { invitation_id: string }) {

        const invitation = await client.nodeClient.getInvitation({
            invitation_id: args.invitation_id
        })

        const initiator = await getInbox(invitation.invitation.from)

        const combinedEncryptedConversationId = Buffer.from(invitation.invitation.encrypted_conversation_id, 'hex')

        const shared_secret = nacl.box.before(
            Buffer.from(initiator.encrypt_public_key, 'hex'),
            client.encryptionKeyPair.secretKey.subarray(0,32)
        )


        const nonce = combinedEncryptedConversationId.subarray(0, nacl.secretbox.nonceLength)
        const data = combinedEncryptedConversationId.subarray(nacl.secretbox.nonceLength)

        const decrypted = nacl.secretbox.open(
            data,
            nonce,
            shared_secret
        )

        if(!decrypted){
            throw new Error("No conversation header found")
        }

        const serialized_conversation_header = Buffer.from(decrypted).toString('utf-8')

        const confirmation: AcceptInput = {
            to: invitation.invitation.from,
            from: client.owner,
            invitation: args.invitation_id,
            published: Date.now()
        }

        const signature = nacl.sign.detached(
            nacl_util.decodeUTF8(JSON.stringify(confirmation)),
            client.signKeyPair.secretKey
        )

        const ack = await getClient(client.onChainNode.protocol_endpoint).submitSignedActivity({
            input: {
                type: 'user',
                signature: Buffer.from(signature).toString('base64'),
                identity: client.owner,
                activity: {
                    accept: confirmation
                },
            }
        })

        return serialized_conversation_header
    }

    static async rejectInvite(client: Client, args: { invitation_id: string }) {

        const invitation = await client.nodeClient.getInvitation({
            invitation_id: args.invitation_id
        })
        const initiator = await getInbox(invitation.invitation.from)

        const rejection: RejectInput = {
            to: invitation.invitation.from,
            from: client.owner,
            invitation: args.invitation_id,
            published: Date.now()
        }

        const signature = nacl.sign.detached(
            nacl_util.decodeUTF8(JSON.stringify(rejection)),
            client.signKeyPair.secretKey
        )

        const ack = await getClient(client.onChainNode.protocol_endpoint).submitSignedActivity({
            input: {
                type: 'user',
                signature: Buffer.from(signature).toString('base64'),
                identity: client.owner,
                activity: {
                    reject: rejection
                },
            }
        })

        return ack

    }

}