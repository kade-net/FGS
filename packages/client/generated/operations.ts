import * as Types from './types';

export type GetConversationQueryVariables = Types.Exact<{
  conversation_id: Types.Scalars['String']['input'];
}>;


export type GetConversationQuery = { __typename?: 'Query', conversation: { __typename?: 'Conversation', conversation_id: string, messages?: Array<{ __typename?: 'Message', id?: string | null, conversation_id: string, encrypted_content: string, published: any, node: string } | null> | null } };

export type GetInvitationsQueryVariables = Types.Exact<{
  address: Types.Scalars['String']['input'];
  type?: Types.InputMaybe<Types.Invite_Type>;
}>;


export type GetInvitationsQuery = { __typename?: 'Query', invitations?: Array<{ __typename?: 'Invitation', id?: string | null, to: string, from: string, published: any, encrypted_conversation_id: string }> | null };

export type SubmitSignedActivityMutationVariables = Types.Exact<{
  input: Types.SignedActivityInput;
}>;


export type SubmitSignedActivityMutation = { __typename?: 'Mutation', submitSignedActivity: { __typename?: 'Ack', type: string, acknowledged: any, signed_signature: string, identity: string } };

export type SubmitDeliveryMutationVariables = Types.Exact<{
  input: Types.DeliveryActivityInput;
}>;


export type SubmitDeliveryMutation = { __typename?: 'Mutation', submitDelivery: { __typename?: 'Ack', type: string, acknowledged: any, signed_signature: string, identity: string } };
