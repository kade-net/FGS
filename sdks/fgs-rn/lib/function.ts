import {
    aptos,
    ENTRY_FUNCTIONS,
    FGS_NODE,
    INBOX,
    INBOX_REGISTRY_MODULE,
    NODE_ENTRY_FUNCTIONS,
    NODE_REGISTRY_MODULE
} from "./contract";


export const getNode = async (namespace: string) => {

    const [node_address] = await aptos.view({
        payload: {
            function: ENTRY_FUNCTIONS.get_node_address.path,
            functionArguments: ENTRY_FUNCTIONS.get_node_address.parseArgs({
                namespace
            })
        }
    })

    const node = await aptos.getAccountResource<FGS_NODE>({
        accountAddress: node_address as string,
        resourceType: `${NODE_REGISTRY_MODULE}::Node`
    })

    return node
}

export const getInbox = async (inbox_address: string) => {

    return await aptos.getAccountResource<INBOX>({
        accountAddress: inbox_address as string,
        resourceType: `${INBOX_REGISTRY_MODULE}::Inbox`
    })


}

export const getUpdateConversationListTransaction = async (inbox_owner: string, args: Parameters<typeof NODE_ENTRY_FUNCTIONS.updateConversationList.parseArgs>[number]) => {

    const transaction = await aptos.transaction.build.simple({
        sender: inbox_owner,
        data: {
            function: NODE_ENTRY_FUNCTIONS.updateConversationList.path,
            functionArguments: NODE_ENTRY_FUNCTIONS.updateConversationList.parseArgs(args)
        }
    })

    return transaction
}