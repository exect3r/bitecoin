require('colors');

exports.log = function (msg, prefix) {
    console.log(`${new Date().toISOString().gray} ${(prefix || '>').cyan} ${msg}`);
}

exports.warn = function (msg) { exports.log(msg, '!>'.yellow); }

exports.error = function (msg) { exports.log(msg, '!!!>'.red); }