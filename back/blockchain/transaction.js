const Crypto = require('../utils/crypto');
const Config = require('../config');
const { error } = require('../utils/logs')

class Transaction {
    construct() {
        this.id = null;
        this.hash = null;
        this.type = null;
        this.data = {
            inputs: [],
            outputs: []
        };
    }

    toHash() {
        return Crypto.hash(`${this.id}${this.type}${JSON.stringify(this.data)}`);
    }

    check() {
        let isTransactionHashValid = this.hash == this.toHash();

        if (!isTransactionHashValid) {
            error(`Invalid transaction hash '${this.hash}'`);
            throw `Invalid transaction hash '${this.hash}'`;
        }

        // Check if the input transactions are valid.
        for (let txInput of this.data.inputs) {
            let txInputHash = Crypto.hash({
                transaction: txInput.transaction,
                index: txInput.index,
                address: txInput.address
            });

            let isValidSignature = Crypto.verifySignature(txInput.address, txInput.signature, txInputHash);

            if (!isValidSignature) {
                error(`Invalid transaction input signature '${JSON.stringify(txInput)}'`);
                throw `Invalid transaction input signature '${JSON.stringify(txInput)}'`;
            }
        }

        if (this.type == 'regular') {
            // Checking sums.
            let sumOfInputsAmount = 0;
            this.data.inputs.forEach((txInput) => sumOfInputsAmount += txInput.amount);
            let sumOfOutputsAmount = 0;
            this.data.inputs.forEach((txOutput) => sumOfOutputsAmount += txOutput.amount);

            let negativeOutputsFound = 0;
            let i = 0;
            let outputsLen = this.data.outputs.length;

            for (i = 0; i < outputsLen; i++) {
                if (this.data.outputs[i].amount < 0) {
                    negativeOutputsFound++;
                }
            }

            if (sumOfInputsAmount < sumOfOutputsAmount) {
                error(`Invalid transaction balance: inputs sum '${sumOfInputsAmount}', outputs sum '${sumOfOutputsAmount}'`);
                throw `Invalid transaction balance: inputs sum '${sumOfInputsAmount}', outputs sum '${sumOfOutputsAmount}'`;
            }

            if (sumOfInputsAmount - sumOfOutputsAmount < Config.FEE_PER_TRANSACTION) {
                error(`Not enough fee: expected '${Config.FEE_PER_TRANSACTION}' got '${(sumOfInputsAmount - sumOfOutputsAmount)}'`);
                throw `Not enough fee: expected '${Config.FEE_PER_TRANSACTION}' got '${(sumOfInputsAmount - sumOfOutputsAmount)}'`;
            }

            if (negativeOutputsFound > 0) {
                error(`Transaction is either empty or negative, output(s) caught: '${negativeOutputsFound}'`);
                throw `Transaction is either empty or negative, output(s) caught: '${negativeOutputsFound}'`;
            }
        }

        return true;
    }

    static fromJson(data) {
        let transaction = new Transaction();
        Object.entries(data).forEach(([key, value]) => { transaction[key] = value; });
        transaction.hash = transaction.toHash();
        return transaction;
    }
}

module.exports = Transaction;
