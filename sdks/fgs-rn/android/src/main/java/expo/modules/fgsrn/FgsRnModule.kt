package expo.modules.fgsrn

import java.util.*
import expo.modules.fgsrn.AESUtils
import expo.modules.kotlin.exception.Exceptions
import android.content.Context
import expo.modules.fgsrn.FileEncryptionUtils
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.net.Uri
import java.io.File
import java.io.IOException
import javax.crypto.spec.SecretKeySpec
import java.util.regex.Pattern
import androidx.documentfile.provider.DocumentFile
import expo.modules.interfaces.filesystem.Permission
import java.io.FileOutputStream

// public enum class Permission {
//   READ, WRITE,
// }

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


fun createEncryptedFile(context: Context, inputFile: File, encryptedData: ByteArray): Uri {
    // Create the output file with a `.encrypted` suffix
    val encryptedFileName = inputFile.name + ".encrypted"
    val encryptedFile = File(context.cacheDir, encryptedFileName)

    // Write the encrypted data to the file
    FileOutputStream(encryptedFile).use { fos ->
        fos.write(encryptedData)
    }

    // Return the URI of the newly created file
    return Uri.fromFile(encryptedFile)
}

fun getDecryptedFileNameWithRandomness(encryptedFile: File): String {
    val originalFileName = encryptedFile.name.removeSuffix(".encrypted")
    val extension = originalFileName.substringAfterLast('.', "")
    val baseName = originalFileName.substringBeforeLast('.', originalFileName)

    // Add a random string (UUID) to the base name
    val randomSuffix = UUID.randomUUID().toString().take(8)  // Using part of a UUID for randomness

    return if (extension.isNotEmpty()) {
        "$baseName-$randomSuffix.$extension"
    } else {
        "$baseName-$randomSuffix"
    }
}


fun getDecryptedFileName(encryptedFile: File): String {
    return encryptedFile.name.removeSuffix(".encrypted")
}

fun createDecryptedFile(context: Context, encryptedFile: File, decryptedData: ByteArray): Uri {
    // Get the original file name (removing the `.encrypted` suffix)
    val decryptedFileName = getDecryptedFileNameWithRandomness(encryptedFile)
    val decryptedFile = File(context.cacheDir, decryptedFileName)

    // Write the decrypted data to the file
    FileOutputStream(decryptedFile).use { fos ->
        fos.write(decryptedData)
    }

    // Return the URI of the newly created decrypted file
    return Uri.fromFile(decryptedFile)
}


class FileNotReadableException(val path: String) : Exception("File '$path' is not readable")
class FileNotWritableException(val path: String) : Exception("File '$path' is not writable")

fun String.hexStringToByteArray(): ByteArray {
    val len = this.length
    val data = ByteArray(len / 2)
    for (i in 0 until len step 2) {
        data[i / 2] = ((Character.digit(this[i], 16) shl 4) + Character.digit(this[i + 1], 16)).toByte()
    }
    return data
}

fun Uri.toFile() = if (this.path != null) {
  File(this.path!!)
} else {
  throw IOException("Invalid Uri: $this")
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

  private val Uri.isSAFUri: Boolean
    get() = scheme == "content" && host?.startsWith("com.android.externalstorage") ?: false

  private fun parseFileUri(uriStr: String) = uriStr.substring(uriStr.indexOf(':') + 3)

  private fun permissionsForPath(path: String?): EnumSet<Permission>? {
    return appContext.filePermission?.getPathPermissions(context, path)
  }


  private fun getNearestSAFFile(uri: Uri): DocumentFile? {
    val file = DocumentFile.fromSingleUri(context, uri)
    return if (file != null && file.isFile) {
      file
    } else {
      DocumentFile.fromTreeUri(context, uri)
    }
  }

  private fun permissionsForSAFUri(uri: Uri): EnumSet<Permission> {
    val documentFile = getNearestSAFFile(uri)
    return EnumSet.noneOf(Permission::class.java).apply {
      if (documentFile != null) {
        if (documentFile.canRead()) {
          add(Permission.READ)
        }
        if (documentFile.canWrite()) {
          add(Permission.WRITE)
        }
      }
    }
  }

  private fun permissionsForUri(uri: Uri) = when {
    uri.isSAFUri -> permissionsForSAFUri(uri)
    uri.scheme == "content" -> EnumSet.of(Permission.READ)
    uri.scheme == "asset" -> EnumSet.of(Permission.READ)
    uri.scheme == "file" -> permissionsForPath(uri.path)
    uri.scheme == null -> EnumSet.of(Permission.READ)
    else -> EnumSet.noneOf(Permission::class.java)
  }

  @Throws(IOException::class)
  private fun ensurePermission(uri: Uri, permission: Permission, errorMsg: String) {
    if (permissionsForUri(uri)?.contains(permission) != true) {
      throw IOException(errorMsg)
    }
  }

  @Throws(IOException::class)
  private fun ensurePermission(uri: Uri, permission: Permission) {
    if (permission == Permission.READ) {
      ensurePermission(uri, permission, "Location '$uri' isn't readable.")
    }
    if (permission == Permission.WRITE) {
      ensurePermission(uri, permission, "Location '$uri' isn't writable.")
    }
    ensurePermission(uri, permission, "Location '$uri' doesn't have permission '${permission.name}'.")
  }
    
  override fun definition() = ModuleDefinition {
    Name("FgsRn")

    AsyncFunction("AEAD_Encrypt"){key: String, plaintext: String, associatedData: String ->
      val ekey = key.hexStringToByteArray()
      val plaintext = plaintext.toByteArrayUTF8()
      val result = AESUtils.AEAD_Encrypt(ekey,plaintext)
      return@AsyncFunction result!!.ciphertext.toHexString()
    }

    AsyncFunction("AEAD_Decrypt"){key: String, encrypted: String, associatedData: String ->
      val dkey = key.hexStringToByteArray()
      val encrypted = encrypted.hexStringToByteArray()
      val result = AESUtils.AEAD_Decrypt(dkey, encrypted)
      return@AsyncFunction result!!.plaintext.toStringUTF8()
    }
 
    AsyncFunction("EncryptFile") {keyHex: String, fileUri: String  ->
      val inputUri = Uri.parse(slashifyFilePath(fileUri))
      ensurePermission(inputUri, Permission.READ)
      val inputFile = inputUri.toFile()

      val key = keyHex.hexStringToByteArray()

      val newEncryptedFile = AESUtils.EncryptFile(context, key, inputFile)

      return@AsyncFunction newEncryptedFile!!.toString()
    }

    AsyncFunction("DecryptFile"){key: String, inputPath: String  ->
      val inputUri = Uri.parse(slashifyFilePath(inputPath))
      ensurePermission(inputUri, Permission.READ)
      val inputFile = inputUri.toFile()

      val dkey = key.hexStringToByteArray()

      val decryptedFile = AESUtils.DecryptFile(context, dkey, inputFile);
      return@AsyncFunction decryptedFile!!.toString()
    }


    View(FgsRnView::class) {
      // Defines a setter for the `name` prop.
      Prop("name") { view: FgsRnView, prop: String ->
        println(prop)
      }
    }
  }
}
