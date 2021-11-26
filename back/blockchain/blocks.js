const Block = require('./block');

class Blocks extends Array {
    static fromJson(data) {
        let blocks = new Blocks();
        data.forEach((block) => blocks.push(Block.fromJson(block)));
        return blocks;
    }
}

module.exports = Blocks;