var { sendConnections } = require("../operations");
var _ = require("lodash");
var fs = require("fs");
var path = require("path");
var yaml = require("yaml");
const colors = require("colors");
require("dotenv").config();

exports.command = "send-connections <recruiters|r>";

exports.describe = "Send connections to recruiters";

exports.aliases = ["sc"];

exports.builder = {
  config: {
    alias: "c",
    default: "./linkedin.config.json",
    describe: "The path to the LinkedIn configuration file",
    type: "string",
  },
  results: {
    alias: "o",
    type: "string",
    describe: "The path to the JSON file containing the results",
    demandOption: true,
  },
  limit: {
    alias: "l",
    type: "number",
    describe: "The maximum number of recruiters to send connections to",
  },
  messageTemplates: {
    alias: "m",
    type: "string",
    describe: "The path to the message templates YAML file",
    default: './message-templates.yaml',
  }
};

exports.handler = async (argv) => {
  const {
    headless,
    slowMo,
    config: configJsonPath,
    storageStatePath,
    results: resultsFilePath,
    recruiters: recruitersJsonPath,
    limit,
    messageTemplates: messageTemplatesPath,
  } = argv;

  // check if the absolute path to results and recruiters are not the same
  if (path.resolve(resultsFilePath) === path.resolve(recruitersJsonPath)) {
    console.log(
      "The absolute path to the results and recruiters JSON file must be different"
        .red
    );
    return;
  }

  // check if resultsFilePath exists, if not, create it
  if (!fs.existsSync(resultsFilePath)) {
    fs.writeFileSync(resultsFilePath, "{}");
  }

  // parse config as JSON
  const config = JSON.parse(fs.readFileSync(configJsonPath));

  // parse recruiters as JSON
  const recruiters = JSON.parse(fs.readFileSync(recruitersJsonPath));

  // parse message templates as YAML
  const messageTemplates = yaml.parse(fs.readFileSync(messageTemplatesPath, "utf8"));

  // send connections to recruiters
  const results = await sendConnections(
    {
      headless,
      slowMo,
    },
    config,
    recruiters,
    path.resolve(resultsFilePath),
    limit,
    messageTemplates,
    storageStatePath
  );
};
