var playwright = require("playwright");
var { login } = require("./operations");
var yargs = require("yargs/yargs");
var { hideBin } = require("yargs/helpers");
require("dotenv").config();

const argv = yargs(hideBin(process.argv)).options({
    'email': {
        alias: 'e',
        type: 'string',
        default: process.env.EMAIL,
        describe: 'The email address of the user'
    },
    'password': {
        alias: 'p',
        type: 'string',
        default: process.env.PASSWORD,
        describe: 'The password of the user',
        defaultDescription: process.env.PASSWORD ? "set via environment variable 'PASSWORD'" : 'No environment variable PASSWORD set'
    },
}).argv;
