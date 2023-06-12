var getRecruiters = require("../operations/getRecruiters");
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
    describe:
      "The keyword to search for. This will override the keyword in the config file.",
  },
  minPage: {
    type: "number",
    describe:
      "The minimum page to search for. This will override the minPage in the config file.",
  },
  maxPage: {
    type: "number",
    describe:
      "The maximum page to search for. This will override the maxPage in the config file.",
  },
};

/**
 * Merges the given new recruiters with the content of the old recruiters file, overwriting the old file with the merged content.
 *
 * @param {Object[]} newRecruiters - The list of new recruiters to merge. Each recruiter should have the following properties:
 *                                   - name: string
 *                                   - url: string
 *                                   - location: string
 *                                   - position: string
 *                                   - connected: boolean
 * @param {string} oldRecruitersFilePath - The path to the old recruiters file to merge with the new recruiters
 */
const mergeRecruiters = (newRecruiters, oldRecruitersFilePath) => {
  console.log(
    `\tMerging ${newRecruiters.length} recruiters with ${oldRecruitersFilePath}...`
  );

  let oldRecruiters = [];

  try {
    const oldRecruitersFile = fs.readFileSync(oldRecruitersFilePath);
    oldRecruiters = JSON.parse(oldRecruitersFile);
  } catch (err) {
    console.log(
      `\tNo file ${oldRecruitersFilePath}. Will create a new file`.yellow
    );
  }

  const mergedRecruiters = _.uniqBy(
    [...newRecruiters, ...oldRecruiters],
    "url"
  );

  fs.writeFileSync(
    oldRecruitersFilePath,
    JSON.stringify(mergedRecruiters, null, 2)
  );
  console.log(
    `\tMerged recruiters saved to ${oldRecruitersFilePath}. Added ${
      mergedRecruiters.length - oldRecruiters.length
    } new recruiters.`.green
  );
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

  await getRecruiters({
    launchOptions: {
      headless,
      slowMo,
    },
    mergedConfig,
    storageStatePath,
    mergeRecruitersCallback: (newRecruiters) =>
      mergeRecruiters(newRecruiters, outputFilePath),
  });
};
