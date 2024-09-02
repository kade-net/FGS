import Foundation;
import CryptoKit;
import ExpoModulesCore;
import Photos;



struct Header {
    let publicKey: Data
    let previousCounter: Int
    let counter: Int
}

struct AttachmentHeader {
    let attachmentType: Int
    let attachmentLength: Int
}

struct BoxPair {
    let publicKey: Data
    let privateKey: Data
}

struct AEADEncryptResult {
    let ciphertext: Data
}

struct AEADDecryptResult {
    let plaintext: Data
    let valid: Bool
}



func generateHeader(keypair: BoxPair, previousCounter: Int, counter: Int) -> Header {
    return Header(publicKey: keypair.publicKey, previousCounter: previousCounter, counter: counter)
}

func parseHeader(headerBuffer: Data) -> Header? {
    guard headerBuffer.count >= 40 else {
        print("Header too small")
        return nil
    }

    let publicKey = headerBuffer.subdata(in: 0..<32)
    let previousCounter = headerBuffer.subdata(in: 32..<36).withUnsafeBytes { $0.load(as: Int32.self).bigEndian }
    let counter = headerBuffer.subdata(in: 36..<40).withUnsafeBytes { $0.load(as: Int32.self).bigEndian }

    return Header(publicKey: publicKey, previousCounter: Int(previousCounter), counter: Int(counter))

}

struct DoubleRatchetUtils {

    static func hkdfExtract(salt: Data, ikm: Data, hashAlgo: String) -> Data? {
        let algorithm: CCHmacAlgorithm
        let digestLength: Int32

        switch hashAlgo.lowercased() {
        case "sha256":
            algorithm = CCHmacAlgorithm(kCCHmacAlgSHA256)
            digestLength = CC_SHA256_DIGEST_LENGTH
        case "sha1":
            algorithm = CCHmacAlgorithm(kCCHmacAlgSHA1)
            digestLength = CC_SHA1_DIGEST_LENGTH
        case "sha512":
            algorithm = CCHmacAlgorithm(kCCHmacAlgSHA512)
            digestLength = CC_SHA512_DIGEST_LENGTH
        default:
            print("Unsupported hash algorithm")
            return nil
        }

        var hmac = [UInt8](repeating: 0, count: Int(digestLength))
        ikm.withUnsafeBytes { ikmBytes in
            salt.withUnsafeBytes { saltBytes in
                CCHmac(algorithm, saltBytes.baseAddress, salt.count, ikmBytes.baseAddress, ikm.count, &hmac)
            }
        }

        return Data(hmac)
    }

    static func hkdfExpand(prk: Data, info: Data, length: Int, hashAlgo: String) -> Data? {
        let hashLen: Int
        let algorithm: CCHmacAlgorithm

        switch hashAlgo.lowercased() {
        case "sha256":
            hashLen = Int(CC_SHA256_DIGEST_LENGTH)
            algorithm = CCHmacAlgorithm(kCCHmacAlgSHA256)
        case "sha1":
            hashLen = Int(CC_SHA1_DIGEST_LENGTH)
            algorithm = CCHmacAlgorithm(kCCHmacAlgSHA1)
        case "sha512":
            hashLen = Int(CC_SHA512_DIGEST_LENGTH)
            algorithm = CCHmacAlgorithm(kCCHmacAlgSHA512)
        default:
            print("Unsupported hash algorithm")
            return nil
        }

        let n = Int(ceil(Double(length) / Double(hashLen)))
        var okm = Data()
        var outputBlock = Data()

        for i in 1...n {
            var buffer = outputBlock
            buffer.append(info)
            buffer.append(UInt8(i))

            var hmac = [UInt8](repeating: 0, count: hashLen)
            buffer.withUnsafeBytes { bufferBytes in
                prk.withUnsafeBytes { prkBytes in
                    CCHmac(algorithm, prkBytes.baseAddress, prk.count, bufferBytes.baseAddress, buffer.count, &hmac)
                }
            }
            outputBlock = Data(hmac)
            okm.append(outputBlock)
        }

        return okm.prefix(length)
    }

    static func KDF_RK(rk: Data, dhOut: Data) -> (Data, Data)? {
        let hashAlgo = "sha256"
        let info = "hermes:protocol".data(using: .utf8)!
        guard let prk = hkdfExtract(salt: rk, ikm: dhOut, hashAlgo: hashAlgo),
              let output = hkdfExpand(prk: prk, info: info, length: 64, hashAlgo: hashAlgo) else {
            return nil
        }

        let part1 = output.prefix(32)
        let part2 = output.dropFirst(32).prefix(32)

        return (part1, part2)
    }

    static func DH(dhPair: (privateKey: Data, publicKey: Data), dhPub: Data) -> Data? {
        guard dhPair.privateKey.count == 32, dhPub.count == 32 else {
            return nil
        }

        // Perform scalar multiplication using Curve25519
        guard let privateKey = try? Curve25519.KeyAgreement.PrivateKey(rawRepresentation: dhPair.privateKey) else {
            return nil
        }
        guard let publicKey = try? Curve25519.KeyAgreement.PublicKey(rawRepresentation: dhPub) else {
            return nil
        }

        guard let sharedSecret = try? privateKey.sharedSecretFromKeyAgreement(with: publicKey) else {
            return nil
        }

        // Derive a symmetric key from the shared secret
        let symmetricKey = sharedSecret.x963DerivedSymmetricKey(using: SHA256.self, sharedInfo: Data(), outputByteCount: 32)

        return symmetricKey.withUnsafeBytes { Data($0) }
    }

    static func KDF_CK(ck: Data) -> (ckPrime: Data, mk: Data) {
        // Define the constant for the HMAC
        let constant = Data([0x01])

        // Perform HMAC with CK as the key and the constant as the message
        let hmacKey = SymmetricKey(data: ck)
        let hmac = HMAC<SHA256>.authenticationCode(for: constant, using: hmacKey)
        let prk = Data(hmac)

        let info1 = "chain key expansion".data(using: .utf8)!
        let info2 = "message key expansion".data(using: .utf8)!

        let ckPrime = hkdfExpand(prk: prk, info: info1, length: 32, hashAlgo: "sha256")!
        let mk = hkdfExpand(prk: prk, info: info2, length: 32, hashAlgo: "sha256")!

        return (ckPrime, mk)

    }

    static func AEAD_Encrypt(key: Data, plaintext: Data, associatedData: Data) -> AEADEncryptResult? {
        var iv = Data(count: 12)
        let result = iv.withUnsafeMutableBytes({
            SecRandomCopyBytes(kSecRandomDefault, 12, $0.baseAddress!)
        })

        if result != errSecSuccess {
            NSLog("Error generating random bytes")
            return nil
        }

        let symmetrickey = SymmetricKey(data: key)
        do {
            let sealedBox = try CryptoKit.AES.GCM.seal(plaintext,using:symmetrickey, nonce: CryptoKit.AES.GCM.Nonce(data: iv), authenticating: associatedData)

            let ciphertext = iv + sealedBox.ciphertext + sealedBox.tag

            return AEADEncryptResult(ciphertext: ciphertext)
        } catch {
            NSLog("Error encrypting data: \(error.localizedDescription)")
            return nil

        }
    }


    static func EncryptFile(key: Data, fileUrl: URL) -> String? {
        guard let inputHandle = FileHandle(forReadingAtPath: fileUrl.path) else {
            NSLog("Error opening file for reading")
            return nil
        }

        let encryptedFileUrl = fileUrl.appendingPathExtension("encrypted")

        guard FileManager.default.createFile(atPath: encryptedFileUrl.path, contents: nil),
            let outputHandle = FileHandle(forWritingAtPath: encryptedFileUrl.path) else {
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
            nonce.append(Data(count: 4))
            chunkIndex += 1

            let associatedData = withUnsafeBytes(of: chunkIndex.bigEndian) { Data($0) }

            guard let encryptedChunk = AEAD_Encrypt(key: key, plaintext: chunkData, associatedData: associatedData)?.ciphertext else {
                NSLog("Error encrypting chunk \(chunkIndex)")
                return false
            }

            outputHandle.write(encryptedChunk)
            return true
        }) {}

        return encryptedFileUrl.path
    }

    static func AEAD_Decrypt(key: Data, encryptedMessage: Data, associatedData: Data) -> AEADDecryptResult? {
        let iv = encryptedMessage.subdata(in: 0..<12)
        let tag = encryptedMessage.subdata(in: encryptedMessage.count - 16..<encryptedMessage.count)
        let ciphertext = encryptedMessage.subdata(in: 12..<encryptedMessage.count - 16)
        let symmetrickey = SymmetricKey(data: key)

        do { 
            let sealedBox = try CryptoKit.AES.GCM.SealedBox(nonce: CryptoKit.AES.GCM.Nonce(data: iv), ciphertext: ciphertext, tag: tag)
            let plaintext = try CryptoKit.AES.GCM.open(sealedBox, using: symmetrickey, authenticating: associatedData)

            return AEADDecryptResult(plaintext: plaintext, valid: true)
        } catch {
            NSLog("Error decrypting data: \(error.localizedDescription)")
            return AEADDecryptResult(plaintext: Data(), valid: false)

        }
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