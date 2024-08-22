
// 0x...
// @0x...
// ff
export function formatAddressValue(address: string): `0x${string}` {
    if (address.startsWith('0x')) {
        return address as `0x${string}`;
    }

    if (address.startsWith('@')) {
        return address.slice(1) as `0x${string}`;
    }

    return `0x${address}`;
}

export function padAddress(address: `0x${string}`): `0x${string}` {
    const secondPart = address.slice(2);
    const padded = secondPart.padStart(64, '0')

    return `0x${padded}`
}


export function transformTimestampToDate(timestamp: string) {
    const withPadding = `${timestamp}000`
    const parsed = parseInt(withPadding)
    return parsed
}

interface generateAuthRequestTemplateArgs {
    old_node: string,
    new_node: string,
    code: string
    timestamp?: number
    userAddress: string
}
// the change request event needs to be submitted on chain before the change active node request, to enable verification of the event
export function generateAuthRequestTemplate(args: generateAuthRequestTemplateArgs) {
    const { old_node, new_node, code, timestamp, userAddress } = args

    return (
        "NODE CHANGE AUTHORIZATION REQUEST\n" +
        `TO: ${userAddress}\n` +
        `You are about to change your active node provider from ${old_node} to ${new_node}.\n` +
        'The new node will be able to:\n' +
        '- Broadcast your encrypted messages to the network\n' +
        '- Receive messages from the network\n' +
        '- Recieve conversation invites\n' +
        '- Send conversation invites\n' +
        '- Change your active node provider\n' +
        '- Download your ENCRYPTED messages and conversations from the old network\n' +
        '\n' +
        '\n' +
        'Proceed with caution, as the new node will have access to all your ENCRYPTED messages and conversations.\n' +
        'To Proceed, sign this message with your private key.\n' +
        `NONCE: ${code}\n` +
        `REQUESTED BY: ${new_node}\n` +
        `REQUEST TO: ${old_node}\n` +
        `REQUESTED AT: ${timestamp ?? Date.now()}\n`
    )
}
