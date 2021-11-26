const Crypto = require('../utils/crypto');

class Wallet {
    constructor() {
        this.id = null;
        this.passwordHash = null;
        this.secret = null;
        this.keyPairs = [];
    }

    generateAddress() {
        if (this.secret == null)
            this.generateSecret();

        let lastKeyPair = this.keyPairs.length > 0 ? this.keyPairs[this.keyPairs.length - 1] : null;

        // Generate next seed based on the first secret or a new secret from the last key pair.
        let seed = !lastKeyPair ? this.secret : lastKeyPair.secretKey;
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
        this.secret = Crypto.generateSecret(this.passwordHash);
        return this.secret;
    }

    getAddressByIndex(index) {
        return (this.keyPairs.find(pair => pair.index == index) || { publicKey: null }).publicKey;
    }

    getAddressByPublicKey(publicKey) {
        return (this.keyPairs.find(pair => pair.publicKey == publicKey) || { publicKey: null }).publicKey
    }

    getSecretKeyByAddress(address) {
        return (this.keyPairs.find(pair => pair.publicKey == publicKey) || { secretKey: null }).secretKey
    }

    getAddresses() {
        return this.keyPairs.map(pair => pair.publicKey);
    }

    static fromPassword(password) {
        let wallet = new Wallet();
        wallet.id = Crypto.randomId();
        wallet.passwordHash = Crypto.hash(password);
        return wallet;
    }

    static fromHash(passwordHash) {
        let wallet = new Wallet();
        wallet.id = Crypto.randomId();
        wallet.passwordHash = passwordHash;
        return wallet;
    }

    static fromJson(data) {
        let wallet = new Wallet();
        Object.entries(data).forEach(([key, value]) => { wallet[key] = value; });
        return wallet;
    }
}

module.exports = Wallet;