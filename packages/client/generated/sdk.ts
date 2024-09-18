import * as Types from './operations';

import { GraphQLClient, RequestOptions } from 'graphql-request';
import gql from 'graphql-tag';
type GraphQLClientRequestHeaders = RequestOptions['requestHeaders'];

export const GetConversationDocument = gql`
    query getConversation($conversation_id: String!, $page: Int, $size: Int, $sort: SortOrder) {
  conversation(
    conversation_id: $conversation_id
    pagination: {page: $page, size: $size}
    sort: $sort
  ) {
    conversation_id
    messages {
      id
      conversation_id
      encrypted_content
      published
    }
  }
}
    `;
export const GetInvitationsDocument = gql`
    query getInvitations($address: String!, $type: INVITE_TYPE) {
  invitations(address: $address, type: $type) {
    id
    to
    from
    published
    encrypted_conversation_id
  }
}
    `;
export const SubmitSignedActivityDocument = gql`
    mutation submitSignedActivity($input: SignedActivityInput!) {
  submitSignedActivity(input: $input) {
    type
    acknowledged
    signed_signature
    identity
  }
}
    `;
export const SubmitDeliveryDocument = gql`
    mutation submitDelivery($input: DeliveryActivityInput!) {
  submitDelivery(input: $input) {
    type
    acknowledged
    signed_signature
    identity
  }
}
    `;
export const GetInvitationDocument = gql`
    query getInvitation($invitation_id: String!) {
  invitation(invitation_id: $invitation_id) {
    id
    to
    from
    published
    encrypted_conversation_id
  }
}
    `;
export const StreamConversationsDocument = gql`
    subscription streamConversations($conversation_id: String!) {
  conversation(conversation_id: $conversation_id) {
    conversation_id
    encrypted_content
    id
    published
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string, variables?: any) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType, _variables) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    getConversation(variables: Types.GetConversationQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<Types.GetConversationQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<Types.GetConversationQuery>(GetConversationDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'getConversation', 'query', variables);
    },
    getInvitations(variables: Types.GetInvitationsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<Types.GetInvitationsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<Types.GetInvitationsQuery>(GetInvitationsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'getInvitations', 'query', variables);
    },
    submitSignedActivity(variables: Types.SubmitSignedActivityMutationVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<Types.SubmitSignedActivityMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<Types.SubmitSignedActivityMutation>(SubmitSignedActivityDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'submitSignedActivity', 'mutation', variables);
    },
    submitDelivery(variables: Types.SubmitDeliveryMutationVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<Types.SubmitDeliveryMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<Types.SubmitDeliveryMutation>(SubmitDeliveryDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'submitDelivery', 'mutation', variables);
    },
    getInvitation(variables: Types.GetInvitationQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<Types.GetInvitationQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<Types.GetInvitationQuery>(GetInvitationDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'getInvitation', 'query', variables);
    },
    streamConversations(variables: Types.StreamConversationsSubscriptionVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<Types.StreamConversationsSubscription> {
      return withWrapper((wrappedRequestHeaders) => client.request<Types.StreamConversationsSubscription>(StreamConversationsDocument, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'streamConversations', 'subscription', variables);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;