import 'react-native-get-random-values'
import { Button, StyleSheet, Text, View } from 'react-native';
import { aptos, Client, Conversation, getInbox, getUpdateConversationListTransaction, MESSAGE_TYPE } from 'fgs-rn'
import { useEffect, useState } from 'react';
import {Buffer} from 'buffer'
import {Account, Ed25519PrivateKey} from "@aptos-labs/ts-sdk";
import * as ImagePicker from 'expo-image-picker'
import TestEncDec from './test';

const account = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey('0xa1a70f9dc2a1b7ac30d9a05ab2fe3e01b68220810b774613cc7910ada2b00f06') // bob
})

export default function App() {
  const [client, setClient] = useState<Client | null>(null)

  useEffect(() => {
    console.log("stuff")
    ; (async () => {
      const inbox = await getInbox(account.accountAddress.toString())

      const secret_signature = account.sign(
          Buffer.from(inbox.rand_auth_string, 'utf-8')
      )

      console.log("account address::", inbox)

      const client = await Client.init({
        inbox_address: account.accountAddress.toString(),
        secret_signature: Buffer.from(secret_signature.toUint8Array()).toString('hex')
      })

      setClient(client)

      const invitations = await client.loadInvites()

      console.log("Invitations::", invitations)
    })()
  }, [])

  const handleCreateConversation = async () => {
    const newConversationList = await Conversation.createConversation(client!, {
      participants: [
        "0x1a76e876cf1e9599a3eaf29a9560cd16128708cf55a767ccf72cbdab48428761"
      ]
    })


    const transaction = await getUpdateConversationListTransaction(account.accountAddress.toString(), {
      newConversationList
    })

    const commitedTxn = await aptos.transaction.signAndSubmitTransaction({
      transaction,
      signer: account
    })

    const status = await aptos.waitForTransaction({
      transactionHash: commitedTxn.hash
    })

    if (status.success) {
      console.log("success")
    }
    else {
      console.log("fail")
    }
  }

  const handleAcceptInvitation = async () => {
    const conversation_header = await Conversation.acceptInvite(client!, {
      invitation_id: 'fgs://test:invitation:c13b7c9d7dc841956291397e99313da0'
    })

    const updatedConversationList = await client!.getNewEncryptedConversationList(conversation_header)

    const transaction = await getUpdateConversationListTransaction(account.accountAddress.toString(), {
      newConversationList: updatedConversationList
    })

    const commitedTxn = await aptos.transaction.signAndSubmitTransaction({
      transaction,
      signer: account
    })

    const status = await aptos.waitForTransaction({
      transactionHash: commitedTxn.hash
    })

    if (status.success) {
      console.log("success")
    }
    else {
      console.log("fail")
    }
  }

  const handleRejectInvitation = async () => {
    const ack = await Conversation.rejectInvite(client!, {
      invitation_id: 'fgs://test:invitation:c13b7c9d7dc841956291397e99313da0'
    })

    console.log("Acknowledged ::", ack.submitSignedActivity)
  }

  const handleSendMessage = async () => {

    const conversation = await client!.conversation('fgs://test:conversation:60ecde3d4bb43ee4fd74d4650bd56cdb')

    const ack = await conversation?.sendMessage({
      content: 'Hello World!',
      type: MESSAGE_TYPE.MESSAGE,
      attachments: []
    })

    console.log("Ack::", ack)
  }

  const handleSendMessageWithAttachment = async () => {
    const conversation = await client!.conversation('fgs://test:conversation:60ecde3d4bb43ee4fd74d4650bd56cdb')

    const result = await ImagePicker.launchImageLibraryAsync({

    })

    const mainAsset = result.assets?.at(0)

    if (!mainAsset) {
      throw new Error("Failed to launch ImageLibrary")
    }


    const encryptedFile = await conversation?.encryptFile(mainAsset.uri)

    console.log("encryptedFile::", encryptedFile)

  }

  return (
    <View style={styles.container}>
      <TestEncDec />
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
