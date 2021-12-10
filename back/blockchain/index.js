const Database = require('../utils/database');
const Block = require('./block');
const Transaction = require('./transaction');
const Config = require('../config');
const { log, error, warn } = require('../utils/logs');
const EventEmitter = require('events');

class Blockchain {
    constructor(name) {
        this.name = name;

        this.blocksDb = new Database(`data/${name}/${Config.BLOCKCHAIN_FILE}`, new Block.Array());
        this.transDb = new Database(`data/${name}/${Config.TRANSACTIONS_FILE}`, new Transaction.Array());

        this.blocks = this.blocksDb.read(Block.Array);
        this.transactions = this.transDb.read(Transaction.Array);
        this.events = new EventEmitter();
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
    }

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

    replaceChain(blockchain) {
        if (blockchain.length <= this.blocks.length) {
            error('Blockchain is shorter than the current blockchain');
            throw 'Blockchain is shorter than the current blockchain';
        }

        this.checkChain(blockchain);
        log('Received blockchain is valid. Replacing current blockchain with received blockchain');

        // Adding the extra blocks from the received blockchain.
        let blocks = blockchain.slice(blockchain.length - this.blocks.length);
        blocks.forEach((block) => this.addBlock(block, false));
        
        this.events.emit('blocksAdded', blocks);
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

    addBlock(block, event = true) {
        if (this.checkBlock(block, this.getLastBlock())) {
            this.blocks.push(block);
            this.blocksDb.write(this.blocks);

            // After adding the block it removes the transactions of this block from the list of pending transactions
            this.cullTransactions(block);

            if (event) this.events.emit('blockAdded', block);
            log(`Block added: ${block.hash.yellow}`);
            return block;
        }
    }

    addTransaction(trans, event = true) {
        if (this.checkTransaction(trans, this.blocks)) {
            this.transactions.push(trans);
            this.transDb.write(this.transactions);

            if (event) this.events.emit('transactionsAdded', trans);
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

        log(`sums ${sumOfInputsAmount} ${sumOfOutputsAmount}`);

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

        // Verify if all input transactions are unspent in the blockchain
        /*let isInputTransactionsUnspent = R.all(R.equals(false), R.flatten(R.map((txInput) => {
            return R.map(
                R.pipe(
                    R.prop('transactions'),
                    R.map(R.pipe(
                        R.path(['data', 'inputs']),
                        R.contains({ transaction: txInput.transaction, index: txInput.index })
                    ))
                ), referenceBlockchain);
        }, transaction.data.inputs)));*/

        let isInputTransactionsUnspent = transaction.data.inputs.flatMap(txInput => referenceBlockchain
            .map(block => !!block.transactions.find(tx => tx.data.inputs.find(input =>
                input.transaction == txInput.transaction && input.index == txInput.index))));
        
        console.log(isInputTransactionsUnspent)

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
        //this.transactions.forEach(selectTxs); // need to be saved to the blocks

        // Cross both lists and find transactions outputs without a corresponding transaction input
        let unspentTransactionOutput = [];
        txOutputs.forEach((txOutput) => {
            if (!txInputs.find((txInput) => txInput.transaction == txOutput.transaction && txInput.index == txOutput.index)) {
                unspentTransactionOutput.push(txOutput);
            }
        });

        return unspentTransactionOutput;
    }
}

module.exports = Blockchain;