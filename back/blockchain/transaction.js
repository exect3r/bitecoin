const Crypto = require('../utils/crypto');
const Config = require('../config');
const { error } = require('../utils/logs')

class Transaction {
    constructor() {
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

    static Array = class TransactionArray extends Array {
        static fromJson(data) {
            let transactions = new TransactionArray();
            Object.values(data).forEach((transaction) => transactions.push(Transaction.fromJson(transaction)));
            return transactions;
        }
    }

    static create() {
        return {
            listOfUTXO: null,
            outputAddresses: null,
            totalAmount: null,
            changeAddress: null,
            feeAmount: 0,
            secretKey: null,
            type: 'regular',

            from(listOfUTXO) {
                this.listOfUTXO = listOfUTXO;
                return this;
            },
        
            to(address, amount) {
                this.outputAddress = address;
                this.totalAmount = amount;
                return this;
            },
        
            change(changeAddress) {
                this.changeAddress = changeAddress;
                return this;
            },
        
            fee(amount) {
                this.feeAmount = amount;
                return this;
            },
        
            sign(secretKey) {
                this.secretKey = secretKey;
                return this;
            },
        
            type(type) {
                this.type = type;
            },
        
            build() {
                // Check required information
                if (!this.listOfUTXO) {
                    warn('List of unspent output transactions not provided.');
                    throw 'List of unspent output transactions not provided.';
                }
                if (!this.outputAddress) {
                    warn('Destination address not provided.');
                    throw 'Destination address not provided.';
                }
                if (!this.totalAmount) {
                    warn('Transaction value not provided.');
                    throw 'Transaction value not provided.';
                }
        
                // Calculates the change amount
                let totalAmountOfUTXO = this.listOfUTXO.reduce((t1, t2) => t1.amount + t2.amount);
                let changeAmount = totalAmountOfUTXO - this.totalAmount - this.feeAmount;
        
                // For each transaction input, calculates the hash of the input and sign the data.
                let self = this;
                let inputs = this.listOfUTXO.map((utxo) => {
                    let txiHash = Crypto.hash({
                        transaction: utxo.transaction,
                        index: utxo.index,
                        address: utxo.address
                    });
                    utxo.signature = Crypto.signHash(Crypto.generateKeyPairFromSecret(self.secretKey), txiHash);
                    return utxo;
                });
        
                let outputs = [];
        
                // Add target receiver
                outputs.push({
                    amount: this.totalAmount,
                    address: this.outputAddress
                });
        
                // Add change amount
                if (changeAmount > 0) {
                    outputs.push({
                        amount: changeAmount,
                        address: this.changeAddress
                    });
                } else {
                    warn('The sender does not have enough to pay for the transaction.');
                    throw 'The sender does not have enough to pay for the transaction.';
                }
        
                return Transaction.fromJson({
                    id: Crypto.randomId(64),
                    hash: null,
                    type: this.type,
                    data: {
                        inputs: inputs,
                        outputs: outputs
                    }
                });
            }
        }
    }
}

module.exports = Transaction;
