import { useState, useRef, useEffect } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

const EXERCISE_STEPS = [
  {
    id: "welcome",
    type: "info",
    title: "כלי תרגול",
    text: "כלי זה יוביל אותך דרך תרגיל קצר של 3–5 דקות שיעזור לך להתמודד עם הרגע הזה. אין כאן תשובות נכונות או שגויות.",
    btn: "מוכן, בואו נתחיל",
  },
  {
    id: "breathing",
    type: "exercise",
    title: "נשימה מווסתת",
    text: "נתחיל בנשימה עמוקה. שאף אוויר לאט למשך 4 שניות, עצור 4 שניות, ונשוף ל-6 שניות. חזור על זה 3 פעמים.",
    duration: 30,
    btn: "סיימתי את הנשימות",
  },
  {
    id: "acknowledge",
    type: "input",
    title: "זיהוי התחושה",
    text: "בלי לנסות לשנות כלום — תאר במשפט אחד מה אתה מרגיש עכשיו.",
    placeholder: "לדוגמה: אני מרגיש חרדה לגבי...",
  },
  {
    id: "urge",
    type: "choice",
    title: "הדחף",
    text: "האם יש לך דחף לבצע פעולה / טקס / להימנע ממשהו?",
    options: ["כן, יש דחף חזק", "כן, קצת", "לא ממש"],
  },
  {
    id: "erp",
    type: "exercise",
    title: "ישיבה עם אי-הנוחות",
    text: "עכשיו — בלי לבצע שום פעולה — פשוט שב עם התחושה הזו למשך דקה. שים לב לה, אל תנסה להדחיק. אי-הנוחות תעבור.",
    duration: 60,
    btn: "עמדתי בזה ✊",
  },
  {
    id: "after",
    type: "slider",
    title: "רמת חרדה עכשיו",
    text: "על סקלה של 0–100, כמה חרדה אתה מרגיש כרגע (אחרי התרגיל)?",
  },
  {
    id: "reflection",
    type: "input",
    title: "רפלקציה קצרה",
    text: "במשפט אחד — מה שמת לב אליו במהלך התרגיל?",
    placeholder: "לדוגמה: שמתי לב שהחרדה ירדה קצת...",
  },
];

export default function CopingTool({ patientCode, therapistId, onBack }) {
  const [stepIdx, setStepIdx]     = useState(0);
  const [answers, setAnswers]     = useState({});
  const [textVal, setTextVal]     = useState("");
  const [sliderVal, setSliderVal] = useState(50);
  const [timer, setTimer]         = useState(null);
  const [timeLeft, setTimeLeft]   = useState(0);
  const [done, setDone]           = useState(false);
  const [saving, setSaving]       = useState(false);
  const intervalRef = useRef(null);

  const step = EXERCISE_STEPS[stepIdx];

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  const startTimer = (seconds) => {
    setTimeLeft(seconds);
    setTimer("running");
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setTimer("done");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const next = (value) => {
    const newAnswers = { ...answers, [step.id]: value ?? answers[step.id] };
    setAnswers(newAnswers);
    setTextVal("");
    setSliderVal(50);
    clearInterval(intervalRef.current);
    setTimer(null);

    if (stepIdx < EXERCISE_STEPS.length - 1) {
      setStepIdx(i => i + 1);
    } else {
      finishExercise(newAnswers);
    }
  };

  const finishExercise = async (finalAnswers) => {
    setSaving(true);
    console.log("Saving coping session:", { patientCode, therapistId, finalAnswers });
    try {
      const result = await addDoc(collection(db, "copingSessions"), {
        patientCode,
        therapistId,
        timestamp: new Date().toISOString(),
        feeling: finalAnswers.acknowledge || "",
        urge: finalAnswers.urge || "",
        anxietyAfter: finalAnswers.after ?? 50,
        reflection: finalAnswers.reflection || "",
      });
      console.log("Coping session saved:", result.id);
    } catch (e) {
      console.error("Failed to save coping session:", e);
    }
    setSaving(false);
    setDone(true);
  };

  const anxietyColor = sliderVal >= 70 ? "#ef4444" : sliderVal >= 40 ? "#f59e0b" : "#22c55e";
  const progress = (stepIdx / (EXERCISE_STEPS.length - 1)) * 100;

  // DONE screen
  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: "#f1f5f9", direction: "rtl", display: "flex", flexDirection: "column" }}>
        <div className="topbar">
          <button onClick={onBack} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13 }}>➡ חזרה</button>
          <span style={{ fontWeight: 600, fontSize: 14 }}>כלי תרגול</span>
          <span />
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🌟</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>כל הכבוד!</h2>
            <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
              השלמת את תרגיל ההתמודדות. המידע נשלח למטפל שלך.
            </p>
            <div className="card" style={{ textAlign: "right", marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>סיכום התרגיל</div>
              <div style={{ fontSize: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                <div>תחושה: <b>{answers.acknowledge || "—"}</b></div>
                <div>דחף: <b>{answers.urge || "—"}</b></div>
                <div>חרדה אחרי: <b style={{ color: answers.after >= 70 ? "#ef4444" : answers.after >= 40 ? "#f59e0b" : "#22c55e" }}>{answers.after}</b></div>
                <div>רפלקציה: <b>{answers.reflection || "—"}</b></div>
              </div>
            </div>
            <button className="btn-primary" onClick={onBack}>סיום</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", direction: "rtl", display: "flex", flexDirection: "column" }}>
      <div className="topbar">
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13 }}>➡ חזרה</button>
        <span style={{ fontWeight: 600, fontSize: 14 }}>כלי תרגול</span>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>{stepIdx + 1} / {EXERCISE_STEPS.length}</span>
      </div>

      <div style={{ height: 3, background: "#e2e8f0" }}>
        <div style={{ height: 3, background: "#6366f1", width: `${progress}%`, transition: "width 0.4s" }} />
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ maxWidth: 480, width: "100%" }}>
          <div className="card">
            <div style={{ fontSize: 13, color: "#6366f1", fontWeight: 600, marginBottom: 8 }}>{step.title}</div>
            <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 20, color: "#334155" }}>{step.text}</p>

            {step.type === "info" && (
              <button className="btn-primary" onClick={() => next()}>{step.btn}</button>
            )}

            {step.type === "exercise" && (
              <>
                {!timer && (
                  <button onClick={() => startTimer(step.duration)} style={{
                    width: "100%", padding: 12, borderRadius: 12, border: "none",
                    background: "#eef2ff", color: "#6366f1", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 10,
                  }}>
                    ▶ התחל טיימר ({step.duration} שניות)
                  </button>
                )}
                {timer === "running" && (
                  <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 52, fontWeight: 800, color: "#6366f1" }}>{timeLeft}</div>
                    <div style={{ fontSize: 13, color: "#94a3b8" }}>שניות נותרו</div>
                  </div>
                )}
                <button className="btn-primary" onClick={() => next()} disabled={timer === "running"}
                  style={{ opacity: timer === "running" ? 0.4 : 1 }}>
                  {step.btn}
                </button>
              </>
            )}

            {step.type === "input" && (
              <>
                <textarea rows={3} value={textVal} onChange={e => setTextVal(e.target.value)}
                  placeholder={step.placeholder} style={{ resize: "none", marginBottom: 12 }} autoFocus />
                <button className="btn-primary" onClick={() => next(textVal)} disabled={!textVal.trim()}
                  style={{ opacity: !textVal.trim() ? 0.5 : 1 }}>
                  המשך ←
                </button>
              </>
            )}

            {step.type === "choice" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {step.options.map(opt => (
                  <button key={opt} onClick={() => next(opt)} style={{
                    padding: "12px 16px", borderRadius: 12, border: "1.5px solid #e2e8f0",
                    background: "white", cursor: "pointer", textAlign: "right", fontSize: 14, fontWeight: 500,
                  }}>{opt}</button>
                ))}
              </div>
            )}

            {step.type === "slider" && (
              <>
                <div style={{ textAlign: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 48, fontWeight: 800, color: anxietyColor }}>{sliderVal}</span>
                  <span style={{ color: "#94a3b8", fontSize: 14 }}> / 100</span>
                </div>
                <input type="range" min="0" max="100" value={sliderVal}
                  onChange={e => setSliderVal(Number(e.target.value))}
                  style={{ width: "100%", accentColor: anxietyColor, border: "none", background: "transparent", padding: 0, marginBottom: 16 }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>
                  <span>0 – ללא חרדה</span><span>100 – גבוה מאוד</span>
                </div>
                <button className="btn-primary" onClick={() => next(sliderVal)}>המשך ←</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
