import {Account} from "@aptos-labs/ts-sdk";
import {ENTRY_FUNCTIONS, INBOX_REGISTRY_MODULE, NODE_ENTRY_FUNCTIONS, NODE_REGISTRY_MODULE} from "./module_defs";
import {aptos} from "./init";
import {FGS_NODE, INBOX} from "./types";


export const registerNamespace = async (operator: Account, args: Parameters<typeof NODE_ENTRY_FUNCTIONS.operator_register_namespace.parseArgs>[number]) =>{
    const transaction = await aptos.transaction.build.simple({
        sender: operator.accountAddress.toString(),
        data: {
            function: NODE_ENTRY_FUNCTIONS.operator_register_namespace.path as any,
            functionArguments: NODE_ENTRY_FUNCTIONS.operator_register_namespace.parseArgs(args)
        }
    })

    const commitedTxn = await aptos.signAndSubmitTransaction({
        signer: operator,
        transaction
    })

    const status = await aptos.waitForTransaction({
        transactionHash: commitedTxn.hash
    })

    if(status.success){
        console.log("HASH::", status.hash)
        return status
    }

    throw new Error("Transaction failed", {
        cause: status
    })
}


export const getNode = async (namespace: string) => {
    const [node_address] = await aptos.view({
        payload: {
            function: ENTRY_FUNCTIONS.get_node_address.path as any,
            functionArguments: [namespace]
        }
    })

    return await aptos.getAccountResource<FGS_NODE>({
        accountAddress: node_address as string,
        resourceType: `${NODE_REGISTRY_MODULE}::Node` as any,
    })
}


export const getInbox = async (owner_address: string) => {
    return await aptos.getAccountResource<INBOX>({
        accountAddress: owner_address ,
        resourceType: `${INBOX_REGISTRY_MODULE}::Inbox` as any,
    })
}

export const registerUser = async (inbox_owner: Account, args: Parameters<typeof NODE_ENTRY_FUNCTIONS.registerInbox.parseArgs>[number])=>{
    const transaction = await  aptos.transaction.build.simple({
        sender: inbox_owner.accountAddress.toString(),
        data: {
            function: NODE_ENTRY_FUNCTIONS.registerInbox.path as any,
            functionArguments: NODE_ENTRY_FUNCTIONS.registerInbox.parseArgs(args),
        }
    })

    const committedTxn = await aptos.transaction.signAndSubmitTransaction({
        signer: inbox_owner,
        transaction
    })

    const status = await aptos.waitForTransaction({
        transactionHash: committedTxn.hash,
    })

    if(status.success){
        console.log("HASH::", status.hash)

    }else{
        throw new Error("Transaction failed")
    }
}