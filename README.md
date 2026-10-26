# HelpNest — Customer Support Desk

HelpNest is a polished, browser-based customer-support dashboard demo. It gives a portfolio project the feel of a real ticketing product while staying easy to run, understand, and extend.

> **Demo-only notice:** all customer records and tickets are fictional. Changes are saved to the current browser's `localStorage`; this project does not send messages, authenticate users, or connect to a real support platform.

## Features

- Dashboard with support metrics, team availability, activity, and recent tickets.
- Ticket inbox with search, status and priority filters, pagination, and bulk selection.
- Create, edit, update, resolve/reopen, and delete demo tickets.
- Customer directory with quick links to tickets for each customer.
- Status report generated from the current ticket dataset.
- CSV export for filtered tickets or selected records.
- Light/dark appearance setting and compact table preference.
- Responsive layout for desktop, tablet, and mobile.
- Local browser persistence with a reset-to-sample-data option.
- No build process, external API keys, framework, or runtime dependencies.
- Node.js unit tests and a GitHub Actions CI workflow.

## Requirements

- Node.js 18 or newer (for the included local server and tests).
- A modern browser.

## Run locally

```bash
git clone https://github.com/YOUR-USERNAME/helpnest-support-desk.git
cd helpnest-support-desk
npm run serve
```

Open <http://127.0.0.1:4174>.

You can also serve the static files with another local HTTP server. Opening `index.html` directly may cause ES module restrictions in some browsers, so a local server is recommended.

## Tests

```bash
npm test
npm run check
```

Tests use Node's built-in test runner. No `npm install` is required.

## Project layout

```text
helpnest-support-desk/
├── .github/workflows/ci.yml  # automated checks on pushes and pull requests
├── assets/styles.css         # responsive product UI
├── src/app.js                # UI state and interactions
├── src/data.js               # fictional sample tickets and customers
├── src/utils.js              # filtering, status counts, and CSV helpers
├── tests/utils.test.mjs      # unit tests
├── index.html                # app shell
├── server.mjs                # tiny local static server
├── package.json
├── LICENSE
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
└── CHANGELOG.md
```

## Deploy to GitHub Pages

The UI is a static site and can be published with GitHub Pages. Go to **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save. The deployed site does not need `server.mjs`; the server is only for local development. Keep `index.html`, `assets/`, and `src/` in the repository root structure shown above.

## Data and privacy notes

- Demo data is stored in local browser storage only.
- There is no real login, server-side database, or authorization layer.
- Do not use real customer information or treat this demo as a production ticketing system.
- The app is intended for demos, learning, and portfolio experiments.

## Roadmap ideas

- Add a backend API and database with proper access control.
- Add real authentication and role-based permissions.
- Add reply composer with a simulated conversation history.
- Add accessibility testing and end-to-end browser tests.
- Add localization and configurable support teams.

## License

MIT. See [LICENSE](LICENSE).
