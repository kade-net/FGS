export type FGS_NODE = {
    namespace: string,
    protocol_endpoint: string,
    active: boolean,
    node_id: number,
    created_at: number,
    sign_public_key: string,
    encrypt_public_key: string,
}

export type LOCAL_REFERENCE = {
    namespace: string,
    token_address: string
}

export type INBOX = {
    current_node: string,
    sign_public_key: string,
    encrypt_public_key: string,
    encrypted_private_key_set: string,
    rand_auth_string: string,
    prev_nodes: string[],
    encrypted_conversation_list: string[],
    timestamp: number
}