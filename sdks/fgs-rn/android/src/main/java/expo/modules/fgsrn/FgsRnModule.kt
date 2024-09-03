package expo.modules.fgsrn

import expo.modules.fgsrn.AESUtils
import expo.modules.kotlin.exception.Exceptions
import android.content.Context
import expo.modules.fgsrn.FileEncryptionUtils
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.net.Uri
import java.io.File
import javax.crypto.spec.SecretKeySpec
import java.util.regex.Pattern

private fun slashifyFilePath(path: String?): String? {
  return if (path == null) {
    null
  } else if (path.startsWith("file:///")) {
    path
  } else {
    // Ensure leading schema with a triple slash
    Pattern.compile("^file:/*").matcher(path).replaceAll("file:///")
  }
}


class FileNotReadableException(val path: String) : Exception("File '$path' is not readable")
class FileNotWritableException(val path: String) : Exception("File '$path' is not writable")

fun ensurePathPermission(context: Context, uriString: String, isReadPermission: Boolean = true): File {
    val uri = Uri.parse(uriString)
    val file = if (uri.scheme == "file") {
        File(uri.path!!)
    } else {
        // Handle content URIs
        val inputStream = context.contentResolver.openInputStream(uri)
            ?: throw FileNotReadableException(uriString)
        val tempFile = File.createTempFile("temp", null, context.cacheDir)
        tempFile.outputStream().use { output ->
            inputStream.copyTo(output)
        }
        tempFile
    }

    // Check file existence and readability/writability
    if (!file.exists()) {
        throw FileNotReadableException(file.absolutePath)
    }

    if (isReadPermission && !file.canRead()) {
        throw FileNotReadableException(file.absolutePath)
    }

    if (!isReadPermission && !file.canWrite()) {
        throw FileNotWritableException(file.absolutePath)
    }

    return file
}

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

fun String.toFile(): File {
    return File(this)
}

fun String.toByteArrayUTF8(): ByteArray {
    return this.toByteArray(Charsets.UTF_8)
}

fun ByteArray.toStringUTF8(): String {
    return String(this, Charsets.UTF_8)
}


class FgsRnModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.AppContextLost()
    
  override fun definition() = ModuleDefinition {
    Name("FgsRn")

    AsyncFunction("AEAD_Encrypt"){key: String, plaintext: String, associatedData: String ->
      val key = SecretKeySpec(key.hexStringToByteArray(), "AES")
      val plaintext = plaintext.toByteArrayUTF8()
      val cipher = AESUtils.encrypt(plaintext, key)
      return@AsyncFunction cipher.toHexString()
    }

    AsyncFunction("AEAD_Decrypt"){key: String, encrypted: String, associatedData: String ->
      val key = SecretKeySpec(key.hexStringToByteArray(), "AES")
      val encrypted = encrypted.hexStringToByteArray()
      val plaintext = AESUtils.decrypt(encrypted, key)
      return@AsyncFunction plaintext.toStringUTF8()
    }

    AsyncFunction("EncryptFile") {keyHex: String, fileUri: String, outputFilePath: String  ->
            val inputFile = ensurePathPermission(context, fileUri, isReadPermission = true)
            val outputFile = File(outputFilePath)
            if(!outputFile.exists()) {
                outputFile.createNewFile()
            }
            val key = SecretKeySpec(keyHex.hexStringToByteArray(), "AES")

            if (outputFile.exists()) {
                FileEncryptionUtils.encryptFile(inputFile, outputFile, key)
            } else {
                throw FileNotWritableException(outputFilePath)
            }
        }

    AsyncFunction("DecryptFile"){key: String, inputPath: String, outputPath: String  ->
      val inputFile = inputPath.toFile()
      val outputFile = outputPath.toFile()
      val key = SecretKeySpec(key.hexStringToByteArray(), "AES")
      FileEncryptionUtils.decryptFile(inputFile, outputFile, key)
    }


    View(FgsRnView::class) {
      // Defines a setter for the `name` prop.
      Prop("name") { view: FgsRnView, prop: String ->
        println(prop)
      }
    }
  }
}
