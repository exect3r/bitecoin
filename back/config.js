module.exports = {
    BLOCKCHAIN_FILE: 'blockchain',
    TRANSACTIONS_FILE: 'transactions',
    TELLER_FILE: 'wallets',
    
    SALT: '0ffaa74d206930aaece253f090c88dbe6685b9e66ec49ad988d84fd7dff230d1',
    SECRET: '7pec3ac02f82245pen9df13ddf7c3c0f19bab4acd4dc928c62fcd78d5ebc4fgh',

    MINING_REWARD: 5000000000,
    FEE_PER_TRANSACTION: 1,
    TRANSACTIONS_PER_BLOCK: 2,
    
    GENESIS_BLOCK: {
        index: 0,
        previousHash: '0',
        timestamp: 1465154705,
        nonce: 0,
        transactions: [
            {
                id: '63ec3ac02f822450039df13ddf7c3c0f19bab4acd4dc928c62fcd78d5ebc6dba',
                hash: null,
                type: 'regular',
                data: {
                    inputs: [],
                    outputs: []
                }
            }
        ]
    },
    pow: {
        getDifficulty: (blocks, index) => {
            const BASE_DIFFICULTY = Number.MAX_SAFE_INTEGER;
            const EVERY_X_BLOCKS = 5;
            const POW_CURVE = 5;

            return Math.max(
                Math.floor(
                    BASE_DIFFICULTY / Math.pow(
                        Math.floor(((index || blocks.length) + 1) / EVERY_X_BLOCKS) + 1
                        , POW_CURVE)
                )
                , 0);
        }
    }
};