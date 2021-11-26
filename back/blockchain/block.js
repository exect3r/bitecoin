const Crypto = require('../utils/crypto');
const Transactions = require('./transactions');
const Config = require('../config');

class Block {
    toHash() {
        return Crypto.hash(`${this.index}${this.previousHash}${this.timestamp}${JSON.stringify(this.transactions)}${this.nonce}`);
    }

    getDifficulty() {
        return parseInt(this.hash.substring(0, 14), 16);
    }

    static get genesis() {
        return Block.fromJson(Config.GENESIS_BLOCK);
    }

    static fromJson(data) {
        let block = new Block();
        Object.entries(data).forEach(([key, value]) => {
            if (key == 'transactions' && value) {
                block[key] = Transactions.fromJson(value);
            } else {
                block[key] = value;
            }
        }, data);

        block.hash = block.toHash();
        return block;
    }

}

module.exports = Block;