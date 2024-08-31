import {SIGNED_ACTIVITY} from "./schema/activities";
import {contract} from "contract";
import nacl from 'tweetnacl'
import config from "config";


export const verifySignedActivity = async (signedActivity: SIGNED_ACTIVITY<any>) => {
    const initiator = signedActivity.type == 'node' ? await contract.getNode(signedActivity.identity) :
        signedActivity.type == 'user' ? await contract.getInbox(signedActivity.identity) : null

    if(!initiator) {
        throw new Error("Invalid signed activity type, NON EXISTENT initiator");
    }

    const MESSAGE_BUFFER = Buffer.from(JSON.stringify(signedActivity.activity), 'utf-8')
    const SIGNATURE = Buffer.from(signedActivity.signature, 'hex')
    const PUB_KEY = Buffer.from(initiator.sign_public_key, 'hex')
    const isValid = nacl.sign.detached.verify(MESSAGE_BUFFER, SIGNATURE, PUB_KEY)

    if(!isValid) {
        throw new Error("Invalid signed activity. SIGNATURE is invalid");
    }

    return true
}


export const signActivity = async (activity: Record<string, any>) => {
    const ACTIVITY_BUFFER = Buffer.from(JSON.stringify(activity), 'utf-8')
    const SIGNATURE = nacl.sign.detached(ACTIVITY_BUFFER, config.config.signKeyPairDoNotExpose.secretKey)

    return Buffer.from(SIGNATURE).toString('hex')
}