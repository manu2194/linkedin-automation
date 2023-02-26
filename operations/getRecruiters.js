var playwright = require("playwright");

/**
 * Parse recruiter details from a search result like `name`, `url`, `location`, `position` and `connected`
 *
 * @param {} locator
 * @returns
 */
const parseRecruiterSearchResult = async (locator) => {
  const result = {
    name: null,
    url: null,
    location: null,
    position: null,
    connected: false,
  };

  // get badge
  const badgeLocator = await locator.locator(".entity-result__badge");
  const badgeTextLocator = await badgeLocator.locator(
    "span.entity-result__badge-text span[aria-hidden='true']"
  );
  const badgeText = await badgeTextLocator.innerText();

  if (badgeText.includes("1st")) {
    result.connected = true;
  }

  // get name
  const nameLocator = await locator.locator(".entity-result__title-line >> a");
  const nameText = await nameLocator.innerText();
  const name = nameText.split("\n")[0]; // the string will contain two lines, the second line being "View <name>'s profile"
  result.name = name;

  // get url
  const profileUrl = await nameLocator.getAttribute("href");
  // get the portion of the url we care about
  const url = profileUrl.split("?")[0];
  result.url = url;

  // get location
  const locationLocator = await locator.locator(
    ".entity-result__secondary-subtitle"
  );
  const locationText = await locationLocator.innerText();
  result.location = locationText;

  // get position
  const positionLocator = await locator.locator(
    ".entity-result__primary-subtitle"
  );
  const positionText = await positionLocator.innerText();
  result.position = positionText;

  return result;
};

/**
 * Get recruiters from LinkedIn
 *
 * defines an asynchronous function called getRecruiters that takes in three arguments:
 * launchOptions, linkedInConfig, and storageStatePath.
 *
 * The function uses Playwright, an automation library, to open a Chromium browser and navigate
 * to a LinkedIn search page for recruiters based on the configuration information provided. It
 * then iterates through the search results, extracts information about each recruiter and
 * stores it in an array. Finally, it closes the browser, and returns the array of recruiter data.
 * The function uses the parseRecruiterSearchResult function to extract information about each
 * recruiter from the search results page, and it waits for the search results to load before
 * proceeding with each iteration. The function also logs output to the console to provide
 * status updates on its progress.
 *
 * @param {object} launchOptions  - The options to pass to the launch method of Playwright
 * @param {object} linkedInConfig  - The configuration for the LinkedIn operations
 * @param {string} storageStatePath  - The path to the storage state JSON file
 * @param {function} mergeRecruitersCallback - A callback function to merge recruiters
 */
const getRecruiters = async (
  launchOptions,
  linkedInConfig,
  storageStatePath = "./storageState.json",
  mergeRecruitersCallback
) => {
  const recruiters = [];
  const browser = await playwright.chromium.launch(launchOptions);
  const context = await browser.newContext({
    storageState: storageStatePath,
  });
  const page = await context.newPage();

  // go to search page

  // get config
  const recruiterSearchConfig = linkedInConfig.recruiterSearch;

  // get URL, minPage and maxPage
  const keyword = recruiterSearchConfig.keyword;
  const industry = recruiterSearchConfig.industry;
  const minPage = recruiterSearchConfig.minPage || 1;
  const maxPage = recruiterSearchConfig.maxPage;

  console.log(
    `Searching LinkedIn for ${keyword.yellow}, pages ${
      String(minPage).yellow
    }-${String(maxPage).yellow}`
  );

  // Search URL for LinkedIn People Search
  const baseLinkedPeopleUrl = "https://www.linkedin.com/search/results/people/";

  // Build the parameters portion of the URL
  let params = [];
  if (industry) {
    params.push(industry);
  }
  params.push(`keywords=${keyword}`);
  params.push("origin=FACETED_SEARCH");

  // Combine the base URL and the parameters
  let normalizedUrl = `${baseLinkedPeopleUrl}?${params.join("&")}`;

  for (let i = minPage; i <= maxPage; i++) {
    const recruitersPerPage = [];
    console.log(
      `Getting page ${String(i).yellow} for keyword ${keyword.yellow}`
    );
    if (i > 1) {
      normalizedUrl = normalizedUrl + "&page=" + i;
    }
    await page.goto(normalizedUrl);

    // wait for search results container to load
    await page.waitForSelector("div.search-results-container");

    // get all the recruiter links
    const recruiterLinks = await page.locator(
      "div.search-results-container >> div.entity-result__item"
    );

    const count = await recruiterLinks.count();
    console.log(`\tFound ${String(count)} recruiters`.green);

    for (let j = 0; j < count; j++) {
      const recruiterLink = await recruiterLinks.nth(j);
      const recruiter = await parseRecruiterSearchResult(recruiterLink);
      recruitersPerPage.push(recruiter);
    }
    mergeRecruitersCallback(recruitersPerPage);
  }

  // teardown
  await context.close();
  await browser.close();

  // merge recruiters
  return recruiters;
};

module.exports = getRecruiters;
