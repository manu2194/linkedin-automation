var yargs = require("yargs/yargs");
var { hideBin } = require("yargs/helpers");
var loginCommand = require("./commands/login");
var getRecruitersCommand = require("./commands/getRecruiters");
require("dotenv").config();

yargs(hideBin(process.argv))
  .options({
    headless: {
      alias: "h",
      type: "boolean",
      default: true,
      describe: "Whether to run in headless mode",
    },
    "slow-mo": {
      type: "number",
      default: 500,
      describe: "The amount of time to wait between actions",
    },
    "storage-state-path": {
        alias: "s",
        default: "./storageState.json",
        describe: "The path to the storage state JSON file",
        type: "string",
      },
  })
  .command(loginCommand)
  .command(getRecruitersCommand)
  .help().argv;