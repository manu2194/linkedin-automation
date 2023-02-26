var playwright = require("playwright");
var _ = require("lodash");
var fs = require("fs");
var nunjucks = require("nunjucks");

/**
 * Send connections to recruiters in LinkedIn
 * @param {object} launchOptions  - The options to pass to the launch method of Playwright
 * @param {object} linkedInConfig  - The configuration for the LinkedIn operations
 * @param {array} recruitersConfig  - The list of recruiters to send connections to
 * @param {string} completedRecruitersConfigPath  - A path to config of completed recruiters
 * @param {string} limit  - The maximum number of recruiters to send connections to
 * @param {string} messageTemplates - The message templates to use for the connections
 * @param {string} storageStatePath  - The path to the storage state JSON file
 */
const sendConnections = async (
  launchOptions,
  linkedInConfig,
  recruitersConfig,
  completedRecruitersConfigPath,
  limit,
  messageTemplates,
  storageStatePath = "./storageState.json"
) => {
  const completedRecruitersConfig = JSON.parse(
    fs.readFileSync(completedRecruitersConfigPath)
  );

  const filteredRecruitersConfig = recruitersConfig.filter((recruiter) => {
    if (completedRecruitersConfig[recruiter.url]) {
      if (
        completedRecruitersConfig[recruiter.url].sent_invitation === true ||
        completedRecruitersConfig[recruiter.url].no_connection === true
      ) {
        return false;
      }
    }
    return true;
  });

  console.log(
    `Sending connections to ${String(filteredRecruitersConfig.length).yellow}/${
      recruitersConfig.length
    } recruiters`
  );

  const browser = await playwright.chromium.launch(launchOptions);
  const context = await browser.newContext({
    storageState: storageStatePath,
  });
  context.setDefaultNavigationTimeout(30000);
  context.setDefaultTimeout(5000);
  const page = await context.newPage();
  let numberOfSentInvitations = 0;
  for (let i = 0; i < filteredRecruitersConfig.length; i++) {
    if (numberOfSentInvitations >= limit) {
      break;
    }
    const recruiter = filteredRecruitersConfig[i];
    console.log(
      `Sending connection to ${recruiter.name.yellow} (${recruiter.url.yellow})`
    );

    try {
      await page.goto(recruiter.url);

      // get company name
      try {
        await page.waitForSelector("a[href='#experience']");
        const companyLink = await page.locator("a[href='#experience']");
        const companyName = await companyLink.innerText();
        recruiter.company = companyName;
      } catch (error) {
        console.log(
          `Could not find company for ${recruiter.name.yellow} (${recruiter.url.yellow})`
        );
        recruiter.company = "your company";
      }

      // get the message template. if the message templates is a list, then select a random one
      let messageTemplate = messageTemplates;
      if (Array.isArray(messageTemplates)) {
        messageTemplate = _.sample(messageTemplates);
      }

      recruiter.first_name = recruiter.name.split(" ")[0];
      recruiter.last_name = recruiter.name.split(" ")[1];

      let message = nunjucks.renderString(messageTemplate, {
        ...linkedInConfig,
        recruiter,
      });

      // trim message
      message = message.trim();

      if (message.length >= 299) {
        console.log(
          `Message is too long (${message.length}), skipping ${recruiter.name.yellow}`
        );
        continue;
      }

      // click button with text "Connect"
      let connectButton = undefined;
      try {
        const connectButtonSelector = `section.artdeco-card.ember-view.pv-top-card >> div.pvs-profile-actions >> button[aria-label="Invite ${recruiter.name} to connect"]`;
        await page.waitForSelector(connectButtonSelector);
        connectButton = await page.locator(connectButtonSelector);
      } catch (error) {
        console.log(
          `No "Connect" button found, skipping ${recruiter.name.yellow}`
        );
        completedRecruitersConfig[recruiter.url] = { no_connection: true };
        fs.writeFileSync(
          completedRecruitersConfigPath,
          JSON.stringify(completedRecruitersConfig, null, 2)
        );
        continue;
      }

      // click button with text "Connect"
      connectButton.click();

      // wait for the modal to load
      const modal = await page.locator(
        "div[aria-labelledby='send-invite-modal']"
      );

      // check if this recuirter requires that you enter their email
      try {
        await page.waitForSelector(
          "label:has-text('To verify this member knows you, please enter their email to connect. You can also include a personal note')"
        );
        console.log(
          `${recruiter.name.yellow} requires you to enter their email. Skipping...`
        );
        completedRecruitersConfig[recruiter.url] = { no_connection: true };
        fs.writeFileSync(
          completedRecruitersConfigPath,
          JSON.stringify(completedRecruitersConfig, null, 2)
        );
        continue;
      } catch (error) {}

      // check if this recuirter requires that you verify how you know them
      let requiresToVerifyHowYouKnow = false;
      try {
        await modal.waitForSelector("h2#send-invite-modal", {
          timeout: 100,
        });
        console.log(
          `${recruiter.name.yellow} requires you verify how you know them. Selecting "Other"`
        );
        requiresToVerifyHowYouKnow = true;
      } catch (error) {}

      if (requiresToVerifyHowYouKnow) {
        // select "Other"
        await modal.locator('button:has-text("Other")').click();
      }

      // click "Add a note" button
      await modal.locator("button:has-text('Add a note')").click();

      // enter text in textarea with id "custom-message"
      await page.locator("textarea#custom-message").fill(message);

      // send message by clicking send button
      await modal.locator("button:has-text('Send')").click();

      console.log(`Sent connection to ${recruiter.name.yellow}`);

      numberOfSentInvitations++;
      completedRecruitersConfig[recruiter.url] = { sent_invitation: true };

      // save completed recruiters config
      fs.writeFileSync(
        completedRecruitersConfigPath,
        JSON.stringify(completedRecruitersConfig, null, 2)
      );

      // wait for modal to close
      await page.waitForTimeout(500);
    } catch (error) {
      console.log(`Error sending connection to ${recruiter.name.yellow}`.red);
      continue;
    }
  }

  // teardown
  await context.close();
  await browser.close();
};

module.exports = sendConnections;
