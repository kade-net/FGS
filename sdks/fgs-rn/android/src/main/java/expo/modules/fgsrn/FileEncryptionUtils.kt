package expo.modules.fgsrn
import android.util.Log

import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import javax.crypto.SecretKey

object FileEncryptionUtils {

    fun encryptFile(inputFile: File, outputFile: File, key: SecretKey) {
        FileInputStream(inputFile).use { fis ->
            FileOutputStream(outputFile).use { fos ->
                val plaintext = fis.readBytes()
                val ciphertext = AESUtils.encrypt(plaintext, key)
                Log.i("FileEncryptionUtils", "Encrypted file size: ${ciphertext.size}")
                fos.write(ciphertext)
            }
        }
    }

    fun decryptFile(inputFile: File, outputFile: File, key: SecretKey) {
        FileInputStream(inputFile).use { fis ->
            FileOutputStream(outputFile).use { fos ->
                val ciphertext = fis.readBytes()
                val plaintext = AESUtils.decrypt(ciphertext, key)
                Log.i("FileEncryptionUtils", "Decrypted file size: ${plaintext.size}")
                fos.write(plaintext)
            }
        }
    }
}
