const Database = require('../utils/database');
const Block = require('./block');
const Transaction = require('./transaction');
const Peer = require('./peer');
const Config = require('../config');
const axios = require('axios').default;
const { log, error, warn } = require('../utils/logs');

class Blockchain {
    constructor(name, host, port) {
        this.name = name;
        this.host = host;
        this.port = port;
        this.peers = [];

        this.blocksDb = new Database(`data/${name}/${Config.BLOCKCHAIN_FILE}`, new Block.Array());
        this.transDb = new Database(`data/${name}/${Config.TRANSACTIONS_FILE}`, new Transaction.Array());
        this.peerDb = new Database(`data/${Config.PEERS_FILE}`, new Peer.Array())

        this.blocks = this.blocksDb.read(Block.Array);
        this.transactions = this.transDb.read(Transaction.Array);
    }

    init() {
        log('Initializing the blockchain.');
        if (this.blocks.length == 0) {
            log('Blockchain is empty, adding a genesis block');
            this.blocks.push(Block.genesis);
            this.blocksDb.write(this.blocks);
        }

        log('Culling already processed transactions.');
        this.blocks.forEach(this.cullTransactions.bind(this), this.blocks);

        const peerList = this.peerDb.read(Peer.Array);
        if (peerList.length > 0) {
            log('Attempting to connect to peers.');
            this.connectToPeers(peerList, false);
        }
    }

    // Blockchain

    getAllBlocks() {
        return this.blocks;
    }

    getBlockByIndex(index) {
        return this.blocks.find(block => block.index == index);
    }

    getBlocksInRange(start, end) {
        return start >= 0 ? this.blocks.slice(start, end) : this.blocks.slice(-end);
    }

    getBlockByHash(hash) {
        return this.blocks.find(block => block.hash == hash);
    }

    getLastBlock() {
        return this.blocks[this.blocks.length - 1];
    }

    getDifficulty(index) {
        return Config.DIFFICULTY(this.blocks, index);
    }

    getAllTransactions() {
        return this.transactions;
    }

    getTransactionById(id) {
        return this.transactions.find(trans => trans.id == id);
    }

    getTransactionsInRange(start, end) {
        const trans = this.getTransactionsFromBlocks();
        return start >= 0 ? trans.slice(start, end) : trans.slice(-end);
    }

    getTransactionFromBlocks(transactionId) {
        return this.blocks.find(block => block.transactions.find(trans => trans.id == transactionId));
    }

    getTransactionsFromBlocks() {
        return this.blocks.flatMap(block => block.transactions);
    }

    replaceChain(blockchain, broadcast = true) {
        if (blockchain.length <= this.blocks.length) {
            error('Blockchain is shorter than the current blockchain');
            throw 'Blockchain is shorter than the current blockchain';
        }

        this.checkChain(blockchain);
        log('Received blockchain is valid. Replacing current blockchain with received blockchain.');

        // Adding the extra blocks from the received blockchain.
        let blocks = blockchain.slice(this.blocks.length - blockchain.length);
        blocks.forEach((block) => this.addBlock(block, false));
        
        if (broadcast)
            this.broadcast(this.sendLatestBlockToPeer, blocks[blocks.length - 1]);
    }

    checkChain(blockchain) {
        // Checking genesis block.
        if (JSON.stringify(blockchain[0]) !== JSON.stringify(Block.genesis)) {
            error('Genesis blocks aren\'t the same');
            throw 'Genesis blocks aren\'t the same';
        }

        try {
            for (let i = 1; i < blockchain.length; i++)
                this.checkBlock(blockchain[i], blockchain[i - 1], blockchain);
        } catch (ex) {
            error('Invalid block sequence');
            throw 'Invalid block sequence';
        }

        return true;
    }

    addBlock(block, broadcast = true) {
        if (this.checkBlock(block, this.getLastBlock())) {
            this.blocks.push(block);
            this.blocksDb.write(this.blocks);

            this.cullTransactions(block);

            if (broadcast)
                this.broadcast(this.sendLatestBlockToPeer, block);
            
            log(`Block added: ${block.hash.yellow}`);
            return block;
        }
    }

    addTransaction(trans, broadcast = true) {
        if (this.checkTransaction(trans, this.blocks)) {
            this.transactions.push(trans);
            this.transDb.write(this.transactions);

            if (broadcast)
                this.broadcast(this.sendTransactionToPeer, trans);
            
            log(`Transaction added: ${trans.id.yellow}`);
            return trans;
        }
    }

    cullTransactions(block) {
        this.transactions = this.transactions.filter(trans => !block.transactions.find(tr => tr.id == trans.id) );
        this.transDb.write(this.transactions);
    }

    checkBlock(newBlock, previousBlock, referenceBlockchain) {
        if (!referenceBlockchain) referenceBlockchain = this.blocks;

        const blockHash = newBlock.toHash();

        // Check index chaining.
        if (previousBlock.index + 1 != newBlock.index) {
            error(`Invalid index: expected '${previousBlock.index + 1}' got '${newBlock.index}'`);
            throw `Invalid index: expected '${previousBlock.index + 1}' got '${newBlock.index}'`;
        }
        // Check hash chaining.
        else if (previousBlock.hash != newBlock.previousHash) {
            error(`Invalid previous hash: expected '${previousBlock.hash}' got '${newBlock.previousHash}'`);
            throw `Invalid previous hash: expected '${previousBlock.hash}' got '${newBlock.previousHash}'`;
        }
        // Check calculated hash validity.
        else if (blockHash != newBlock.hash) {
            error(`Invalid hash: expected '${blockHash}' got '${newBlock.hash}'`);
            throw `Invalid hash: expected '${blockHash}' got '${newBlock.hash}'`;
        }
        // Check difficulty.
        else if (newBlock.getDifficulty() >= this.getDifficulty(newBlock.index)) {
            error(`Invalid proof-of-work difficulty: expected '${newBlock.getDifficulty()}' to be smaller than '${this.getDifficulty(newBlock.index)}'`);
            throw `Invalid proof-of-work difficulty: expected '${newBlock.getDifficulty()}' be smaller than '${this.getDifficulty()}'`;
        }

        newBlock.transactions.forEach(this.checkTransaction.bind(this));

        // Check if the sums are correct.
        let sumOfInputsAmount = Config.MINING_REWARD;
        let sumOfOutputsAmount = 0;
        let list = {};

        for (let trans of newBlock.transactions) {
            sumOfInputsAmount += trans.data.inputs.map(i => i.amount).reduce((i1, i2) => i1 + i2, 0);
            sumOfOutputsAmount += trans.data.outputs.map(i => i.amount).reduce((i1, i2) => i1 + i2, 0);

            trans.data.inputs.map(inputTx => inputTx.transaction + inputTx.index)
                .forEach(tx => { list[tx] ? list[tx]++ : list[tx] = 1; });
        }

        //log(`sums ${sumOfInputsAmount} ${sumOfOutputsAmount}`);

        if (sumOfInputsAmount < sumOfOutputsAmount) {
            error(`Invalid block balance: inputs sum '${sumOfInputsAmount}', outputs sum '${sumOfOutputsAmount}'`);
            throw `Invalid block balance: inputs sum '${sumOfInputsAmount}', outputs sum '${sumOfOutputsAmount}'`;
        }

        // Check if there is double spending
        list = Object.keys(list).filter(tx => list[tx] > 1);

        if (list.length) {
            warn(`There are unspent output transactions being used more than once: unspent output transaction: '${list.join(', ')}'`);
            throw `There are unspent output transactions being used more than once: unspent output transaction: '${list.join(', ')}'`;
        }

        let transRewardsCount = newBlock.transactions.filter(trans => trans.type == 'reward').length;
        if (transRewardsCount > 1) {
            warn(`Invalid reward transaction count: expected '1' got '${transRewardsCount}'`);
            throw `Invalid reward transaction count: expected '1' got '${transRewardsCount}'`;
        }

        return true;
    }

    checkTransaction(transaction, referenceBlockchain) {
        if (!referenceBlockchain || typeof referenceBlockchain != 'object') referenceBlockchain = this.blocks;
        transaction.check(transaction);

        // Verify if the transaction isn't already in the blockchain.
        if (referenceBlockchain.find(block => block.transactions.find(trans => trans.id == transaction.id))) {
            error(`Transaction '${transaction.id}' is already in the blockchain`);
            throw `Transaction '${transaction.id}' is already in the blockchain`;
        }

        let isInputTransactionsUnspent = transaction.data.inputs.flatMap(txInput => referenceBlockchain
            .map(block => !!block.transactions.find(tx => tx.data.inputs.find(input =>
                input.transaction == txInput.transaction && input.index == txInput.index))));

        if (!isInputTransactionsUnspent) {
            console.error(`Not all inputs are unspent for transaction '${transaction.id}'`);
            throw new TransactionAssertionError(`Not all inputs are unspent for transaction '${transaction.id}'`, transaction.data.inputs);
        }

        return true;
    }

    getUnspentTransactionsForAddress(address) {
        const selectTxs = (transaction) => {
            let index = 0;
            // Create a list of all transactions outputs found for an address (or all).
            transaction.data.outputs.forEach(txOutput => {
                if (address && txOutput.address == address) {
                    txOutputs.push({
                        transaction: transaction.id,
                        index: index,
                        amount: txOutput.amount,
                        address: txOutput.address
                    });
                }
                index++;
            });

            // Create a list of all transactions inputs found for an address (or all).            
            transaction.data.inputs.forEach((txInput) => {
                if (address && txInput.address != address) return;

                txInputs.push({
                    transaction: txInput.transaction,
                    index: txInput.index,
                    amount: txInput.amount,
                    address: txInput.address
                });
            });
        };

        // Considers both transactions in block and unconfirmed transactions (enabling transaction chain)
        let txOutputs = [];
        let txInputs = [];
        this.blocks.forEach(block => block.transactions.forEach(selectTxs));

        // Cross both lists and find transactions outputs without a corresponding transaction input
        let unspentTransactionOutput = [];
        txOutputs.forEach((txOutput) => {
            if (!txInputs.find((txInput) => txInput.transaction == txOutput.transaction && txInput.index == txOutput.index)) {
                unspentTransactionOutput.push(txOutput);
            }
        });

        return unspentTransactionOutput;
    }

    // Peer management

    broadcast(f, ...args) {
        this.peers.map((peer) => {
            f.apply(this, [peer, ...args]);
        });
    }

    connectToPeer(peer) {
        return axios.get(`${peer}/peers`).then((res) => true).catch((err) => false);
    }

    connectToPeers(peers, logExisting = true) {
        const self = `http://${this.host}:${this.port}`;
        peers.forEach((peer) => {
            if (peer == self) return;
            if (!this.peers.find(p => p == peer))
                this.connectToPeer(peer).then((isOnline) => {
                    if (isOnline) {
                        this.sendPeer(peer, self);
                        this.peers.push(peer);

                        log(`Added peer ${peer.yellow}.`);

                        this.getLatestBlockFromPeer(peer);
                        this.getTransactionsFromPeer(peer);

                        this.broadcast(this.sendPeer, peer);
                    }
                    else log(`Peer ${peer.yellow} is ${'offline'.red}.`);
                });
            else if (logExisting) log(`Peer ${peer.yellow} already added.`);
        });
    }

    sendPeer(peer, destPeer) {
        if (peer == destPeer) return;

        const URL = `${peer}/peers`;
        log(`Sending ${destPeer.yellow} to peer ${URL.cyan}.`);
        return axios
            .post(URL, { peer: destPeer })
            .catch((err) => {
                console.warn(`Unable to ${destPeer.yellow} me to peer ${URL.cyan}: ${err.message}`);
            });
    }

    getLatestBlockFromPeer(peer) {
        const URL = `${peer}/blockchain/blocks/latest`;
        log(`Getting latest block from: ${URL.yellow}`);
        return axios.get(URL)
            .then((res) => {
                if (!res.data) {
                    warn(`${URL.yellow} did not return a valid block.`);
                    return;
                }
                this.checkReceivedBlock(Block.fromJson(res.data));
            })
            .catch((err) => {
                warn(`Unable to get latest block from ${URL.yellow}: ${err.message}`);
            });
    }

    sendLatestBlockToPeer(peer, block) {
        const URL = `${peer}/blockchain/blocks/latest`;
        log(`Posting latest block to: ${URL.yellow}`);
        return axios.put(URL, { block })
            .catch((err) => {
                warn(`Unable to post latest block to ${URL.yellow}: ${err.message}`);
            });
    }

    getBlocksFromPeer(peer) {
        const URL = `${peer}/blockchain/blocks`;
        log(`Getting blocks from: ${URL.yellow}`);
        return axios.get(URL)
            .then((res) => {
                if (!res.data) {
                    warn(`${URL.yellow} did not return a valid array of blocks.`);
                    return;
                }
                this.checkReceivedBlocks(Block.Array.fromJson(res.data));
            })
            .catch((err) => {
                warn(`Unable to get blocks from ${URL.yellow}: ${err.message}`);
            });
    }

    sendTransactionToPeer(peer, transaction) {
        const URL = `${peer}/blockchain/transactions`;
        log(`Sending transaction '${(transaction.id.slice(0, 5) + '...' + transaction.id.slice(-5)).yellow}' to: '${URL.yellow}'`);
        return axios.post(URL, { transaction })
            .catch((err) => {
                warn(`Unable to post transaction to ${URL}: ${err.message}`);
            });
    }

    getTransactionsFromPeer(peer) {
        const URL = `${peer}/blockchain/transactions`;
        log(`Getting transactions from: ${URL.yellow}`);
        return axios.get(URL)
            .then((res) => {
                if (!res.data) {
                    warn(`${URL.yellow} did not return a valid array of transactions.`);
                    return;
                }
                this.syncTransactions(Transaction.Array.fromJson(res.data));
            })
            .catch((err) => {
                warn(`Unable to get transations from ${URL.yellow}: ${err.message}`);
            });
    }

    getConfirmation(peer, transactionId) {
        const URL = `${peer}/blockchain/blocks/transactions/${transactionId}`;
        log(`Getting transactions from: ${URL.yellow}`);
        return axios.get(URL)
            .then(() => {
                return true;
            })
            .catch(() => {
                return false;
            });
    }

    getConfirmations(transactionId) {
        const existsHere = this.getTransactionFromBlocks(transactionId) ? true : false;
        return Promise.all(this.peers.map((peer) => {
            return this.getConfirmation(peer, transactionId);
        })).then((values) => {
            return [existsHere, ...values].filter((conf) => conf).length;
        });
    }

    syncTransactions(transactions) {
        transactions.forEach((trans) => {
            if (!this.getTransactionById(trans.id)) {
                log(`Adding transaction '${trans.id.yellow}'`);
                this.addTransaction(trans);
            }
        });
    }

    checkReceivedBlock(block) {
        return this.checkReceivedBlocks([block]);
    }

    checkReceivedBlocks(blocks) {
        const orderedBlocks = blocks.sort((b1, b2) => b1.index - b2.index);
        const apexForeign = orderedBlocks[orderedBlocks.length - 1];
        const apexHere = this.getLastBlock();

        if (apexForeign.index <= apexHere.index)
            return false;

        log(`Blockchain is possibly behind. Our height: ${apexHere.index}, Peer's height: ${apexForeign.index}.`);

        // We can append the received block to our chain
        if (apexHere.hash === apexForeign.previousHash) {
            log('Appending received block to our chain.');
            this.addBlock(apexForeign);
            return true;
        }
        // We have to query the chain from our peer
        else if (orderedBlocks.length == 1) {
            log('Querying the blockchain from our peers.');
            this.broadcast(this.getBlocksFromPeer);
            return 'need_full_blockchain';
        }
        // Received blockchain is longer than current blockchain
        else {
            log('Updating blockchain to match peer\'s blockchain.');
            this.replaceChain(orderedBlocks);
            return true;
        }
    }
}

module.exports = Blockchain;