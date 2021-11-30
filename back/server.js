const express = require('express');
const bodyParser = require('body-parser');
const Block = require('./blockchain/block');
const Transaction = require('./blockchain/transaction');
const path = require('path');
const { log, error, warn } = require('./utils/logs');
const Crypto = require('./utils/crypto');
const Config = require('./config');
const jwt = require('jsonwebtoken');

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
        let teller = node.teller;

        this.app = express();
        this.app.use(bodyParser.json());

        this.app.get('/blockchain/info', (req, res) => {
            logReq('GET', req);

            res.status(200).send({
                blockCount: blockchain.getAllBlocks().length,
                transactionCount: blockchain.getAllTransactions().length,
                coinPrice: 0, // calculate coin price in dollars
                hashPower: 0, // calculate hash power
            });
        });

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

        this.app.get('/blockchain/blocks/:range([0-9]+\\-[0-9]+)', (req, res) => {
            logReq('GET', req);

            let bounds = req.params.range.split('-');
            let start = Number(bounds[0]);
            let end = Number(bounds[1]);

            res.status(200).send(blockchain.getBlocksInRange(start, end));
        });

        this.app.get('/blockchain/blocks/:index([0-9]+)', (req, res) => {
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

        this.app.get('/blockchain/transactions/:range([0-9]+\\-[0-9]+)', (req, res) => {
            logReq('GET', req);

            let bounds = req.params.range.split('-');
            let start = Number(bounds[0]);
            let end = Number(bounds[1]);

            res.status(200).send(blockchain.getTransactionsInRange(start, end));
        });


        this.app.get('/blockchain/blocks/transactions/', (req, res) => {
            logReq('GET', req);

            res.status(200).send(blockchain.getTransactionsFromBlocks());
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

        this.app.get('/blockchain/mine/:addressId', (req, res) => {
            logReq('GET', req);

            const previousBlock = blockchain.getLastBlock();
            const newIndex = previousBlock.index + 1;
            let cleanTransactions = [];

            blockchain.transactions.forEach((trans, i) => {
                if (cleanTransactions.length == Config.TRANSACTIONS_PER_BLOCK) return;

                if (trans.type == 'regular' && trans.data.outputs.find(out => out.amount < 0)) {
                    warn(`Discarding regular transaction ${trans.id.yellow} that has negative outputs.`);
                    blockchain.transactions.splice(i, 1);
                    return;
                }
                
                if (trans.type != 'regular' || trans.type != 'reward') {
                    warn(`Discarding transaction ${trans.id.yellow} that has an unknown type ${trans.type.red}.`);
                    blockchain.transactions.splice(i, 1);
                    return;
                }

                // double spending
                if (trans.data.inputs.find(input => 
                    cleanTransactions.find(t => 
                        t.data.inputs.find(i => 
                            i.index == input.index && i.transaction == input.transactions
                        )
                    )
                )) {
                    warn(`Discarding transaction ${trans.id.yellow} that has a double spending.`);
                    warn(blockchain.transactions.splice(i, 1));
                    return;
                }

                // invalid input
                if (trans.data.inputs.find(input => 
                    blockchain.getAllBlocks().find(b => b.transactions.find(t =>
                        t.data.inputs.find(i => 
                            i.index == input.index && i.transaction == input.transactions
                        )
                    )
                ))) {
                    warn(`Discarding transaction ${trans.id.yellow} that has an already existing input.`);
                    warn(blockchain.transactions.splice(i, 1));
                    return;
                }

                cleanTransactions.push(trans);
            });

            cleanTransactions = cleanTransactions.slice(0, Config.TRANSACTIONS_PER_BLOCK);

            if (cleanTransactions.length == 0) {
                warn('Not enough transactions to populate the block!');
                res.status(403).send({ error: 'Not enough transactions to populate the block!' });
                return;
            }

            if (req.query.addressId) {
                cleanTransactions.push(Transaction.fromJson({
                    id: Crypto.randomId(64),
                    type: 'reward',
                    data: {
                        inputs: [],
                        outputs: [{
                            address: req.query.addressId,
                            amount: Config.MINING_REWARD
                        }]
                    }
                }));
            }

            return Block.fromJson({
                index: newIndex,
                nonce: 0,
                timestamp: Date.now(),
                transactions: cleanTransactions,
                previousHash: previousBlock.hash
            });
        });

        function authenticateToken(req, res, next) {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];
          
            if (token == null) return res.status(401).send();
          
            jwt.verify(token, Config.SECRET, (err, user) => {        
                if (err) {
                    warn(err)
                    return res.status(403).send({ error: err });
                }

                req.user = user;
                next();
            });
        }

        this.app.post('/teller/login', (req, res) => {
            logReq('POST', req);
            const hashedPwd = Crypto.hash(req.body.password);

            let wallet = teller.getWalletByEmail(req.body.email);
            if (!wallet) {
                warn(`E-mail ${req.body.email.yellow} is not registered!`);
                res.status(401).send({ error: `Incorrect E-mail or password.` });
                return;
            }

            if (!teller.checkWalletPassword(wallet.id, hashedPwd)) {
                warn(`Password hash does not match!`);
                res.status(401).send({ error: `Incorrect E-mail or password.` });
                return;
            }

            res.status(200).send(jwt.sign(
                { email: req.body.email, walletId: wallet.id },
                Config.SECRET,
                { expiresIn: '1800s' }
            ));
        });

        this.app.post('/teller/register', (req, res) => {
            logReq('POST', req);

            const hashedPwd = Crypto.hash(req.body.password);

            let wallet = teller.getWalletByEmail(req.body.email);
            if (wallet) {
                warn(`E-mail ${req.body.email.yellow} is already registered!`);
                res.status(401).send({ error: `E-mail already registered.` });
                return;
            }

            wallet = teller.createWallet(req.body.email, hashedPwd);

            res.status(200).send();
        });

        this.app.get('/teller/user', authenticateToken, (req, res) => {
            logReq('GET', req);
            res.status(200).send({ user: req.user });
        });

        this.app.get('/teller/wallets', (req, res) => {
            logReq('GET', req);

            res.status(200).send(teller.getWallets().map(cullWalletData));
        });

        this.app.get('/teller/wallet/balance', authenticateToken, (req, res) => {
            logReq('GET', req);

            const wallet = teller.getWalletById(req.user.walletId);
            if (!wallet) {
                warn(`User ${req.user.email.yellow} has a non-existing wallet id ${req.user.walletId.yellow}`);
                res.status(404).send({ error: `Could not find wallet with id ${req.user.walletId} !`});
                return;
            }
            
            const balance = teller.getBalanceForWallet(wallet);
            res.status(200).send({ balance: balance });
        });

        this.app.get('/teller/wallet/addresses', authenticateToken, (req, res) => {
            logReq('GET', req);

            const wallet = teller.getWalletById(req.user.walletId);
            if (!wallet) {
                warn(`User ${req.user.email.yellow} has a non-existing wallet id ${req.user.walletId.yellow}`);
                res.status(404).send({ error: `Could not find wallet with id ${req.user.walletId} !`});
                return;
            }
            
            const addresses = teller.getAddressesForWallet(wallet);
            res.status(200).send({ addresses: addresses });
        });

        this.app.post('/teller/wallet/addresses', authenticateToken, (req, res) => {
            logReq('POST', req);

            const wallet = teller.getWalletById(req.user.walletId);
            if (!wallet) {
                warn(`User ${req.user.email.yellow} has a non-existing wallet id ${req.user.walletId.yellow}`);
                res.status(404).send({ error: `Could not find wallet with id ${req.user.walletId} !`});
                return;
            }

            let newAddress = teller.generateAddressForWallet(wallet);
            res.status(201).send({ address: newAddress });
        });

        this.app.post('/teller/wallets/:walletId/transactions', (req, res) => {
            logReq('POST', req);

            let walletId = req.params.walletId;
            let password = req.headers.password;

            if (password == null) {
                warn(`Password not provided!`);
                res.status(401).send({ error: `Password not provided!` });
                return;
            }

            let passwordHash = Crypto.hash(password);

            if (!teller.checkWalletPassword(walletId, passwordHash)) {
                warn(`Invalid password for wallet ${walletId.yellow} !`);
                res.status(403).send({ error: `Invalid password for wallet ${walletId} !` });
                return;
            }

            let transaction = teller.createTransaction(walletId, req.body.fromAddress, req.body.toAddress, req.body.amount, req.body['changeAddress'] || req.body.fromAddress);
            transaction.check();

            res.status(201).send(blockchain.addTransaction(Transaction.fromJson(transaction)));
        });

        this.app.get('/teller/:addressId/balance', (req, res) => {
            logReq('GET', req);

            let addressId = req.params.addressId;
            // check address exists.
            let balance = teller.getBalanceForAddress(addressId);
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