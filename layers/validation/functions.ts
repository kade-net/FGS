import {SIGNED_ACTIVITY} from "./schema/activities";
import {contract} from "contract";
import nacl from 'tweetnacl'
import nacl_util from 'tweetnacl-util'
import config from "config";


export const verifySignedActivity = async (signedActivity: SIGNED_ACTIVITY<any>) => {
    const initiator = signedActivity.type == 'node' ? await contract.getNode(signedActivity.identity) :
        signedActivity.type == 'user' ? await contract.getInbox(signedActivity.identity) : null

    if(!initiator) {
        throw new Error("Invalid signed activity type, NON EXISTENT initiator");
    }

    if(signedActivity.activity.published){
        signedActivity.activity.published = new Date(signedActivity.activity.published).getTime();
    }


    console.log("activity to sign::", signedActivity.activity);

    const MESSAGE_BUFFER = nacl_util.decodeUTF8(JSON.stringify(signedActivity.activity))
    console.log("MESSAGE_BUFFER", Buffer.from(MESSAGE_BUFFER).toString('hex'))
    const SIGNATURE = Buffer.from(signedActivity.signature, 'base64')
    const PUB_KEY = Buffer.from(initiator.sign_public_key, 'hex')

    const isValid = nacl.sign.detached.verify(MESSAGE_BUFFER, SIGNATURE, PUB_KEY)

    if(!isValid) {
        throw new Error("Invalid signed activity. SIGNATURE is invalid");
    }

    return true
}


export const signActivity = async (activity: Record<string, any>) => {
    const ACTIVITY_BUFFER = nacl_util.decodeUTF8(JSON.stringify(activity))
    const SIGNATURE = nacl.sign.detached(ACTIVITY_BUFFER, config.config.signKeyPairDoNotExpose.secretKey)

    return Buffer.from(SIGNATURE).toString('base64')
}