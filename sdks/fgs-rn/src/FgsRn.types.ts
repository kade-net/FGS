interface KDF_RK_Result {
  rk: string
  ck: string
}

interface KDF_CK_Result {
  ckPrime: string
  mk: string
}
export interface FGSRNModule {
  hello(): string

  count(): string

  KDF_RK(rk: string, dhOut: string): Promise<KDF_RK_Result>

  KDF_RKSync(rk: string, dhOut: string): KDF_RK_Result

  DH(privateKey: string, publicKey: string, dhPub: string): Promise<string>

  DHSync(privateKey: string, publicKey: string, dhPub: string): string

  KDF_CK(ck: string): Promise<KDF_CK_Result>

  KDF_CKSync(ck: string): KDF_CK_Result

  AEAD_Encrypt(key: string, plaintext: string, associatedData: string): Promise<string>

  AEAD_Decrypt(key: string, encryptedMessage: string, associatedData: string): Promise<{
    valid: boolean,
    plaintext: string
  }|string>

  EncryptFile(key: string, fileUrl: string): Promise<string>

  DecryptFile(key: string, fileUrl: string): Promise<string>


}