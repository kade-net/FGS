import nacl from 'tweetnacl'

const signing = nacl.sign.keyPair()

const SS = Buffer.from(signing.secretKey).toString('hex')

console.log("SIGINGIN::", SS)

const encrypting = nacl.box.keyPair()

const ES = Buffer.from(encrypting.secretKey).toString('hex')

console.log("ES::", ES)