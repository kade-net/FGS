/**
    * This module handles the storage of user inbox identities on chain i.e registering to a namespace etc
    * handles advertising of conversation envelopes
    * handles keeping track of inbox sequence numbers for auditability by other nodes on the network
**/

module fgs::inbox_registry {

    use std::signer;
    use std::string;
    use aptos_framework::account;
    use aptos_framework::event::emit;
    use aptos_framework::timestamp;
    use fgs::node_registry;

    const EOPERATION_NOT_PERMITTED: u64 = 13001;

    const SEED: vector<u8> = b"FEDERATED GM SERVICE::inboxes";

    #[event] // shuld only be submitted by the fgs admin account and no other node
    struct RegisterInbox has drop,store {
        currentNode: string::String,
        address: address,
        publicKey: string::String,
        signedPublicKey: string::String,
        encryptedPrivateKey: string::String,
        randAuthString: string::String,
        signature: string::String, // This initial signature will be the signature from the aptos account
        timestamp: u64
    }

    #[event]
    struct ChangeActiveNode has drop, store {
        node: string::String,
        newActiveNode: string::String,
        address: address,
        randomAuth: string::String,
        signature: string::String, // this and all other signatures will be from the generate keypair
        timestamp: u64,
        ack: string::String // the new node first acknowledges the change requests then spins up a job to start compiling all the user's conversations
    }

    #[event]
    struct InviteToConversation has drop, store {
        from_address: address,
        to_address: address,
        encryptedConversationAddress: string::String,
        signature: string::String,
        node: string::String,
        toNode: string::String,
        ack: string::String, // the ack will be a signed message hash to ensure only the target server could have generated it
        // Before triggering this event and all the ones below, the node first has to verify that the target node has recieved the message details - this will help with things like if another server's down
        timestamp: u64
    }

    #[event]
    struct RejectInviteToConversation has drop, store {
        encryptedConversationAddress: string::String,
        signature: string::String,
        node: string::String,
        toNode: string::String,
        ack: string::String,
        timestamp: u64
    }

    #[event]
    struct AcceptInviteToConversation has drop, store {
        encryptedConversationAddress: string::String,
        signature: string::String,
        node: string::String,
        toNode: string::String,
        ack: string::String,
        timestamp: u64
    }

    #[event]
    struct ConversationMarker has store, drop {
        conversationId: string::String,
        node: string::String,
        timestamp: u64,
        toNode: string::String,
        ack: string::String,
    }

    struct State has key {
        signer_capability: account::SignerCapability
    }


    fun init_module(admin: &signer) {
        let (resource_signer, signer_capability) = account::create_resource_account(admin, SEED);

        move_to(&resource_signer, State {
            signer_capability
        })

    }

    public entry fun registerInbox(
        admin: &signer,
        node: string::String,
        inbox_address: address,
        publicKey: string::String,
        signedPublicKey: string::String,
        encryptedPrivateKey: string::String,
        randAuthString: string::String,
        signature: string::String
    ){
        assert!(signer::address_of(admin) == @fgs, EOPERATION_NOT_PERMITTED);

        node_registry::get_node_details(node);

        emit(RegisterInbox {
            currentNode: node,
            publicKey,
            address: inbox_address,
            encryptedPrivateKey,
            randAuthString,
            signature,
            signedPublicKey,
            timestamp: timestamp::now_seconds()
        })
    }


    public entry fun changeActiveNode(nodeOperator: &signer, newNode: string::String, address: address, randomAuth: string::String, signature: string::String, ack: string::String){
        let current_operator_address = signer::address_of(nodeOperator);
        let currentNode = node_registry::get_node_namespace(current_operator_address);
        let newNodeDetails = node_registry::get_node_details(newNode);

        emit(ChangeActiveNode {
            signature,
            randomAuth,
            newActiveNode: newNode,
            address,
            timestamp: timestamp::now_seconds(),
            node: currentNode,
            ack
        });
    }

    public entry fun createConversationInvite(nodeOperator: &signer, destinationNode: address, from: address, to: address, encryptedConversationAddress: string::String, signature: string::String, ack: string::String){
        let current_operator_address = signer::address_of(nodeOperator);
        let namespace = node_registry::get_node_namespace(current_operator_address);
        let toNode = node_registry::get_node_namespace(destinationNode);

        emit(InviteToConversation {
            signature,
            node: namespace,
            encryptedConversationAddress,
            from_address: from,
            to_address: to,
            ack,
            toNode,
            timestamp: timestamp::now_seconds()
        })

    }

    public entry fun rejectInviteToConversation(nodeOperator: &signer, destinationNode: address, encryptedConversationAddress: string::String, signature: string::String, ack: string::String) {

        let current_operator_address = signer::address_of(nodeOperator);
        let namespace = node_registry::get_node_namespace(current_operator_address);
        let toNode = node_registry::get_node_namespace(destinationNode);

        emit(RejectInviteToConversation {
            encryptedConversationAddress,
            node: namespace,
            signature,
            ack,
            toNode,
            timestamp: timestamp::now_seconds()
        })

    }

    public entry fun acceptInviteToConversation(nodeOperator: &signer, destinationNode: address, encryptedConversationAddress: string::String, signature: string::String, ack: string::String) {
        let current_operator_address = signer::address_of(nodeOperator);
        let namespace = node_registry::get_node_namespace(current_operator_address);
        let toNode = node_registry::get_node_namespace(destinationNode);
        emit(AcceptInviteToConversation {
            ack,
            signature,
            node: namespace,
            encryptedConversationAddress,
            toNode,
            timestamp: timestamp::now_seconds()
        })
    }


    public entry fun createConversationMarker(nodeOperator: &signer, destinationNode: address, conversationId: string::String, ack: string::String) {
        let current_operator_address = signer::address_of(nodeOperator);
        let namespace = node_registry::get_node_namespace(current_operator_address);
        let toNode = node_registry::get_node_namespace(destinationNode);

        emit(ConversationMarker {
            timestamp: timestamp::now_seconds(),
            node: namespace,
            toNode,
            ack,
            conversationId
        })
    }





}
