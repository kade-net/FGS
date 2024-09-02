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

        AsyncFunction("hkdfExtract") { (salt: String, ikm: String, hashAlgo: String) in
            let saltData = Data(hexString: salt)
            let ikmData = Data(hexString: ikm)
            let result = DoubleRatchetUtils.hkdfExtract(salt: saltData, ikm: ikmData, hashAlgo: hashAlgo)
            return result?.hexEncodedString()
        }

        AsyncFunction("KDF_RK"){ (rk: String, dhOut: String) in

            let rkData = Data(hexString: rk)
            let dhOutData = Data(hexString: dhOut)
            let result = DoubleRatchetUtils.KDF_RK(rk: rkData, dhOut: dhOutData)
            let rk = result?.0.hexEncodedString()
            let cks = result?.1.hexEncodedString()
            let dict: [String : String?] = [
              "rk": rk,
              "ck": cks
            ]
            return dict
        }

        Function("KDF_RKSync"){ (rk: String, dhOut: String) in
            let rkData = Data(hexString: rk)
            let dhOutData = Data(hexString: dhOut)

            let result = DoubleRatchetUtils.KDF_RK(rk: rkData, dhOut: dhOutData)
            let rk = result?.0.hexEncodedString()
            let cks = result?.1.hexEncodedString()
            let dict: [String : String?] = [
              "rk": rk,
              "ck": cks
            ]
            return dict
        }

        AsyncFunction("DH") {(privateKey: String, publicKey: String, dhPub: String) in
            let privateKeyData = Data(hexString: privateKey)
            let publicKeyData = Data(hexString: publicKey)
            let dhPubData = Data(hexString: dhPub)
            let result = DoubleRatchetUtils.DH(dhPair: (privateKey: privateKeyData, publicKey: publicKeyData), dhPub: dhPubData)
            return result?.hexEncodedString()
        }

        Function("DHSync"){(privateKey: String, publicKey: String, dhPub: String) in
            let privateKeyData = Data(hexString: privateKey)
            let publicKeyData = Data(hexString: publicKey)
            let dhPubData = Data(hexString: dhPub)
            let result = DoubleRatchetUtils.DH(dhPair: (privateKey: privateKeyData, publicKey: publicKeyData), dhPub: dhPubData)
            print("Result::\(result!)")
            return result?.hexEncodedString()
        }

        AsyncFunction("KDF_CK"){(ck: String) in
            let ckData = Data(hexString: ck)
            let result = DoubleRatchetUtils.KDF_CK(ck: ckData)
            let ckPrime = result.ckPrime.hexEncodedString()
            let mk = result.mk.hexEncodedString()
            let dict: [String : String?] = [
              "ckPrime": ckPrime,
              "mk": mk
            ]
            return dict
        }

        Function("KDF_CKSync"){(ck: String) in
            let ckData = Data(hexString: ck)
            let result = DoubleRatchetUtils.KDF_CK(ck: ckData)
            let ckPrime = result.ckPrime.hexEncodedString()
            let mk = result.mk.hexEncodedString()
            let dict: [String : String?] = [
              "ckPrime": ckPrime,
              "mk": mk
            ]
            return dict
        }

        AsyncFunction("AEAD_Encrypt"){(key: String, plaintext: String, associatedData: String) in
            let keyData = Data(hexString: key)
            let plaintextData = Data(hexString: plaintext)
            let associatedDataData = Data(hexString: associatedData)
            let result = DoubleRatchetUtils.AEAD_Encrypt(key: keyData, plaintext: plaintextData, associatedData: associatedDataData)
            return result?.ciphertext.hexEncodedString()
        }

        AsyncFunction("AEAD_Decrypt"){(key: String, encryptedMessage: String, associatedData: String) in
            let keyData = Data(hexString: key)
            let encryptedMessageData = Data(hexString: encryptedMessage)
            let associatedDataData = Data(hexString: associatedData)
            guard let result = DoubleRatchetUtils.AEAD_Decrypt(key: keyData, encryptedMessage: encryptedMessageData, associatedData: associatedDataData) else {
              let dict: [String : Any?] = [
                "valid": false,
                "plaintext": ""
              ]
              return dict
            }
            let dict: [String : Any?] = [
              "valid": result.valid,
              "plaintext": result.plaintext.hexEncodedString()
            ]
            return dict
        }

        AsyncFunction("EncryptFile"){(key: String, fileUrl: URL) in

            try ensurePathPermission(appContext, path: fileUrl.path, flag: .read)

            let keyData = Data(hexString: key)
            let encryptedFileUrl = DoubleRatchetUtils.EncryptFile(key: keyData, fileUrl: fileUrl)

            return encryptedFileUrl

        }

        AsyncFunction("DecryptFile"){(key: String, fileUrl: URL) in
              try ensurePathPermission(appContext, path: fileUrl.path, flag: .read)

              let keyData = Data(hexString: key)
              let decryptedFileUrl = DoubleRatchetUtils.DecryptFile(key: keyData, fileUrl: fileUrl)

              return decryptedFileUrl
        }

  }
}
