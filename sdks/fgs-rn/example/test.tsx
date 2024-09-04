import { View, Text, Button, Image } from 'react-native'
import React from 'react'
import nacl from 'tweetnacl'
import fgs from 'fgs-rn'
import * as ImagePicker from 'expo-image-picker'

const TestEncDec = () => {
    const [decrypted, setDecrypted] = React.useState<string | null>(null)
    const handleBasicEncryptDecrypt = async () => {
        const key = nacl.randomBytes(32)
        const encryptionKey = Buffer.from(key).toString('hex')

        const plaintext = 'hello world'

        const ciphertext = await fgs.AEAD_Encrypt(encryptionKey, plaintext, "")

        console.log("ciphertext::", ciphertext)

        const decrepted = await fgs.AEAD_Decrypt(encryptionKey, ciphertext, "")

        console.log("decrypted::", decrepted)
    }

    const handleAssetEncryptDecrypt = async () => {
        const key = nacl.randomBytes(32)
        const keyAsString = Buffer.from(key).toString('hex')
        const p = await ImagePicker.requestMediaLibraryPermissionsAsync()
        p.status !== 'granted' && console.log("Permission not granted")
        const result = await ImagePicker.launchImageLibraryAsync({
        })

        const mainAsset = result.assets![0]

        console.log("main asset::", mainAsset.uri)
        console.log("key::", keyAsString)
        const encryptedFile = await fgs.EncryptFile(keyAsString, mainAsset.uri)
        console.log("encrypted file::", encryptedFile)
        // console.log("encrypted url::", encryptedUrl)

        // const decryptedUrl = mainAsset.uri?.replace('.png', 'cool-stuff.png')

        const decrypted = await fgs.DecryptFile(keyAsString, encryptedFile)

        console.log("decrypted url::", decrypted)

        setDecrypted(decrypted)
    }

    return (
        <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
        }} >
            <Button
                title="Basic Encrypt Decrypt"
                onPress={handleBasicEncryptDecrypt}
            />
            <Button
                title="Basic Encrypt Decrypt File"
                onPress={handleAssetEncryptDecrypt}
            />
            {
                decrypted && <Image
                    source={{
                        uri: decrypted
                    }}
                    style={{
                        width: 200,
                        height: 200
                    }}
                />
            }
        </View>
    )
}

export default TestEncDec