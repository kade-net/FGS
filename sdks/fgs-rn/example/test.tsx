import { View, Text, Button, Image } from 'react-native'
import React from 'react'
import nacl from 'tweetnacl'
import fgs from 'fgs-rn'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import {ba} from "@aptos-labs/ts-sdk/dist/common/accountAddress-LOYE4_sG";

function extractFileName(uri: string){
    return uri?.replace('https://', '')?.split('/').pop()
}

const TestEncDec = () => {
    const [decrypted, setDecrypted] = React.useState<string | null>(null)

    const downloadAndProcessEncrypted = async () => {
        const URI = 'https://d35fqrnmq0pxki.cloudfront.net/uploads/0xdcd4b89cb26c3903c247c9ab17d096f4c43842e9205d9d7475bc287c9569d1f8/1e4b0e7e00f38a563c106c222f094f27-1000034615.jpg.encrypted'

        const ENCRYPTION_KEY = 'dd6976e28d8ddf5a0457cff4f98a1982d40310c54b34d1a7d2db1ab95b73afa8'

        let fileName = extractFileName(URI)
        fileName = `${FileSystem.documentDirectory}${fileName}`
        const res = await FileSystem.downloadAsync(URI, fileName)
        const base64 = await FileSystem.readAsStringAsync(fileName, {
            encoding: 'base64'
        })

        const decrypted = await fgs.DecryptFile(ENCRYPTION_KEY, res.uri)

        console.log("decrypted::", decrypted)

        const decryptedData = await FileSystem.readAsStringAsync(decrypted, {
            encoding: 'base64'
        })

        console.log("decryptedData::", decryptedData.slice(0,1000))

        setDecrypted(decrypted)
        //
        // console.log("Start : \n", base64.slice(0,1000))
        // console.log("End : \n", base64.slice(base64.length - 1000))
    }

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
        await FileSystem.deleteAsync(mainAsset.uri)

        const encryptedData = await FileSystem.readAsStringAsync(encryptedFile, {
            encoding: 'base64'
        })

        console.log("encryptedData::", encryptedData.slice(0,500))
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

            <Button title={'File Data'} onPress={downloadAndProcessEncrypted} />
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