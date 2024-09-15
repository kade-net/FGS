import {Aptos, AptosConfig, Network} from "@aptos-labs/ts-sdk";

export type FGS_NODE = {
    namespace: string;
    protocol_endpoint: string;
    active: boolean;
    node_id: number;
    created_at: number;
    sign_public_key: string;
    encrypt_public_key: string;
};
export type LOCAL_REFERENCE = {
    namespace: string;
    token_address: string;
};
export type INBOX = {
    current_node: string;
    sign_public_key: string;
    encrypt_public_key: string;
    encrypted_private_key_set: string;
    rand_auth_string: string;
    prev_nodes: string[];
    encrypted_conversation_list: string;
    timestamp: number;
};

const MODULE_ADDRESS = "0x58bf9d22bd9f1541b2bd81b71094a84916bb401a03db7288da407a489b254cde";

export const NODE_REGISTRY_MODULE = `${MODULE_ADDRESS}::node_registry` as const
export const INBOX_REGISTRY_MODULE = `${MODULE_ADDRESS}::inbox_registry` as const

export const NODE_ENTRY_FUNCTIONS = {
    operator_register_namespace: {
        path: `${NODE_REGISTRY_MODULE}::operator_register_namespace` as const,
        parseArgs: (args: {
            namespace: string,
            endpoint: string,
            sign_public_key: string,
            encrypt_public_key: string,
        }) => [args.namespace, args.endpoint, args.sign_public_key, args.encrypt_public_key]
    },
    registerInbox: {
        path: `${INBOX_REGISTRY_MODULE}::registerInbox` as const,
        parseArgs: (args: {node: string, randAuthString: string, sign_public_key: string, encrypt_public_key: string, encrypted_private_key_set: string}) => [
            args.node,
            args.randAuthString,
            args.sign_public_key,
            args.encrypt_public_key,
            args.encrypted_private_key_set,
        ]
    },
    updateConversationList: {
        path: `${INBOX_REGISTRY_MODULE}::updateConversationList` as const,
        parseArgs: (args: {newConversationList: string}) => [args.newConversationList]
    },
    updateInbox: {
        path: `${INBOX_REGISTRY_MODULE}::updateInbox` as const,
        parseArgs: (args: {
            newRandAuthString: string,
            newEncryptedPrivateKeySet: string,
            newSignerPublicKey: string,
            newEncryptionPublicKey: string
        }) => [
            args.newRandAuthString,
            args.newEncryptedPrivateKeySet,
            args.newSignerPublicKey,
            args.newEncryptionPublicKey
        ]
    }
}

export const ENTRY_FUNCTIONS = {
    get_node_namespace: {
        path: `${NODE_REGISTRY_MODULE}::get_node_namespace` as const,
        parseArgs: (args: {operator_address: string}) => [args.operator_address],
    },
    get_node_address: {
        path: `${NODE_REGISTRY_MODULE}::get_node_address` as const,
        parseArgs: (args: {namespace: string}) => [args.namespace],
    }
}



export const aptos = new Aptos(new AptosConfig({
    network: Network.MAINNET
}))