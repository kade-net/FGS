import {DeliveryActivityInput, FunResolver, InputArg, SignedActivityInput} from "./types";
import { contract } from 'contract'
import {ACCEPT, INVITATION, MESSAGE, REJECT, SIGNED_ACTIVITY, utils, validator} from "validation";
import { getClient } from 'client'
import db, {schema} from 'storage'
import config from "config";
import nacl from "tweetnacl";




interface ResolverMap {
    Mutation: {
        submitSignedActivity: FunResolver<any, InputArg<SignedActivityInput>, any>
        submitDelivery: FunResolver<any, InputArg<DeliveryActivityInput>, any>
    }
}

const submitSignedActivity: FunResolver<any, InputArg<SignedActivityInput>, any> = async (_, args, __)=>{

    console.log("Data::", args.input)
    const ACTIVITY_TYPE = args.input.activity.accept ? 'accept' :
        args.input.activity.message ? 'message' :
            args.input.activity.reject ? 'reject' :
                args.input.activity.invitation ? 'invitation' : 'none'

    if(ACTIVITY_TYPE == 'none') {
        throw new Error('Unknown activity activity')
    }

    const activity = args.input.activity.accept ?? args.input.activity.message ?? args.input.activity.reject ?? args.input.activity.invitation

    const signedActivity: SIGNED_ACTIVITY<INVITATION | ACCEPT | REJECT | MESSAGE | {}> = {
        activity: activity ?? {},
        type: args.input.type,
        identity: args.input.identity,
        signature: args.input.signature,
    }

    const isValid = await validator.verifySignedActivity(signedActivity)

    if(!isValid){
        throw new Error("Invalid signed activity. SIGNATURE is invalid");
    }

    // start distributing to the different inboxes
    switch (ACTIVITY_TYPE){
        case "accept":{
            const accept = signedActivity.activity as ACCEPT
            const sender = await contract.getInbox(signedActivity.identity)
            const receiver = await contract.getInbox(accept.to)

            const destination_node = receiver.current_node
            const SAME_NODE = destination_node == config.config.namespace;
            // const SAME_USER = sender.sign_public_key == receiver.sign_public_key;

            const node_details = await contract.getNode(destination_node)

            const client = getClient(node_details.protocol_endpoint)

            return await db.transaction(async (tx)=>{
                const id = accept?.id ?? utils.generateId('accept')
                accept.id = id
                await tx.insert(schema.userOutbox).values({
                    id,
                    activity: signedActivity.activity,
                    activity_type: 'accept',
                    signature: signedActivity.signature
                })

                if(SAME_NODE){

                    await tx.insert(schema.nodeInbox).values({
                        activity: accept,
                        activity_type: 'accept',
                        signature: signedActivity.signature,
                        originator_type: 'user',
                        originator: accept.from,
                        id
                    })

                    await tx.insert(schema.userInbox).values({
                        activity: accept,
                        activity_type: 'accept',
                        signature: signedActivity.signature,
                        id
                    })

                }else{

                    await tx.insert(schema.nodeOutbox).values({
                        activity: accept,
                        activity_type: 'accept',
                        signature: signedActivity.signature,
                        id,
                        originator: accept.from,
                        originator_type: 'user'
                    })

                    args.input.activity.accept!.id = id

                    const signature = await validator.signActivity(args.input)

                    await client.submitDelivery({
                        input: {
                            type: 'node',
                            signature,
                            activity: args.input,
                            identity: config.config.namespace
                        }
                    })
                }


                const signed_signature = nacl.sign.detached(Buffer.from(args.input.signature, 'hex'), config.config.signKeyPairDoNotExpose.secretKey)

                return {
                    type: 'accept',
                    identity: config.config.namespace,
                    id,
                    acknowledged: new Date(),
                    signed_signature: Buffer.from(signed_signature).toString('hex'),
                }
            })

            break;
        }
        case "reject":{
            const reject = signedActivity.activity as REJECT
            const sender = await contract.getInbox(signedActivity.identity)
            const receiver = await contract.getInbox(reject.to)

            const destination_node = receiver.current_node
            const SAME_NODE = destination_node == config.config.namespace;
            // const SAME_USER = sender.sign_public_key == receiver.sign_public_key;

            const node_details = await contract.getNode(destination_node)

            const client = getClient(node_details.protocol_endpoint)

            return await db.transaction(async (tx)=>{
                const id = reject?.id ?? utils.generateId('reject')
                reject.id = id
                await tx.insert(schema.userOutbox).values({
                    id,
                    activity: signedActivity.activity,
                    activity_type: 'reject',
                    signature: signedActivity.signature
                })

                if(SAME_NODE){

                    await tx.insert(schema.nodeInbox).values({
                        activity: reject,
                        activity_type: 'reject',
                        signature: signedActivity.signature,
                        originator_type: 'user',
                        originator: reject.from,
                        id
                    })

                    await tx.insert(schema.userInbox).values({
                        activity: reject,
                        activity_type: 'accept',
                        signature: signedActivity.signature,
                        id
                    })

                }else{

                    await tx.insert(schema.nodeOutbox).values({
                        activity: reject,
                        activity_type: 'reject',
                        signature: signedActivity.signature,
                        id,
                        originator: reject.from,
                        originator_type: 'user'
                    })

                    args.input.activity.reject!.id = id

                    const signature = await validator.signActivity(args.input)

                    await client.submitDelivery({
                        input: {
                            type: 'node',
                            signature,
                            activity: args.input,
                            identity: config.config.namespace
                        }
                    })
                }

                const signed_signature = nacl.sign.detached(Buffer.from(args.input.signature, 'hex'), config.config.signKeyPairDoNotExpose.secretKey)

                return {
                    type: 'reject',
                    identity: config.config.namespace,
                    id,
                    acknowledged: new Date(),
                    signed_signature: Buffer.from(signed_signature).toString('hex'),
                }
            })
            break;
        }
        case "message": {
            const message =  signedActivity.activity as MESSAGE

            const node = await contract.getNode(message.node)

            const SAME_NODE = message.node == config.config.namespace

            const client = getClient(node.protocol_endpoint)

            return await db.transaction(async (tx)=>{
                const id = message?.id ?? utils.generateId('message')
                message.id =id

                    await tx.insert(schema.nodeInbox).values({
                        activity_type: 'message',
                        activity: message,
                        signature: signedActivity.signature,
                        id,
                        originator: 'anonymous',
                        originator_type: 'user'
                    })


                    const signature = await validator.signActivity(args.input)
                    args.input.activity.message!.id = id

                    const ack = await client.submitDelivery({
                        input: {
                            type: 'node',
                            signature,
                            activity: args.input,
                            identity: config.config.namespace
                        }
                    })




                const signed_signature = nacl.sign.detached(Buffer.from(args.input.signature, 'hex'), config.config.signKeyPairDoNotExpose.secretKey)

                return {
                    type: 'message',
                    identity: config.config.namespace,
                    id,
                    acknowledged: new Date(),
                    signed_signature: Buffer.from(signed_signature).toString('hex'),
                }
            })
            break;
        }
        case "invitation": {
            const invitation = signedActivity.activity as INVITATION
            const sender = await contract.getInbox(signedActivity.identity)
            const receiver = await contract.getInbox(invitation.to)


            const destination_node = receiver.current_node

            const SAME_NODE = destination_node == config.config.namespace;
            const SAME_USER = sender.sign_public_key == receiver.sign_public_key;

            const node_details = await contract.getNode(destination_node)

            const client = getClient(node_details.protocol_endpoint)

            return await db.transaction(async (tx)=>{
                const id = invitation?.id ?? utils.generateId('invitation')
                invitation.id = id
                await tx.insert(schema.userOutbox).values({
                    id,
                    activity: signedActivity.activity,
                    activity_type: 'invite',
                    signature: signedActivity.signature
                })

                if(SAME_NODE){

                    await tx.insert(schema.nodeInbox).values({
                        activity: invitation,
                        activity_type: 'invite',
                        signature: signedActivity.signature,
                        originator_type: 'user',
                        originator: invitation.from,
                        id
                    })

                    await tx.insert(schema.userInbox).values({
                        activity: invitation,
                        activity_type: 'invite',
                        signature: signedActivity.signature,
                        id
                    })

                }else{

                    await tx.insert(schema.nodeOutbox).values({
                        activity: invitation,
                        activity_type: 'invite',
                        signature: signedActivity.signature,
                        id,
                        originator: invitation.from,
                        originator_type: 'user'
                    })

                    args.input.activity.invitation!.id = id

                    const signature = await validator.signActivity(args.input)

                    await client.submitDelivery({
                        input: {
                            type: 'node',
                            signature,
                            activity: args.input,
                            identity: config.config.namespace
                        }
                    })
                }


                const signed_signature = nacl.sign.detached(Buffer.from(args.input.signature, 'hex'), config.config.signKeyPairDoNotExpose.secretKey)

                return {
                    type: 'invitation',
                    identity: config.config.namespace,
                    id,
                    acknowledged: new Date(),
                    signed_signature: Buffer.from(signed_signature).toString('hex'),
                }


            })

            break;
        }
    }

}

export const mutationResolver: ResolverMap = {
    Mutation: {
        submitSignedActivity: submitSignedActivity,
        submitDelivery: async (_, args, __)=>{
            const node = await contract.getNode(args.input.identity)
            const isValid = await validator.verifySignedActivity(args.input as any)

            if(!isValid){
                throw new Error("Invalid signed activity type, NON EXISTENT initiator");
            }

            return await submitSignedActivity(null, {
                input: args.input.activity
            }, null)
        }
    }
}