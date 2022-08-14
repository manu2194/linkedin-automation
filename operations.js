var playwright = require('playwright');
var _ = require('lodash');
var { delay } = require('./utils');
var colors = require('colors');

/**
 * Login to LinkedIn and generate a `storageState` to be reused for other operations
 * @param {string} email - The email address of the user
 * @param {string} password - The password of the user
 * @param {string} storageStatePath The path to the storage state JSON file
 * @param {object} launchOptions - The options to pass to the launch method of Playwright
 */
const login = async (email, password, launchOptions, storageStatePath = './storageState.json') => {
    const browser = await playwright.chromium.launch(launchOptions);
    const context = await browser.newContext();
    const page = await context.newPage();

    // go to linkedin
    await page.goto('https://www.linkedin.com/login')

    // email is in an input field with name 'session_key'
    // password is in an input field with name 'session_password'
    await page.type('input[name="session_key"]', email)
    await page.type('input[name="session_password"]', password)

    // click the login button, which is of type 'submit'
    await page.click('button[type="submit"]')

    // wait for the page to load
    await page.waitForNavigation({
        url: 'https://www.linkedin.com/feed/**',
        waitUntil: 'networkidle',
        timeout: 0
        
    })

    // save to storage state
    await page.context().storageState({
        path: storageStatePath
    })

    
    // teardown
    await context.close()
    await browser.close();
}


const parseRecruiterSearchResult = async (locator) => {
    const result = {
        name: null,
        url: null,
        location: null,
        position: null,
    }

    // get name
    const nameLocator = await locator.locator('.entity-result__title-line >> a')
    const nameText = await nameLocator.innerText()
    const name = nameText.split('\n')[0] // the string will contain two lines, the second line being "View <name>'s profile"
    result.name = name

    // get url
    const profileUrl = await nameLocator.getAttribute('href')
    // get the portion of the url we care about
    const url = profileUrl.split('?')[0]
    result.url = url

    // get location
    const locationLocator = await locator.locator('.entity-result__secondary-subtitle')
    const locationText = await locationLocator.innerText()
    result.location = locationText

    // get position
    const positionLocator = await locator.locator('.entity-result__primary-subtitle')
    const positionText = await positionLocator.innerText()
    result.position = positionText

    return result
}

/**
 * Get recruiters from LinkedIn
 * @param {object} launchOptions  - The options to pass to the launch method of Playwright
 * @param {object} linkedConfig  - The configuration for the LinkedIn operations
 * @param {string} storageStatePath  - The path to the storage state JSON file
 */
const getRecruiters = async (launchOptions, linkedConfig, storageStatePath = './storageState.json') => {

    const recruiters = []
    const browser = await playwright.chromium.launch(launchOptions);
    const context = await browser.newContext({
        storageState: storageStatePath
    });
    const page = await context.newPage();

    // go to search page

    // get config
    const recruiterSearchConfig = linkedConfig.recruiterSearch

    // get URL, minPage and maxPage
    const url = recruiterSearchConfig.url
    const minPage = recruiterSearchConfig.minPage || 1
    const maxPage = recruiterSearchConfig.maxPage

    for(let i = minPage; i <= maxPage; i++) {
        console.log(`Getting page ${String(i).yellow}`)
        let normalizedUrl = url
        if (i > 1) {
            normalizedUrl = url + '&page=' + i
        }
        await page.goto(normalizedUrl)

        // wait for search results container to load
        await page.waitForSelector('div.search-results-container')

        // get all the recruiter links
        const recruiterLinks = await page.locator('div.search-results-container >> div.entity-result__item')

        const count = await recruiterLinks.count()
        console.log(`Found ${String(count).yellow} recruiters`)

        for(let j = 0; j < count; j++) {
            const recruiterLink = await recruiterLinks.nth(j)
            const recruiter = await parseRecruiterSearchResult(recruiterLink)
            recruiters.push(recruiter)
        }

    }

    // teardown
    await context.close()
    await browser.close();

    return recruiters
    
}

module.exports = {
    login,
    getRecruiters
}