import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.net.Uri

class FileNotReadableException(val path: String) : Exception("File '$path' is not readable")
class FileNotWritableException(val path: String) : Exception("File '$path' is not writable")

class FgsRnModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("FgsRn")

    Constants(
            mapOf(
                    "PI" to Math.PI
            )
    )

    AsyncFunction("hkdfExtract") { salt: String, ikm: String, hashAlgo: String ->
      val saltData = salt.hexStringToByteArray()
      val ikmData = ikm.hexStringToByteArray()
      val result = DoubleRatchetUtils.hkdfExtract(saltData, ikmData, hashAlgo)
      result?.toHexString()
    }

    AsyncFunction("KDF_RK") { rk: String, dhOut: String ->
      val rkData = rk.hexStringToByteArray()
      val dhOutData = dhOut.hexStringToByteArray()
      val result = DoubleRatchetUtils.KDF_RK(rkData, dhOutData)
      result?.let {
        mapOf(
                "rk" to it.first.toHexString(),
                "ck" to it.second.toHexString()
        )
      }
    }

    Function("KDF_RKSync") { rk: String, dhOut: String ->
      val rkData = rk.hexStringToByteArray()
      val dhOutData = dhOut.hexStringToByteArray()
      val result = DoubleRatchetUtils.KDF_RK(rkData, dhOutData)
      result?.let {
        mapOf(
                "rk" to it.first.toHexString(),
                "ck" to it.second.toHexString()
        )
      }
    }

    AsyncFunction("DH") { privateKey: String, publicKey: String, dhPub: String ->
      val privateKeyData = privateKey.hexStringToByteArray()
      val publicKeyData = publicKey.hexStringToByteArray()
      val dhPubData = dhPub.hexStringToByteArray()
      val result = DoubleRatchetUtils.DH(Pair(privateKeyData, publicKeyData), dhPubData)
      result?.toHexString()
    }

    Function("DHSync") { privateKey: String, publicKey: String, dhPub: String ->
      val privateKeyData = privateKey.hexStringToByteArray()
      val publicKeyData = publicKey.hexStringToByteArray()
      val dhPubData = dhPub.hexStringToByteArray()
      val result = DoubleRatchetUtils.DH(Pair(privateKeyData, publicKeyData), dhPubData)
      result?.toHexString()
    }

    AsyncFunction("KDF_CK") { ck: String ->
      val ckData = ck.hexStringToByteArray()
      val result = DoubleRatchetUtils.KDF_CK(ckData)
      mapOf(
              "ckPrime" to result.first.toHexString(),
              "mk" to result.second.toHexString()
      )
    }

    Function("KDF_CKSync") { ck: String ->
      val ckData = ck.hexStringToByteArray()
      val result = DoubleRatchetUtils.KDF_CK(ckData)
      mapOf(
              "ckPrime" to result.first.toHexString(),
              "mk" to result.second.toHexString()
      )
    }

    AsyncFunction("AEAD_Encrypt") { key: String, plaintext: String, associatedData: String ->
      val keyData = key.hexStringToByteArray()
      val plaintextData = plaintext.hexStringToByteArray()
      val associatedDataData = associatedData.hexStringToByteArray()
      val result = DoubleRatchetUtils.AEAD_Encrypt(keyData, plaintextData, associatedDataData)
      result?.ciphertext?.toHexString()
    }

    AsyncFunction("AEAD_Decrypt") { key: String, encryptedMessage: String, associatedData: String ->
      val keyData = key.hexStringToByteArray()
      val encryptedMessageData = encryptedMessage.hexStringToByteArray()
      val associatedDataData = associatedData.hexStringToByteArray()
      val result = DoubleRatchetUtils.AEAD_Decrypt(keyData, encryptedMessageData, associatedDataData)
      result?.let {
        mapOf(
                "valid" to it.valid,
                "plaintext" to it.plaintext.toHexString()
        )
      } ?: mapOf(
              "valid" to false,
              "plaintext" to ""
      )
    }

    AsyncFunction("EncryptFile") { key: String, fileUrl: String ->
      val uri = Uri.parse(fileUrl)
      ensurePathPermission(uri, read = true)

      val keyData = key.hexStringToByteArray()
      val encryptedFileUrl = DoubleRatchetUtils.EncryptFile(keyData, uri)
      encryptedFileUrl
    }

    AsyncFunction("DecryptFile") { key: String, fileUrl: String ->
      val uri = Uri.parse(fileUrl)
      ensurePathPermission(uri, read = true)

      val keyData = key.hexStringToByteArray()
      val decryptedFileUrl = DoubleRatchetUtils.DecryptFile(keyData, uri)
      decryptedFileUrl
    }
  }

  private fun ensurePathPermission(uri: Uri, read: Boolean) {
    // Implement permission checking logic here, possibly using Android's storage access framework
    // If permissions are not granted, throw FileNotReadableException or FileNotWritableException
  }
}

// Extension functions for hex string conversion
fun String.hexStringToByteArray(): ByteArray {
  val len = this.length
  val data = ByteArray(len / 2)
  for (i in 0 until len step 2) {
    data[i / 2] = ((Character.digit(this[i], 16) shl 4) + Character.digit(this[i + 1], 16)).toByte()
  }
  return data
}

fun ByteArray.toHexString(): String {
  return this.joinToString("") { "%02x".format(it) }
}
