

export type FunResolver<P = any, A = any, C = any, R = any> = (parent: P, args: A, context: C) => any | Promise<R>

export type InputArg<T> = {
    input: T
}


//

export type InvitationInput = {
    id?: string
    to: string;
    from: string;
    published: number;
    encrypted_conversation_id: string;
};

export type AcceptInput = {
    id?: string
    to: string;
    from: string;
    invitation: string;
    published: number;
};

export type RejectInput = {
    id?: string
    to: string;
    from: string;
    invitation: string;
    published: number;
};

export type MessageInput = {
    id?: string
    conversation_id: string;
    encrypted_content: string;
    published: number;
    node: string;
};

export type SignedActivityInput = {
    type: 'user' | 'node';
    identity: string;
    activity: ActivityTypesInput;
    signature: string;
};

export type DeliveryActivityInput = {
    type: string;
    activity: SignedActivityInput;
    published: number;
    signature: string;
    identity: string;
};

export type ActivityTypesInput = {
    invitation?: InvitationInput;
    accept?: AcceptInput;
    reject?: RejectInput;
    message?: MessageInput;
};


/*
* type Ack {
    type: String!
    identity: String!
    acknowledged: Int!
    signed_signature: String! # a signature of the signed signature
}
* */

export type Ack = {
    type: 'node' | 'user'
    identity: string
    acknowledged: boolean
    signed_signature: string
}