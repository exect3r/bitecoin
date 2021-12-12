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
                transactionCount: blockchain.getTransactionsFromBlocks().length,
                coinPrice: 0, // calculate coin price in dollars
                hashPower: Config.DIFFICULTY(blockchain.getAllBlocks()), // calculate hash power
            });
        });

        this.app.get('/blockchain/blocks', (req, res) => {
            logReq('GET', req);

            res.status(200).send(blockchain.getAllBlocks());
        });

        this.app.post('/blockchain/blocks', (req, res) => {
            logReq('POST', req);

            try {
                // sanitize block from excess properties
                const block = Block.fromJson(req.body.block);

                if (blockchain.checkBlock(block, blockchain.getLastBlock())) {
                    blockchain.addBlock(block)
                    res.status(200).send({ status: 'Block added to the blockchain successfully. ' });
                }
            } catch (e) {
                res.status(403).send({ error: e });
            }
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

            let requestBlock = Block.fromJson(req.body.block);

            if (!requestBlock) {
                warn('Request does not contain a valid block.');
                return;
            }

            let result = blockchain.checkReceivedBlock(requestBlock);

            if (result == 'need_full_blockchain')
                res.status(200).send({ status: 'Requesting the full blockchain to check.' });
            else if (result) res.status(200).send(requestBlock);
            else res.status(200).send({ status: 'Blockchain seems ahead.' });
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

        this.app.get('/blockchain/blocks/:range([0-9]{0,}\\-[0-9]+)', (req, res) => {
            logReq('GET', req);

            let bounds = req.params.range.split('-');
            let start = Number(bounds[0] || -1);
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

        this.app.get('/blockchain/transactions/:range([0-9]{0,}\\-[0-9]+)', (req, res) => {
            logReq('GET', req);

            let bounds = req.params.range.split('-');
            let start = Number(bounds[0] || -1);
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

            let requestTransaction = Transaction.fromJson(req.body.transaction);
            let transactionFound = blockchain.getTransactionById(requestTransaction.id);

            if (transactionFound)
                return;

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
            let toRemove = [];

            //console.log('len', blockchain.transactions.length)

            blockchain.transactions.forEach((trans, i) => {
                //console.log('treating ', i)
                if (cleanTransactions.length == Config.TRANSACTIONS_PER_BLOCK) return;

                if (trans.type == 'regular' && trans.data.outputs.find(out => out.amount < 0)) {
                    warn(`Discarding regular transaction ${trans.id.yellow} that has negative outputs.`);
                    toRemove.push(i);
                    return;
                }
                
                if (trans.type != 'regular' && trans.type != 'reward') {
                    warn(`Discarding transaction ${trans.id.yellow} that has an unknown type ${(trans.type || '').red}.`);
                    toRemove.push(i);
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
                    toRemove.push(i);
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
                    toRemove.push(i);
                    return;
                }

                cleanTransactions.push(trans);
            });

            toRemove.forEach(i => blockchain.transactions.splice(i, 1));
            cleanTransactions = cleanTransactions.slice(0, Config.TRANSACTIONS_PER_BLOCK);

            if (req.params.addressId) {
                cleanTransactions.push(Transaction.fromJson({
                    id: Crypto.randomId(64),
                    type: 'reward',
                    data: {
                        inputs: [],
                        outputs: [{
                            address: req.params.addressId,
                            amount: Config.MINING_REWARD
                        }]
                    }
                }));
            }

            res.status(200).send(Block.fromJson({
                index: newIndex,
                nonce: 0,
                timestamp: Date.now(),
                transactions: cleanTransactions,
                previousHash: previousBlock.hash,
                difficulty: Config.DIFFICULTY(blockchain.getAllBlocks(), newIndex),
                miner: req.params.addressId
            }));
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
            teller.generateAddressForWallet(wallet);

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

        this.app.get('/teller/wallet/transactions/:range([0-9]{0,}\\-[0-9]+)', authenticateToken, (req, res) => {
            logReq('GET', req);

            const wallet = teller.getWalletById(req.user.walletId);
            if (!wallet) {
                warn(`User ${req.user.email.yellow} has a non-existing wallet id ${req.user.walletId.yellow}`);
                res.status(404).send({ error: `Could not find wallet with id ${req.user.walletId} !` });
                return;
            }

            let bounds = req.params.range.split('-');
            let start = Number(bounds[0] || -1);
            let end = Number(bounds[1]);

            const transactions = teller.getWalletTransactions(wallet);
            res.status(200).send({ transactions: start >= 0 ? transactions.slice(start, end) : transactions.slice(-end) });
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

        this.app.post('/teller/wallet/transactions', authenticateToken, (req, res) => {
            logReq('POST', req);

            try {
                let transaction = teller.createTransaction(req.user.walletId, req.body.from, req.body.to,
                    Number(req.body.amount), Number(req.body.fee));
                
                //console.log(transaction, transaction.data)
                
                transaction.check();
                res.status(201).send(blockchain.addTransaction(Transaction.fromJson(transaction)));
            } catch (e) {
                res.status(403).send({ error: 'Could not create transaction.' });
            }
        });

        this.app.get('/teller/:addressId/balance', authenticateToken, (req, res) => {
            logReq('GET', req);

            let addressId = req.params.addressId;
            // check address exists.
            let balance = teller.getBalanceForAddress(addressId);
            res.status(200).send({ balance: balance });
        });

        this.app.get('/peers', (req, res) => {
            logReq('GET', req);

            res.status(200).send({ status: 'online' });
        });

        this.app.post('/peers', (req, res) => {
            logReq('POST', req);

            if (req.body.peer) {
                blockchain.connectToPeers([req.body.peer]);
                res.status(200).send({ status: 'peer received' });
            }
            else res.status(400).send({ error: '\'peer\' not specified in request body.' });
        });

        this.app.get('/blockchain/utxos', (req, res) => {
            logReq('GET', req);

            res.status(200).send(teller.getWallets().flatMap(wallet => teller.getAddressesForWallet(wallet))
                .map(addr => ({ address: addr, utxos: blockchain.getUnspentTransactionsForAddress(addr) })));
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

// TODO: Add transactions cleaning from double-spending errors.