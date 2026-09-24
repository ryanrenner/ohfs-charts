# Changelog

## 5.1 (2026-09-24)
- Dashboard headline is now `<h3>` instead of `<h2>`.
- Intro block (kicker, headline, lede) no longer caps at 760px; the lede
  paragraph now spans the full dashboard width like the KPI row and charts.

## 5.0 (2026-09-23)
- One shared snippet (`#market-dashboard#`) for every neighborhood page. The
  config reads the page URL, looks it up in `data/index.json`, and loads that
  neighborhood's data.
- Kicker, headline, lede, and source line are generated. Lede direction words
  (up, down, about the same) come from the data.
- Zero-sale years are trimmed at the ends and shown as gaps in the middle.
- Charts need 2+ years of data and 5+ average annual sales, otherwise KPIs only.
- Sections with no data remove themselves.
- Local preview server.

## Data pipeline (2026-09-23)
- `pipeline/build_market_data.py` builds per-neighborhood JSON from the MLS export.
- 371 neighborhood pages matched from the live sitemap.

## 4.1 (2026-09-23)
- Kicker "Market Trends" in green bold Poppins, scoped to this component.
- Headline pattern "[Neighborhood] Neighborhood Home Sales".

## 4.0 (2026-09-23)
- New dashboard layout: KPI row, price range chart (low to high with the
  average marked), and homes-sold bar chart.
- KPIs, percent changes, and chips are computed from data.
- Homes-sold change shown as a count, not a percent.
- Theme palette only; square corners.

## 3.0 and earlier
- Classic combo chart (average price bars + homes-sold line) with stat cards.
