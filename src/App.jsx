import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import TherapistDashboard from "./pages/TherapistDashboard";
import PatientCheckIn from "./pages/PatientCheckIn";
import TherapistLogin from "./pages/TherapistLogin";
import TherapistRegister from "./pages/TherapistRegister";
import PatientLogin from "./pages/PatientLogin";

export default function App() {
  const [therapist, setTherapist] = useState(undefined);
  const [screen, setScreen] = useState("select");
  const [patientCode, setPatientCode] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setTherapist(user || null);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const code = localStorage.getItem("circleuno_patientCode");
    if (code) setPatientCode(code);
  }, []);

  if (therapist === undefined) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" }}>
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <div>טוען...</div>
        </div>
      </div>
    );
  }

  if (therapist) {
    return <TherapistDashboard therapist={therapist} onLogout={() => auth.signOut()} />;
  }

  if (patientCode) {
    return (
      <PatientCheckIn
        patientCode={patientCode}
        onLogout={() => {
          localStorage.removeItem("circleuno_patientCode");
          setPatientCode(null);
          setScreen("select");
        }}
      />
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <img src="/logo.png" alt="CircleUno" style={{ width: 110, height: 110, objectFit: "contain", margin: "0 auto 4px", display: "block" }} />
        <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 16px" }}>Clinical Monitoring Platform</p>

        <div className="login-description card">
          <p className="login-text">
            המערכת מאפשרת למטפלים לעקוב בזמן אמת אחרי מה שקורה בין הפגישות —
            רמות חרדה, טריגרים ודפוסי תגובה של המטופל לאורך זמן.
          </p>
          <p className="login-subtext">
            במקום להסתמך רק על דיווח רטרוספקטיבי, מתקבלת תמונה רציפה שמאפשרת
            הבנה מדויקת יותר של התהליך הטיפולי.
          </p>
        </div>

        {screen === "select" && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <button className="btn-primary" style={{ fontSize: 15, padding: 13 }} onClick={() => setScreen("therapistLogin")}>
              🧑‍⚕️ כניסת מטפלים
            </button>
            <button className="card" style={{ fontSize: 15, padding: 13, cursor: "pointer", textAlign: "center", fontFamily: "inherit" }} onClick={() => setScreen("patient")}>
              👤 כניסת מטופלים
            </button>
          </div>
        )}

        {screen === "therapistLogin" && (
          <TherapistLogin onRegister={() => setScreen("therapistRegister")} onBack={() => setScreen("select")} />
        )}
        {screen === "therapistRegister" && (
          <TherapistRegister onBack={() => setScreen("therapistLogin")} />
        )}
        {screen === "patient" && (
          <PatientLogin onLogin={(code) => { localStorage.setItem("circleuno_patientCode", code); setPatientCode(code); }} onBack={() => setScreen("select")} />
        )}
      </div>
    </div>
  );
}
