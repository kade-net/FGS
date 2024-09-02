import {aptos, ENTRY_FUNCTIONS, FGS_NODE, INBOX, INBOX_REGISTRY_MODULE, NODE_REGISTRY_MODULE} from "./contract";


export const getNode = async (namespace: string) => {

    const [node_address] = await aptos.view({
        payload: {
            function: ENTRY_FUNCTIONS.get_node_address.path,
            functionArguments: ENTRY_FUNCTIONS.get_node_address.parseArgs({
                namespace
            })
        }
    })

    return await aptos.getAccountResource<FGS_NODE>({
        accountAddress: node_address as string,
        resourceType: `${NODE_REGISTRY_MODULE}::Node`
    })
}

export const getInbox = async (inbox_address: string) => {

    return await aptos.getAccountResource<INBOX>({
        accountAddress: inbox_address as string,
        resourceType: `${INBOX_REGISTRY_MODULE}::Inbox`
    })


}