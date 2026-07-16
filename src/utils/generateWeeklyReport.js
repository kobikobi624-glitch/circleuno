import { getClinicalInsights } from "./clinicalInsights";

export function generateWeeklyReport(patient) {
  const entries  = patient.entries || [];
  const dateFrom = patient.dateFrom
    ? new Date(patient.dateFrom + 'T00:00:00').getTime()
    : Date.now() - 7 * 86400000;
  const dateTo = patient.dateTo
    ? new Date(patient.dateTo + 'T23:59:59').getTime()
    : Date.now();
  const weekly = entries.filter(e => {
    const t = new Date(e.timestamp).getTime();
    return t >= dateFrom && t <= dateTo;
  });
  const insights = getClinicalInsights(patient);

  const avg        = weekly.length > 0 ? weekly.reduce((s,e)=>s+e.anxiety,0)/weekly.length : 0;
  const avoidCount = weekly.filter(e=>e.response==="no").length;
  const avoidPct   = weekly.length > 0 ? Math.round(avoidCount/weekly.length*100) : 0;

  const triggers = {};
  weekly.forEach(e => { if(e.trigger) triggers[e.trigger] = (triggers[e.trigger]||0)+1; });
  const topTriggers = Object.entries(triggers).sort((a,b)=>b[1]-a[1]).slice(0,3);

  const riskColor = { high:"#ef4444", medium:"#f59e0b", low:"#22c55e" }[insights.risk] || "#6366f1";

  const eventsRows = weekly.slice(0,20).map(e => {
    const resp = e.response==="no"?"נמנע":e.response==="partial"?"חלקי":"התמודד";
    const color = e.anxiety>=70?"#ef4444":e.anxiety>=40?"#f59e0b":"#22c55e";
    return `
      <tr>
        <td>${new Date(e.timestamp).toLocaleDateString("he-IL")}</td>
        <td>${e.trigger || "—"}</td>
        <td style="color:${color};font-weight:700">${e.anxiety}</td>
        <td>${resp}</td>
        <td style="font-size:12px;color:#64748b">${e.notes || "—"}</td>
      </tr>`;
  }).join("");

  const triggersHtml = topTriggers.map(([t,c]) =>
    `<span class="tag">${t} <b>(${c})</b></span>`
  ).join(" ");

  // Build SVG line chart for weekly anxiety trend
  const buildChart = () => {
    const sorted = [...weekly].sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
    if (sorted.length < 2) return "";

    const W = 700, H = 240, padL = 40, padR = 20, padT = 20, padB = 40;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    const points = sorted.map((e, i) => {
      const x = padL + (i / (sorted.length - 1)) * chartW;
      const y = padT + (1 - e.anxiety / 100) * chartH;
      return { x, y, e };
    });

    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    const yFor = v => padT + (1 - v/100) * chartH;

    const dots = points.map(p => {
      const color = p.e.anxiety >= 70 ? "#ef4444" : p.e.anxiety >= 40 ? "#f59e0b" : "#22c55e";
      return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="${color}" stroke="white" stroke-width="1.5"/>`;
    }).join("");

    const xLabels = points.map((p, i) => {
      if (sorted.length > 8 && i % 2 !== 0 && i !== sorted.length - 1) return "";
      const date = new Date(p.e.timestamp).toLocaleDateString("he-IL", { day: "numeric", month: "numeric" });
      return `<text x="${p.x.toFixed(1)}" y="${H - 12}" font-size="10" fill="#94a3b8" text-anchor="middle">${date}</text>`;
    }).join("");

    return `
    <svg width="100%" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="font-family:'Heebo',Arial,sans-serif">
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${H-padB}" stroke="#e2e8f0" stroke-width="1"/>
      <line x1="${padL}" y1="${H-padB}" x2="${W-padR}" y2="${H-padB}" stroke="#e2e8f0" stroke-width="1"/>
      <text x="${padL-8}" y="${padT+4}" font-size="10" fill="#94a3b8" text-anchor="end">100</text>
      <text x="${padL-8}" y="${(padT+H-padB)/2+4}" font-size="10" fill="#94a3b8" text-anchor="end">50</text>
      <text x="${padL-8}" y="${H-padB+4}" font-size="10" fill="#94a3b8" text-anchor="end">0</text>
      <line x1="${padL}" y1="${yFor(70)}" x2="${W-padR}" y2="${yFor(70)}" stroke="#ef4444" stroke-width="1" stroke-dasharray="4,4" opacity="0.5"/>
      <line x1="${padL}" y1="${yFor(40)}" x2="${W-padR}" y2="${yFor(40)}" stroke="#f59e0b" stroke-width="1" stroke-dasharray="4,4" opacity="0.5"/>
      <path d="${linePath}" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${dots}
      ${xLabels}
    </svg>`;
  };

  const chartSvg = buildChart();

  const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8"/>
<title>דוח שבועי – ${patient.name || patient.code}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Heebo', Arial, sans-serif;
    color: #0f172a;
    background: white;
    direction: rtl;
    padding: 32px;
    font-size: 14px;
    line-height: 1.6;
  }

  /* HEADER */
  .header {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    padding: 24px 28px;
    border-radius: 16px;
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header h1 { font-size: 26px; font-weight: 800; margin-bottom: 4px; }
  .header .sub { opacity: 0.85; font-size: 13px; }
  .header .date { font-size: 13px; opacity: 0.8; text-align: left; }

  /* PATIENT INFO */
  .patient-bar {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 14px 20px;
    margin-bottom: 20px;
    display: flex;
    gap: 32px;
    align-items: center;
  }
  .patient-bar .name { font-size: 18px; font-weight: 700; }
  .patient-bar .code { color: #64748b; font-size: 13px; }

  /* KPI GRID */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }
  .kpi {
    border-radius: 12px;
    padding: 16px;
    border: 1px solid #e2e8f0;
    text-align: center;
  }
  .kpi .val { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
  .kpi .lbl { font-size: 12px; color: #64748b; font-weight: 500; }

  /* SECTION */
  .section { margin-bottom: 20px; }
  .section h2 {
    font-size: 15px; font-weight: 700;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 2px solid #e2e8f0;
  }

  /* INSIGHT BOX */
  .insight-box {
    background: #eef2ff;
    border-radius: 12px;
    padding: 14px 16px;
    color: #4f46e5;
    font-size: 13px;
    line-height: 1.7;
  }
  .insight-row { display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 10px; }
  .insight-row span { font-size: 13px; }
  .insight-row b { color: #0f172a; }

  /* TAGS */
  .tag {
    display: inline-block;
    background: #eef2ff;
    color: #4f46e5;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
    margin: 2px;
  }

  /* TABLE */
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead tr { background: #f1f5f9; }
  th { padding: 10px 12px; text-align: right; font-weight: 600; color: #475569; font-size: 12px; }
  td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; }
  tr:last-child td { border-bottom: none; }
  tbody tr:hover { background: #f8fafc; }

  /* CHART */
  .card-chart {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 12px;
    background: white;
  }

  /* RISK BADGE */
  .risk-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    background: ${riskColor}20;
    color: ${riskColor};
  }

  /* FOOTER */
  .footer {
    margin-top: 32px;
    padding-top: 14px;
    border-top: 1px solid #e2e8f0;
    font-size: 11px;
    color: #94a3b8;
    display: flex;
    justify-content: space-between;
  }

  @media print {
    body { padding: 16px; }
    @page { margin: 12mm; }
  }
</style>
</head>
<body>

  <div class="header">
    <div style="display:flex;align-items:center;gap:16px">
      <img src="/logo.png" alt="CircleUno" style="width:120px;height:120px;object-fit:contain;border-radius:12px;background:rgba(255,255,255,0.15);padding:4px" />
      <div>
        <div style="font-size:22px;font-weight:800;color:white">דוח שבועי</div>
        <div style="font-size:16px;color:rgba(255,255,255,0.85);margin-top:4px">${patient.name || patient.code}</div>
      </div>
    </div>
    <div class="date">
      תאריך הפקה:<br/>
      <b>${new Date().toLocaleDateString("he-IL", { day:"numeric", month:"long", year:"numeric" })}</b>
    </div>
  </div>

  <div class="patient-bar">
    <div>קוד: <b>${patient.code}</b></div>
    <div>${patient.dateFrom ? patient.dateFrom + " עד " + patient.dateTo : "7 ימים אחרונים"}</div>
    <div>אירועים בתקופה: <b>${weekly.length}</b></div>
    <div>רמת סיכון: <span class="risk-badge">${insights.riskLabel}</span></div>
  </div>

  <div class="kpi-grid">
    <div class="kpi" style="border-top:3px solid #6366f1">
      <div class="val" style="color:#6366f1">${weekly.length}</div>
      <div class="lbl">אירועים השבוע</div>
    </div>
    <div class="kpi" style="border-top:3px solid ${riskColor}">
      <div class="val" style="color:${riskColor}">${avg.toFixed(1)}</div>
      <div class="lbl">חרדה ממוצעת</div>
    </div>
    <div class="kpi" style="border-top:3px solid #f59e0b">
      <div class="val" style="color:#f59e0b">${avoidPct}%</div>
      <div class="lbl">אחוז הימנעות</div>
    </div>
    <div class="kpi" style="border-top:3px solid #22c55e">
      <div class="val" style="color:#22c55e">${100-avoidPct}%</div>
      <div class="lbl">אחוז התמודדות</div>
    </div>
  </div>

  ${chartSvg ? `
  <div class="section">
    <h2>📈 מגמת חרדה - 7 ימים אחרונים</h2>
    <div class="card-chart">${chartSvg}</div>
  </div>` : ""}

  <div class="section">
    <h2>🧠 אינסייטים קליניים</h2>
    <div class="insight-row">
      <span>מגמה: <b>${insights.trendIcon} ${insights.trendLabel}</b></span>
      <span>טריגר דומיננטי: <b>${insights.dominantTrigger}</b></span>
      <span>חרדה ממוצעת כוללת: <b>${insights.overallAvg}</b></span>
    </div>
    <div class="insight-box">🧾 ${insights.note}</div>
  </div>

  ${topTriggers.length > 0 ? `
  <div class="section">
    <h2>🎯 טריגרים השבוע</h2>
    <div>${triggersHtml}</div>
  </div>` : ""}

  ${weekly.length > 0 ? `
  <div class="section">
    <h2>📋 רשימת אירועים</h2>
    <table>
      <thead>
        <tr>
          <th>תאריך</th>
          <th>טריגר</th>
          <th>חרדה</th>
          <th>תגובה</th>
          <th>הערות</th>
        </tr>
      </thead>
      <tbody>${eventsRows}</tbody>
    </table>
  </div>` : `<p style="color:#94a3b8;text-align:center;padding:24px">לא נרשמו אירועים בשבוע האחרון</p>`}

  <div class="footer">
    <span>CircleUno · דוח קליני שבועי</span>
    <span>${patient.code} · ${new Date().toLocaleDateString("he-IL")}</span>
  </div>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
}
