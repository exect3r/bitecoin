const Wallets = require('./wallets');
const Wallet = require('./wallet');
const Transaction = require('../blockchain/transaction');
const TransactionBuilder = require('./transactionBuilder');
const Database = require('../utils/database');
const Config = require('../config');
const { log, warn, error } = require('../utils/logs');

class Operator {
    constructor(node) {
        this.db = new Database(`data/${node.blockchain.name}/${Config.OPERATOR_FILE}`, new Wallets());

        this.wallets = this.db.read(Wallets);
        this.blockchain = node.blockchain;
    }

    addWallet(wallet) {
        this.wallets.push(wallet);
        this.db.write(this.wallets);
        return wallet;
    }

    createWalletFromPassword(password) {
        let newWallet = Wallet.fromPassword(password);
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
        return this.wallets.find(wallet => { return wallet.id == walletId; });
    }

    generateAddressForWallet(walletId) {
        let wallet = this.getWalletById(walletId);
        if (wallet == null) {
            error((`Wallet with id '${walletId.yellow}' does not exist!`));
            throw (`Wallet with id '${walletId}' does not exist!`);
        }

        let address = wallet.generateAddress();
        this.db.write(this.wallets);
        return address;
    }

    getAddressesForWallet(walletId) {
        let wallet = this.getWalletById(walletId);
        if (wallet == null) {
            error((`Wallet with id '${walletId.yellow}' does not exist!`));
            throw (`Wallet with id '${walletId}' does not exist!`);
        }

        let addresses = wallet.getAddresses();
        return addresses;
    }

    getBalanceForAddress(addressId) {
        let unspent = this.blockchain.getUnspentTransactionsForAddress(addressId);

        if (unspent == null || unspent.length == 0) {
            error((`No transactions found for address '${addressId.yellow}'!`));
            throw (`No transactions found for address '${addressId}'!`);
        }
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

        let tx = new TransactionBuilder();
        tx.from(utxo);
        tx.to(toAddressId, amount);
        tx.change(changeAddressId || fromAddressId);
        tx.fee(Config.FEE_PER_TRANSACTION);
        tx.sign(secretKey);

        return Transaction.fromJson(tx.build());
    }
}

module.exports = Operator;