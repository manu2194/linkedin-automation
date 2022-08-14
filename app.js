var playwright = require("playwright");
var { login, getRecruiters } = require("./operations");
var yargs = require("yargs/yargs");
var yaml = require("yaml");
var { hideBin } = require("yargs/helpers");
var fs = require("fs");
var colors = require("colors");
require("dotenv").config();

const argv = yargs(hideBin(process.argv)).options({
    'config': {
        alias: 'c',
        default: './linkedin.config.yaml',
        describe: 'The path to the LinkedIn configuration file',
        type: 'string'
    },
    'storage-state-path': {
        alias: 's',
        default: './storageState.json',
        describe: 'The path to the storage state JSON file',
        type: 'string'
    },
    'email': {
        alias: 'e',
        type: 'string',
        default: process.env.EMAIL,
        describe: 'The email address of the user'
    },
    'login': {
        alias: 'l',
        type: 'boolean',
        default: true,
        describe: 'Whether to login to LinkedIn and generate a storage state'
    },
    'password': {
        alias: 'p',
        type: 'string',
        default: process.env.PASSWORD,
        describe: 'The password of the user',
        defaultDescription: process.env.PASSWORD ? "set via environment variable 'PASSWORD'" : 'No environment variable PASSWORD set'
    },
    'headless': {
        alias: 'h',
        type: 'boolean',
        default: true,
        describe: 'Whether to run in headless mode'
    },
    'slow-mo': {
        type: 'number',
        default: 500,
        describe: 'The amount of time to wait between actions'
    },
    'recruiters': {
        type: 'string',
        default: './recruiters.json',
        describe: 'The path to the recruiters JSON file'
    }
}).argv;

const {
    config: linkedInConfig,
    storageStatePath,
    email,
    password,
    headless,
    slowMo,
    login: shouldLogin,
    recruiters: recruitersPath
} = argv;
(async () => {

    // parse config file
    console.log(`Parsing config file ${linkedInConfig.yellow}`)
    const config = yaml.parse(fs.readFileSync(linkedInConfig, "utf8"));

    if(shouldLogin){
    console.log(`Logging in with email ${email.yellow}`)

        await login(email, password ,{
            headless,
        }, storageStatePath);
    }

    console.log(`Getting recruiters from LinkedIn`)
    const recruiters = await getRecruiters({
        headless,
        slowMo
    }, config, storageStatePath);

    // write recruiters to file
    console.log(`Writing ${recruiters.length.toString().yellow} recruiters to file ${recruitersPath.yellow}`)
    fs.writeFileSync(recruitersPath, JSON.stringify(recruiters, null, 2));

}
)();