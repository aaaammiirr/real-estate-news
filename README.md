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

`data/entities.json` is the starter watchlist. Add entities there with `name`, `type`, `city`, and optional `aliases`. The dashboard also supports a browser-local watchlist for quick additions on the current device.

## What the labels mean

Category, tone, and priority are keyword-based triage labels generated from headline and snippet text. They are not fact-checks or conclusions. Review the original publisher link before making a decision. Entity matching uses exact name and alias mentions; similar names may be missed or matched loosely.

## Current source limits

The collector uses public Google News search RSS feeds as a discovery layer. Search indexing and snippets vary by publisher. This version does not directly ingest paid databases, private lender information, court or RERA APIs, company filings, or social-network posts. The starter entity directory is not exhaustive. Project, promoter, and leadership records should be expanded with primary-source citations before being treated as verified profiles. Location filtering is deliberately strict to avoid unrelated city coverage; stories that omit both the target-market name and a tracked local entity may be missed.

The dashboard presents a daily edition and in-page priority watchlist. It does not yet send email, SMS, Telegram, or browser push notifications; a delivery channel and credentials are needed to add those.
