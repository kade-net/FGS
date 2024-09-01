

const MODULE_ADDRESS = process.env.MODULE_ADDRESS!;

export const NODE_REGISTRY_MODULE = `${MODULE_ADDRESS}::node_registry`
export const INBOX_REGISTRY_MODULE = `${MODULE_ADDRESS}::inbox_registry`

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