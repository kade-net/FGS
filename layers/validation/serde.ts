import crypto from 'crypto';

interface generate_random_auth_string_args {
    timestamp?: number
    rand?: string
    inbox_owner: string
}

export function generate_random_auth_string(args: generate_random_auth_string_args) {
    const random_string = args.rand ?? crypto.randomBytes(16).toString('hex')

    return (
        "FGS SECRET SIGNATURE REQUEST\n" +
            "\n" +
            "SIGNING THIS TEXT GENERATES A SECRET THAT WILL ENABLE THIS APP\n"+
            "TO ENCRYPT AND DECRYPT MESSAGES ON YOUR BEHALF.\n" +
            "\n" +
            "ONLY PROCEED IF YOU UNDERSTAND WHAT THIS AUTHORIZATION MEANS!\n" +
            "\n" +
            "----\n" +
            "RAND: " + random_string + "\n" +
            "IDENTITY REGISTRATION TIMESTAMP: "+ (args.timestamp ?? Date.now()) + "\n" +
            "INBOX OWNER: "+ args.inbox_owner + "\n" +
            "---"
    )
}

interface key_set_args {
    signing_key: string
    encryption_key: string
}
export function generate_serialized_key_set(args: key_set_args) {
    return (
        "FGS SECRET KEYS\n"+
            "SIGNING_KEY::"+ args.signing_key + "\n" +
            "ENCRYPTION_KEY::" + args.encryption_key + "\n"
    )
}