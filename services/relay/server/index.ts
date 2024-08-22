import { Server, ServerCredentials, ServerUnaryCall, ServerWritableStream, sendUnaryData } from '@grpc/grpc-js';
import { inter_node, UnimplementedInterNodeServiceService } from 'inter-node'
import { serial, organized } from 'local-storage'
import config from 'config'
import crypto from 'crypto'
import { generateAuthRequestTemplate } from 'schema'
import { desc, eq } from 'drizzle-orm'

const localSerialStore = await serial.LocalSerialStore.init()

class RelayService implements UnimplementedInterNodeServiceService {
    [method: string]: import("@grpc/grpc-js").UntypedHandleCall;
    async SendMessageEvent(call: ServerUnaryCall<inter_node.MessageEvent, inter_node.AckEvent>, callback: sendUnaryData<inter_node.AckEvent>): Promise<void> {
        const request = call.request.toObject()

        await localSerialStore.put<"message_event">({
            conversationId: request.conversationId!,
            encryptedContent: request.encryptedContent!,
            signature: request.signature!,
            timestamp: request.timestamp!,
            to: request.to! as any,
            type: "message_event",
        })

        callback(null, new inter_node.AckEvent({
            ackType: inter_node.AckType.MESSAGE,
            node: config.config.namespace,
            signature: "TODO", // TODO: sign the request object
            timestamp: Date.now()
        }))
    }
    async SendInviteCreateEvent(call: ServerUnaryCall<inter_node.InviteCreateEvent, inter_node.AckEvent>, callback: sendUnaryData<inter_node.AckEvent>): Promise<void> {

        const request = call.request.toObject()

        await localSerialStore.put<"invite_event">({
            encryptedConversationId: request.encryptedConversationId!,
            from: request.from! as any,
            signature: request.signature!,
            timestamp: request.timestamp!,
            to: request.to! as any,
            type: "invite_event"
        })


        callback(null, new inter_node.AckEvent({
            ackType: inter_node.AckType.INVITE_CREATE,
            node: config.config.namespace,
            signature: "TODO", // TODO: sign the request object
            timestamp: Date.now()
        }))

    }
    async SendInviteAcceptEvent(call: ServerUnaryCall<inter_node.InviteAcceptEvent, inter_node.AckEvent>, callback: sendUnaryData<inter_node.AckEvent>): Promise<void> {
        const request = call.request.toObject()

        await localSerialStore.put<"accept_invite_event">({
            encryptedConversationId: request.encryptedConversationId!,
            signature: request.signature!,
            timestamp: request.timestamp!,
            to: request.to! as any,
            type: "accept_invite_event"
        })

        callback(null, new inter_node.AckEvent({
            ackType: inter_node.AckType.INVITE_ACCEPT,
            node: config.config.namespace,
            signature: "TODO", // TODO: sign the request object
            timestamp: Date.now()
        }))
    }
    async SendInviteRejectEvent(call: ServerUnaryCall<inter_node.InviteRejectEvent, inter_node.AckEvent>, callback: sendUnaryData<inter_node.AckEvent>): Promise<void> {
        const request = call.request.toObject()

        await localSerialStore.put<"reject_invite_event">({
            encryptedConversationId: request.encryptedConversationId!,
            signature: request.signature!,
            timestamp: request.timestamp!,
            to: request.to! as any,
            type: "reject_invite_event"
        })

        callback(null, new inter_node.AckEvent({
            ackType: inter_node.AckType.INVITE_REJECT,
            node: config.config.namespace,
            signature: "TODO", // TODO: sign the request object
            timestamp: Date.now()
        }))
    }
    async SendChangeActiveNodeEvent(call: ServerUnaryCall<inter_node.ChangeActiveNodeEvent, inter_node.AckEvent>, callback: sendUnaryData<inter_node.AckEvent>): Promise<void> {
        const request = call.request.toObject()

        // TODO: validate the authorization string sent by the user before triggering the node change event

        await organized.db.update(organized.schema.authRequests).set({
            approvalSignature: request.signature!
        }).where(
            eq(
                organized.schema.authRequests.generatedAuthString,
                request.userAuthorizationString!
            )
        )

        await localSerialStore.put<"change_active_node_event">({
            address: request.address!,
            newActiveNode: config.config.namespace,
            node: '', // TODO: the node that is sending the change active node event
            signature: request.signature!,
            randomAuth: request.userAuthorizationString!, // TODO: this will be used to authenticate the change active node event
            timestamp: request.timestamp!,
            type: "change_active_node_event"
        })

        callback(null, new inter_node.AckEvent({
            ackType: inter_node.AckType.CHANGE_ACTIVE_NODE,
            node: config.config.namespace,
            signature: "TODO", // TODO: sign the request object
            timestamp: Date.now()
        }))
    }

    async SendRequestNodeChangeAuthorizationString(call: ServerUnaryCall<inter_node.RequestNodeChangeAuthorizationString, inter_node.NodeChangeAuthorizationString>, callback: sendUnaryData<inter_node.NodeChangeAuthorizationString>): Promise<void> {
        const request = call.request.toObject()
        const randomCode = crypto.randomBytes(16).toString('hex')
        const timestamp = Date.now()
        const generatedString = generateAuthRequestTemplate({
            code: randomCode,
            new_node: request.newNodeNamespace!,
            old_node: config.config.namespace,
            timestamp,
            userAddress: request.address!
        })

        // TODO: send request event to be emitted onchain for verifiability

        await organized.db.insert(organized.schema.authRequests).values({
            fromNode: request.newNodeNamespace!,
            fromUserAddress: request.address!,
            generatedRandomCode: randomCode,
            id: randomCode,
            timestamp: new Date(timestamp),
            generatedAuthString: generatedString
        })

        callback(null, new inter_node.NodeChangeAuthorizationString({
            address: request.address!,
            authorizationRequestString: generatedString,
            signature: "TODO", // SIGNATURE MADE BY THE NODe
            timestamp: Date.now()
        }))


    }
    async DownloadMessageEventsToNewActiveNode(call: ServerWritableStream<inter_node.MessageDownloadRequest, inter_node.MessageEvent>): Promise<void> {

        // TODO: check if the requesting node has the necessary authorization to download the messages
        const request = call.request.toObject()

        let BATCH_SIZE = 10
        let OFFSET = 0;

        while (true) {
            const messages = await organized.db.query.messages.findMany({
                where(fields, ops) {
                    return ops.eq(fields.owner, request.userAddress!)
                },
                limit: BATCH_SIZE,
                offset: OFFSET,
                orderBy: desc(organized.schema.messages.timestamp)
            })

            if (messages.length === 0) {
                break;
            }

            for (const message of messages) {
                call.write(new inter_node.MessageEvent({
                    conversationId: message.conversationId,
                    encryptedContent: message.encryptedContent,
                    signature: message.signature,
                    timestamp: message.timestamp.getTime(),
                    to: message.owner, // for this case we will choose to use the to field as the owner during reconstruction
                }))
            }

            if (messages.length < BATCH_SIZE) {
                break;
            }

            OFFSET += BATCH_SIZE


        }
        call.end()
    }

}


const service = new RelayService()

const server = new Server()
server.addService(UnimplementedInterNodeServiceService.definition, service)

const PORT = process.env.RELAY_GRPC_PORT ?? 50051

function main() {
    server.bindAsync(`0.0.0.0:${PORT}`, ServerCredentials.createInsecure(), (error, port) => {
        if (error) {
            console.log("Error::", error)
            return
        }
        server.start()
        console.log("Server started on port::", port)
    })
}


main()
