package expo.modules.fgsrn

import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.SecretKey
import javax.crypto.KeyGenerator
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

object AESUtils {
    private const val AES_KEY_SIZE = 256 // 256 bits
    private const val GCM_IV_LENGTH = 12 // 12 bytes for GCM IV
    private const val GCM_TAG_LENGTH = 16 // 16 bytes for GCM Tag

    fun generateAESKey(): SecretKey {
        val keyGen = KeyGenerator.getInstance("AES")
        keyGen.init(AES_KEY_SIZE)
        return keyGen.generateKey()
    }

    fun encrypt(plaintext: ByteArray, key: SecretKey): ByteArray {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val iv = ByteArray(GCM_IV_LENGTH)
        SecureRandom().nextBytes(iv)
        val gcmParameterSpec = GCMParameterSpec(GCM_TAG_LENGTH * 8, iv)
        cipher.init(Cipher.ENCRYPT_MODE, key, gcmParameterSpec)
        val ciphertext = cipher.doFinal(plaintext)
        return iv + ciphertext // Prepend IV to the ciphertext
    }

    fun decrypt(ciphertext: ByteArray, key: SecretKey): ByteArray {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val iv = ciphertext.copyOfRange(0, GCM_IV_LENGTH)
        val actualCiphertext = ciphertext.copyOfRange(GCM_IV_LENGTH, ciphertext.size)
        val gcmParameterSpec = GCMParameterSpec(GCM_TAG_LENGTH * 8, iv)
        cipher.init(Cipher.DECRYPT_MODE, key, gcmParameterSpec)
        return cipher.doFinal(actualCiphertext)
    }
}
