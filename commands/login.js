var login = require("../operations/login");
require("dotenv").config();

exports.command = "login";

exports.describe = "Login to LinkedIn";

exports.aliases = ["login"];

exports.builder = {
  email: {
    alias: "e",
    type: "string",
    default: process.env.EMAIL,
    describe: "The email address of the user",
  },
  password: {
    alias: "p",
    type: "string",
    default: process.env.PASSWORD,
    describe: "The password of the user",
    defaultDescription: process.env.PASSWORD
      ? "set via environment variable 'PASSWORD'"
      : "No environment variable PASSWORD set",
  },
};

exports.handler = async (argv) => {
  const { email, password, storageStatePath } = argv;
  await login(email, password, {}, storageStatePath);
};
