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
    describe: "The keyword to search for. This will override the keyword in the config file.",
  },
  minPage: {
    type: "number",
    describe: "The minimum page to search for. This will override the minPage in the config file.",
  },
  maxPage: {
    type: "number",
    describe: "The maximum page to search for. This will override the maxPage in the config file.",
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
  const mergedConfig = _.merge(config, {
    recruiterSearch: {
      keyword,
      minPage,
      maxPage,
    },
  });

  const newlyFetchedRecruiters = await getRecruiters(
    {
      headless,
      slowMo,
    },
    mergedConfig,
    storageStatePath
  );

  let mergedRecruiters = newlyFetchedRecruiters;

  // Check if an output file already exists
  if (fs.existsSync(outputFilePath)) {
    // If the output file exists, read in its contents
    const previouslyFetchedRecruiters = JSON.parse(fs.readFileSync(outputFilePath));
    
    // Merge the new recruiter data with the existing data, using the recruiter's URL as the unique identifier
    mergedRecruiters = _.mergeWith(
      previouslyFetchedRecruiters,
      newlyFetchedRecruiters,
      (objValue, srcValue) => {
        if (objValue.url == srcValue.url) {
          // If a recruiter with the same URL already exists in the old data, replace it with the new data
          return srcValue;
        }
      }
    );
  }


  // write output to file
  fs.writeFileSync(outputFilePath, JSON.stringify(mergedRecruiters, null, 2));
};
