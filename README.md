# ohfs-charts

Market trend dashboards for neighborhood pages on **omahahomesforsale.com**
(REW platform, `sagittarius` theme). Served to the site through jsDelivr.

## How it works

1. `pipeline/build_market_data.py` turns an MLS sold export into one small
   JSON file per neighborhood in `data/`, plus `data/index.json`, which maps
   each page URL to its data file.
2. One REW snippet, `#market-dashboard#`, goes on every neighborhood page.
   It loads `ohfs-chart-config.js`, which reads the page URL, finds the data,
   and builds the section: kicker, headline, lede, KPI row, price chart, and
   homes-sold chart.
3. Pages with no data remove the section automatically.

## Repo layout

| Path | What it is |
|---|---|
| `ohfs-chart-config.js` | The component: CSS, Chart.js loader, rendering, auto-loader |
| `snippets/market-dashboard.html` | The shared REW snippet. Paste once, use everywhere |
| `snippets/examples/` | Hand-coded single-page version, for reference |
| `data/` | Generated neighborhood data. Never hand-edit |
| `pipeline/build_market_data.py` | Builds `data/` from the MLS export |
| `pipeline/neighborhoods.csv` | Page to MLS subdivision mapping. Hand-maintained |
| `pipeline/pages-to-review.csv` | Pages that look like neighborhoods but need a manual match |
| `pipeline/subdivision-inventory.csv` | Every MLS subdivision name with sales per year |
| `preview/serve.py` | Local preview of any page |
| `docs/` | Project history and design decisions |
| `CLAUDE.md` | Working instructions for AI assistants on this repo |

## Common tasks

**Refresh the data (yearly, or when a new MLS export is ready)**

```bash
pip install pandas
python pipeline/build_market_data.py build ~/Downloads/sold-export.csv
git add data pipeline && git commit -m "Data refresh" && git push
```

Then purge the cache (see below). Keep the raw export outside the repo.
`.gitignore` blocks stray CSVs, but it contains addresses and parcel numbers.

**Add a neighborhood**

1. Find its MLS name(s) in `pipeline/subdivision-inventory.csv`.
2. Add a row to `pipeline/neighborhoods.csv`: `slug,name,page_path,mls_subdivisions`.
   Several MLS names are separated with ` | `.
3. Rebuild and push, then put `#market-dashboard#` on the page.

**Preview locally**

```bash
python preview/serve.py
# open http://localhost:8000/sagewood.php
```

**Publish a change**

Commit and push, then open these URLs to purge jsDelivr's cache:

```
https://purge.jsdelivr.net/gh/ryanrenner/ohfs-charts@main/ohfs-chart-config.js
https://purge.jsdelivr.net/gh/ryanrenner/ohfs-charts@main/data/index.json
```

After a data refresh, individual data files also cache for up to 12 hours.
For an instant, all-at-once switch, create a GitHub release (e.g. `v5.1`)
and point the snippet at `@v5.1` instead of `@main`.

## REW setup

- **Snippet:** Content → Snippets → Add New, name `market-dashboard`, paste
  `snippets/market-dashboard.html`.
- **Pages:** add `#market-dashboard#` where the section should appear.
- Page URLs follow `/neighborhood-name.php`, hyphenated.
