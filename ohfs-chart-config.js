/*
================================================================================
  OHFS MARKET CHART - GLOBAL CONFIG
  File:  ohfs-chart-config.js
  Repo:  github.com/ryanrenner/ohfs-charts
  Theme: REW sagittarius (26.x)
  Version: 4.0

  WHAT THIS FILE DOES
  -------------------
  Every chart block loads this file. It injects the shared CSS, loads Chart.js,
  and provides the OHFSChart() function. All colors and sizing live in THEME.

  TWO LAYOUTS
  -----------
  layout: 'dashboard' (new in 4.0, recommended)
    KPI row for the latest year, a price range chart (low to high per year
    with the average marked and connected), and a homes-sold bar chart.
    Needs: years, sold, avgPrice, lowPrice, highPrice.

  layout: 'classic' (default, unchanged from 3.0 so existing blocks keep working)
    One combo chart (price bars + homes sold line) with per-year stat cards.
    Needs: years, sold, avgPrice.

  COLORS - validated against the live theme stylesheet
  ------------------------------------------------------
  https://www.omahahomesforsale.com/build/sagittarius/bundle.04da9dff.css
  Every hex value in THEME appears in that stylesheet:
    #3c8227 green (.button--strong)       #0b64c5 blue (.button--blue, focus)
    #d9e6d4 green tint (.notice--success) #d2e0f4 blue tint (.notice--info)
    #222 text   #707070 secondary text   #ccc border   #eee light border
  4.0 replaced 3.0's #3a3938 and #6b6b69, which are not in the theme palette.
  Corners are square to match the theme.

  TO RESTYLE EVERY CHART
  ----------------------
  1. Edit the THEME block below
  2. Commit to GitHub and create a new release tag (e.g. v4.1)
  3. Either update the tag in your chart snippets, or keep using @main and purge:
       https://purge.jsdelivr.net/gh/ryanrenner/ohfs-charts@main/ohfs-chart-config.js
     Without a purge, @main can take up to 12 hours to update.

  DEPLOYMENT
  ----------
  Page blocks go in Content -> Snippets and are embedded with a #snippet-name#
  token. This file self-injects its CSS, but the page block still carries
  HTML the editor would mangle, so the snippet route is required.

  NOTES FOR CLAUDE - generating a new dashboard page
  --------------------------------------------------
  - Start from subdivision-market-dashboard.html. Change only:
      the kicker, headline, and lede paragraph (hand-written HTML, for SEO),
      the body div id, and the data passed to OHFSChart().
  - Do not copy CSS or Chart.js into page blocks. It all lives here.
  - The headline and lede must match the data. Check year-over-year direction
    before writing them. Do not write "higher prices" if the average fell.
  - KPI numbers, percent changes, and chart labels are computed here from
    the data, so they cannot disagree with the charts. Never hand-type them.
  - Thin data: if average annual sales fall below THEME.minAnnualSales, the
    charts are skipped and only the KPI row renders. Override per page with
    showCharts: true or false.
  - Before introducing a new color, check it against the live stylesheet.
    If it is not there, flag it to Ryan rather than assuming it is approved.
================================================================================
*/

(function (global) {

  /* ============================================================
     THEME - edit to restyle all charts sitewide
     ============================================================ */
  var THEME = {
    colorPrimary:    '#3c8227',   /* Brand green: price range, average line */
    colorPrimaryTint:'#d9e6d4',   /* Green tint: range bar fill, price chip */
    colorSecondary:  '#0b64c5',   /* Theme blue: homes sold */
    colorSecondaryTint: '#d2e0f4',/* Blue tint: sales chip */
    colorText:       '#222',      /* Body text, KPI values */
    colorMuted:      '#707070',   /* Axis labels, legend, KPI labels */
    colorBorder:     '#ccc',      /* Card hairlines */
    colorGrid:       '#eee',      /* Chart gridlines */
    colorCardBg:     '#f7f7f7',   /* Classic stat cards (.block--light value) */
    colorTooltipBg:  '#222',
    cornerRadius:    '0',
    fontFamily:      'Poppins, Arial, "Helvetica Neue", Helvetica, sans-serif',
    chartHeight:     '260px',     /* Mobile chart height */
    chartHeightLg:   '300px',     /* Chart height at 768px and up */
    maxWidth:        '860px',     /* Classic layout only */
    minAnnualSales:  5            /* Dashboard: below this average, show KPIs only */
  };
  /* ============================================================ */

  function injectStyles() {
    if (document.getElementById('ohfs-chart-styles')) return;
    var T = THEME;
    var css = [
      /* ---------- Classic layout (unchanged structure from 3.0) ---------- */
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
      '.cmpt-market-chart__stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 20px; }',
      '.cmpt-market-chart__stat { background: ' + T.colorCardBg + '; border-radius: ' + T.cornerRadius + '; padding: 12px; text-align: center; }',
      '.cmpt-market-chart__stat-year { font-size: 12px; font-weight: 700; color: ' + T.colorMuted + '; margin: 0 0 4px; }',
      '.cmpt-market-chart__stat-sold { font-size: 15px; font-weight: 600; color: ' + T.colorText + '; margin: 0 0 2px; }',
      '.cmpt-market-chart__stat-price { font-size: 13px; font-weight: 600; color: ' + T.colorPrimary + '; margin: 0; }',
      '@media (min-width: 768px) {',
      '  .cmpt-market-chart { padding: 56px 0; }',
      '  .cmpt-market-chart__canvas-wrap { height: 320px; }',
      '  .cmpt-market-chart__stats { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }',
      '}',

      /* ---------- Dashboard layout (new in 4.0) ---------- */
      '.cmpt-market-dash { margin: 48px 0; font-family: ' + T.fontFamily + '; color: ' + T.colorText + '; }',
      '.cmpt-market-dash__intro { max-width: 760px; }',
      '.cmpt-market-dash__intro h2 { margin-bottom: 16px; }',

      /* KPI row: 2 across on phones, 4 across at 768px */
      '.cmpt-market-dash__kpis { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 32px 0 16px; }',
      '.cmpt-market-dash__kpi { background: #fff; border: 1px solid ' + T.colorBorder + '; border-radius: ' + T.cornerRadius + '; padding: 16px; }',
      '.cmpt-market-dash__kpi-label { margin: 0; font-size: 12px; font-weight: 700; line-height: 1.4; letter-spacing: 0.5px; text-transform: uppercase; color: ' + T.colorMuted + '; }',
      '.cmpt-market-dash__kpi-value { margin: 8px 0 0; font-size: 26px; font-weight: 700; line-height: 1.1; color: ' + T.colorText + '; }',
      '.cmpt-market-dash__kpi-sub { margin: 8px 0 0; font-size: 13px; line-height: 1.4; color: ' + T.colorMuted + '; }',
      '.cmpt-market-dash__kpi-change { font-weight: 700; color: ' + T.colorText + '; }',

      /* Chart panels: stack on phones and 760px sidebar pages, side by side at full width */
      '.cmpt-market-dash__panels { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr)); gap: 16px; }',
      '.cmpt-market-dash__panel { background: #fff; border: 1px solid ' + T.colorBorder + '; border-radius: ' + T.cornerRadius + '; padding: 16px; min-width: 0; }',
      '.cmpt-market-dash__panel-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 8px 16px; margin-bottom: 12px; }',
      '.cmpt-market-dash__panel-title { margin: 0; font-size: 1.375rem; line-height: 1.3; letter-spacing: 0; }',
      '.cmpt-market-dash__panel-desc { margin: 4px 0 0; font-size: 14px; line-height: 1.5; color: ' + T.colorMuted + '; }',
      '.cmpt-market-dash__chip { display: inline-block; padding: 4px 10px; font-size: 12px; font-weight: 700; line-height: 1.5; white-space: nowrap; color: ' + T.colorText + '; border-radius: ' + T.cornerRadius + '; }',
      '.cmpt-market-dash__chip--price { background: ' + T.colorPrimaryTint + '; }',
      '.cmpt-market-dash__chip--sales { background: ' + T.colorSecondaryTint + '; }',
      '.cmpt-market-dash__legend { display: flex; flex-wrap: wrap; gap: 8px 20px; margin: 0 0 12px; font-size: 13px; line-height: 1.4; color: ' + T.colorMuted + '; }',
      '.cmpt-market-dash__legend span { display: inline-flex; align-items: center; gap: 8px; }',
      '.cmpt-market-dash__swatch-range { width: 12px; height: 12px; background: ' + T.colorPrimaryTint + '; border: 1px solid ' + T.colorPrimary + '; }',
      '.cmpt-market-dash__swatch-avg { width: 20px; height: 2px; background: ' + T.colorPrimary + '; position: relative; }',
      '.cmpt-market-dash__swatch-avg::after { content: ""; position: absolute; left: 6px; top: -3px; width: 8px; height: 8px; border-radius: 50%; background: ' + T.colorPrimary + '; }',
      '.cmpt-market-dash__canvas-wrap { position: relative; width: 100%; height: ' + T.chartHeight + '; }',
      '.cmpt-market-dash__source { margin: 16px 0 0; font-size: 12px; line-height: 1.5; color: ' + T.colorMuted + '; }',

      '@media (min-width: 768px) {',
      '  .cmpt-market-dash { margin: 64px 0; }',
      '  .cmpt-market-dash__kpis { grid-template-columns: repeat(4, 1fr); gap: 16px; }',
      '  .cmpt-market-dash__kpi { padding: 20px 16px; }',
      '  .cmpt-market-dash__kpi-value { font-size: 30px; }',
      '  .cmpt-market-dash__panel { padding: 24px; }',
      '  .cmpt-market-dash__canvas-wrap { height: ' + T.chartHeightLg + '; }',
      '}'
    ].join('\n');
    var tag = document.createElement('style');
    tag.id = 'ohfs-chart-styles';
    tag.textContent = css;
    document.head.appendChild(tag);
  }

  /* ---------- Formatting helpers ---------- */

  /* 390000 -> $390K, 1250000 -> $1.25M */
  function fmtK(n) {
    if (n >= 1000000) return '$' + (Math.round(n / 10000) / 100) + 'M';
    return '$' + Math.round(n / 1000) + 'K';
  }

  /* Percent change with a real minus sign, e.g. +13% or \u22128% */
  function fmtPct(from, to) {
    if (!from) return '';
    var p = Math.round(((to - from) / from) * 100);
    if (p === 0) return 'No change';
    return (p > 0 ? '+' : '\u2212') + Math.abs(p) + '%';
  }

  function sum(arr) { var s = 0; for (var i = 0; i < arr.length; i++) s += arr[i]; return s; }

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

  function setChartDefaults() {
    Chart.defaults.font.family = THEME.fontFamily;
    Chart.defaults.color = THEME.colorMuted;
  }

  function tooltipBase() {
    return {
      backgroundColor: THEME.colorTooltipBg,
      titleColor: '#fff',
      bodyColor: '#eee',
      footerColor: '#ccc',
      padding: 10,
      cornerRadius: 0,
      displayColors: false
    };
  }

  /*
    Draws value labels above points or bars for one dataset.
    Registered per chart (never globally) so it cannot affect other charts.
  */
  function valueLabelPlugin(datasetIndex, format) {
    return {
      id: 'ohfsValueLabels',
      afterDatasetsDraw: function (chart) {
        var meta = chart.getDatasetMeta(datasetIndex);
        if (!meta || meta.hidden) return;
        var data = chart.data.datasets[datasetIndex].data;
        var ctx = chart.ctx;
        ctx.save();
        ctx.font = '700 12px ' + THEME.fontFamily;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#fff';
        ctx.fillStyle = THEME.colorText;
        meta.data.forEach(function (el, i) {
          var p = el.tooltipPosition();
          var text = format(data[i]);
          ctx.strokeText(text, p.x, p.y - 8);
          ctx.fillText(text, p.x, p.y - 8);
        });
        ctx.restore();
      }
    };
  }

  /* ============================================================
     CLASSIC LAYOUT (3.0 behavior)
     ============================================================ */

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

  function classicAria(c) {
    var parts = [];
    for (var i = 0; i < c.years.length; i++) {
      parts.push(c.years[i] + ': ' + c.sold[i] + ' homes sold, average price $' + c.avgPrice[i].toLocaleString());
    }
    return 'Chart of homes sold and average sale price. ' + parts.join('. ') + '.';
  }

  function renderClassic(canvas, c) {
    setChartDefaults();
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
          tooltip: Object.assign(tooltipBase(), {
            displayColors: true,
            callbacks: {
              label: function (ctx) {
                return ctx.dataset.yAxisID === 'yPrice'
                  ? '  Avg price: $' + ctx.parsed.y.toLocaleString()
                  : '  Homes sold: ' + ctx.parsed.y;
              }
            }
          })
        },
        scales: {
          x: { grid: { display: false }, border: { color: '#ddd' }, ticks: { font: { size: 13 } } },
          yPrice: {
            type: 'linear', position: 'left', beginAtZero: true, grace: '10%',
            title: { display: true, text: 'Avg sale price', color: THEME.colorPrimary, font: { size: 12 } },
            ticks: { font: { size: 12 }, callback: function (v) { return fmtK(v); } },
            grid: { color: THEME.colorGrid }
          },
          ySales: {
            type: 'linear', position: 'right', beginAtZero: true, grace: '15%',
            title: { display: true, text: 'Homes sold', color: THEME.colorSecondary, font: { size: 12 } },
            ticks: { font: { size: 12 }, precision: 0 },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
  }

  function initClassic(c) {
    var canvas = document.getElementById(c.id);
    if (!canvas) { console.warn('OHFSChart: no canvas with id "' + c.id + '"'); return; }
    var section = canvas.closest('.cmpt-market-chart');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', classicAria(c));
    var stats = section && section.querySelector('.cmpt-market-chart__stats');
    if (stats) buildStatCards(stats, c);
    loadChartJS(function () { renderClassic(canvas, c); });
  }

  /* ============================================================
     DASHBOARD LAYOUT (new in 4.0)
     ============================================================ */

  function validateDashboard(c) {
    var keys = ['years', 'sold', 'avgPrice', 'lowPrice', 'highPrice'];
    for (var k = 0; k < keys.length; k++) {
      if (!Array.isArray(c[keys[k]])) {
        console.warn('OHFSChart: dashboard layout needs "' + keys[k] + '"');
        return false;
      }
      if (c[keys[k]].length !== c.years.length) {
        console.warn('OHFSChart: "' + keys[k] + '" has ' + c[keys[k]].length + ' entries, expected ' + c.years.length);
        return false;
      }
    }
    for (var i = 0; i < c.years.length; i++) {
      if (!(c.lowPrice[i] <= c.avgPrice[i] && c.avgPrice[i] <= c.highPrice[i])) {
        console.warn('OHFSChart: ' + c.years[i] + ' prices look wrong. Expected low <= average <= high.');
      }
    }
    return true;
  }

  function kpiCard(label, value, subHtml) {
    return '' +
      '<div class="cmpt-market-dash__kpi">' +
        '<p class="cmpt-market-dash__kpi-label">' + label + '</p>' +
        '<p class="cmpt-market-dash__kpi-value">' + value + '</p>' +
        '<p class="cmpt-market-dash__kpi-sub">' + subHtml + '</p>' +
      '</div>';
  }

  function changeLine(from, to, priorYear) {
    if (from === undefined) return 'First year of data';
    return '<span class="cmpt-market-dash__kpi-change">' + fmtPct(from, to) + '</span> vs. ' + priorYear;
  }

  /* Sales counts are small, so show the difference in homes, not a percent (2 to 4 is not "+100%") */
  function countChangeLine(from, to, priorYear) {
    if (from === undefined) return 'First year of data';
    var d = to - from;
    if (d === 0) return 'Same as ' + priorYear;
    return '<span class="cmpt-market-dash__kpi-change">' + (d > 0 ? '+' : '\u2212') + Math.abs(d) + '</span> vs. ' + priorYear;
  }

  function buildKpis(c) {
    var L = c.years.length - 1;
    var P = L - 1;
    var yr = c.years[L];
    var prior = P >= 0 ? c.years[P] : null;
    return '' +
      '<div class="cmpt-market-dash__kpis" role="group" aria-label="' + yr + ' market snapshot">' +
        kpiCard('Homes sold', String(c.sold[L]),
          countChangeLine(P >= 0 ? c.sold[P] : undefined, c.sold[L], prior)) +
        kpiCard('Avg sale price', fmtK(c.avgPrice[L]),
          changeLine(P >= 0 ? c.avgPrice[P] : undefined, c.avgPrice[L], prior)) +
        kpiCard('Highest sale', fmtK(c.highPrice[L]), yr + ' high') +
        kpiCard('Lowest sale', fmtK(c.lowPrice[L]), yr + ' low') +
      '</div>';
  }

  function buildPanels(c) {
    var first = 0, last = c.years.length - 1;
    var priceChip = fmtPct(c.avgPrice[first], c.avgPrice[last]);
    priceChip = priceChip === 'No change' ? 'Flat since ' + c.years[first] : priceChip + ' since ' + c.years[first];
    var salesChip = c.sold[first] + ' \u2192 ' + c.sold[last] + ' homes';

    return '' +
      '<div class="cmpt-market-dash__panels">' +

        '<div class="cmpt-market-dash__panel">' +
          '<div class="cmpt-market-dash__panel-head">' +
            '<div>' +
              '<h3 class="cmpt-market-dash__panel-title">Sale prices</h3>' +
              '<p class="cmpt-market-dash__panel-desc">Lowest to highest sale each year, with the average marked</p>' +
            '</div>' +
            '<span class="cmpt-market-dash__chip cmpt-market-dash__chip--price">' + priceChip + '</span>' +
          '</div>' +
          '<div class="cmpt-market-dash__legend" aria-hidden="true">' +
            '<span><i class="cmpt-market-dash__swatch-range"></i>Price range</span>' +
            '<span><i class="cmpt-market-dash__swatch-avg"></i>Average sale price</span>' +
          '</div>' +
          '<div class="cmpt-market-dash__canvas-wrap"><canvas id="' + c.id + '-price"></canvas></div>' +
        '</div>' +

        '<div class="cmpt-market-dash__panel">' +
          '<div class="cmpt-market-dash__panel-head">' +
            '<div>' +
              '<h3 class="cmpt-market-dash__panel-title">Homes sold</h3>' +
              '<p class="cmpt-market-dash__panel-desc">Closed sales each year</p>' +
            '</div>' +
            '<span class="cmpt-market-dash__chip cmpt-market-dash__chip--sales">' + salesChip + '</span>' +
          '</div>' +
          '<div class="cmpt-market-dash__canvas-wrap"><canvas id="' + c.id + '-sold"></canvas></div>' +
        '</div>' +

      '</div>';
  }

  function priceAria(c) {
    var parts = [];
    for (var i = 0; i < c.years.length; i++) {
      parts.push(c.years[i] + ': average ' + fmtK(c.avgPrice[i]) + ', range ' + fmtK(c.lowPrice[i]) + ' to ' + fmtK(c.highPrice[i]));
    }
    return 'Chart of sale prices by year. ' + parts.join('. ') + '.';
  }

  function soldAria(c) {
    var parts = [];
    for (var i = 0; i < c.years.length; i++) parts.push(c.years[i] + ': ' + c.sold[i]);
    return 'Chart of homes sold by year. ' + parts.join('. ') + '.';
  }

  /* Round axis bounds to clean steps ($25K, $50K, $100K, or $250K) with headroom */
  function priceBounds(c) {
    var lo = Math.min.apply(null, c.lowPrice);
    var hi = Math.max.apply(null, c.highPrice);
    var span = hi - lo;
    var step = span > 600000 ? 250000 : span > 250000 ? 100000 : span > 100000 ? 50000 : 25000;
    var pad = span * 0.08;
    return {
      min: Math.max(0, Math.floor((lo - pad) / step) * step),
      max: Math.ceil((hi + pad) / step) * step,
      step: step
    };
  }

  function renderPriceChart(canvas, c) {
    var ranges = [];
    for (var i = 0; i < c.years.length; i++) ranges.push([c.lowPrice[i], c.highPrice[i]]);
    var b = priceBounds(c);

    new Chart(canvas, {
      data: {
        labels: c.years,
        datasets: [
          {
            type: 'bar',
            label: 'Price range',
            data: ranges,
            backgroundColor: THEME.colorPrimaryTint,
            borderColor: THEME.colorPrimary,
            borderWidth: 1,
            borderSkipped: false,
            borderRadius: 0,
            maxBarThickness: 56,
            order: 2
          },
          {
            type: 'line',
            label: 'Average sale price',
            data: c.avgPrice,
            borderColor: THEME.colorPrimary,
            borderWidth: 2,
            tension: 0,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: THEME.colorPrimary,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            order: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 8 } },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: Object.assign(tooltipBase(), {
            callbacks: {
              label: function (ctx) {
                if (ctx.datasetIndex === 0) return 'Range: ' + fmtK(ctx.raw[0]) + ' to ' + fmtK(ctx.raw[1]);
                return 'Average: ' + fmtK(ctx.raw);
              },
              footer: function (items) {
                var n = c.sold[items[0].dataIndex];
                return n + (n === 1 ? ' sale' : ' sales');
              }
            }
          })
        },
        scales: {
          x: { grid: { display: false }, border: { color: THEME.colorBorder } },
          y: {
            min: b.min,
            max: b.max,
            ticks: { stepSize: b.step, callback: function (v) { return fmtK(v); } },
            grid: { color: THEME.colorGrid },
            border: { display: false }
          }
        }
      },
      plugins: [valueLabelPlugin(1, fmtK)]
    });
  }

  function renderSoldChart(canvas, c) {
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: c.years,
        datasets: [{
          label: 'Homes sold',
          data: c.sold,
          backgroundColor: THEME.colorSecondary,
          borderRadius: 0,
          maxBarThickness: 56
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 24 } },
        plugins: {
          legend: { display: false },
          tooltip: Object.assign(tooltipBase(), {
            callbacks: { label: function (ctx) { return ctx.raw + ' homes sold'; } }
          })
        },
        scales: {
          x: { grid: { display: false }, border: { color: THEME.colorBorder } },
          y: {
            beginAtZero: true,
            grace: '10%',
            ticks: { precision: 0, maxTicksLimit: 6 },
            grid: { color: THEME.colorGrid },
            border: { display: false }
          }
        }
      },
      plugins: [valueLabelPlugin(0, String)]
    });
  }

  function initDashboard(c) {
    var body = document.getElementById(c.id);
    if (!body) { console.warn('OHFSChart: no element with id "' + c.id + '"'); return; }
    if (!validateDashboard(c)) return;

    var showCharts = typeof c.showCharts === 'boolean'
      ? c.showCharts
      : (sum(c.sold) / c.sold.length) >= THEME.minAnnualSales;

    body.innerHTML = buildKpis(c) + (showCharts ? buildPanels(c) : '');
    if (!showCharts) return;

    var priceCanvas = document.getElementById(c.id + '-price');
    var soldCanvas = document.getElementById(c.id + '-sold');
    priceCanvas.setAttribute('role', 'img');
    priceCanvas.setAttribute('aria-label', priceAria(c));
    soldCanvas.setAttribute('role', 'img');
    soldCanvas.setAttribute('aria-label', soldAria(c));

    loadChartJS(function () {
      setChartDefaults();
      renderPriceChart(priceCanvas, c);
      renderSoldChart(soldCanvas, c);
    });
  }

  /*
    OHFSChart(config)

    Dashboard (recommended):
      layout     'dashboard'
      id         {string}  id of the empty body div, e.g. 'ohfs-dash-sagewood'
      years      {array}   ['2022', '2023', '2024', '2025']
      sold       {array}   [12, 14, 15, 18]
      avgPrice   {array}   [353000, 361000, 345000, 390000]
      lowPrice   {array}   lowest sale each year
      highPrice  {array}   highest sale each year
      showCharts {bool}    optional, overrides the thin-data rule

    Classic:
      id         {string}  canvas id
      years, sold, avgPrice

    All arrays must be the same length. Any number of years works.
  */
  global.OHFSChart = function (c) {
    injectStyles();
    if (c.layout === 'dashboard') initDashboard(c);
    else initClassic(c);
  };

}(window));