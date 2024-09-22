package expo.modules.fgsrn

import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.SecretKey
import javax.crypto.KeyGenerator
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec
import android.content.Context
import java.io.File
import java.io.FileOutputStream
import android.net.Uri
import expo.modules.kotlin.exception.Exceptions
import java.util.*
import java.io.IOException
import java.nio.ByteBuffer
import java.nio.ByteOrder

data class AEADEncryptResult(val ciphertext: ByteArray)
data class AEADDecryptResult(val plaintext: ByteArray, val valid: Boolean)

object AESUtils {
    private const val AES_KEY_SIZE = 256 // 256 bits
    private const val GCM_IV_LENGTH = 12 // 12 bytes for GCM IV
    private const val GCM_TAG_LENGTH = 16 // 16 bytes for GCM Tag


        fun AEAD_Encrypt(key: ByteArray, plaintext: ByteArray, associatedData: ByteArray? = null): AEADEncryptResult? {
            val iv = ByteArray(12)
            SecureRandom().nextBytes(iv)

            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            val gcmSpec = GCMParameterSpec(128, iv)
            val secretKey = SecretKeySpec(key, "AES")
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, gcmSpec)

            associatedData?.let {
                cipher.updateAAD(it)
            }

            val ciphertext = cipher.doFinal(plaintext)
            return AEADEncryptResult(iv + ciphertext)
        }

        fun AEAD_Decrypt(key: ByteArray, encryptedMessage: ByteArray, associatedData: ByteArray? = null): AEADDecryptResult? {
            val iv = encryptedMessage.copyOfRange(0, 12)
            val ciphertext = encryptedMessage.copyOfRange(12, encryptedMessage.size - 16)
            val tag = encryptedMessage.copyOfRange(encryptedMessage.size - 16, encryptedMessage.size)

            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            val gcmSpec = GCMParameterSpec(128, iv)
            val secretKey = SecretKeySpec(key, "AES")
            cipher.init(Cipher.DECRYPT_MODE, secretKey, gcmSpec)

            associatedData?.let {
                cipher.updateAAD(it)
            }

            return try {
                val plaintext = cipher.doFinal(ciphertext + tag)
                AEADDecryptResult(plaintext, true)
            } catch (e: Exception) {
                AEADDecryptResult(ByteArray(0), false)
            }
        }

    fun EncryptFile(context: Context, key: ByteArray, inputFile: File): Uri? {
        val bufferSize = 64 * 1024 // 64 KB, same as in iOS
        var chunkIndex: Int = 0

        val encryptedFileName = inputFile.name + ".encrypted"
        val encryptedFile = File(context.cacheDir, encryptedFileName)

        try {
            inputFile.inputStream().use { inputStream ->
                encryptedFile.outputStream().use { outputStream ->
                    val buffer = ByteArray(bufferSize)
                    var bytesRead: Int
                    while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                        val chunkData = if (bytesRead < bufferSize) {
                            buffer.copyOf(bytesRead)
                        } else {
                            buffer
                        }

                        // Construct a nonce with chunk index and pad it to 12 bytes (for AES GCM)
                        val associatedData = ByteBuffer.allocate(4)
                                                .order(ByteOrder.BIG_ENDIAN)
                                                .putInt(chunkIndex)
                                                .array()
                        chunkIndex++

                        // Encrypt the chunk
                        val encryptedChunk = AESUtils.AEAD_Encrypt(key, chunkData, associatedData)?.ciphertext
                        if (encryptedChunk == null) {
                            throw IOException("Error encrypting chunk $chunkIndex")
                        }

                        // Write the encrypted chunk to the file
                        outputStream.write(encryptedChunk)
                    }
                }
            }
        } catch (e: IOException) {
            e.printStackTrace()
            return null
        }

        return Uri.fromFile(encryptedFile)
    }

    fun DecryptFile(context: Context, key: ByteArray, encryptedFile: File): Uri? {
        val bufferSize = 64 * 1024 + 16 + 12 // 64 KB + 16 bytes for tag + 12 bytes for IV (nonce)
        var chunkIndex: Int = 0

        val decryptedFileName = getDecryptedFileNameWithRandomness(encryptedFile)
        val decryptedFile = File(context.cacheDir, decryptedFileName)

        try {
            encryptedFile.inputStream().use { inputStream ->
                decryptedFile.outputStream().use { outputStream ->
                    val buffer = ByteArray(bufferSize)
                    var bytesRead: Int
                    while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                        val chunkData = if (bytesRead < bufferSize) {
                            buffer.copyOf(bytesRead)
                        } else {
                            buffer
                        }

                        // Extract the nonce for this chunk (first 12 bytes)
                        val associatedData = ByteBuffer.allocate(4)
                                                .order(ByteOrder.BIG_ENDIAN)
                                                .putInt(chunkIndex)
                                                .array()
                        chunkIndex++

                        // Decrypt the chunk
                        val decryptedChunk = AESUtils.AEAD_Decrypt(key, chunkData, associatedData)?.plaintext
                        if (decryptedChunk == null) {
                            throw IOException("Error decrypting chunk $chunkIndex")
                        }

                        // Write the decrypted chunk to the file
                        outputStream.write(decryptedChunk)
                    }
                }
            }
        } catch (e: IOException) {
            e.printStackTrace()
            return null
        }

        return Uri.fromFile(decryptedFile)
    }


}
