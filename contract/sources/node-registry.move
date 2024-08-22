/**
    This file contains the description of an onchain registry for all nodes in the FGS registry
**/
module fgs::node_registry {

    use std::option;
    use std::signer;
    use std::string;
    use aptos_framework::account;
    use aptos_framework::event::emit;
    use aptos_framework::object;
    use aptos_framework::timestamp;
    use aptos_token_objects::collection;
    use aptos_token_objects::token;
    use fgs::utils;
    #[test_only]
    use std::vector;
    #[test_only]
    use aptos_std::debug;
    #[test_only]
    use aptos_framework::event::emitted_events;


    const ENAMESPACE_ALREADY_CLAIMED: u64 = 10023;
    const EOPERATION_NOT_PERMITTED: u64 = 10024;
    const ENAMESPACE_DOES_NOT_EXIST: u64 = 10025;

    const SEED: vector<u8> = b"FEDERATED GM SERVICE::nodes";
    const NODE_COLLECTION_NAME: vector<u8> = b"Federated GM Registry";
    const NODE_DESCRIPTION: vector<u8> = b"A Node Of The Federated GM Registry";
    const COLLECTION_URI: vector<u8> = b"https://kade.network";



    struct Node has key, store {
        namespace: string::String,
        protocol_endpoint: string::String,
        active: bool,
        node_id: u64,
        created_at: u64,
        public_key: string::String
    }

    struct LocalReference has key, store, copy, drop {
        namespace: string::String,
        token_address: address,
    }

    struct NodeReturn has store, drop, copy {
        namespace: string::String,
        protocol_endpoint: string::String,
        active: bool,
        node_id: u64,
        created_at: u64
    }

    #[event]
    struct NodeUpdate has store, drop, copy {
        namespace: string::String,
        protocol_endpoint: string::String,
        active: bool,
        node_id: u64,
        timestamp: u64,
        update_type: string::String, // - can be create | update | deactivate | activate
        public_key: string::String,
    }

    struct State has key {
        signer_capability: account::SignerCapability,
        node_count: u64
    }

    fun init_module(admin: &signer) {
        let (resource_signer, signer_capability) = account::create_resource_account(admin, SEED);

        collection::create_unlimited_collection(
            &resource_signer,
            string::utf8(NODE_DESCRIPTION),
            string::utf8(NODE_COLLECTION_NAME),
            option::none(),
            string::utf8(COLLECTION_URI)
        );

        move_to(&resource_signer, State {
            signer_capability,
            node_count: 100
        })

    }

    fun internal_create_namespace(operator: &signer, namespace: string::String, endpoint: string::String, publicKey: string::String) acquires State {
        let operator_address = signer::address_of(operator);
        utils::assert_has_no_special_characters(namespace);
        assert_namespace_does_not_exist(namespace);
        utils::assert_not_empty_string(endpoint);
        let resource_address = account::create_resource_address(&@fgs, SEED);

        let state = borrow_global_mut<State>(resource_address);
        let resource_signer = account::create_signer_with_capability(&state.signer_capability);

        let constructor_ref = token::create_named_token(
                &resource_signer,
            string::utf8(NODE_COLLECTION_NAME),
            string::utf8(NODE_DESCRIPTION),
            namespace,
            option::none(),
            string::utf8(COLLECTION_URI)
        );

        let token_signer = object::generate_signer(&constructor_ref);
        let token_address = object::address_from_constructor_ref(&constructor_ref);


        move_to(&token_signer, Node {
            namespace,
            active: true,
            node_id: state.node_count,
            protocol_endpoint: endpoint,
            created_at: timestamp::now_seconds(),
            public_key: publicKey
        });

        move_to(operator, LocalReference {
            namespace,
            token_address
        });

        let node_obj = object::object_from_constructor_ref<Node>(&constructor_ref);

        object::transfer(&resource_signer, node_obj, operator_address);

        object::disable_ungated_transfer(
            &object::generate_transfer_ref(&constructor_ref)
        );

        emit(NodeUpdate {
            protocol_endpoint: endpoint,
            node_id: state.node_count,
            active: true,
            namespace,
            timestamp: timestamp::now_seconds(),
            update_type: string::utf8(b"create"),
            public_key: publicKey
        });

        state.node_count = state.node_count + 1;
    }

    fun assert_namespace_does_not_exist(namespace: string::String) {
        let resource_address = account::create_resource_address(&@fgs, SEED);
        let token_address = token::create_token_address(&resource_address, &string::utf8(NODE_COLLECTION_NAME), &namespace);

        let is_object = object::is_object(token_address);

        assert!(!is_object, ENAMESPACE_ALREADY_CLAIMED);
        assert!(!exists<Node>(token_address), ENAMESPACE_ALREADY_CLAIMED);

    }

    public entry fun fgs_register_namespace(admin: &signer, operator: &signer, namespace: string::String, endpoint: string::String, publicKey: string::String) acquires State {
        assert!(signer::address_of(admin) == @fgs, EOPERATION_NOT_PERMITTED);
        internal_create_namespace(operator,namespace, endpoint, publicKey);
    }


    #[view]
    public fun get_node_details(namespace: string::String): NodeReturn acquires Node {
        let resource_address = account::create_resource_address(&@fgs, SEED);

        let token_address = token::create_token_address(&resource_address, &string::utf8(NODE_COLLECTION_NAME), &namespace);

        let is_object = object::is_object(token_address);

        assert!(is_object, ENAMESPACE_DOES_NOT_EXIST);
        assert!(exists<Node>(token_address), ENAMESPACE_DOES_NOT_EXIST);

        let node = borrow_global<Node>(token_address);

        let details = NodeReturn {
            namespace: node.namespace,
            created_at: node.created_at,
            active: node.active,
            node_id: node.node_id,
            protocol_endpoint: node.protocol_endpoint
        };

        return details
    }

    #[view]
    public fun get_node_details_from_address(operator_address: address): NodeReturn acquires Node, LocalReference {
        let ref = borrow_global<LocalReference>(operator_address);

        let details = get_node_details(ref.namespace);

        return details
    }


    #[view]
    public fun get_node_namespace(operator_address: address): string::String acquires LocalReference {
        let ref = borrow_global<LocalReference>(operator_address);

        return ref.namespace
    }

    #[test_only]
    public fun dependancy_test_init_module(admin: &signer){
        init_module(admin)
    }

    #[test]
    public fun test_register_node() acquires State, Node {
        let admin = account::create_account_for_test(@fgs);
        let operator = account::create_account_for_test(@kade);
        let aptos_admin = account::create_account_for_test(@0x1);

        timestamp::set_time_has_started_for_testing(&aptos_admin);

        init_module(&admin);

        fgs_register_namespace(&admin, &operator,string::utf8(b"kade"), string::utf8(b"fgs.kade.network"), string::utf8(b""));

        let node = get_node_details(string::utf8(b"kade"));

        debug::print(&node);

        let events = emitted_events<NodeUpdate>();

        assert!(vector::length(&events) == 1, 100);

        debug::print(&events);
    }

}
