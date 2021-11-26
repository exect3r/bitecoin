const Crypto = require('../utils/crypto');
const Transaction = require('../blockchain/transaction');
const { log, warn, error } = require('../utils/logs');

class TransactionBuilder {
    constructor() {
        this.listOfUTXO = null;
        this.outputAddresses = null;
        this.totalAmount = null;
        this.changeAddress = null;
        this.feeAmount = 0;
        this.secretKey = null;
        this.type = 'regular';
    }

    from(listOfUTXO) {
        this.listOfUTXO = listOfUTXO;
        return this;
    }

    to(address, amount) {
        this.outputAddress = address;
        this.totalAmount = amount;
        return this;
    }

    change(changeAddress) {
        this.changeAddress = changeAddress;
        return this;
    }

    fee(amount) {
        this.feeAmount = amount;
        return this;
    }

    sign(secretKey) {
        this.secretKey = secretKey;
        return this;
    }

    type(type) {
        this.type = type;
    }

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

module.exports = TransactionBuilder;