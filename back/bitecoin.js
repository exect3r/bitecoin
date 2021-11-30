require('colors');
const Blockchain = require('./blockchain');
const Teller = require('./teller');
const BiteCoinServer = require('./server');
const { log } = require('./utils/logs');

class BiteCoin {
    constructor(argv) {
        this.host = process.env.HOST || argv.host || 'localhost';
        this.port = process.env.PORT || argv.port || 3001;
        this.name = process.env.NAME || argv.name || 'unnamed';

        this.blockchain = new Blockchain(this.name);
        this.blockchain.init();

        this.teller = new Teller(this);
        
        this.server = new BiteCoinServer(this);
    }

    start() {
        log(`Starting node ${this.name.yellow.italic}.`);
        this.server.listen(this.host, this.port);
    }

    stop() {
        log(`Stopping node ${this.name.yellow.italic}.`);
        this.server.stop();
    }
}

module.exports = BiteCoin;