import db from '../../db'
import { K, DATA } from "serial";
import { Plugin } from "./class";
import { inbox, nodes } from '../../db/schema';
import { eq } from 'drizzle-orm';


export class NodeUpdatePlugin extends Plugin {
    name: K = "node_update"
    async process(data: { key: string; value: DATA['node_update'] & { type: 'node_update'; }; }): Promise<void> {

        try {

            if (data.value.update_type == "create") {
                await db.insert(nodes).values({
                    namespace: data.value.namespace,
                    active: data.value.active,
                    node_id: data.value.node_id,
                    protocol_endpoint: data.value.protocol_endpoint,
                    public_key: data.value.public_key,
                    timestamp: new Date(data.value.timestamp).toISOString()
                })

            }

            if (data.value.update_type == "update") {
                await db.update(nodes).set({
                    active: data.value.active,
                    protocol_endpoint: data.value.protocol_endpoint,
                    public_key: data.value.public_key,
                    timestamp: new Date(data.value.timestamp).toISOString()
                }).where(
                    eq(nodes.namespace, data.value.namespace)
                )
            }

            console.log(`success::${data.key}::${data.value.type}::✅`)
        }
        catch (e) {
            console.log(`error::${data.key}::❌`, e)
        }
    }



}


export class RegisterInboxPlugin extends Plugin {
    name: K = "register_inbox";
    async process(data: { key: string; value: DATA['register_inbox'] & { type: K; }; }): Promise<void> {
        try {
            await db.insert(inbox).values({
                address: data.value.address,
                currentNode: data.value.currentNode,
                encryptedPrivateKey: data.value.encryptedPrivateKey,
                publicKey: data.value.publicKey,
                randAuthString: data.value.randAuthString,
                signature: data.value.signature,
                signedPublicKey: data.value.signedPublicKey,
                timestamp: new Date(data.value.timestamp).toISOString()
            })

            console.log(`success::${data.key}::${data.value.type}::✅`)
        }
        catch (e) {
            console.log(`error::${data.key}::❌`, e)
        }
    }

}

export class ChangeActiveNodePlugin extends Plugin {
    name: K = "change_active_node"
    async process(data: { key: string; value: DATA['change_active_node'] & { type: K; }; }): Promise<void> {
        try {
            await db.update(inbox).set({
                currentNode: data.value.newActiveNode,
            }).where(
                eq(inbox.address, data.value.address)
            )

            console.log(`success::${data.key}::${data.value.type}::✅`)
        }
        catch (e) {
            console.log(`error::${data.key}::❌`, e)
        }
    }
}

export const plugins = [
    new NodeUpdatePlugin(),
    new RegisterInboxPlugin(),
    new ChangeActiveNodePlugin()
]