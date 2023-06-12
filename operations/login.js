var playwright = require("playwright");

/**
 * Login to LinkedIn and generate a `storageState` to be reused for other operations
 * @param {object} options - The options for the command
 * @param {string} options.email - The email address of the user
 * @param {string} options.password - The password of the user
 * @param {string} options.storageStatePath The path to the storage state JSON file
 * @param {object} options.launchOptions - The options to pass to the launch method of Playwright
 */
const login = async ({
  email,
  password,
  launchOptions,
  storageStatePath = "./storageState.json",
}) => {
  const browser = await playwright.chromium.launch(launchOptions);
  const context = await browser.newContext();
  const page = await context.newPage();

  // go to linkedin
  await page.goto("https://www.linkedin.com/login");

  // email is in an input field with name 'session_key'
  // password is in an input field with name 'session_password'
  await page.type('input[name="session_key"]', email);
  await page.type('input[name="session_password"]', password);

  // click the login button, which is of type 'submit'
  await page.click('button[type="submit"]');

  // wait for the page to load
  await page.waitForURL("https://www.linkedin.com/feed/**", {
    timeout: 15000,
  });

  // save to storage state
  await page.context().storageState({
    path: storageStatePath,
  });

  // teardown
  await context.close();
  await browser.close();
};

module.exports = login;
