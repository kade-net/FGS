import { Lama, LamaReader } from "lama"
import { ACCEPT_INVITE_EVENT, CHANGE_ACTIVE_NODE, INVITE_EVENT, MESSAGE_EVENT, REJECT_INVITE_EVENT } from "schema"

type OPTIONS = {
    message_event: MESSAGE_EVENT,
    invite_event: INVITE_EVENT,
    accept_invite_event: ACCEPT_INVITE_EVENT,
    reject_invite_event: REJECT_INVITE_EVENT,
    change_active_node_event: CHANGE_ACTIVE_NODE
}

type K = "message_event" | "invite_event" | "accept_invite_event" | "reject_invite_event" | "change_active_node_event"


export class LocalSerialStore {

    db: Lama

    constructor(db: Lama) {
        this.db = db
    }

    static async init(path?: string) {
        let db = await Lama.init("local-serial-store", path ?? "./db/local-serial")

        return new LocalSerialStore(db)
    }

    async put<G extends K>(value: OPTIONS[G] & { type: G }) {
        let sequence_number = Date.now().toString()
        return this.db.put(sequence_number, value)
    }

    async get<G extends K>(key: string) {
        return await this.db.get(key) as OPTIONS[G]
    }

    async processForPipeline(processor: <T extends K>(processor: { key: T, value: OPTIONS[T] & { type: T } }) => Promise<void>, lastKey?: string) {
        const reader = new LamaReader(
            this.db.db,
            lastKey
        )

        await reader.dataRead(processor)

    }
}
