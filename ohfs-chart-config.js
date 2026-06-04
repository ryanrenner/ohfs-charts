/*
================================================================================
  OHFS MARKET CHART — GLOBAL CONFIG
  File: ohfs-chart-config.js
  Repo: github.com/YOUR-USERNAME/ohfs-charts   ← update this
  CDN:  https://cdn.jsdelivr.net/gh/YOUR-USERNAME/ohfs-charts@main/ohfs-chart-config.js

  HOW THIS FILE WORKS
  -------------------
  This file is loaded ONCE sitewide (via GTM or the site footer).
  It provides the OHFSChart() function that every neighborhood chart page calls.
  All colors, fonts, sizing, and Chart.js configuration live here.

  TO CHANGE COLORS SITEWIDE
  --------------------------
  Edit the THEME block below. Every chart on every page updates automatically.
  After editing, commit and push to GitHub. jsDelivr CDN updates within ~10 min.
  To force an immediate update, use a versioned URL (see DEPLOYMENT NOTE below).

  DEPLOYMENT NOTE
  ---------------
  For production, pin to a specific release tag so a bad push doesn't break live charts:
    https://cdn.jsdelivr.net/gh/YOUR-USERNAME/ohfs-charts@v1.0/ohfs-chart-config.js
  Use @main only during development.

  INSTRUCTIONS FOR CLAUDE — how to use this system
  --------------------------------------------------
  Each neighborhood page only needs a tiny data block (see subdivision-market-chart.html).
  When generating a new chart page, Claude should:
    1. Copy the per-page template (subdivision-market-chart.html)
    2. Update: neighborhood name, subtitle year range, years/sold/avgPrice arrays
    3. Give each chart instance a unique ID (e.g. 'ohfs-chart-hearthwood')
    4. Do NOT modify this file or copy styles into the page — they live here
    5. Do NOT include Chart.js in the page — this file loads it
================================================================================
*/

(function (global) {

  /* ============================================================
     THEME — edit this block to restyle all charts sitewide
     ============================================================ */
  var THEME = {
    colorPrimary:    '#298c8c',   /* Bar color (avg sale price) + left axis title + eyebrow */
    colorSecondary:  '#f1a226',   /* Line color (homes sold) + right axis title + stat prices */
    colorText:       '#3a3938',   /* Main body text, sold count in stat cards */
    colorMuted:      '#6b6b69',   /* Axis tick labels, legend text, stat year */
    colorGrid:       'rgba(0,0,0,0.06)', /* Horizontal grid lines */
    colorCardBg:     '#f1f0ef',   /* Stat card background */
    colorTooltipBg:  '#3a3938',   /* Tooltip background */
    chartHeight:     '300px',     /* Desktop chart canvas height */
    chartHeightMobile: '240px',   /* Mobile chart canvas height */
    maxWidth:        '860px',     /* Max width of the chart section */
  };
  /* ============================================================
     END THEME — do not edit below unless you know what you're doing
  ============================================================ */

  /* Injects the shared CSS into the page once */
  function injectStyles() {
    if (document.getElementById('ohfs-chart-styles')) return; /* Already injected */
    var css = [
      '.cmpt-market-chart { background: #fff; }',
      '.cmpt-market-chart__inner { max-width: ' + THEME.maxWidth + '; margin: 0 auto; padding: 0 24px; }',
      '.cmpt-market-chart__header { margin-bottom: 24px; }',
      '.cmpt-market-chart__eyebrow { font-size: 13px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: ' + THEME.colorPrimary + '; margin: 0 0 6px; }',
      '.cmpt-market-chart__title { font-size: 26px; font-weight: 600; color: ' + THEME.colorText + '; margin: 0 0 8px; }',
      '.cmpt-market-chart__observations { margin: 0; }',
      '.cmpt-market-chart__observations p { font-size: 15px; color: ' + THEME.colorText + '; line-height: 1.65; margin: 0 0 12px; }',
      '.cmpt-market-chart__observations p:last-child { margin-bottom: 0; }',
      '.cmpt-market-chart__legend { display: flex; gap: 20px; margin-bottom: 16px; flex-wrap: wrap; }',
      '.cmpt-market-chart__legend-item { display: flex; align-items: center; gap: 7px; font-size: 13px; color: ' + THEME.colorMuted + '; }',
      '.cmpt-market-chart__legend-bar { width: 12px; height: 12px; border-radius: 3px; background: ' + THEME.colorPrimary + '; flex-shrink: 0; }',
      '.cmpt-market-chart__legend-line { width: 22px; height: 3px; border-radius: 2px; background: ' + THEME.colorSecondary + '; flex-shrink: 0; }',
      '.cmpt-market-chart__canvas-wrap { position: relative; width: 100%; height: ' + THEME.chartHeight + '; }',
      '.cmpt-market-chart__stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 20px; }',
      '.cmpt-market-chart__stat { background: ' + THEME.colorCardBg + '; border-radius: 8px; padding: 12px; text-align: center; }',
      '.cmpt-market-chart__stat-year { font-size: 12px; font-weight: 700; color: ' + THEME.colorMuted + '; margin: 0 0 4px; }',
      '.cmpt-market-chart__stat-sold { font-size: 15px; font-weight: 600; color: ' + THEME.colorText + '; margin: 0 0 2px; }',
      '.cmpt-market-chart__stat-price { font-size: 13px; font-weight: 600; color: ' + THEME.colorSecondary + '; margin: 0; }',
      '@media (max-width: 600px) {',
      '  .cmpt-market-chart__stats { grid-template-columns: repeat(2, 1fr); }',
      '  .cmpt-market-chart__canvas-wrap { height: ' + THEME.chartHeightMobile + '; }',
      '  .cmpt-market-chart__title { font-size: 22px; }',
      '}'
    ].join('\n');

    var tag = document.createElement('style');
    tag.id = 'ohfs-chart-styles';
    tag.textContent = css;
    document.head.appendChild(tag);
  }

  /* Builds the stat card HTML for a chart instance */
  function buildStatCards(container, config) {
    var html = '';
    for (var i = 0; i < config.years.length; i++) {
      var price = '$' + (config.avgPrice[i] / 1000).toFixed(0) + 'k';
      html +=
        '<div class="cmpt-market-chart__stat">' +
          '<p class="cmpt-market-chart__stat-year">' + config.years[i] + '</p>' +
          '<p class="cmpt-market-chart__stat-sold">' + config.sold[i] + ' homes sold</p>' +
          '<p class="cmpt-market-chart__stat-price">' + price + ' avg</p>' +
        '</div>';
    }
    container.innerHTML = html;
  }

  /* Renders the Chart.js bar+line combo for a chart instance */
  function renderChart(canvasEl, config) {
    new Chart(canvasEl, {
      data: {
        labels: config.years,
        datasets: [
          {
            type: 'bar',
            label: 'Avg sale price',
            data: config.avgPrice,
            backgroundColor: THEME.colorPrimary,
            borderRadius: 5,
            yAxisID: 'yPrice',
            order: 2
          },
          {
            type: 'line',
            label: 'Homes sold',
            data: config.sold,
            borderColor: THEME.colorSecondary,
            backgroundColor: THEME.colorSecondary.replace(')', ', 0.10)').replace('rgb', 'rgba'),
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
            bodyColor: '#ccc',
            padding: 10,
            callbacks: {
              label: function (ctx) {
                if (ctx.dataset.yAxisID === 'yPrice') {
                  return '  Avg price: $' + ctx.parsed.y.toLocaleString();
                }
                return '  Homes sold: ' + ctx.parsed.y;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            border: { color: '#ddd' },
            ticks: { color: THEME.colorMuted, font: { size: 13 } }
          },
          yPrice: {
            type: 'linear',
            position: 'left',
            min: config.priceMin || 280000,
            suggestedMax: config.priceMax || 440000,
            title: { display: true, text: 'Avg sale price', color: THEME.colorPrimary, font: { size: 12 } },
            ticks: {
              color: THEME.colorMuted,
              font: { size: 12 },
              callback: function (v) { return '$' + (v / 1000).toFixed(0) + 'k'; }
            },
            grid: { color: THEME.colorGrid }
          },
          ySales: {
            type: 'linear',
            position: 'right',
            min: 0,
            suggestedMax: config.soldMax || 70,
            title: { display: true, text: 'Homes sold', color: THEME.colorSecondary, font: { size: 12 } },
            ticks: { color: THEME.colorMuted, font: { size: 12 }, stepSize: 10 },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
  }

  /* Loads Chart.js from cdnjs if not already present, then runs callback */
  function loadChartJS(callback) {
    if (typeof Chart !== 'undefined') { callback(); return; }
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
    s.onload = callback;
    document.head.appendChild(s);
  }

  /*
    OHFSChart(config) — the public function each neighborhood page calls

    Required config properties:
      id         {string}   Unique ID for this chart's canvas element (e.g. 'ohfs-chart-sanctuary-ridge')
      title      {string}   Neighborhood name for the <h2>
      subtitle   {string|array}  Observations text. Either a single string or an array of
                                 paragraph strings. Each array item becomes its own <p> tag.
                                 e.g. ['In 2024, there were 15 homes sold...', 'In 2025...']
      years      {array}    Year labels  e.g. ['2022', '2023', '2024', '2025']
      sold       {array}    Homes sold   e.g. [47, 38, 42, 51]
      avgPrice   {array}    Avg prices   e.g. [342000, 361000, 378000, 395000]

    Optional config properties (for axis scale overrides):
      priceMin   {number}   Left axis min (default: 280000)
      priceMax   {number}   Left axis suggestedMax (default: 440000)
      soldMax    {number}   Right axis suggestedMax (default: 70)
  */
  global.OHFSChart = function (config) {
    injectStyles();

    /* Find the section this config belongs to by looking for a canvas with the given id */
    var canvas = document.getElementById(config.id);
    if (!canvas) {
      console.warn('OHFSChart: no canvas found with id "' + config.id + '"');
      return;
    }

    var section = canvas.closest('.cmpt-market-chart');
    if (!section) return;

    /* Populate header */
    var titleEl = section.querySelector('.cmpt-market-chart__title');
    var observationsEl = section.querySelector('.cmpt-market-chart__observations');
    if (titleEl) titleEl.textContent = config.title;
    if (observationsEl && config.subtitle) {
      var paragraphs = Array.isArray(config.subtitle) ? config.subtitle : [config.subtitle];
      observationsEl.innerHTML = paragraphs.map(function (p) {
        return '<p>' + p + '</p>';
      }).join('');
    }

    /* Build stat cards */
    var statsEl = section.querySelector('.cmpt-market-chart__stats');
    if (statsEl) buildStatCards(statsEl, config);

    /* Render chart */
    loadChartJS(function () { renderChart(canvas, config); });
  };

}(window));
