# Working on ohfs-charts

Instructions for AI assistants (Claude, Claude Code, etc.). Read this first.

## Context

- Owner: Ryan Renner, solo residential agent in Omaha. Site: omahahomesforsale.com
  on REW, theme `sagittarius` 26.x.
- This repo is served live through jsDelivr. **A push to `main` reaches the
  live site after a cache purge.** Test with `preview/serve.py` first.
- Project history: `docs/HISTORY.md`. Why things are the way they are:
  `docs/DECISIONS.md`. Read both before proposing structural changes.

## Rules

- **Colors:** only the live theme palette. `#3c8227` green, `#0b64c5` blue,
  `#d9e6d4` green tint, `#d2e0f4` blue tint, `#222` text, `#707070` secondary,
  `#ccc` border, `#eee` grid. Flag anything new instead of assuming it's approved.
- **Look:** square corners, 1px `#ccc` hairlines, no shadows. Poppins for UI,
  Playfair Display (theme default) for headings.
- **Layout:** mobile-first, `min-width` breakpoints at 480/768/960/1080.
  Content column is 1180px, or 760px when the page has a sidebar snippet.
- **Scoping:** all CSS under `.cmpt-market-dash` or `.cmpt-market-chart`.
  Never style `body` or global elements. Chart.js plugins are registered per
  chart, never globally.
- **Copy:** kicker is "Market Trends". Headline is "[Name] Neighborhood Home
  Sales". Lede describes direction honestly from data. No em dashes, no
  exclamation points, no hype.
- **Data:** `data/` is generated. Never hand-edit it. Numbers come from
  `pipeline/build_market_data.py`, never from an LLM reading rows.
- **Raw MLS exports never go in the repo.** They contain addresses and parcel numbers.
- Keep `ohfs-chart-config.js` ES5-style (var, function) for broad browser support.
- Bump the version in the config header and add a `CHANGELOG.md` entry for
  every config change.

## Ryan's preferences for responses

Bullets, bold key terms, short paragraphs. No more than 3 action items at a
time. End complex tasks with the single next step. Complete code, never partial snippets.
