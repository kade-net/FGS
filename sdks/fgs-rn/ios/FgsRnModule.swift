import CryptoKit;
import ExpoModulesCore;

struct DecryptionResult {
  let valid: Bool
  let plaintext: String
}

final class FileNotReadableException: GenericException<String> {
  override var reason: String {
    "File '\(param)' is not readable"
  }
}

func ensurePathPermission(_ appContext: AppContext?, path: String, flag: EXFileSystemPermissionFlags) throws {
  guard let permissionsManager: EXFilePermissionModuleInterface = appContext?.legacyModule(implementing: EXFilePermissionModuleInterface.self) else {
    throw Exceptions.PermissionsModuleNotFound()
  }
  guard permissionsManager.getPathPermissions(path).contains(flag) else {
    throw flag == .read ? FileNotReadableException(path) : FileNotWritableException(path)
  }
}

final class FileNotWritableException: GenericException<String> {
  override var reason: String {
    "File '\(param)' is not writable"
  }
}

public class FgsRnModule: Module {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('FgsRn')` in JavaScript.
    Name("FgsRn")

    // Sets constant properties on the module. Can take a dictionary or a closure that returns a dictionary.
    Constants([
      "PI": Double.pi
    ])

        AsyncFunction("AEAD_Encrypt"){(key: String, plaintext: String, associatedData: String) in
            let keyData = Data(hexString: key)
            let plaintextData = plaintext.data(using: .utf8)!
            let associatedDataData = Data(hexString: associatedData)
            let result = AESUtils.AEAD_Encrypt(key: keyData, plaintext: plaintextData, associatedData: associatedDataData)
            return result?.ciphertext.hexEncodedString()
        }

        AsyncFunction("AEAD_Decrypt"){(key: String, encryptedMessage: String, associatedData: String) in
            let keyData = Data(hexString: key)
            let encryptedMessageData = Data(hexString: encryptedMessage)
            let associatedDataData = Data(hexString: associatedData)
            guard let result = AESUtils.AEAD_Decrypt(key: keyData, encryptedMessage: encryptedMessageData, associatedData: associatedDataData) else {
              let dict: [String : Any?] = [
                "valid": false,
                "plaintext": ""
              ]
              return dict
            }
            let dict: [String : Any?] = [
              "valid": result.valid,
              "plaintext": String(data: result.plaintext, encoding: .utf8)
            ]
            return dict
        }

        AsyncFunction("EncryptFile"){(key: String, fileUrl: URL) in

            try ensurePathPermission(appContext, path: fileUrl.path, flag: .read)

            let keyData = Data(hexString: key)
            let encryptedFileUrl = AESUtils.EncryptFile(key: keyData, fileUrl: fileUrl)

            return encryptedFileUrl

        }

        AsyncFunction("DecryptFile"){(key: String, fileUrl: URL) in
              try ensurePathPermission(appContext, path: fileUrl.path, flag: .read)

              let keyData = Data(hexString: key)
              let decryptedFileUrl = AESUtils.DecryptFile(key: keyData, fileUrl: fileUrl)

              return decryptedFileUrl
        }

  }
}
