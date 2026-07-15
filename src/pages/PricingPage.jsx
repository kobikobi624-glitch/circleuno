import { useState } from "react";

const PLANS = [
  {
    id: "trial",
    name: "ניסיון",
    price: "חינם",
    period: "30 יום",
    color: "#64748b",
    bg: "#f8fafc",
    border: "#e2e8f0",
    badge: null,
    features: [
      "עד 3 מטופלים פעילים",
      "כל הפיצ'רים פתוחים",
      "דוחות PDF שבועיים",
      "כלי תרגול ERP",
      "ללא צורך בכרטיס אשראי",
    ],
    cta: "התחל ניסיון חינם",
    ctaBg: "#64748b",
  },
  {
    id: "basic",
    name: "בסיסי",
    price: "79",
    period: "לחודש",
    color: "#6366f1",
    bg: "#eef2ff",
    border: "#6366f1",
    badge: "הכי פופולרי",
    features: [
      "עד 10 מטופלים פעילים",
      "כל הפיצ'רים פתוחים",
      "דוחות PDF שבועיים",
      "כלי תרגול ERP",
      "תמיכה במייל",
    ],
    cta: "בחר תוכנית בסיסית",
    ctaBg: "#6366f1",
  },
  {
    id: "pro",
    name: "מתקדם",
    price: "149",
    period: "לחודש",
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#7c3aed",
    badge: "למרפאות וקליניקות",
    features: [
      "מטופלים ללא הגבלה",
      "כל הפיצ'רים פתוחים",
      "דוחות PDF שבועיים",
      "כלי תרגול ERP",
      "עדיפות בתמיכה",
      "מתאים לצוות מטפלים",
    ],
    cta: "בחר תוכנית מתקדמת",
    ctaBg: "#7c3aed",
  },
];


export default function PricingPage({ onBack, onSignup }) {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", direction: "rtl" }}>

      <div className="topbar">
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13 }}>
          ➡ חזרה
        </button>
        <span style={{ fontWeight: 700, fontSize: 15 }}>💎 תוכניות ומחירים</span>
        <span />
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px", color: "#0f172a" }}>
            בחר את התוכנית המתאימה לך
          </h1>
          <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>
            התחל בחינם — ללא כרטיס אשראי. שדרג בכל עת.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 40 }}>
          {PLANS.map(plan => (
            <div
              key={plan.id}
              style={{
                background: "white",
                borderRadius: 20,
                border: `2px solid ${plan.border}`,
                padding: "24px 20px",
                position: "relative",
                boxShadow: plan.badge ? "0 8px 32px rgba(99,102,241,0.12)" : "0 1px 4px rgba(0,0,0,0.06)",
                transform: plan.id === "basic" ? "translateY(-4px)" : "none",
              }}
            >
              {plan.badge && (
                <div style={{
                  position: "absolute", top: -12, right: 20,
                  background: plan.color, color: "white",
                  padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                }}>
                  {plan.badge}
                </div>
              )}

              <div style={{ fontSize: 13, fontWeight: 600, color: plan.color, marginBottom: 8 }}>{plan.name}</div>

              <div style={{ marginBottom: 20 }}>
                {plan.price === "חינם" ? (
                  <div style={{ fontSize: 36, fontWeight: 800, color: "#0f172a" }}>חינם</div>
                ) : (
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: "#0f172a" }}>{plan.price} ₪</div>
                    <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>{plan.period}</div>
                  </div>
                )}
                {plan.id === "trial" && (
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>ללא כרטיס אשראי</div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <span style={{ color: plan.color, fontSize: 16, flexShrink: 0 }}>✓</span>
                    <span style={{ color: "#334155" }}>{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={onSignup}
                style={{
                  width: "100%", padding: "12px", borderRadius: 12, border: "none",
                  background: plan.ctaBg, color: "white", fontWeight: 700,
                  fontSize: 14, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div style={{
          background: "white", borderRadius: 16, padding: "16px 20px",
          border: "1px solid #e2e8f0", marginBottom: 32, textAlign: "center",
        }}>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
            💡 כל התוכניות כוללות את אותם הפיצ'רים — ההבדל היחיד הוא מספר המטופלים הפעילים.
          </p>
        </div>
              {openFaq === i && (
                <div style={{ marginTop: 10, padding: "10px 12px", background: "#eef2ff", borderRadius: 10, fontSize: 13, color: "#334155", lineHeight: 1.7 }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", padding: "20px", background: "white", borderRadius: 16, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>יש שאלות? נשמח לעזור</div>
          <div style={{ fontSize: 13, color: "#6366f1" }}>circleuno.support@gmail.com</div>
        </div>

      </div>
    </div>
  );
}
