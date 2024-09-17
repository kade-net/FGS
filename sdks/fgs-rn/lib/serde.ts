import nacl from 'tweetnacl'
import {Buffer} from 'buffer'

export const CONVERSATION_DELIMITER = "\n---\n" as const;
interface generate_random_auth_string_args {
    timestamp?: number
    rand?: string
    inbox_owner: string
}

export function generate_random_auth_string(args: generate_random_auth_string_args) {
    const random_string = args.rand ?? Buffer.from(nacl.randomBytes(16)).toString('hex')

    return (
        "FGS SECRET SIGNATURE REQUEST\n" +
        "\n" +
        "SIGNING THIS TEXT GENERATES A SECRET THAT WILL ENABLE THIS APP\n"+
        "TO ENCRYPT AND DECRYPT MESSAGES ON YOUR BEHALF.\n" +
        "\n" +
        "ONLY PROCEED IF YOU UNDERSTAND WHAT THIS AUTHORIZATION MEANS!\n" +
        "\n" +
        "----\n" +
        "RAND: " + random_string + "\n" +
        "IDENTITY REGISTRATION TIMESTAMP: "+ (args.timestamp ?? Date.now()) + "\n" +
        "INBOX OWNER: "+ args.inbox_owner + "\n" +
        "---"
    )
}

interface key_set_args {
    signing_key: string
    encryption_key: string
}
export function generate_serialized_key_set(args: key_set_args) {
    return (
        "FGS SECRET KEYS\n"+
        "SIGNING_KEY::"+ args.signing_key + "\n" +
        "ENCRYPTION_KEY::" + args.encryption_key + "\n"
    )
}

export function deserialize_serialized_key_set(serialized: string) {
    const [_, signer, encryption] = serialized.split("\n")
    const signing_key = signer.trim().replace("SIGNING_KEY::", "").trim()
    const encryption_key = encryption.trim().replace("ENCRYPTION_KEY::", "").trim()

    return {
        signing_key,
        encryption_key,
    }
}

interface generate_conversation_header_args {
    originator: string
    participants: string[]
    originator_node?: string
    conversation_id?: string
    secret_key?: string
}
export function generate_conversation_header(args: generate_conversation_header_args){
    const randomInviteId = args?.conversation_id ?? `fgs://${args.originator_node}:conversation:` + Buffer.from(nacl.randomBytes(16)).toString('hex')
    const randomSenderKey = args?.secret_key ??  Buffer.from(nacl.randomBytes(32)).toString('hex')

    return (
        "FGS CONVERSATION\n" +
            `ORIGINATOR::${args.originator}\n` +
            `PARTICIPANTS::${args.participants.join(",")}\n` +
            `CONVERSATION_ID::${randomInviteId}\n` +
            `CONVERSATION_KEY::${randomSenderKey}\n`
    )

}


export interface CONVERSATION_HEADER {
    originator: string
    participants: string[]
    conversation_id: string,
    conversation_key: string,
}

export function deserialize_conversation_header(conversation_header: string) {

    const [
        _,
        originator,
        participants,
        conversation_id,
        conversation_key
    ] = conversation_header.split("\n")

    return {
        originator: originator.split("::")?.at(1)!,
        participants: participants.split("::")?.at(1)?.split(",")!,
        conversation_id: conversation_id.split("::")?.at(1)!,
        conversation_key: conversation_key.split("::")?.at(1)!,
    } as CONVERSATION_HEADER
}

export function generateFGSGId(args: {node: string, type: 'inbox' | 'conversation', id?: string } ){

    const id = args?.id ?? Buffer.from(nacl.randomBytes(16)).toString('hex')

    return `fgs://${args.node}:${args.type}:${id}`
}

export interface ATTACHMENT {
    TYPE: string
    SIZE: number
    uri: string
}

export enum MESSAGE_TYPE {
    MESSAGE = "MESSAGE",
    REPLY = "REPLY",
    REACTION = "REACTION",
}

export interface MESSAGE {
    content: string
    attachments: Array<ATTACHMENT>
    id?: string
    parent?: string
    type: MESSAGE_TYPE
    timestamp?: number
    originator: string
    random_delimiter?: string
}


export function serializeMessage(args: {message: MESSAGE}) {

    const delimiter = args.message.random_delimiter ?? Buffer.from(nacl.randomBytes(16)).toString('hex')
    const id = args?.message?.id ?? `fgs://${args.message.originator}:message:` + Buffer.from(nacl.randomBytes(16)).toString('hex')
    const timestamp = args?.message?.timestamp ?? Date.now()
    return (
        `FGS MESSAGE\n`+
        `RANDOM_DELIMITER::${delimiter}\n`+
        `ORIGINATOR::${args.message.originator}\n`+
        `ID::${id}\n`+
       ` TYPE::${args.message.type}\n`+
        `PARENT::${args.message.parent}\n`+
        `TIMESTAMP::${timestamp}\n`+
        `${delimiter}\n`+
        `${args.message.content}\n`+
        `${delimiter}\n`+
        `${args.message.attachments?.map(a => `${a.TYPE} ${a.SIZE} ${a.uri}`).join('\n')}`
    )
    // TODO: embed message signature to prevent tampering
}

export function deserializeMessage(message: string) {

    const lines = message?.split("\n")

    const [
        _,
        _delimiter,
        _originator,
        _id,
        _type,
        _parent,
        _timestamp,
        ...rest
    ] = lines

    const delimiter = _delimiter?.trim()?.split("::")?.at(1)!
    const originator = _originator?.trim()?.split("::")?.at(1)!
    const id = _id?.trim()?.split("::")?.at(1)!
    const type = _type?.trim()?.split("::")?.at(1)!
    const timestamp = _timestamp?.trim()?.split("::")?.at(1)!
    let parent: string | undefined = _parent?.trim()?.split("::")?.at(1)!
    parent = parent == 'undefined' ? undefined : parent

    const [
        __,
        content,
        attachments_serialized
    ] = rest?.join("\n")?.split(delimiter)

    const attachments = attachments_serialized?.trim()?.split('\n')?.map(a => {
        const [ type, size, uri ] = a?.split(" ")

        if(!uri){
            return null
        }

        return {
            TYPE: type,
            SIZE: parseInt(size),
            uri: uri
        } as ATTACHMENT
    })?.filter(a => a !== null)


    return {
        type,
        id,
        attachments: attachments ?? [],
        content,
        random_delimiter: delimiter,
        timestamp: parseInt(timestamp),
        parent: parent,
        originator: originator,
    } as MESSAGE


}