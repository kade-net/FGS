package expo.modules.fgsrn

import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.SecretKey
import javax.crypto.KeyGenerator
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec


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
}
