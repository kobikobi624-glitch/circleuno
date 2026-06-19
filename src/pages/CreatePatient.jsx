import { useState } from "react";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing chars like 0,O,1,I
  let code = "CU-";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function CreatePatient({ therapistId }) {
  const [name, setName]       = useState("");
  const [saved, setSaved]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const createPatient = async () => {
    if (!name.trim()) return;
    setLoading(true); setError("");

    // Generate a unique code
    let newCode, attempts = 0;
    while (attempts < 10) {
      newCode = generateCode();
      const existing = await getDocs(query(collection(db, "patients"), where("code", "==", newCode)));
      if (existing.empty) break;
      attempts++;
    }

    try {
      await addDoc(collection(db, "patients"), {
        name: name.trim(),
        code: newCode,
        therapistId,
        createdAt: new Date().toISOString(),
      });
      setSaved({ name: name.trim(), code: newCode });
      setName("");
      setTimeout(() => setSaved(null), 10000);
    } catch {
      setError("יצירת המטופל נכשלה — נסה שוב");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", direction: "rtl" }}>
      <h2 style={{ fontSize: 20, marginBottom: 6 }}>➕ יצירת מטופל</h2>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
        צור מטופל חדש — קוד ייחודי ואקראי ייווצר אוטומטית
      </p>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>שם המטופל *</label>
          <input
            placeholder="לדוגמה: דניאל כהן"
            value={name}
            onChange={e => { setName(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && createPatient()}
          />
        </div>
        {error && <div style={{ color: "#ef4444", fontSize: 13 }}>{error}</div>}
        <button className="btn-primary" onClick={createPatient} disabled={loading || !name.trim()} style={{ marginTop: 4 }}>
          {loading ? "יוצר..." : "➕ צור מטופל"}
        </button>
      </div>

      {saved && (
        <div style={{ marginTop: 16, padding: "16px", borderRadius: 14, background: "#dcfce7", border: "1px solid #bbf7d0", color: "#166534" }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>✅ המטופל נוצר בהצלחה!</div>
          <div style={{ fontSize: 13, marginBottom: 8 }}>שם: <b>{saved.name}</b></div>
          <div style={{ fontSize: 13, marginBottom: 4 }}>קוד כניסה:</div>
          <div style={{
            fontSize: 22, fontWeight: 800, letterSpacing: 2,
            background: "white", padding: "10px 14px", borderRadius: 10,
            border: "1px solid #bbf7d0", textAlign: "center",
          }}>
            {saved.code}
          </div>
        </div>
      )}
    </div>
  );
}
