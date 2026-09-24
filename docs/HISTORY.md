# Project history

How the market dashboard came together, condensed from the working sessions.

## Before September 2026
- `ohfs-chart-config.js` v1 to v3: a classic combo chart (price bars +
  homes-sold line) with per-year stat cards, served through jsDelivr, with
  per-page data typed into each snippet.

## 2026-09-23: dashboard redesign
- Ryan built a mockup: headline, KPI row, price line chart, homes-sold bar
  chart, and a price range chart.
- Review kept the strengths (single-axis charts, KPI row, range context) and
  fixed design-system issues: off-palette colors, rounded corners, shadows,
  Inter font, `max-width` breakpoints, global CSS leaks, missing aria labels.
- Consolidated to two charts. Built as `layout: 'dashboard'` in config v4.0,
  keeping the classic layout working.
- v4.1: kicker "Market Trends" in green bold sans-serif; headline
  "[Neighborhood] Neighborhood Home Sales".
- A dumbbell-style range plot was mocked up in two orientations. Ryan kept
  the tinted range bars.

## 2026-09-23: scaling to every neighborhood
- Goal: roughly 150 neighborhood pages without hand-editing snippets.
- Analyzed the MLS sold export (49,503 rows, 2022 to 2025):
  - 5,860 exact duplicate rows, all in 2022, removed
  - 7,288 raw subdivision names (5,076 after normalizing case), with replats
    and lot-level variants split out
  - Sagewood's real data differed from the mockup: 35 sales in 2022 down to
    18 in 2025
- Built `pipeline/build_market_data.py`.
- The CMS spreadsheet turned out to be incomplete (229 of 1,320 pages). Used
  the live sitemap instead: 583 pages match an MLS subdivision exactly, and
  371 have 20+ sales. Replats and lot variants were folded in for 170 of them.
  28 more pages were flagged for manual review. 4 city pages were flagged
  to leave off.
- Confirmed URL pattern: `/neighborhood-name.php`, hyphenated.
- Config v5.0: one shared snippet reads the page URL and loads its data.
  Generated intro copy, zero-sale-year handling, and self-removal when there
  is no data.

## Open items
- Review `pipeline/pages-to-review.csv` (28 pages) and add confirmed matches.
- Decide on the 4 city pages (leave off, or build a city-wide version).
- Decide on partial current-year data (show YTD, or full years only).
- Confirm MLS rules allow publishing aggregated sold statistics on the site.
- Test on REW staging: the snippet, a sidebar (760px) page, and a page with no data.
