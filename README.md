# LinkedIn Automation Tool

A powerful, automated tool built with [Playwright](https://playwright.dev/) to help job seekers discover recruiters and send personalized connection requests on LinkedIn.

---

## 🚀 Easy to Understand Guide

### What does this tool do?
Searching for jobs can be a full-time job in itself. This tool automates the repetitive parts of networking:
1.  **Login:** Securely logs into your LinkedIn account and saves your session so you don't have to log in every time.
2.  **Find Recruiters:** Searches LinkedIn for recruiters based on your specific keywords (e.g., "Tech Recruiter", "Software Engineering Manager") and saves their profiles to a local file.
3.  **Send Connections:** Automatically sends connection requests to the found recruiters using personalized message templates that mention their company and your target role.

### Why use it?
- **Efficiency:** Reach out to dozens of recruiters in minutes instead of hours.
- **Personalization:** Use templates to ensure every message feels tailored, not robotic.
- **Tracking:** Keeps track of who you've already contacted to avoid duplicates.

---

## 🛠 How to Run

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [Yarn](https://yarnpkg.com/) (v3 is used in this project)

### 2. Installation
Clone the repository and install dependencies:
```bash
yarn install
```

### 3. Configuration
1.  **Environment Variables:** Copy `.env.example` to `.env` and add your LinkedIn credentials.
    ```bash
    cp .env.example .env
    ```
    Edit `.env`:
    ```env
    EMAIL=your-email@example.com
    PASSWORD=your-password
    ```
2.  **App Config:** Edit `linkedin.config.yaml` to set your name, target position, and search parameters.
3.  **Message Templates:** Customize `message-templates.yaml` with your preferred outreach messages. Use `{{ recruiter.first_name }}` and `{{ recruiter.company }}` for personalization.

### 4. Running the Commands
The tool uses a 3-step workflow:

#### Step 1: Login
Generate a session file (`storageState.json`) so you can run other commands without being blocked by 2FA every time.
```bash
node app.js login
```
*Note: If you have 2FA enabled, run this in non-headless mode (`-h false`) to manually enter the code.*

#### Step 2: Get Recruiters
Search and save recruiter profiles to a JSON file.
```bash
node app.js get-recruiters recruiters.json --minPage 1 --maxPage 5
```

#### Step 3: Send Connections
Send connection requests to the list you just generated.
```bash
node app.js send-connections recruiters.json --results results.json --limit 10
```

### ⚠️ Edge Cases & Tips
- **Headless Mode:** By default, it runs without a visible browser. Use `--headless false` to watch the automation in action.
- **Message Length:** LinkedIn has a 300-character limit for connection notes. The tool will skip recruiters if the generated message is too long.
- **Manual Verification:** Some recruiters require an email address or a specific "how do you know them" selection. The tool handles "Other" automatically but will skip those requiring an email.
- **LinkedIn Limits:** **IMPORTANT.** LinkedIn monitors for automation. Avoid sending more than 20-30 connections per day to keep your account safe. Use the `--limit` flag.

---

## ⚙️ How it Works (Technical)

### Architecture
The project is split into two main directories:
- `commands/`: Handles the CLI interface using `yargs`. It parses arguments and prepares data.
- `operations/`: Contains the core logic using `playwright`. These are the "workers" that interact with the browser.

### Tech Stack
- **Playwright:** Controls the Chromium browser.
- **Yargs:** Provides a robust CLI with aliases and help menus.
- **Nunjucks:** A powerful templating engine used to inject recruiter data into your messages.
- **YAML:** Used for clean, human-readable configuration files.

### Session Management
Instead of logging in for every search, the `login` operation uses Playwright's `storageState`. This saves cookies and local storage to `storageState.json`, allowing subsequent runs to "resume" your session seamlessly.

### Data Flow
1. `linkedin.config.yaml` -> `getRecruiters` -> `recruiters.json` (List of targets)
2. `recruiters.json` + `message-templates.yaml` -> `sendConnections` -> `results.json` (Tracking sent requests)

---

## 🛡 Disclaimer
This tool is for educational purposes. Automated use of LinkedIn may violate their [User Agreement](https://www.linkedin.com/legal/user-agreement). Use responsibly and at your own risk.
