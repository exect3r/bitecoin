const Wallet = require('./wallet');

class Wallets extends Array {
    static fromJson(data) {
        let wallets = new Wallets();
        Object.values(data).forEach((wallet) => { wallets.push(Wallet.fromJson(wallet)); });
        return wallets;
    }
}

module.exports = Wallets;