const Crypto = require('../utils/crypto');
const { warn } = require('../utils/logs');

class Wallet {
    constructor() {
        this.id = null;
        this.email = null;
        this.passwordHash = null;
        this.secret = null;
        this.keyPairs = [];
    }

    generateAddress() {
        this.generateSecret();

        // Generate next seed based on the first secret or a new secret from the last key pair.
        let seed = this.secret;
        let keyPairRaw = Crypto.generateKeyPairFromSecret(seed);
        let newKeyPair = {
            index: this.keyPairs.length + 1,
            secretKey: Crypto.toHex(keyPairRaw.getSecret()),
            publicKey: Crypto.toHex(keyPairRaw.getPublic())
        };
        
        this.keyPairs.push(newKeyPair);
        return newKeyPair.publicKey;
    }

    generateSecret() {
        if (!this.secret)
            this.secret = Crypto.generateSecret(this.passwordHash + this.id);
        else this.secret = Crypto.generateSecret(this.secret);
        return this.secret;
    }

    getAddressByIndex(index) {
        return (this.keyPairs.find(pair => pair.index == index) || { publicKey: null }).publicKey;
    }

    getAddressByPublicKey(publicKey) {
        return (this.keyPairs.find(pair => pair.publicKey == publicKey) || { publicKey: null }).publicKey
    }

    getSecretKeyByAddress(address) {
        return (this.keyPairs.find(pair => pair.publicKey == address) || { secretKey: null }).secretKey
    }

    getAddresses() {
        return this.keyPairs.map(pair => pair.publicKey);
    }

    static create(email, password) {
        let wallet = new Wallet();
        wallet.id = Crypto.randomId();
        wallet.email = email;
        wallet.passwordHash = password;
        return wallet;
    }

    static fromJson(data) {
        let wallet = new Wallet();
        Object.entries(data).forEach(([key, value]) => { wallet[key] = value; });
        return wallet;
    }

    static Array = class WalletsArray extends Array {
        static fromJson(data) {
            let wallets = new WalletsArray();
            Object.values(data).forEach((wallet) => { wallets.push(Wallet.fromJson(wallet)); });
            return wallets;
        }
    }
}

module.exports = Wallet;