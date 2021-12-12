const crypto = require('crypto');
const elliptic = require('elliptic');
const EdDSA = elliptic.eddsa;
const ec = new EdDSA('ed25519');
const Config = require('../config');
const bcrypt = require('bcrypt');

class Crypto {
    static hash(data) {
        let str = typeof (data) == 'object' ? JSON.stringify(data) : data.toString();
        return crypto.createHash('sha256').update(str).digest('hex');
    }

    static hashPassword(password) {
        return bcrypt.hashSync(password, 11);
    }

    static isPasswordCorrect(password, hashedPassword) {
        return bcrypt.compareSync(password, hashedPassword);
    }

    static randomId(size = 64) {
        return crypto.randomBytes(Math.floor(size / 2)).toString('hex');
    }

    static toHex(data) {
        return elliptic.utils.toHex(data);
    }

    static generateSecret(password) {
        let secret = crypto.pbkdf2Sync(password, Config.SALT, 10000, 512, 'sha512').toString('hex');
        return secret;
    }

    static generateKeyPairFromSecret(secret) {
        let keyPair = ec.keyFromSecret(secret);
        return keyPair;
    }

    static signHash(keyPair, messageHash) {
        let signature = keyPair.sign(messageHash).toHex().toLowerCase();
        return signature;
    }

    static verifySignature(publicKey, signature, messageHash) {
        let key = ec.keyFromPublic(publicKey, 'hex');
        let verified = key.verify(messageHash, signature);
        return verified;
    }
}

module.exports = Crypto;