import { View, Text, Button, Image } from 'react-native'
import React from 'react'
import nacl from 'tweetnacl'
import fgs from 'fgs-rn'
import * as ImagePicker from 'expo-image-picker'

const TestEncDec = () => {
    const [decrypted, setDecrypted] = React.useState<string | null>(null)
    const handleBasicEncryptDecrypt = async () => {
        const key = nacl.randomBytes(32)
        const encryptionKey = '01049eb7881c9bdf2fa44532ed7914396b918e1f68f9517ed4146dd42771183a'

        const plaintext = 'hello world'
        //
        // const ciphertext = await fgs.AEAD_Encrypt(encryptionKey, plaintext, Buffer.from(new Uint8Array()).toString('hex'))
        //
        const ciphertext = '9d27f284e11eb4fc78d9fb801e8a3f5865114eec3dfb7f67469e7fa6d8a579d469092934323efe';
        console.log("Current cipher::", ciphertext)
        // const ciphertext = "e07879c13a711b539f171a93f5ae9015201b05e0d16cbc984a22995c"
        //
        //
        const decrypted = await fgs.AEAD_Decrypt(encryptionKey, ciphertext, Buffer.from(new Uint8Array()).toString('hex'))
        //
        console.log("decrypted::", decrypted)
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