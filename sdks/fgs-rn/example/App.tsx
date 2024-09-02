import { StyleSheet, Text, View } from 'react-native';
import {Client, Conversation, getInbox} from 'fgs-rn'
import { useEffect } from 'react';
import {Buffer} from 'buffer'
import {Account, Ed25519PrivateKey} from "@aptos-labs/ts-sdk";

const account = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey('0xe8fe155bf93952cf6b787d120362aed690f17564dba0d68724da6960da856a20')
})

export default function App() {

  useEffect(() => {
    ; (async () => {
      const inbox = await getInbox(account.accountAddress.toString())
      const secret_signature = account.sign(
          Buffer.from(inbox.rand_auth_string, 'utf-8')
      )

      const client = await Client.init({
        inbox_address: account.accountAddress.toString(),
        secret_signature: Buffer.from(secret_signature.toUint8Array()).toString('hex')
      })

      console.log(client.onChainNode)


    })()
  }, [])
  return (
    <View style={styles.container}>
      <Text>Hello there</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
