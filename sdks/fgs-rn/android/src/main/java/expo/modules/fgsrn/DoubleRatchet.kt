import java.security.KeyFactory
import java.security.KeyPair
import java.security.KeyPairGenerator
import java.security.PublicKey
import java.security.spec.X509EncodedKeySpec
import javax.crypto.Cipher
import javax.crypto.KeyAgreement
import javax.crypto.Mac
import javax.crypto.SecretKey
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.SecretKeySpec
import kotlin.math.ceil
import kotlin.math.floor

data class Header(val publicKey: ByteArray, val previousCounter: Int, val counter: Int)
data class AttachmentHeader(val attachmentType: Int, val attachmentLength: Int)
data class BoxPair(val publicKey: ByteArray, val privateKey: ByteArray)
data class AEADEncryptResult(val ciphertext: ByteArray)
data class AEADDecryptResult(val plaintext: ByteArray, val valid: Boolean)

fun generateHeader(keypair: BoxPair, previousCounter: Int, counter: Int): Header {
    return Header(publicKey = keypair.publicKey, previousCounter = previousCounter, counter = counter)
}

fun parseHeader(headerBuffer: ByteArray): Header? {
    if (headerBuffer.size < 40) {
        println("Header too small")
        return null
    }

    val publicKey = headerBuffer.copyOfRange(0, 32)
    val previousCounter = headerBuffer.copyOfRange(32, 36).toInt()
    val counter = headerBuffer.copyOfRange(36, 40).toInt()

    return Header(publicKey = publicKey, previousCounter = previousCounter, counter = counter)
}

object DoubleRatchetUtils {

    fun hkdfExtract(salt: ByteArray, ikm: ByteArray, hashAlgo: String): ByteArray? {
        val algorithm = when (hashAlgo.lowercase()) {
            "sha256" -> "HmacSHA256"
            "sha1" -> "HmacSHA1"
            "sha512" -> "HmacSHA512"
            else -> {
                println("Unsupported hash algorithm")
                return null
            }
        }

        val mac = Mac.getInstance(algorithm)
        val keySpec = SecretKeySpec(salt, algorithm)
        mac.init(keySpec)
        return mac.doFinal(ikm)
    }

    fun hkdfExpand(prk: ByteArray, info: ByteArray, length: Int, hashAlgo: String): ByteArray? {
        val hashLen = when (hashAlgo.lowercase()) {
            "sha256" -> 32
            "sha1" -> 20
            "sha512" -> 64
            else -> {
                println("Unsupported hash algorithm")
                return null
            }
        }

        val n = ceil(length / hashLen.toDouble()).toInt()
        var okm = ByteArray(0)
        var outputBlock = ByteArray(0)

        for (i in 1..n) {
            val buffer = outputBlock + info + i.toByte()
            val mac = Mac.getInstance(hashAlgo)
            val keySpec = SecretKeySpec(prk, hashAlgo)
            mac.init(keySpec)
            outputBlock = mac.doFinal(buffer)
            okm += outputBlock
        }

        return okm.copyOf(length)
    }

    fun KDF_RK(rk: ByteArray, dhOut: ByteArray): Pair<ByteArray, ByteArray>? {
        val hashAlgo = "HmacSHA256"
        val info = "hermes:protocol".toByteArray()
        val prk = hkdfExtract(rk, dhOut, hashAlgo) ?: return null
        val output = hkdfExpand(prk, info, 64, hashAlgo) ?: return null

        val part1 = output.copyOfRange(0, 32)
        val part2 = output.copyOfRange(32, 64)

        return Pair(part1, part2)
    }

    fun DH(dhPair: Pair<ByteArray, ByteArray>, dhPub: ByteArray): ByteArray? {
        if (dhPair.first.size != 32 || dhPub.size != 32) {
            return null
        }

        val keyFactory = KeyFactory.getInstance("X25519")
        val privateKeySpec = X509EncodedKeySpec(dhPair.first)
        val publicKeySpec = X509EncodedKeySpec(dhPub)

        val privateKey = keyFactory.generatePrivate(privateKeySpec)
        val publicKey = keyFactory.generatePublic(publicKeySpec)

        val keyAgreement = KeyAgreement.getInstance("X25519")
        keyAgreement.init(privateKey)
        keyAgreement.doPhase(publicKey, true)

        return keyAgreement.generateSecret()
    }

    fun KDF_CK(ck: ByteArray): Pair<ByteArray, ByteArray> {
        val constant = byteArrayOf(0x01)

        val mac = Mac.getInstance("HmacSHA256")
        val keySpec = SecretKeySpec(ck, "HmacSHA256")
        mac.init(keySpec)
        val prk = mac.doFinal(constant)

        val info1 = "chain key expansion".toByteArray()
        val info2 = "message key expansion".toByteArray()

        val ckPrime = hkdfExpand(prk, info1, 32, "HmacSHA256")!!
        val mk = hkdfExpand(prk, info2, 32, "HmacSHA256")!!

        return Pair(ckPrime, mk)
    }

    fun AEAD_Encrypt(key: ByteArray, plaintext: ByteArray, associatedData: ByteArray): AEADEncryptResult? {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val secretKey = SecretKeySpec(key, "AES")

        val iv = ByteArray(12)
        SecureRandom().nextBytes(iv)

        val gcmSpec = GCMParameterSpec(128, iv)
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, gcmSpec)
        cipher.updateAAD(associatedData)

        val ciphertext = cipher.doFinal(plaintext)
        return AEADEncryptResult(iv + ciphertext)
    }

    fun AEAD_Decrypt(key: ByteArray, encryptedMessage: ByteArray, associatedData: ByteArray): AEADDecryptResult? {
        val iv = encryptedMessage.copyOfRange(0, 12)
        val ciphertext = encryptedMessage.copyOfRange(12, encryptedMessage.size)

        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val secretKey = SecretKeySpec(key, "AES")
        val gcmSpec = GCMParameterSpec(128, iv)
        cipher.init(Cipher.DECRYPT_MODE, secretKey, gcmSpec)
        cipher.updateAAD(associatedData)

        return try {
            val plaintext = cipher.doFinal(ciphertext)
            AEADDecryptResult(plaintext, true)
        } catch (e: Exception) {
            println("Error decrypting data: ${e.message}")
            AEADDecryptResult(ByteArray(0), false)
        }
    }
}

fun ByteArray.toInt(): Int {
    return this.fold(0) { acc, byte -> (acc shl 8) or (byte.toInt() and 0xFF) }
}
