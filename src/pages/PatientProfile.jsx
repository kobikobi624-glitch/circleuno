import { useMemo, useState, useEffect } from "react";
import { doc, updateDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { getClinicalInsights } from "../utils/clinicalInsights";
import { generateWeeklyReport } from "../utils/generateWeeklyReport";

export default function PatientProfile({ patient, entries, onBack }) {
  if (!patient) return null;

  const [copingEnabled, setCopingEnabled] = useState(patient.copingToolEnabled !== false);
  const [copingSessions, setCopingSessions] = useState([]);
  const [newCode, setNewCode] = useState(null);
  const [generatingCode, setGeneratingCode] = useState(false);

  // Date range state
  const defaultFrom = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  };
  const defaultTo = () => new Date().toISOString().slice(0, 10);

  const [dateFrom, setDateFrom] = useState(defaultFrom());
  const [dateTo, setDateTo] = useState(defaultTo());

  useEffect(() => {
    getDocs(query(collection(db, "copingSessions"), where("patientCode", "==", patient.code)))
      .then(snap => setCopingSessions(
        snap.docs.map(d => ({ id: d.id, ...d.data() }))
          .sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))
      ));
  }, [patient.code]);

  const toggleCoping = async () => {
    const newVal = !copingEnabled;
    setCopingEnabled(newVal);
    await updateDoc(doc(db, "patients", patient.id), { copingToolEnabled: newVal });
  };

  const generateNewCode = async () => {
    if (!confirm("ליצור קוד כניסה חדש? הקוד הישן יפסיק לעבוד מיידית.")) return;
    setGeneratingCode(true);
    try {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let code, attempts = 0;
      while (attempts < 10) {
        code = "CU-";
        for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
        const existing = await getDocs(query(collection(db, "patients"), where("code", "==", code)));
        if (existing.empty) break;
        attempts++;
      }
      const batch = writeBatch(db);
      batch.update(doc(db, "patients", patient.id), { code });
      const [entriesSnap, copingSnap] = await Promise.all([
        getDocs(query(collection(db, "entries"), where("patientCode", "==", patient.code))),
        getDocs(query(collection(db, "copingSessions"), where("patientCode", "==", patient.code))),
      ]);
      entriesSnap.docs.forEach(d => batch.update(d.ref, { patientCode: code }));
      copingSnap.docs.forEach(d => batch.update(d.ref, { patientCode: code }));
      await batch.commit();
      setNewCode(code);
    } catch { alert("שגיאה ביצירת קוד חדש — נסה שוב"); }
    setGeneratingCode(false);
  };

  // Filter entries by date range
  const filteredEntries = useMemo(() => {
    const from = new Date(dateFrom + "T00:00:00");
    const to   = new Date(dateTo   + "T23:59:59");
    return entries.filter(e => {
      const t = new Date(e.timestamp);
      return t >= from && t <= to;
    }).sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [entries, dateFrom, dateTo]);

  const allSorted = [...entries].sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
  const patientWithFiltered = { ...patient, entries: filteredEntries };
  const insights = getClinicalInsights(patientWithFiltered);
  const highRiskEvents = filteredEntries.filter(e => e.anxiety >= 70);

  const chartData = useMemo(() => filteredEntries.map(e => ({
    time: new Date(e.timestamp).toLocaleDateString("he-IL", { month: "short", day: "numeric" }),
    anxiety: e.anxiety,
  })), [filteredEntries]);

  const riskBadge = {
    high:   { bg: "#fee2e2", color: "#991b1b", label: "סיכון גבוה" },
    medium: { bg: "#fef3c7", color: "#92400e", label: "סיכון בינוני" },
    low:    { bg: "#dcfce7", color: "#166534", label: "סיכון נמוך" },
  }[insights.risk];

  return (
    <div style={{ padding: "16px 20px", maxWidth: 900, margin: "0 auto", direction: "rtl" }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button onClick={onBack} style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 13 }}>➡ חזרה</button>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{patient.name || patient.code}</h2>
          <div style={{ fontSize: 13, color: "#64748b" }}>קוד: {patient.code}</div>
        </div>
        <span style={{ marginRight: "auto", padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: riskBadge.bg, color: riskBadge.color }}>
          {riskBadge.label}
        </span>
      </div>

      {/* DATE RANGE FILTER */}
      <div className="card" style={{ marginBottom: 14, background: "#f8fafc" }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "#334155" }}>📅 טווח תאריכים לתצוגה ולדוח</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ color: "#64748b" }}>מ-</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              style={{ width: "auto", padding: "8px 10px", fontSize: 13 }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ color: "#64748b" }}>עד-</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              style={{ width: "auto", padding: "8px 10px", fontSize: 13 }}
            />
          </div>
          <div style={{ marginRight: "auto", fontSize: 13, color: "#6366f1", fontWeight: 600 }}>
            {filteredEntries.length} אירועים בטווח
          </div>
        </div>
        {/* Quick range buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {[
            { label: "שבוע אחרון", days: 7 },
            { label: "חודש אחרון", days: 30 },
            { label: "3 חודשים", days: 90 },
            { label: "הכל", days: null },
          ].map(opt => (
            <button
              key={opt.label}
              onClick={() => {
                const to = new Date();
                setDateTo(to.toISOString().slice(0, 10));
                if (opt.days) {
                  const from = new Date();
                  from.setDate(from.getDate() - opt.days);
                  setDateFrom(from.toISOString().slice(0, 10));
                } else {
                  setDateFrom(allSorted[0]
                    ? new Date(allSorted[0].timestamp).toISOString().slice(0, 10)
                    : defaultFrom());
                }
              }}
              style={{
                padding: "5px 12px", borderRadius: 999, border: "1px solid #e2e8f0",
                background: "white", fontSize: 12, cursor: "pointer", color: "#64748b",
                fontFamily: "inherit",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", gap: 10, marginBottom: 16 }}>
        {[
          { label: "אירועים בטווח", value: filteredEntries.length,          color: "#6366f1" },
          { label: "חרדה ממוצעת",  value: insights.overallAvg,              color: insights.riskColor },
          { label: "הימנעות",       value: `${insights.avoidanceRate}%`,     color: "#f59e0b" },
          { label: "התמודדות",      value: `${insights.complianceRate}%`,    color: "#22c55e" },
          { label: "מגמה",          value: `${insights.trendIcon} ${insights.trendLabel}`, color: "#6366f1" },
        ].map(k => (
          <div key={k.label} style={{ background: "white", borderRadius: 12, padding: "12px 14px", border: "1px solid #e2e8f0", borderTop: `3px solid ${k.color}` }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color, marginTop: 4 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* HIGH RISK */}
      {highRiskEvents.length > 0 && (
        <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 12, padding: "10px 14px", marginBottom: 14, color: "#991b1b", fontWeight: 600, fontSize: 14 }}>
          🚨 נרשמו {highRiskEvents.length} אירועי חרדה גבוהה (≥70) בטווח זה
        </div>
      )}

      {/* CHART */}
      <div className="card" style={{ marginBottom: 14 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>📈 מגמת חרדה — {dateFrom} עד {dateTo}</h3>
        {chartData.length < 2 ? (
          <p style={{ color: "#94a3b8", fontSize: 14 }}>אין מספיק נתונים בטווח זה (נדרשים לפחות 2 אירועים)</p>
        ) : (
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis domain={[0,100]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 13 }} formatter={v => [v, "חרדה"]} />
                <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" />
                <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="anxiety" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* INSIGHTS */}
      <div className="card" style={{ marginBottom: 14 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>🧠 אינסייטים קליניים</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 14 }}>
          <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>מגמה</div>
            <div style={{ fontWeight: 700, marginTop: 2 }}>{insights.trendIcon} {insights.trendLabel}</div>
          </div>
          <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>טריגר דומיננטי</div>
            <div style={{ fontWeight: 700, marginTop: 2 }}>🎯 {insights.dominantTrigger}</div>
          </div>
        </div>
        <div style={{ marginTop: 10, padding: "10px 12px", background: "#eef2ff", borderRadius: 10, fontSize: 13, color: "#4f46e5", lineHeight: 1.6 }}>
          🧾 {insights.note}
        </div>
      </div>

      {/* COPING TOGGLE */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: 15 }}>🧘 כלי תרגול</h3>
            <div style={{ fontSize: 12, color: "#64748b" }}>הפעל/כבה את כלי התרגול עבור מטופל זה</div>
          </div>
          <div onClick={toggleCoping} style={{
            width: 48, height: 26, borderRadius: 999, cursor: "pointer",
            background: copingEnabled ? "#6366f1" : "#e2e8f0", position: "relative", transition: "background 0.2s",
          }}>
            <div style={{
              position: "absolute", top: 3,
              right: copingEnabled ? 3 : 23,
              width: 20, height: 20, borderRadius: "50%", background: "white",
              transition: "right 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }} />
          </div>
        </div>
      </div>

      {/* COPING SESSIONS */}
      {copingSessions.length > 0 && (
        <div className="card" style={{ marginBottom: 14 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>🧘 סיכומי תרגולים ({copingSessions.length})</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {copingSessions.slice(0, 10).map(s => (
              <div key={s.id} style={{ padding: "10px 12px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>{new Date(s.timestamp).toLocaleString("he-IL")}</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <span><b>תחושה:</b> {s.feeling || "—"}</span>
                  <span><b>דחף:</b> {s.urge || "—"}</span>
                  <span><b>חרדה אחרי:</b> <span style={{ fontWeight: 700, color: s.anxietyAfter >= 70 ? "#ef4444" : s.anxietyAfter >= 40 ? "#f59e0b" : "#22c55e" }}>{s.anxietyAfter}</span></span>
                </div>
                {s.reflection && <div style={{ marginTop: 6, color: "#475569" }}>💬 {s.reflection}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEW CODE */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: 15 }}>🔑 קוד כניסה</h3>
            <div style={{ fontSize: 12, color: "#64748b" }}>קוד נוכחי: <b style={{ letterSpacing: 1 }}>{newCode || patient.code}</b></div>
          </div>
          <button onClick={generateNewCode} disabled={generatingCode} style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #6366f1", background: "white", color: "#6366f1", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            {generatingCode ? "יוצר..." : "🔄 צור קוד חדש"}
          </button>
        </div>
        {newCode && (
          <div style={{ marginTop: 12, padding: "12px 14px", background: "#dcfce7", borderRadius: 10, border: "1px solid #bbf7d0" }}>
            <div style={{ fontSize: 13, color: "#166534", fontWeight: 600, marginBottom: 4 }}>✅ קוד חדש נוצר בהצלחה!</div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 2, color: "#166534" }}>{newCode}</div>
            <div style={{ fontSize: 12, color: "#4ade80", marginTop: 4 }}>שתף את הקוד החדש עם המטופל — הקוד הישן בוטל</div>
          </div>
        )}
      </div>

      {/* PDF */}
      <div className="card" style={{ marginBottom: 14 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 15 }}>📄 הורדת דוח</h3>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>
          הדוח יכלול אירועים מ-{dateFrom} עד {dateTo} ({filteredEntries.length} אירועים)
        </div>
        <button
          onClick={() => generateWeeklyReport({ ...patientWithFiltered, dateFrom, dateTo })}
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "none", background: "#0f172a", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
        >
          ⬇ הורד דו״ח PDF
        </button>
      </div>

      {/* TIMELINE */}
      <div className="card">
        <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>📅 היסטוריית אירועים בטווח</h3>
        {filteredEntries.length === 0 && <p style={{ color: "#94a3b8", fontSize: 14 }}>אין אירועים בטווח התאריכים שנבחר</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[...filteredEntries].reverse().map(e => (
            <div key={e.id} style={{
              padding: "10px 14px", borderRadius: 12, background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRight: `4px solid ${e.anxiety>=70?"#ef4444":e.anxiety>=40?"#f59e0b":"#22c55e"}`,
            }}>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>{new Date(e.timestamp).toLocaleString("he-IL")}</div>
              <div style={{ display: "flex", gap: 12, fontSize: 13, flexWrap: "wrap" }}>
                <span><b>טריגר:</b> {e.trigger || "—"}</span>
                <span><b>חרדה:</b> <span style={{ fontWeight: 700, color: e.anxiety>=70?"#ef4444":e.anxiety>=40?"#f59e0b":"#22c55e" }}>{e.anxiety}</span></span>
                <span><b>תגובה:</b> {e.response==="no"?"נמנע":e.response==="partial"?"חלקי":"ביצע"}</span>
              </div>
              {e.notes && <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>📝 {e.notes}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
