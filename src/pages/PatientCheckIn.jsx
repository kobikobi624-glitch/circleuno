import { useEffect, useState } from "react";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import CopingTool from "./CopingTool";
import PatientHelpPage from "./PatientHelpPage";

export default function PatientCheckIn({ patientCode, onLogout }) {
  const [patientData, setPatientData] = useState(null);
  const [trigger, setTrigger]   = useState("");
  const [anxiety, setAnxiety]   = useState(40);
  const [response, setResponse] = useState("no");
  const [notes, setNotes]       = useState("");
  const [saving, setSaving]     = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [showCoping, setShowCoping] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    getDocs(query(collection(db, "patients"), where("code", "==", patientCode)))
      .then(snap => { if (!snap.empty) setPatientData(snap.docs[0].data()); });
  }, [patientCode]);

  const saveEntry = async () => {
    if (!trigger.trim()) { alert("נא להזין טריגר"); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, "entries"), {
        patientCode,
        therapistId: patientData?.therapistId,
        timestamp: new Date().toISOString(),
        trigger: trigger.trim(),
        anxiety,
        response,
        notes: notes.trim(),
      });
      setTrigger(""); setAnxiety(40); setResponse("no"); setNotes("");
      setSavedMsg("✅ הדיווח נשמר בהצלחה");
      setTimeout(() => setSavedMsg(""), 2500);
    } catch { alert("שמירה נכשלה — נסה שוב"); }
    setSaving(false);
  };

  if (showHelp) {
    return <PatientHelpPage onBack={() => setShowHelp(false)} />;
  }

  if (showCoping) {
    return (
      <CopingTool
        patientCode={patientCode}
        therapistId={patientData?.therapistId}
        onBack={() => setShowCoping(false)}
      />
    );
  }

  const anxietyColor = anxiety >= 70 ? "#ef4444" : anxiety >= 40 ? "#f59e0b" : "#22c55e";
  const copingEnabled = patientData?.copingToolEnabled !== false; // default enabled unless therapist disables

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", direction: "rtl" }}>
      <div className="topbar">
        <div style={{ fontWeight: 600, fontSize: 14 }}>👤 {patientData?.name || patientCode}</div>
        <button onClick={() => setShowHelp(true)} style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>❓ עזרה</button>
        <button className="btn-danger" onClick={onLogout}>יציאה</button>
      </div>

      <div style={{ padding: 16, maxWidth: 480, margin: "0 auto" }}>

        {/* Coping Tool Banner — only if enabled by therapist */}
        {copingEnabled && (
          <div
            onClick={() => setShowCoping(true)}
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              borderRadius: 16, padding: "14px 16px", marginBottom: 16,
              cursor: "pointer", color: "white", display: "flex", alignItems: "center", gap: 12,
            }}
          >
            <span style={{ fontSize: 28 }}>🧘</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>תרגיל התמודדות</div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>תרגיל מובנה של 3–5 דקות לרגע הקשה</div>
            </div>
            <span style={{ marginRight: "auto", fontSize: 18 }}>←</span>
          </div>
        )}

        <h2 style={{ fontSize: 20, marginBottom: 4 }}>דיווח אירוע</h2>
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>רשום מה קורה לך עכשיו</p>

        <div className="card" style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>🎯 מה היה הטריגר?</label>
          <input value={trigger} onChange={e => setTrigger(e.target.value)} placeholder="תאר מה קרה..." />
        </div>

        <div className="card" style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
            📊 רמת חרדה: <span style={{ color: anxietyColor, fontSize: 22, fontWeight: 800 }}>{anxiety}</span>
            <span style={{ color: "#94a3b8", fontWeight: 400, fontSize: 12 }}> / 100</span>
          </label>
          <input type="range" min="0" max="100" value={anxiety} onChange={e => setAnxiety(Number(e.target.value))}
            style={{ width: "100%", accentColor: anxietyColor, border: "none", background: "transparent", padding: 0 }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
            <span>0 – ללא חרדה</span><span>50 – בינוני</span><span>100 – גבוה מאוד</span>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>🔄 איך הגבת?</label>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { value: "yes",     label: "ביצעתי התנהגות", color: "#ef4444" },
              { value: "partial", label: "חלקית",           color: "#f59e0b" },
              { value: "no",      label: "עמדתי בזה ✊",   color: "#22c55e" },
            ].map(opt => (
              <button key={opt.value} onClick={() => setResponse(opt.value)} style={{
                flex: 1, padding: "10px 6px", borderRadius: 10, cursor: "pointer", fontSize: 12,
                border: `2px solid ${response === opt.value ? opt.color : "#e2e8f0"}`,
                background: response === opt.value ? opt.color + "15" : "white",
                color: response === opt.value ? opt.color : "#64748b",
                fontWeight: response === opt.value ? 700 : 400,
              }}>{opt.label}</button>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
            📝 הערות <span style={{ color: "#94a3b8", fontWeight: 400 }}>(אופציונלי)</span>
          </label>
          <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="מחשבות, הקשרים, כל מה שחשוב לך לרשום..." style={{ resize: "none" }} />
        </div>

        <button onClick={saveEntry} disabled={saving} style={{
          width: "100%", padding: 14, borderRadius: 12, border: "none",
          background: "#22c55e", color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer",
        }}>
          {saving ? "שומר..." : "💾 שמור דיווח"}
        </button>

        {savedMsg && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#dcfce7", color: "#166534", textAlign: "center", fontSize: 14, fontWeight: 600 }}>
            {savedMsg}
          </div>
        )}
      </div>
    </div>
  );
}
