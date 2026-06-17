import { useState } from "react";

const SECTIONS = [
  {
    id: "therapist",
    icon: "🧑‍⚕️",
    title: "מדריך למטפל",
    color: "#6366f1",
    bg: "#eef2ff",
    items: [
      {
        q: "איך נרשמים למערכת?",
        a: "לחץ 'כניסת מטפלים' → 'הרשמה כאן' → מלא שם, אימייל וסיסמה חזקה (לפחות 8 תווים, אות גדולה, ספרה ותו מיוחד)."
      },
      {
        q: "איך יוצרים מטופל חדש?",
        a: "לחץ 'מטופל חדש' בתפריט → הזן שם → לחץ 'צור מטופל'. קוד ייחודי ייווצר אוטומטית — שמור אותו ושתף עם המטופל."
      },
      {
        q: "מה כולל הדשבורד?",
        a: "KPIs חיים (מטופלים, דורשים תשומת לב, יציבים), פאנל תשומת לב עם מטופלים שדורשים מעקב, והתראות אוטומטיות."
      },
      {
        q: "מה רואים בפרופיל מטופל?",
        a: "KPIs אישיים, גרף מגמת חרדה, אינסייטים קליניים, סיכומי תרגולים, toggle לכלי התרגול, ודוח PDF שבועי."
      },
      {
        q: "איך מורידים דוח PDF?",
        a: "כנס לפרופיל המטופל → לחץ 'הורד דו\"ח PDF'. הדוח נפתח בחלון חדש עם גרף ואינסייטים — שמור דרך דיאלוג ההדפסה."
      },
      {
        q: "מה ההבדל בין איפוס למחיקה?",
        a: "איפוס — מוחק את כל האירועים והתרגולים אבל שומר את המטופל. מחיקה — מוחקת את המטופל וכל הנתונים לצמיתות."
      },
      {
        q: "איך מפעילים/מכבים את כלי התרגול?",
        a: "כנס לפרופיל המטופל → מצא את הסעיף 'כלי תרגול' → הפעל/כבה עם ה-toggle."
      },
      {
        q: "שכחתי סיסמה — מה עושים?",
        a: "במסך כניסת מטפלים, לחץ 'שכחתי סיסמה', הזן את האימייל שלך ותקבל מייל לאיפוס. (רק למשתמשים רשומים)"
      },
    ]
  },
  {
    id: "patient",
    icon: "👤",
    title: "מדריך למטופל",
    color: "#22c55e",
    bg: "#f0fdf4",
    items: [
      {
        q: "איך נכנסים למערכת?",
        a: "לחץ 'כניסת מטופלים' → הזן את הקוד שקיבלת מהמטפל (לדוגמה: CU-X7K2M9PQ) → לחץ 'כניסה'."
      },
      {
        q: "איך מדווחים אירוע?",
        a: "מלא טריגר (מה קרה), הזז את הסליידר לרמת החרדה, בחר איך הגבת, הוסף הערות אם רוצה, ולחץ 'שמור דיווח'."
      },
      {
        q: "מה זה כלי התרגול?",
        a: "תרגיל מובנה של כ-5 דקות: נשימה → זיהוי תחושה → ישיבה עם אי-נוחות → רפלקציה. לחץ על הבאנר הסגול כדי להתחיל."
      },
      {
        q: "האם המטפל רואה את הדיווחים שלי?",
        a: "כן — כל האירועים וסיכומי התרגולים מגיעים ישירות למטפל שלך."
      },
      {
        q: "שכחתי את הקוד שלי",
        a: "פנה למטפל שלך — הוא יצור לך קוד חדש."
      },
    ]
  },
  {
    id: "security",
    icon: "🔐",
    title: "אבטחה ופרטיות",
    color: "#f59e0b",
    bg: "#fffbeb",
    items: [
      {
        q: "איפה מאוחסנים הנתונים?",
        a: "בענן של Google Firebase — מוצפן ומאובטח. השרתים נמצאים באירופה."
      },
      {
        q: "האם מטפל אחר יכול לראות את המטופלים שלי?",
        a: "לא — כל מטפל רואה אך ורק את המטופלים שהוא יצר."
      },
      {
        q: "למה הקוד חייב להיות ארוך?",
        a: "קודים קצרים קל לנחש. הקודים שלנו הם 8 תווים אקראיים — מה שהופך אותם לכמעט בלתי ניתנים לניחוש."
      },
    ]
  },
];

export default function HelpPage({ onBack }) {
  const [openSection, setOpenSection] = useState("therapist");
  const [openItem, setOpenItem] = useState(null);

  const section = SECTIONS.find(s => s.id === openSection);

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", direction: "rtl" }}>
      <div className="topbar">
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13 }}>
          ⬅ חזרה
        </button>
        <span style={{ fontWeight: 700, fontSize: 15 }}>❓ מרכז עזרה</span>
        <span />
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "16px 20px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>❓</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>איך אפשר לעזור?</h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>מצא תשובות לשאלות הנפוצות על CircleUno</p>
        </div>

        {/* Section tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => { setOpenSection(s.id); setOpenItem(null); }}
              style={{
                padding: "8px 16px", borderRadius: 999, border: "none", cursor: "pointer",
                fontWeight: 600, fontSize: 13, fontFamily: "inherit",
                background: openSection === s.id ? s.color : "white",
                color: openSection === s.id ? "white" : "#64748b",
                border: `1px solid ${openSection === s.id ? s.color : "#e2e8f0"}`,
                transition: "all 0.15s",
              }}
            >
              {s.icon} {s.title}
            </button>
          ))}
        </div>

        {/* FAQ items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {section.items.map((item, i) => (
            <div
              key={i}
              className="card"
              style={{ cursor: "pointer", transition: "all 0.15s" }}
              onClick={() => setOpenItem(openItem === i ? null : i)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{item.q}</span>
                <span style={{ color: section.color, fontSize: 18, transition: "transform 0.15s", transform: openItem === i ? "rotate(45deg)" : "rotate(0)" }}>+</span>
              </div>
              {openItem === i && (
                <div style={{ marginTop: 10, padding: "10px 12px", background: section.bg, borderRadius: 10, fontSize: 13, color: "#334155", lineHeight: 1.7 }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact */}
        <div style={{ marginTop: 24, padding: "16px", background: "white", borderRadius: 16, border: "1px solid #e2e8f0", textAlign: "center" }}>
          <div style={{ fontSize: 20, marginBottom: 8 }}>📧</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>לא מצאת תשובה?</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>צור קשר: <span style={{ color: "#6366f1" }}>circleuno.support@gmail.com</span></div>
        </div>
      </div>
    </div>
  );
}
