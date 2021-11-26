const express = require('express');
const bodyParser = require('body-parser');
const Transaction = require('./blockchain/transaction');
const path = require('path');
const { log, error, warn } = require('./utils/logs');
const Crypto = require('./utils/crypto');

class BiteCoinServer {
    constructor(node) {
        function logReq(type, req) {
            log(`${(req.socket.remoteAddress + ':' + req.socket.remotePort).green} ${type} ${req.url}`);
        }

        function cullWalletData(wallet) {
            return {
                id: wallet.id,
                addresses: wallet.keyPairs.map(keyPair => keyPair.publicKey)
            };
        };

        let blockchain = node.blockchain;
        let operator = node.operator;

        this.app = express();
        this.app.use(bodyParser.json());

        this.app.get('/blockchain/blocks', (req, res) => {
            logReq('GET', req);

            res.status(200).send(blockchain.getAllBlocks());
        });

        this.app.get('/blockchain/blocks/latest', (req, res) => {
            logReq('GET', req);

            let lastBlock = blockchain.getLastBlock();
            if (lastBlock == null) {
                warn('Block not found!');
                res.status(404).send({ error: 'Block not found!' });
                return;
            }

            res.status(200).send(lastBlock);
        });

        this.app.put('/blockchain/blocks/latest', (req, res) => {
            logReq('PUT', req);

            let requestBlock = Block.fromJson(req.body);
            let result = node.checkReceivedBlock(requestBlock);

            if (result == null) res.status(200).send('Requesting the blockchain to check.');
            else if (result) res.status(200).send(requestBlock);
            else throw new HTTPError(409, 'Blockchain is update.');
        });

        this.app.get('/blockchain/blocks/:hash([a-zA-Z0-9]{64})', (req, res) => {
            logReq('GET', req);

            let blockFound = blockchain.getBlockByHash(req.params.hash);
            if (blockFound == null) {
                warn(`Block with hash ${req.params.hash.yellow} not found!`);
                res.status(404).send({ error: `Block with hash ${req.params.hash} not found!`});
                return;
            }

            res.status(200).send(blockFound);
        });

        this.app.get('/blockchain/blocks/:index', (req, res) => {
            logReq('GET', req);

            let blockFound = blockchain.getBlockByIndex(parseInt(req.params.index));
            if (blockFound == null) {
                warn(`Block with index ${req.params.index.yellow} not found!`);
                res.status(404).send({ error: `Block with index ${req.params.index} not found!`});
                return;
            }

            res.status(200).send(blockFound);
        });

        this.app.get('/blockchain/blocks/transactions/:transactionId([a-zA-Z0-9]{64})', (req, res) => {
            logReq('GET', req);

            let transactionFromBlock = blockchain.getTransactionFromBlocks(req.params.transactionId);
            if (transactionFromBlock == null) {
                warn(`No block contains transaction ${req.params.transactionId.yellow} !`);
                res.status(404).send({ error: `No block contains transaction ${req.params.transactionId} !` });
                return;
            }

            res.status(200).send(transactionFromBlock);
        });

        this.app.get('/blockchain/transactions', (req, res) => {
            logReq('GET', req);

            res.status(200).send(blockchain.getAllTransactions());
        });

        this.app.post('/blockchain/transactions', (req, res) => {
            logReq('POST', req);

            let requestTransaction = Transaction.fromJson(req.body);
            let transactionFound = blockchain.getTransactionById(requestTransaction.id);

            if (transactionFound) {
                warn(`Transaction '${requestTransaction.id.yellow}' already exists!`);
                res.status(409).send({ error: `Transaction '${requestTransaction.id}' already exists!` });
                return;
            }

            try {
                let newTransaction = blockchain.addTransaction(requestTransaction);
                res.status(201).send(newTransaction);
            } catch (ex) {
                error(ex.message);
                res.status(400).send(ex.message);
            }
        });

        this.app.get('/blockchain/transactions/unspent', (req, res) => {
            logReq('GET', req);

            res.status(200).send(blockchain.getUnspentTransactionsForAddress(req.query.address));
        });

        this.app.get('/operator/wallets', (req, res) => {
            logReq('GET', req);

            res.status(200).send(operator.getWallets().map(cullWalletData));
        });

        this.app.post('/operator/wallets', (req, res) => {
            logReq('GET', req);

            let password = req.body.password;
            if (password.match(/\w+/g).length <= 4) {
                warn(`Password must contain more than 4 words!`);
                res.status(400).send({ error: `Password must contain more than 4 words!` });
                return;
            }

            res.status(201).send(cullWalletData(operator.createWalletFromPassword(password)));
        });

        this.app.get('/operator/wallets/:walletId', (req, res) => {
            logReq('GET', req);

            let wallet = operator.getWalletById(req.params.walletId);
            if (wallet == null) {
                warn(`Wallet with id ${walletId.yellow} not found!`);
                res.status(404).send({ error: `Wallet with id ${walletId} not found!` });
                return;
            }

            res.status(200).send(cullWalletData(wallet));
        });

        this.app.post('/operator/wallets/:walletId/transactions', (req, res) => {
            logReq('POST', req);

            let walletId = req.params.walletId;
            let password = req.headers.password;

            if (password == null) {
                warn(`Password not provided!`);
                res.status(401).send({ error: `Password not provided!` });
                return;
            }

            let passwordHash = Crypto.hash(password);

            if (!operator.checkWalletPassword(walletId, passwordHash)) {
                warn(`Invalid password for wallet ${walletId.yellow} !`);
                res.status(403).send({ error: `Invalid password for wallet ${walletId} !` });
                return;
            }

            let transaction = operator.createTransaction(walletId, req.body.fromAddress, req.body.toAddress, req.body.amount, req.body['changeAddress'] || req.body.fromAddress);
            transaction.check();

            res.status(201).send(blockchain.addTransaction(Transaction.fromJson(transaction)));
        });

        this.app.get('/operator/wallets/:walletId/addresses', (req, res) => {
            logReq('GET', req);

            let walletId = req.params.walletId;
            let addresses = operator.getAddressesForWallet(walletId);

            res.status(200).send(addresses);
        });

        this.app.post('/operator/wallets/:walletId/addresses', (req, res) => {
            logReq('POST', req);

            let walletId = req.params.walletId;
            let password = req.headers.password;

            if (password == null) {
                warn(`Password not provided!`);
                res.status(401).send({ error: `Password not provided!` });
                return;
            }

            let passwordHash = Crypto.hash(password);

            if (!operator.checkWalletPassword(walletId, passwordHash)) {
                warn(`Invalid password for wallet ${walletId.yellow} !`);
                res.status(403).send({ error: `Invalid password for wallet ${walletId} !` });
                return;
            }

            let newAddress = operator.generateAddressForWallet(walletId);
            res.status(201).send({ address: newAddress });
        });

        this.app.get('/operator/:addressId/balance', (req, res) => {
            logReq('GET', req);

            let addressId = req.params.addressId;
            // check address exists.
            let balance = operator.getBalanceForAddress(addressId);
            res.status(200).send({ balance: balance });
        });
    }

    listen(host, port) {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(port, host, (err) => {
                if (err) reject(err);
                log(`Listening on: ${('http://' + this.server.address().address + ':' + this.server.address().port).yellow}`);
                resolve(this);
            });
        });
    }

    stop() {
        return new Promise((resolve, reject) => {
            this.server.close((err) => {
                if (err) reject(err);
                log('Closing server.');
                resolve(this);
            });
        });
    }
}

module.exports = BiteCoinServer;