const Transaction = require('./transaction');

class Transactions extends Array {
    static fromJson(data) {
        let transactions = new Transactions();
        Object.values(data).forEach((transaction) => transactions.push(Transaction.fromJson(transaction)));
        return transactions;
    }
}

module.exports = Transactions;