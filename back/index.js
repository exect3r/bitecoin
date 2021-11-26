const BiteCoin = require('./bitecoin');

const argv = require('yargs')
    .alias('h', 'host')
    .describe('h', 'Host address. (localhost)')
    .alias('p', 'port')
    .describe('p', 'HTTP port. (3001)')
    .alias('n', 'name')
    .describe('n', 'Node\'s name. (unnamed)')
    .argv;

const bc = new BiteCoin(argv);
bc.start();