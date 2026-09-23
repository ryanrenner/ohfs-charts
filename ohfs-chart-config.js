/*
================================================================================
  OHFS MARKET CHART - GLOBAL CONFIG
  File:  ohfs-chart-config.js
  Repo:  github.com/ryanrenner/ohfs-charts
  Theme: REW sagittarius (26.x)
  Version: 3.0

  WHAT THIS FILE DOES
  -------------------
  Every chart block loads this file. It injects the shared CSS, loads Chart.js,
  and provides the OHFSChart() function. All colors and sizing live in THEME.

  COLORS - validated against the live theme stylesheet
  ------------------------------------------------------
  https://www.omahahomesforsale.com/build/sagittarius/bundle.04da9dff.css
  colorPrimary (#3c8227) and colorLink (#0b64c5) are real theme colors,
  used throughout for buttons, badges, links, and focus states.
  colorCardBg (#f7f7f7) matches the theme's actual light-background value
  (.block--light, .sidebar--light), not an off-palette gray.
  Corners are square (border-radius: 0) to match the theme, which does not
  use rounded corners except where explicitly opted in (e.g. .button--round).

  TO RESTYLE EVERY CHART
  ----------------------
  1. Edit the THEME block below
  2. Commit to GitHub and create a new release tag (e.g. v3.1)
  3. Either update the tag in your chart snippets, or keep using @main and purge:
       https://purge.jsdelivr.net/gh/ryanrenner/ohfs-charts@main/ohfs-chart-config.js
     Without a purge, @main can take up to 12 hours to update.

  DEPLOYMENT
  ----------
  Snippets are mandatory for this platform. Anything with <style> or a media
  query gets stripped by the REW page editor. This file self-injects its CSS
  via JS, so the page block itself only needs the canvas + script tags - but
  the page block still must be delivered through Content -> Snippets and
  referenced with a #snippet-name# token, not pasted into the page editor.

  NOTES FOR CLAUDE
  ----------------
  - Do not copy CSS or Chart.js into page blocks. It all lives here.
  - Page blocks hold the title and observations as real HTML (for SEO)
    and pass only data to OHFSChart().
  - Uses sagittarius conventions: mobile-first min-width breakpoints,
    no old utility classes (-pad-*, -mar-*, -text-*, -width-*), square corners.
  - Before introducing a new color, check it against the live stylesheet
    above. If it is not there, flag it to Ryan rather than assuming it is
    approved, per project platform-rules.
================================================================================
*/

(function (global) {

  /* ============================================================
     THEME - edit to restyle all charts sitewide
     ============================================================ */
  var THEME = {
    colorPrimary:    '#3c8227',   /* Brand green: price bars, price text, eyebrow. Confirmed in theme CSS. */
    colorSecondary:  '#0b64c5',   /* Theme blue: homes sold line. Confirmed in theme CSS (links, focus states). */
    colorText:       '#3a3938',   /* Body text */
    colorMuted:      '#6b6b69',   /* Axis labels, legend, stat years */
    colorGrid:       'rgba(0,0,0,0.06)',
    colorCardBg:     '#f7f7f7',   /* Stat card background. Matches theme's .block--light / .sidebar--light. */
    colorTooltipBg:  '#3a3938',
    cornerRadius:    '0',         /* Theme uses square corners by default */
    fontFamily:      'Poppins, Arial, "Helvetica Neue", Helvetica, sans-serif',
    chartHeight:     '260px',     /* Mobile chart height */
    chartHeightLg:   '320px',     /* Chart height at 768px and up */
    maxWidth:        '860px'
  };
  /* ============================================================ */

  function injectStyles() {
    if (document.getElementById('ohfs-chart-styles')) return;
    var T = THEME;
    var css = [
      '.cmpt-market-chart { padding: 40px 0; font-family: ' + T.fontFamily + '; }',
      '.cmpt-market-chart__inner { max-width: ' + T.maxWidth + '; margin: 0 auto; }',
      '.cmpt-market-chart__header { margin-bottom: 24px; }',
      '.cmpt-market-chart__eyebrow { font-size: 13px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: ' + T.colorPrimary + '; margin: 0 0 6px; }',
      '.cmpt-market-chart__title { margin: 0 0 16px; }',
      '.cmpt-market-chart__observations p { font-size: 15px; line-height: 1.65; color: ' + T.colorText + '; margin: 0 0 12px; }',
      '.cmpt-market-chart__observations p:last-child { margin-bottom: 0; }',
      '.cmpt-market-chart__legend { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 14px; }',
      '.cmpt-market-chart__legend-item { display: flex; align-items: center; gap: 7px; font-size: 13px; color: ' + T.colorMuted + '; }',
      '.cmpt-market-chart__legend-bar { width: 12px; height: 12px; border-radius: ' + T.cornerRadius + '; background: ' + T.colorPrimary + '; flex-shrink: 0; }',
      '.cmpt-market-chart__legend-line { width: 22px; height: 3px; border-radius: ' + T.cornerRadius + '; background: ' + T.colorSecondary + '; flex-shrink: 0; }',
      '.cmpt-market-chart__canvas-wrap { position: relative; width: 100%; height: ' + T.chartHeight + '; }',
      /* Mobile-first: 2 cards per row, auto-fit wider at 768px so any number of years works */
      '.cmpt-market-chart__stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 20px; }',
      '.cmpt-market-chart__stat { background: ' + T.colorCardBg + '; border-radius: ' + T.cornerRadius + '; padding: 12px; text-align: center; }',
      '.cmpt-market-chart__stat-year { font-size: 12px; font-weight: 700; color: ' + T.colorMuted + '; margin: 0 0 4px; }',
      '.cmpt-market-chart__stat-sold { font-size: 15px; font-weight: 600; color: ' + T.colorText + '; margin: 0 0 2px; }',
      '.cmpt-market-chart__stat-price { font-size: 13px; font-weight: 600; color: ' + T.colorPrimary + '; margin: 0; }',
      '@media (min-width: 768px) {',
      '  .cmpt-market-chart { padding: 56px 0; }',
      '  .cmpt-market-chart__canvas-wrap { height: ' + T.chartHeightLg + '; }',
      '  .cmpt-market-chart__stats { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }',
      '}'
    ].join('\n');
    var tag = document.createElement('style');
    tag.id = 'ohfs-chart-styles';
    tag.textContent = css;
    document.head.appendChild(tag);
  }

  function fmtK(n) { return '$' + Math.round(n / 1000) + 'k'; }

  function buildStatCards(container, c) {
    var html = '';
    for (var i = 0; i < c.years.length; i++) {
      html +=
        '<div class="cmpt-market-chart__stat">' +
          '<p class="cmpt-market-chart__stat-year">' + c.years[i] + '</p>' +
          '<p class="cmpt-market-chart__stat-sold">' + c.sold[i] + ' homes sold</p>' +
          '<p class="cmpt-market-chart__stat-price">' + fmtK(c.avgPrice[i]) + ' avg</p>' +
        '</div>';
    }
    container.innerHTML = html;
  }

  /* Plain-language summary for screen readers */
  function ariaSummary(c) {
    var parts = [];
    for (var i = 0; i < c.years.length; i++) {
      parts.push(c.years[i] + ': ' + c.sold[i] + ' homes sold, average price $' + c.avgPrice[i].toLocaleString());
    }
    return 'Chart of homes sold and average sale price. ' + parts.join('. ') + '.';
  }

  function renderChart(canvas, c) {
    Chart.defaults.font.family = THEME.fontFamily;
    Chart.defaults.color = THEME.colorMuted;

    new Chart(canvas, {
      data: {
        labels: c.years,
        datasets: [
          {
            type: 'bar',
            label: 'Avg sale price',
            data: c.avgPrice,
            backgroundColor: THEME.colorPrimary,
            borderRadius: 0,
            maxBarThickness: 64,
            yAxisID: 'yPrice',
            order: 2
          },
          {
            type: 'line',
            label: 'Homes sold',
            data: c.sold,
            borderColor: THEME.colorSecondary,
            pointBackgroundColor: THEME.colorSecondary,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
            borderWidth: 2.5,
            tension: 0.35,
            fill: false,
            yAxisID: 'ySales',
            order: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: THEME.colorTooltipBg,
            titleColor: '#fff',
            bodyColor: '#ddd',
            padding: 10,
            callbacks: {
              label: function (ctx) {
                return ctx.dataset.yAxisID === 'yPrice'
                  ? '  Avg price: $' + ctx.parsed.y.toLocaleString()
                  : '  Homes sold: ' + ctx.parsed.y;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            border: { color: '#ddd' },
            ticks: { font: { size: 13 } }
          },
          /* Price bars start at zero so differences are not exaggerated */
          yPrice: {
            type: 'linear',
            position: 'left',
            beginAtZero: true,
            grace: '10%',
            title: { display: true, text: 'Avg sale price', color: THEME.colorPrimary, font: { size: 12 } },
            ticks: { font: { size: 12 }, callback: function (v) { return fmtK(v); } },
            grid: { color: THEME.colorGrid }
          },
          /* Homes sold auto-scales with headroom; no per-page overrides needed */
          ySales: {
            type: 'linear',
            position: 'right',
            beginAtZero: true,
            grace: '15%',
            title: { display: true, text: 'Homes sold', color: THEME.colorSecondary, font: { size: 12 } },
            ticks: { font: { size: 12 }, precision: 0 },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
  }

  function loadChartJS(cb) {
    if (typeof Chart !== 'undefined') { cb(); return; }
    var existing = document.getElementById('ohfs-chartjs');
    if (existing) { existing.addEventListener('load', cb); return; }
    var s = document.createElement('script');
    s.id = 'ohfs-chartjs';
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
    s.onload = cb;
    document.head.appendChild(s);
  }

  /*
    OHFSChart(config)
      id        {string}  Canvas id, e.g. 'ohfs-chart-sagewood'
      years     {array}   ['2022', '2023', '2024', '2025']
      sold      {array}   [12, 14, 15, 18]
      avgPrice  {array}   [353000, 361000, 345000, 390000]
    All three arrays must be the same length. Any number of years works.
  */
  global.OHFSChart = function (c) {
    injectStyles();
    var canvas = document.getElementById(c.id);
    if (!canvas) { console.warn('OHFSChart: no canvas with id "' + c.id + '"'); return; }
    var section = canvas.closest('.cmpt-market-chart');

    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', ariaSummary(c));

    var stats = section && section.querySelector('.cmpt-market-chart__stats');
    if (stats) buildStatCards(stats, c);

    loadChartJS(function () { renderChart(canvas, c); });
  };

}(window));