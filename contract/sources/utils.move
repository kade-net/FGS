module fgs::utils {

    use std::string;
    use std::vector;
    friend fgs::node_registry;

    const EINVALID_NAME: u64 = 1111;
    const EEMPTY_STRING: u64 = 1112;

    public(friend) fun assert_has_no_special_characters(username: string::String){

        let string_length = string::length(&username);
        assert!(string_length < 16, EINVALID_NAME);
        let index_of_empty_string = string::index_of(&username, &string::utf8(b" "));
        assert!(index_of_empty_string == string_length, EINVALID_NAME);

        let special_characters = vector::empty<string::String>();
        vector::push_back(&mut special_characters, string::utf8(b"!"));
        vector::push_back(&mut special_characters, string::utf8(b"@"));
        vector::push_back(&mut special_characters, string::utf8(b"#"));
        vector::push_back(&mut special_characters, string::utf8(b"$"));
        vector::push_back(&mut special_characters, string::utf8(b"%"));
        vector::push_back(&mut special_characters, string::utf8(b"^"));
        vector::push_back(&mut special_characters, string::utf8(b"&"));
        vector::push_back(&mut special_characters, string::utf8(b"*"));
        vector::push_back(&mut special_characters, string::utf8(b"("));
        vector::push_back(&mut special_characters, string::utf8(b")"));
        vector::push_back(&mut special_characters, string::utf8(b"-"));
        vector::push_back(&mut special_characters, string::utf8(b"+"));
        vector::push_back(&mut special_characters, string::utf8(b"="));
        vector::push_back(&mut special_characters, string::utf8(b"["));
        vector::push_back(&mut special_characters, string::utf8(b"]"));
        vector::push_back(&mut special_characters, string::utf8(b"{"));
        vector::push_back(&mut special_characters, string::utf8(b"}"));
        vector::push_back(&mut special_characters, string::utf8(b"|"));
        vector::push_back(&mut special_characters, string::utf8(b";"));
        vector::push_back(&mut special_characters, string::utf8(b":"));
        vector::push_back(&mut special_characters, string::utf8(b"'"));
        vector::push_back(&mut special_characters, string::utf8(b"\""));
        vector::push_back(&mut special_characters, string::utf8(b"<"));
        vector::push_back(&mut special_characters, string::utf8(b">"));
        vector::push_back(&mut special_characters, string::utf8(b","));
        vector::push_back(&mut special_characters, string::utf8(b"."));
        vector::push_back(&mut special_characters, string::utf8(b"/"));
        vector::push_back(&mut special_characters, string::utf8(b"?"));
        vector::push_back(&mut special_characters, string::utf8(b"`"));
        vector::push_back(&mut special_characters, string::utf8(b"~"));
        vector::push_back(&mut special_characters, string::utf8(b" "));
        vector::push_back(&mut special_characters, string::utf8(b"\t"));
        vector::push_back(&mut special_characters, string::utf8(b"\n"));
        vector::push_back(&mut special_characters, string::utf8(b"\r"));
        vector::push_back(&mut special_characters, string::utf8(b"\0"));
        vector::push_back(&mut special_characters, string::utf8(b"A"));
        vector::push_back(&mut special_characters, string::utf8(b"B"));
        vector::push_back(&mut special_characters, string::utf8(b"C"));
        vector::push_back(&mut special_characters, string::utf8(b"D"));
        vector::push_back(&mut special_characters, string::utf8(b"E"));
        vector::push_back(&mut special_characters, string::utf8(b"F"));
        vector::push_back(&mut special_characters, string::utf8(b"G"));
        vector::push_back(&mut special_characters, string::utf8(b"H"));
        vector::push_back(&mut special_characters, string::utf8(b"I"));
        vector::push_back(&mut special_characters, string::utf8(b"J"));
        vector::push_back(&mut special_characters, string::utf8(b"K"));
        vector::push_back(&mut special_characters, string::utf8(b"L"));
        vector::push_back(&mut special_characters, string::utf8(b"M"));
        vector::push_back(&mut special_characters, string::utf8(b"N"));
        vector::push_back(&mut special_characters, string::utf8(b"O"));
        vector::push_back(&mut special_characters, string::utf8(b"P"));
        vector::push_back(&mut special_characters, string::utf8(b"Q"));
        vector::push_back(&mut special_characters, string::utf8(b"R"));
        vector::push_back(&mut special_characters, string::utf8(b"S"));
        vector::push_back(&mut special_characters, string::utf8(b"T"));
        vector::push_back(&mut special_characters, string::utf8(b"U"));
        vector::push_back(&mut special_characters, string::utf8(b"V"));
        vector::push_back(&mut special_characters, string::utf8(b"W"));
        vector::push_back(&mut special_characters, string::utf8(b"X"));
        vector::push_back(&mut special_characters, string::utf8(b"Y"));
        vector::push_back(&mut special_characters, string::utf8(b"Z"));

        let current_index = 0;
        let special_characters_length = vector::length(&special_characters);
        while(current_index < special_characters_length) {
            let special_character = vector::borrow(&special_characters, current_index);
            let index_of_special_character = string::index_of(&username, special_character);
            assert!(index_of_special_character == string_length, EINVALID_NAME);
            current_index = current_index + 1;
        }

    }

    public(friend) fun assert_not_empty_string(value: string::String) {
        let string_length = string::length(&value);

        let index_of_empty_string = string::index_of(&value, &string::utf8(b" "));
        assert!(index_of_empty_string == string_length, EEMPTY_STRING);

        assert!(string_length > 0, EEMPTY_STRING);
    }
}
