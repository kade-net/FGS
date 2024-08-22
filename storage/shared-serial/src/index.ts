import { Lama, LamaReader } from 'lama'
import { ACCEPT_INVITE_TO_CONVERSATION, CHANGE_ACTIVE_NODE, CONVERSATION_MARKER, INVITE_TO_CONVERSATION, NODE_UPDATE, REGISTER_INBOX, REJECT_INVITE_TO_CONVERSATION } from 'schema'
type T = ACCEPT_INVITE_TO_CONVERSATION | CHANGE_ACTIVE_NODE | CONVERSATION_MARKER | INVITE_TO_CONVERSATION | NODE_UPDATE | REGISTER_INBOX | REJECT_INVITE_TO_CONVERSATION


export type DATA = {
    accept_invite_to_conversation: ACCEPT_INVITE_TO_CONVERSATION,
    change_active_node: CHANGE_ACTIVE_NODE,
    conversation_marker: CONVERSATION_MARKER,
    invite_to_conversation: INVITE_TO_CONVERSATION,
    node_update: NODE_UPDATE,
    register_inbox: REGISTER_INBOX,
    reject_invite_to_conversation: REJECT_INVITE_TO_CONVERSATION
}

export type K = "accept_invite_to_conversation"
    | "change_active_node"
    | "conversation_marker"
    | "invite_to_conversation"
    | "node_update"
    | "register_inbox"
    | "reject_invite_to_conversation"


export class SerialStorage {
    lm: Lama
    constructor(lm: Lama) {
        this.lm = lm
    }


    static async init(path?: string) {
        let lm = await Lama.init("serial-store", path ?? "./db/serial-store")

        return new SerialStorage(lm)
    }


    async put<G extends K>(value: DATA[G] & { type: G }) {
        let sequence_number = Date.now().toString()
        return this.lm.put(sequence_number, value)
    }

    async get<G extends K>(key: string) {
        return await this.lm.get(key) as DATA[G]
    }


    async processForPipeline(processor: <T extends K>(processor: { key: T, value: DATA[T] & { type: T } }) => Promise<void>, lastKey?: string) {
        const reader = new LamaReader(
            this.lm.db,
            lastKey
        )

        await reader.dataRead(processor)

    }


}