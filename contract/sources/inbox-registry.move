/**
    * This module handles the storage of user inbox identities on chain i.e registering to a namespace etc
**/

module fgs::inbox_registry {

    use std::signer;
    use std::string;
    use std::vector;
    use aptos_framework::account;
    use aptos_framework::event::emit;
    use aptos_framework::timestamp;
    use fgs::node_registry;

    const EOPERATION_NOT_PERMITTED: u64 = 13001;

    const SEED: vector<u8> = b"FEDERATED GM SERVICE::inboxes";

    struct Inbox has key {
        current_node: string::String,
        sign_public_key: string::String, // ed25199 - pub
        encrypt_public_key: string::String, // x25519 - pub
        encrypted_private_key_set: string::String, // ed25199-priv:x25519-priv
        rand_auth_string: string::String,
        prev_nodes: vector<string::String>,
        encrypted_conversation_list: string::String,
        timestamp: u64
    }

    #[event] // shuld only be submitted by the fgs admin account and no other node
    struct RegisterInbox has drop,store {
        current_node: string::String,
        address: address,
        sign_public_key: string::String, // ed25199 - pub
        encrypt_public_key: string::String, // x25519 - pub
        encrypted_private_key_set: string::String, // ed25199-priv:x25519-priv
        rand_auth_string: string::String,
        timestamp: u64
    }

    #[event]
    struct ChangeActiveNode has drop, store {
        node: string::String,
        address: address,
        timestamp: u64
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
        inbox_owner: &signer,
        node: string::String,
        randAuthString: string::String,
        sign_public_key: string::String,
        encrypt_public_key: string::String,
        encrypted_private_key_set: string::String
    ){

        node_registry::get_node_address(node);

        let inbox_address = signer::address_of(inbox_owner);

        move_to(inbox_owner, Inbox {
           encrypted_private_key_set,
            sign_public_key,
            encrypt_public_key,
            timestamp: timestamp::now_seconds(),
            current_node: node,
            rand_auth_string: randAuthString,
            prev_nodes: vector::empty(),
            encrypted_conversation_list: string::utf8(b"")
        });

        emit(RegisterInbox {
            current_node: node,
            address: inbox_address,
            rand_auth_string: randAuthString,
            timestamp: timestamp::now_seconds(),
            encrypt_public_key,
            sign_public_key,
            encrypted_private_key_set
        })
    }


    public entry fun changeActiveNode(inbox_owner: &signer, newNode: string::String) acquires Inbox {
        let inbox_owner_address = signer::address_of(inbox_owner);
        node_registry::get_node_address(newNode); // assets node exists

        let inbox = borrow_global_mut<Inbox>(inbox_owner_address);
        vector::push_back(&mut inbox.prev_nodes, inbox.current_node);

        inbox.current_node = newNode;

        emit(ChangeActiveNode {
            address: inbox_owner_address,
            node: newNode,
            timestamp: timestamp::now_seconds()
        });
    }




}
