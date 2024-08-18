# The Federated GM Service
The Federated GM Service(FGS), is a protocol for providing a sufficiently decentralised and reasonably secure service for interoperable inboxes(Inbox that can be read and written to from multiple clients).

### What we're trying to build
- Secure communication with Metadata Privacy
- Message Availability to different clients
- Granular authorization for access levels to content on different servers
- A consistent namespace definition for servers to ensure consistent communication and availability

### Reason for federated approach
- While figuring out how to implement end to end encrypted direct messaging in a decentralised manner. I run into a couple of roadblocks, that I think would have greatly decreased the user experience.
- Implementing the double ratchet encryption standard for message encryption, loses it's security, when we consider the fact that this data has to be accessed by different unrelated clients. In a case where there's more than a single client, we eventually need somewhere to store the user's chat history and have it accessible to other clients.
- Decentralized storage isn't an option, becuase it will eventually expose the user's metadata history, regardless of the encryption done on the messages themselves.
- Local storage of the data, or doing user specific backups, as is done with applications like whatsapp, isn't an option, because it means the data cann't eventually be shared with other applications
- Having delegates as well introduces a problem when we need messages to be transferred between different nodes in the federation.

### Tenets of the FGS approach
- Provide an identity service compatible with kade's identity layer
- Hold an encrypted version of the user's key pair onchain
- Decrypt this keypair only on device
- Always encrypt messages sent to nodes(Double ratchet may still be the best way to provide this security, only issue is we have to keep track of the metadata tied to each message as well. A shared key approach is more feasible | However this part of the protocol can always be updated eventually)
- Require authorization from a user before giving a node access to messages that may be stored on another node.


### Definition of entities

## Node
- A node is a server, that hosts the FGS protocol. Nodes have to be registered on-chain, and provide details about: 
  - the node's base access uri - e.g fgs.poseidon.ac
  - the node's namespace, to be used for inter node communication
    - e.g poseidon used in denv@poseidon.fgs
  - keep track of the node's primary users
 - verify data transfer requests of primary user data made by other nodes the transfer of conversations to other nodes

## User
- A user is a participant in the FGS protocol. 
- The User participates by: 
  - Regestering and advertising their keypair
  - Initiating or Joining conversations
  - Sending and Receiving messages
  - Encrypting and Decrypting messages
  - Keeps track of their sequence number,used to denote actions made by the user
  - Authorize copying of information from one node to another making use of transfer windows






