import config from "config";
import crypto from "crypto";

export function generateId(type: 'invitation' | 'accept' | 'reject' | 'message'){
    const namespace = config.config.namespace
    const randomString = crypto.randomBytes(16).toString('hex')
    return `fgs://${namespace}:${type}:${randomString}` as const
}

type s = string
export function destructureId(id: `fgs://${s}:${'invitation' | 'accept' | 'reject' | 'message'}:${s}`) {
    const parts = id.trim().replace("fgs://", "").split(':')

    const [namespace, type, random] = parts

    return {
        namespace,
        type: type as 'invitation' | 'accept' | 'reject' | 'message',
        random: random,
    }
}