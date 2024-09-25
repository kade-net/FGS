The Federated GM Service (FGS) is a protocol for providing secure and anonymous communication between addresses on Aptos and an Interoperable inbox that can be used across dApps.

Federated here is used to note the fact that a lot of the operations on the protocol run off the main blockchain, and on a federated network of servers.

This document will take you through how we tackle the following important aspects:
1. Identity
3. Anonymity and Message Delivery
4. Encryption and Verification



# Identity
There are 2 main entities in the FGS protocol:
### Nodes
These are servers that host the FGS protocol. They are registered on chain but run the protocol off chain. Will typically be controlled by a dApp that's integrating the FGS protocol for its users.
Node's provide storage, validation and delivery of messages submitted by users on the network.
Node's have an inbox/outbox system, where all incoming messages from other nodes, gets put in its inbox and all outgoing communication will get put in its outbox after successful delivery to other nodes.

An example node setup scenario:
- Poseidon, a client of Kade wants to add end to end encrypted direct messaging for their users.
- In order to join the FGS network, Poseidon will first need to register its namespace on chain so that other nodes running the protocol can recognise messages targeted to Poseidon users, and so that other servers can be able to verify all messages coming from Poseidon.
- To do this the developers would register their namespace "poseidon" through the fgs protocol smart contract on Aptos. Think of this like registering a domain name with ICANN.
- They will provide the following information:
```ts
type FGS_NODE = {  
    operator: "0x4332...", // the registering account's address  
    namespace: "poseidon", // a unique name  
    protocol_endpoint: "fgs.poseidon.domain", // the route to where endpoints for the fgs protocol are hosted on Poseidon's servers  
    active: true, // whether the servers are currently active  
    node_id: 100, // will get automatically assigned by the smart contract  
    created_at: 17282322222, // timestamp on when registration occured  
    sign_public_key: "673833...4322ea33", // this will be used by other servers to verify that content sent to them is actually from poseidon (think of it like a site certificate)  
    encrypt_public_key: "544242...42424", // for some operations internode communication may need to be encrypted, this is so that other nodes can easily construct a shared secret for communication
}
```
- Once this is registered on chain, both other nodes and other users will know details necessary to communicate with the poseidon servers.

### Inboxes
These are users on the protocol. They get registered on chain, where they advertise information necessary to send messages to them.

An example inbox setup(Note, these steps should get abstracted by the application, and made easier for users):
- IMPORTANT NOTE: All these operations should always occur on the user's device and never on the applications servers
- Alice a user of Poseidon, wants to start messaging Bob a user of Netra wallet.
- Both Poseidon and Netra have been registered on the network and each run a server that hosts the FGS protocol.
- Bob has already registered his inbox on Netra.
- Poseidon will abstract away the registration process from Alice, but the steps taken for registration will be as follows.
  - Poseidon will generate a long random string, known as a **Random Auth String**
  - this **Random Auth String** will look something like this:
---
```txt
FGS SECRET SIGNATURE REQUEST

SIGNING THIS TEXT GENERATES A SECRET THAT WILL ENABLE THIS APP
TO ENCRYPT AND DECRYPT MESSAGES ON YOUR BEHALF.

ONLY PROCEED IF YOU UNDERSTAND WHAT THIS AUTHORIZATION MEANS!

----
RAND: [A RANDOMLY GENERATED STRING]
IDENTITY REGISTRATION TIMESTAMP: [ISO TIMESTAMP]
INBOX OWNER: [THE ADDRESS OF THE INBOX OWNER ALICE in this case]
----
``` 
---
-  Poseidon will then request Alice to sign the rand auth string above
  - The resultant signature will be Alice's **secret signature**
  - Poseidon will then generate an encryption key pair and a sign key pair for Alice
  - Poseidon(ON DEVICE) will then combine the secret keys for signing and encryption, into a single formatted string with this structure:
```txt
FGS SECRET KEYS
SIGNING_KEY::[the signing key] - ed25519
ENCRYPTION_KEY::[the encryption key] - x25519
```

- The result will then get encrypted using the **secret signature** from the previous step.
- Poseidon will then request Alice to submit a transaction to the blockchain, that will register their inbox on chain. 
- The transaction, will involve Alice registering the following details for her inbox on chain:

```ts
type Inbox = {  
    current_node: "poseidon", // the current application namespace  
    sign_public_key: "46634...1123", // ed25199 - pub  
    encrypt_public_key: "423..521", // x25519 - pub  
    encrypted_private_key_set: "6662133", // ed25199-priv:x25519-priv  
    rand_auth_string: "FGS...",  
    prev_nodes: ["poseidon"], // the previous nodes that Alice has used  
    encrypted_conversation_list: "", // an encrypted hex string containing a list of Alice's conversations  
    timestamp: 17383922833 // when this occured
}
```
---

- Once this has been registered on chain, Bob will now know how to encrypt conversation invites for Alice and what node to send his message to, and since Bob had already gone through the same process on Netra, Alice will as well.
- Alice can always reconstruct the keypairs she needs for encryption and signing on any other application. All she will need to do is sign the public **random auth string** with her Aptos wallet private key to obtain her secret signature, which she can use to decrypt the ``encrypted_private_key_set``
- In case Alice or Bob feels any of their private details have been exposed, they can always update their inboxes. And any new messages sent on the protocol will dynamically adapt the new details.


### Anonymity
- Anonymity of conversations is an important thing to consider when dealing with communication on a decentralised protocol.
- The main goal with our approach is to hide conversations in "plain sight" and make it difficult for an individual to guess what conversation belongs to a specific set of users, think of a needle in a big jar of other needles at the bottom of a river in a forest, it's technically possible to find it, but before you do you must use a tonne of resources, and if you some how do, you'll find that all communication has been encrypted.
- The path to enabling this is relatively simple. It all starts with a shared secret.
- Both Alice and Bob can construct a shared secret from their public private key pairs through the Diffie Hellman key exchange.
- If Bob is initiating the conversation, once he has constructed a shared secret with Alice's ``encryption_public_key`` he can use it to encrypt a ``CONVERSATION HEADER`` which he can include in an invitation that he forwards to Alice. The forwarding will involve the invitation being sent to Netra's sever, which will lookup the currently active node of the to address that Bob specified, and forwarding the invitation to that server's ``protocol_endpoint``
- An invitation will look like this:
---
```ts
type Invitation = {  
    to: "0xaaa", // Alice's address 
    from: "0xbbb", // Bob's address
    published: 1756739222,
    encrypted_conversation_id: "54322" // a hexstring which is an encrypted version on the conversation header  
}
```
---
This is what an unencrypted ``CONVERSATION_HEADR`` would look like:

---
```txt
FGS CONVERSATION
ORIGINATOR: address - in this case BOB's address
PARTICIPANTS: alice's address, bob's address 
CONVERSATION_ID: a globally unique string following fgs's global id system
CONVERSATION_KEY: a 32 byte hex to be used for encryption and decryption of all messages and attachments sent in this conversation
```
---
- As Bob forwards his invite, he will also update his on chain conversation list to include this header. This is what the ``encrypted_conversation_list``  field of the inbox will contain.
- When Alice receives the invite, She'll accept it/ she can optionally reject it(which involves sending back and accept/reject response through the server system)
- Then updates her inbox's ``encrypted_conversation_list`` with it as well.
- Going forward all messages sent by Alice will be encrypted with the ``CONVERSATION_KEY`` and tagged with the ``CONVERSATION_ID`` that no one apart from Bob knows about.
- Additionally, the target of all her messages will not be Bob's address but instead Alice will simply use Netra's namespace i.e ``netra``. Poseidon's server will be able to lookup the destination server for the message, and deliver the message to Netra's inbox.
- NOTE: the ``CONVERSATION_ID`` is different from the ``encrypted_conversation_id``
  - We decrypted the ``encrypted_conversation_id`` to get the ``CONVERSATION_HEADER`` which contains the actual ``CONVERSATION_ID``
- Unless exposed by either parties, the ``CONVERSATION_ID`` can not be tracked back to either of them.
- Tracking of conversation ids may seem possible because for our example we have only Alice and Bob, but imagine a situation with more than 100,000 conversations are running on the system.
- The needle, in a jar of needles at the bottom of a river in a forest starts to play out.

### Delivery
Continuing with the Alice Bob example. Lets examine how messages sent by Alice will get delivered to Bob and ViceVersa.

Previously we looked at conversation initialisation, where Bob creates a ``CONVERSATION_HEADER``, encrypts and sends it **publicly** to Alice, who decrypts it and gets back the ``CONVERSATION_HEADER``, which importantly includes the ``CONVERSATION_ID`` and a ``CONVERSATION_KEY``.

Now if Alice needs to send a GM to Bob, or send a picture of her cat. She'll go through the following steps:
- Construct a ``MESSAGE`` payload, which looks like this:
```txt
FGS MESSAGE
ORIGINATOR:: alice's address
RANDOM_DELIMETER:: a random string to be used for delimiting the different sections
ID:: a fgs global identifier for the message
TYPE:: a message type MESSAGE / REACTION / REPLY ...and other future types
PARENT:: in case this message is a reaction or reply
TIMESTAMP::
{random_delimeter}
content 
{random_delimeter}
TYPE SIZE URI - a new line separated list of all attachments
```
- Encrypt the ``MESSAGE``  with the ``CONVERSATION_KEY``
- once Alice has an encrypted version of the message, she can then construct a payload to send to Poseidon's servers.
- This will look something like this:
```ts
type MessageInput {    
    conversation_id: 'fgs://netra:conversation:47373729382' 
    encrypted_content: '434242...4832' // an encrypted hex of the message 
    published: 1728398484433  
    nodes: ["netra"] // the destination node in the federation
}
```
- NOTE how no user/ inbox identifiable information is included in what Alice submits to Poseidon's severs.
- Only Bob and Alice will be able to figure out who this conversation is meant for by tracking the ``conversation_id``

### Encryption and Verification

#### Verification
- The FGS protocol has self verifying data primitives.
- This means all data submitted on the network, will include a signature that can point to the original signer of the data. We use a custom wrapper data type for all data or what we call **activities** on the network. This wrapper is called a **SignedActivity**, this is what it's typescript implementation looks like:
```ts
type SignedActivity<T extends Record<string, any>> = {
	type: 'user' | 'node'
	identity: string // address of the sender or node namespace
	activity: T // e.g invite, message, accept, reject
	signature: string // a signature of the activity T
}
``` 
- Before any **activity** makes its way to a node's inbox or outbox, the node has to verify that that the actor claiming to be the sender of an activity was actually the one who created it.

#### Encryption
- Encryption on the FGS protocol is used in 3 key places:
  - The On chain Inbox:
    - The ``encrypted_private_key_set`` gets encrypted with the ``secret_signature`` derived from the ``random_auth_string``
    - The ``encrypted_conversation_list`` is a list of serialised conversation headers for the conversations the user is involved with, that have been encrypted with the user's ``encryption_key`` which can get derived from the ``encrypted_private_key_set``
  - Invites/Accepts/Rejects:
    - For these we send encrypted versions of the ``CONVERSATION_HEADER`` as the ``encrypted_conversation_id`` field. The ``CONVERSATION_HEADER`` gets encrypted using a shared secret generated by the 2 parties involved, usually through the Diffie-Helman key exchange
  - Message encryption
    - All messages on the network get encrypted with the ``CONVERSATION_KEY`` found in the ``CONVERSATION_HEADER``

### Conclusion
- Work on the Federated GM Service was a product of previous work done on the Hermes protocol for Kade, which was meant to provide on chain direct messaging. However, when we run into issues around privacy of user data we decided to begin work on something that would ensure conversation anonymity.
- We found that a federated approach was a lot more privacy friendly while still enabling us to build interoperable inbox for users on Aptos, without having to expose all their conversations to the world.
- Regarding encryption, we had initially began with the idea of implementing Signal's Double Ratchet algorithm for message encryption, however the metadata involved for handling message keys and constructing the encryption and decryption trees is something that is a lot easier to do with a centralised system, but complicates the process for a decentralised system.
- We plan to further work on things like conversation key rotation to give a form of forward healing property to the network in case of key leakage.
- The FGS protocol is now being actively used by [Poseidon](https://poseidon.ac) for E2EE Direct Messaging.