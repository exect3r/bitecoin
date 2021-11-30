const Crypto = require('../utils/crypto');
const Transaction = require('./transaction');
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
                block[key] = Transaction.Array.fromJson(value);
            } else {
                block[key] = value;
            }
        }, data);

        block.hash = block.toHash();
        return block;
    }

    static Array = class BlocksArray extends Array {
        static fromJson(data) {
            let blocks = new BlocksArray();
            data.forEach((block) => blocks.push(Block.fromJson(block)));
            return blocks;
        }
    }

}

module.exports = Block;