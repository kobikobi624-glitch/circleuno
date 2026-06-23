import { useState } from "react";

const ITEMS = [
  { q: "איך מדווחים אירוע?", a: "לחץ על 'דיווח אירוע' → מלא מה היה הטריגר → הזז את הסליידר לרמת החרדה → בחר איך הגבת → הוסף הערות אם רוצה → לחץ 'שמור דיווח'." },
  { q: "מה זה רמת חרדה?", a: "סקלה של 0–100 שמייצגת את עוצמת החרדה שאתה מרגיש. 0 = ללא חרדה, 50 = בינוני, 100 = גבוה מאוד." },
  { q: "מה זה כלי התרגול?", a: "תרגיל מובנה של כ-5 דקות שמוביל אותך דרך נשימה, זיהוי תחושה, ישיבה עם אי-נוחות ורפלקציה. לחץ על הבאנר הסגול 'תרגיל התמודדות' כדי להתחיל." },
  { q: "האם המטפל רואה את הדיווחים שלי?", a: "כן — כל האירועים וסיכומי התרגולים מגיעים ישירות למטפל שלך ועוזרים לו להבין מה קורה בין הפגישות." },
  { q: "מה ההבדל בין 'ביצעתי התנהגות' ל'עמדתי בזה'?", a: "'ביצעתי התנהגות' — ביצעת טקס או נמנעת מהמצב. 'עמדתי בזה' — הצלחת לא לבצע את הפעולה למרות הדחף. 'חלקית' — משהו באמצע." },
  { q: "האם חייבים למלא הערות?", a: "לא — שדה ההערות הוא אופציונלי. אבל לפעמים כתיבה עוזרת לעבד את החוויה." },
  { q: "שכחתי את הקוד שלי", a: "פנה למטפל שלך — הוא יצור לך קוד חדש." },
];

export default function PatientHelpPage({ onBack }) {
  const [openItem, setOpenItem] = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", direction: "rtl" }}>
      <div className="topbar">
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13 }}>
          ⬅ חזרה
        </button>
        <span style={{ fontWeight: 700, fontSize: 15 }}>❓ עזרה</span>
        <span />
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px 20px" }}>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>❓</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>איך אפשר לעזור?</h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>תשובות לשאלות נפוצות</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ITEMS.map((item, i) => (
            <div
              key={i}
              className="card"
              style={{ cursor: "pointer" }}
              onClick={() => setOpenItem(openItem === i ? null : i)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{item.q}</span>
                <span style={{ color: "#6366f1", fontSize: 18, transition: "transform 0.15s", transform: openItem === i ? "rotate(45deg)" : "rotate(0)" }}>+</span>
              </div>
              {openItem === i && (
                <div style={{ marginTop: 10, padding: "10px 12px", background: "#eef2ff", borderRadius: 10, fontSize: 13, color: "#334155", lineHeight: 1.7 }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
