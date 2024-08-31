export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: any; output: any; }
  JSON: { input: any; output: any; }
};

export type Activity_Types = Accept | Invitation | Message | Reject;

export type Accept = {
  __typename?: 'Accept';
  from: Scalars['String']['output'];
  id?: Maybe<Scalars['String']['output']>;
  invitation: Scalars['String']['output'];
  published: Scalars['Int']['output'];
  to: Scalars['String']['output'];
};

export type AcceptInput = {
  from: Scalars['String']['input'];
  id?: InputMaybe<Scalars['String']['input']>;
  invitation: Scalars['String']['input'];
  published: Scalars['Int']['input'];
  to: Scalars['String']['input'];
};

export type Ack = {
  __typename?: 'Ack';
  acknowledged: Scalars['Int']['output'];
  id?: Maybe<Scalars['String']['output']>;
  identity: Scalars['String']['output'];
  signed_signature: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type ActivityTypesInput = {
  accept?: InputMaybe<AcceptInput>;
  invitation?: InputMaybe<InvitationInput>;
  message?: InputMaybe<MessageInput>;
  reject?: InputMaybe<RejectInput>;
};

export type Conversation = {
  __typename?: 'Conversation';
  conversation_id: Scalars['String']['output'];
  messages?: Maybe<Array<Maybe<Message>>>;
};

export type Delivery_Activity = {
  __typename?: 'DELIVERY_ACTIVITY';
  activity: Signed_Activity;
  published: Scalars['Int']['output'];
  signature: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type DeliveryActivityInput = {
  activity: SignedActivityInput;
  identity: Scalars['String']['input'];
  signature: Scalars['String']['input'];
  type: Scalars['String']['input'];
};

export enum Invite_Type {
  Accepted = 'ACCEPTED',
  Pending = 'PENDING',
  Rejected = 'REJECTED'
}

export type Invitation = {
  __typename?: 'Invitation';
  encrypted_conversation_id: Scalars['String']['output'];
  from: Scalars['String']['output'];
  id?: Maybe<Scalars['String']['output']>;
  published: Scalars['Int']['output'];
  to: Scalars['String']['output'];
};

export type InvitationInput = {
  encrypted_conversation_id: Scalars['String']['input'];
  from: Scalars['String']['input'];
  id?: InputMaybe<Scalars['String']['input']>;
  published: Scalars['Int']['input'];
  to: Scalars['String']['input'];
};

export type Message = {
  __typename?: 'Message';
  conversation_id: Scalars['String']['output'];
  encrypted_content: Scalars['String']['output'];
  id?: Maybe<Scalars['String']['output']>;
  node: Scalars['String']['output'];
  published: Scalars['Int']['output'];
};

export type MessageInput = {
  conversation_id: Scalars['String']['input'];
  encrypted_content: Scalars['String']['input'];
  id?: InputMaybe<Scalars['String']['input']>;
  node: Scalars['String']['input'];
  published: Scalars['Int']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  submitDelivery: Ack;
  submitSignedActivity: Ack;
};


export type MutationSubmitDeliveryArgs = {
  input: DeliveryActivityInput;
};


export type MutationSubmitSignedActivityArgs = {
  input: SignedActivityInput;
};

export type Query = {
  __typename?: 'Query';
  conversation: Conversation;
  invitations?: Maybe<Array<Invitation>>;
};


export type QueryConversationArgs = {
  conversation_id: Scalars['String']['input'];
};


export type QueryInvitationsArgs = {
  address?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Invite_Type>;
};

export type Reject = {
  __typename?: 'Reject';
  from: Scalars['String']['output'];
  id?: Maybe<Scalars['String']['output']>;
  invitation: Scalars['String']['output'];
  published: Scalars['Int']['output'];
  to: Scalars['String']['output'];
};

export type RejectInput = {
  from: Scalars['String']['input'];
  id?: InputMaybe<Scalars['String']['input']>;
  invitation: Scalars['String']['input'];
  published: Scalars['Int']['input'];
  to: Scalars['String']['input'];
};

export type Signed_Activity = {
  __typename?: 'SIGNED_ACTIVITY';
  activity: Activity_Types;
  identity: Scalars['String']['output'];
  signature: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type SignedActivityInput = {
  activity: ActivityTypesInput;
  identity: Scalars['String']['input'];
  signature: Scalars['String']['input'];
  type: Scalars['String']['input'];
};
