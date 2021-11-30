const Wallet = require('./wallet');
const Transaction = require('../blockchain/transaction');
const Database = require('../utils/database');
const Config = require('../config');
const { log, warn, error } = require('../utils/logs');

class Teller {
    constructor(node) {
        this.db = new Database(`data/${node.blockchain.name}/${Config.TELLER_FILE}`, new Wallet.Array());

        this.wallets = this.db.read(Wallet.Array);
        this.blockchain = node.blockchain;
    }

    addWallet(wallet) {
        this.wallets.push(wallet);
        this.db.write(this.wallets);
        return wallet;
    }

    createWallet(email, password) {
        let newWallet = Wallet.create(email, password);
        return this.addWallet(newWallet);
    }

    checkWalletPassword(walletId, passwordHash) {
        let wallet = this.getWalletById(walletId);
        if (wallet == null) {
            error((`Wallet with id '${walletId.yellow}' does not exist!`));
            throw (`Wallet with id '${walletId}' does not exist!`);
        }

        return wallet.passwordHash == passwordHash;
    }

    getWallets() {
        return this.wallets;
    }

    getWalletById(walletId) {
        return this.wallets.find(wallet => wallet.id == walletId);
    }

    getWalletByEmail(email) {
        return this.wallets.find(wallet => wallet.email == email);
    }

    getBalanceForWallet(wallet) {
        return wallet.getAddresses().map(addr => this.getBalanceForAddress(addr))
            .reduce((a1, a2) => a1 + a2, 0);
    }

    generateAddressForWallet(wallet) {
        let address = wallet.generateAddress();
        this.db.write(this.wallets);
        return address;
    }

    getAddressesForWallet(wallet) {
        return wallet.getAddresses();
    }

    walletContainsAddress(walletId, address) {
        return this.getAddressesForWallet(walletId).find(addr => addr == address) != null;
    }

    getBalanceForAddress(addressId) {
        let unspent = this.blockchain.getUnspentTransactionsForAddress(addressId);

        if (unspent == null || unspent.length == 0)
            return 0;

        return unspent.reduce((a1, a2) => a1.amount + a2.amount);
    }

    createTransaction(walletId, fromAddressId, toAddressId, amount, changeAddressId) {
        let utxo = this.blockchain.getUnspentTransactionsForAddress(fromAddressId);
        let wallet = this.getWalletById(walletId);

        if (wallet == null) {
            error((`Wallet with id '${walletId.yellow}' does not exist!`));
            throw (`Wallet with id '${walletId}' does not exist!`);
        }

        let secretKey = wallet.getSecretKeyByAddress(fromAddressId);

        if (secretKey == null) {
            error((`Secret key not found for wallet id '${walletId.yellow}' and address '${fromAddressId.yellow}'!`));
            throw (`Secret key not found for wallet id '${walletId}' and address '${fromAddressId}'!`);
        }

        let tx = Transaction.create();
        tx.from(utxo);
        tx.to(toAddressId, amount);
        tx.change(changeAddressId || fromAddressId);
        tx.fee(Config.FEE_PER_TRANSACTION);
        tx.sign(secretKey);

        return tx.build();
    }
}

module.exports = Teller;