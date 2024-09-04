import Foundation;
import CryptoKit;
import ExpoModulesCore;

struct AEADEncryptResult {
    let ciphertext: Data
}

struct AEADDecryptResult {
    let plaintext: Data
    let valid: Bool
}

struct AESUtils {
    static let AES_KEY_SIZE = 256 / 8 // 256 bits = 32 bytes
    static let GCM_IV_LENGTH = 12 // 12 bytes for GCM IV
    static let GCM_TAG_LENGTH = 16 // 16 bytes for GCM Tag

    static func AEAD_Encrypt(key: Data, plaintext: Data, associatedData: Data? = nil) -> AEADEncryptResult? {
        let iv = AESUtils.randomIV(length: GCM_IV_LENGTH)

        do {
            let sealedBox = try AES.GCM.seal(plaintext, using: SymmetricKey(data: key), nonce: AES.GCM.Nonce(data: iv), authenticating: associatedData ?? Data())
            let ciphertext = iv + sealedBox.ciphertext + sealedBox.tag
            return AEADEncryptResult(ciphertext: ciphertext)
        } catch {
            print("Encryption error: \(error)")
            return nil
        }
    }

    static func AEAD_Decrypt(key: Data, encryptedMessage: Data, associatedData: Data? = nil) -> AEADDecryptResult? {
        // Extract the IV, ciphertext, and tag from the encryptedMessage
        let iv = encryptedMessage.prefix(AESUtils.GCM_IV_LENGTH) // First 12 bytes are the IV
        let tag = encryptedMessage.suffix(AESUtils.GCM_TAG_LENGTH) // Last 16 bytes are the tag
        let ciphertext = encryptedMessage.dropFirst(AESUtils.GCM_IV_LENGTH).dropLast(AESUtils.GCM_TAG_LENGTH) // Ciphertext in the middle

        do {
            // Create the sealed box with the extracted IV, ciphertext, and tag
            let sealedBox = try AES.GCM.SealedBox(nonce: AES.GCM.Nonce(data: iv), ciphertext: ciphertext, tag: tag)

            // Decrypt the message
            let plaintext = try AES.GCM.open(sealedBox, using: SymmetricKey(data: key), authenticating: associatedData ?? Data())

            // Return the decrypted plaintext and set valid to true
            return AEADDecryptResult(plaintext: plaintext, valid: true)
        } catch {
            // Handle decryption failure
            NSLog("Decryption error: \(error)")
            return AEADDecryptResult(plaintext: Data(), valid: false)
        }
    }

    static func EncryptFile(key: Data, fileUrl: URL) -> String? {
        guard let inputHandle = try? FileHandle(forReadingFrom: fileUrl) else {
            NSLog("Error opening file for reading")
            return nil
        }

        let encryptedFileUrl = fileUrl.appendingPathExtension("encrypted")

        guard FileManager.default.createFile(atPath: encryptedFileUrl.path, contents: nil),
              let outputHandle = try? FileHandle(forWritingTo: encryptedFileUrl) else {
            NSLog("Error creating or opening file for writing")
            return nil
        }

        defer {
            inputHandle.closeFile()
            outputHandle.closeFile()
        }

        let bufferSize = 64 * 1024 // 64 KB
        var chunkIndex: Int = 0

        while autoreleasepool(invoking: {
            let chunkData = inputHandle.readData(ofLength: bufferSize)
            if chunkData.isEmpty {
                return false
            }

            var nonce = withUnsafeBytes(of: chunkIndex.bigEndian) { Data($0) }
            nonce.append(Data(count: 4)) // Padding the nonce to 12 bytes for AES-GCM

            chunkIndex += 1
            let associatedData = withUnsafeBytes(of: chunkIndex.bigEndian) { Data($0) }

            guard let encryptedChunk = AESUtils.AEAD_Encrypt(key: key, plaintext: chunkData, associatedData: associatedData)?.ciphertext else {
                NSLog("Error encrypting chunk \(chunkIndex)")
                return false
            }

            outputHandle.write(encryptedChunk)
            return true
        }) {}

        return encryptedFileUrl.path
    }

    static func DecryptFile(key: Data, fileUrl: URL) -> String? {
            guard let inputHandle = FileHandle(forReadingAtPath: fileUrl.path) else {
                NSLog("Error opening file for reading")
                return nil
            }

            let decryptedFileUrl = fileUrl.deletingPathExtension()

            guard FileManager.default.createFile(atPath: decryptedFileUrl.path, contents: nil),
                let outputHandle = FileHandle(forWritingAtPath: decryptedFileUrl.path) else {
                print("Error creating or opening file for writing")
                return nil
            }

            defer {
                inputHandle.closeFile()
                outputHandle.closeFile()
            }

            let bufferSize = 64 * 1024 + 16 + 12 // 64 KB + 16 bytes for the tag + 12 for the iv
            var chunkIndex: UInt64 = 0

            while autoreleasepool(invoking: {
                let chunkData = inputHandle.readData(ofLength: bufferSize)
                if chunkData.isEmpty {
                    return false
                }

                chunkIndex += 1

                let associatedData = withUnsafeBytes(of: chunkIndex.bigEndian) { Data($0) }

                guard let decryptedChunk = AEAD_Decrypt(key: key, encryptedMessage: chunkData, associatedData: associatedData) else {
                    print("Error decrypting chunk")
                    return false
                }

                outputHandle.write(decryptedChunk.plaintext)
                return true
            }) {}

            return decryptedFileUrl.path
        }

    private static func randomIV(length: Int) -> Data {
        var iv = Data(count: length)
        _ = iv.withUnsafeMutableBytes { SecRandomCopyBytes(kSecRandomDefault, length, $0.baseAddress!) }
        return iv
    }
}


extension Data {
    init(hexString: String) {
        self.init()
        var hex = hexString
        // Remove spaces if any
        hex = hex.replacingOccurrences(of: " ", with: "")
        // Make sure the string is even
        if hex.count % 2 != 0 {
            hex = "0" + hex
        }
        for i in stride(from: 0, to: hex.count, by: 2) {
            let start = hex.index(hex.startIndex, offsetBy: i)
            let end = hex.index(start, offsetBy: 2)
            let bytes = hex[start..<end]
            if var num = UInt8(bytes, radix: 16) {
                self.append(&num, count: 1)
            }
        }
    }

    func hexEncodedString() -> String {
        return map { String(format: "%02hhx", $0) }.joined()
    }
}
