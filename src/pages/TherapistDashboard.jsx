import { useState, useEffect, useCallback } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import Header from "../components/Header";
import KPICards from "../components/KPICards";
import AttentionPanel from "../components/AttentionPanel";
import NotificationBell from "../components/NotificationBell";
import Patients from "./Patients";
import PatientProfile from "./PatientProfile";
import CreatePatient from "./CreatePatient";
import { generateAlertsFromData } from "../utils/notifications";
import HelpPage from "./HelpPage";

export default function TherapistDashboard({ therapist, onLogout }) {
  const [screen, setScreen] = useState("dashboard");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [entries, setEntries] = useState([]);
  const [notifRefresh, setNotifRefresh] = useState(0);

  useEffect(() => {
    const q = query(collection(db, "patients"), where("therapistId", "==", therapist.uid));
    return onSnapshot(q, snap => setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [therapist.uid]);

  useEffect(() => {
    const q = query(collection(db, "entries"), where("therapistId", "==", therapist.uid), orderBy("timestamp", "desc"));
    return onSnapshot(q, snap => setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [therapist.uid]);

  const stats = useCallback(() => {
    let red = 0, yellow = 0, green = 0;
    const enriched = patients.map(p => {
      const pe = entries.filter(e => e.patientCode === p.code);
      const sorted = [...pe].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
      const recent = sorted.slice(0, 5);
      const recentAvg = recent.length > 0 ? recent.reduce((s,e) => s + e.anxiety, 0) / recent.length : 0;
      const prevAvg = sorted.slice(5,10).reduce((s,e) => s + e.anxiety, 0) / (sorted.slice(5,10).length || 1);
      if (recentAvg >= 65) red++;
      else if (recentAvg >= 40) yellow++;
      else green++;
      return { ...p, anxiety: Math.round(recentAvg), prevAnxiety: Math.round(prevAvg) };
    });
    const attention = enriched.filter(p => p.anxiety >= 65 || (p.anxiety - p.prevAnxiety) > 10);
    const newAlerts = generateAlertsFromData(patients, entries);
    if (newAlerts > 0) setNotifRefresh(r => r + 1);
    return { total: patients.length, red, yellow, green, attention };
  }, [patients, entries]);

  const s = stats();

  return (
    <div>
      <div className="topbar">
        <div style={{ display: "flex", gap: 4 }}>
          <button className={`nav-btn ${screen === "dashboard" ? "active" : ""}`} onClick={() => setScreen("dashboard")}>📊 דשבורד</button>
          <button className={`nav-btn ${screen === "patients" ? "active" : ""}`} onClick={() => setScreen("patients")}>👥 מטופלים</button>
          <button className={`nav-btn ${screen === "create" ? "active" : ""}`} onClick={() => setScreen("create")}>➕ מטופל חדש</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "#64748b" }}>{therapist.displayName || therapist.email}</span>
          <NotificationBell refresh={notifRefresh} />
          <button className="btn-danger" onClick={onLogout}>יציאה</button>
        </div>
      </div>

      {screen === "dashboard" && (
        <div style={{ padding: "16px 20px" }}>
          <Header patientCount={s.total} therapistName={therapist.displayName} />
          <AttentionPanel patients={s.attention} />
          <KPICards totalPatients={s.total} redPatients={s.red} yellowPatients={s.yellow} greenPatients={s.green} />
        </div>
      )}
      {screen === "create" && <div style={{ padding: "16px 20px" }}><CreatePatient therapistId={therapist.uid} /></div>}
      {screen === "patients" && (
        <Patients patients={patients} entries={entries} therapistId={therapist.uid} onSelect={(p) => { setSelectedPatient(p); setScreen("profile"); }} />
      )}
      {screen === "help" && (
        <HelpPage onBack={() => setScreen("dashboard")} />
      )}

      {screen === "profile" && (
        <PatientProfile patient={selectedPatient} entries={entries.filter(e => e.patientCode === selectedPatient?.code)} onBack={() => setScreen("patients")} />
      )}
    </div>
  );
}
