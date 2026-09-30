# Groundline — Real Estate Intelligence

A static intelligence dashboard with a daily public-news collection workflow for Bengaluru, Hyderabad, Chennai, Pune, Mumbai, and India-wide real estate finance and leadership coverage.

## Run locally

Requires Node.js 20 or newer and Python 3 for the local static server. No app dependencies are installed.

```sh
npm run collect
npm run serve
```

Open <http://localhost:4173>.

## Daily collection

`.github/workflows/daily-collection.yml` runs at 08:00 India time each day and can also be started manually from GitHub Actions. It queries 34 Google News RSS search streams, labels search results for triage, retains a 30-day news history, and commits the JSON edition to `data/news.json`. City results must name the selected market (including its metro aliases) or a tracked entity based there. India-wide results must show Indian context or match a tracked Indian entity. The workflow needs repository Actions enabled and `contents: write` permission.

`data/entities.json` is the starter directory. Add entities with `name`, `type`, `city`, optional `aliases`, and a `sourceUrl` when a reliable public profile is available. Entity categories include developers, funds, REITs/listed trusts, lenders, promoters, senior leaders, advisors, construction/materials, and regulators. The dashboard supports browser-local quick additions.

`data/projects.json` contains structured project records plus official RERA search links for Karnataka (Bengaluru), Telangana (Hyderabad), Tamil Nadu (Chennai), and Maharashtra (Pune and Mumbai). Project-news items are displayed separately as reported leads; they are not treated as RERA records. Add confirmed project details with registration number and official record link.

`data/funding.json` is the structured lender/investor/developer relationship ledger. Funding-news items are displayed as signals only and do not automatically create a relationship or amount. Records distinguish official-source evidence, press-reported evidence, and unverified entries. Add source links when mapping a relationship.

## What the labels mean

Category, tone, and priority are keyword-based triage labels generated from headline and snippet text. They are not fact-checks or conclusions. Review the original publisher link before making a decision. Entity matching uses exact name and alias mentions; similar names may be missed or matched loosely.

## Current source limits

The collector uses public Google News search RSS feeds as a discovery layer. Search indexing and snippets vary by publisher. This version does not directly ingest paid databases, private lender information, court or RERA APIs, company filings, or social-network posts. Official RERA portals are linked for lookups, but registered project records are not automatically synchronized from those portals. New entities, project records, and funding relationships added in the interface are stored in browser local storage and do not sync to the public dashboard or across devices; edit the JSON files and publish through GitHub to share records. The starter entity directory is not exhaustive. Project, promoter, and leadership records should be expanded with primary-source citations before being treated as verified profiles. Location filtering is deliberately strict to avoid unrelated city coverage; stories that omit both the target-market name and a tracked local entity may be missed.

The dashboard presents a daily edition and in-page priority watchlist. It does not yet send email, SMS, Telegram, or browser push notifications; a delivery channel and credentials are needed to add those.
