var { getRecruiters } = require("../operations");
var _ = require("lodash");
var fs = require("fs");
var yaml = require("yaml");
require("dotenv").config();

exports.command = "get-recruiters <o|output>";

exports.describe = "Get recruiters";

exports.aliases = ["gr"];

exports.builder = {
  config: {
    alias: "c",
    default: "./linkedin.config.yaml",
    describe: "The path to the LinkedIn configuration file",
    type: "string",
  },
  keyword: {
    alias: "k",
    type: "string",
    describe: "The keyword to search for",
  },
  minPage: {
    type: "number",
    describe: "The minimum page to search for",
  },
  maxPage: {
    type: "number",
    describe: "The maximum page to search for",
  },
};

exports.handler = async (argv) => {
  const {
    headless,
    slowMo,
    config: configYamlPath,
    storageStatePath,
    output: outputFilePath,
    keyword,
    minPage,
    maxPage,
  } = argv;

  // parse config as YAML
  const config = yaml.parse(fs.readFileSync(configYamlPath, "utf8"));

  // merge config with keyword and minPage and maxPage
  const mergedConfig = _.merge(config,{
    recruiterSearch: {
      keyword,
      minPage,
      maxPage,
    }, 
  });

  const recruiters = await getRecruiters(
    {
      headless,
      slowMo,
    },
    mergedConfig,
    storageStatePath
  );

  // write output to file
  fs.writeFileSync(outputFilePath, JSON.stringify(recruiters, null, 2));
};
