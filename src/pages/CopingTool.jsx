import { useState, useEffect, useRef } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

const STEPS = ['welcome','trigger','anxiety_pre','breathing','urge','sitting','anxiety_post','reflection','done'];
const STEP_NAMES = {
  trigger:'מה קורה?', anxiety_pre:'רמת חרדה', breathing:'נשימה',
  urge:'הדחף', sitting:'ישיבה', anxiety_post:'רמת חרדה אחרי', reflection:'רפלקציה'
};

function anxColor(v) {
  if (v >= 70) return '#ef4444';
  if (v >= 40) return '#f59e0b';
  return '#22c55e';
}

function Character({ mood }) {
  const m = {
    neutral:   { shirt: '#e0e7ff', shirtD: '#6366f1', mouth: 'M43,58 Q50,63 57,58' },
    focused:   { shirt: '#fef3c7', shirtD: '#f59e0b', mouth: 'M44,59 Q50,62 56,59' },
    calm:      { shirt: '#dcfce7', shirtD: '#22c55e', mouth: 'M42,58 Q50,64 58,58' },
    breathing: { shirt: '#dbeafe', shirtD: '#3b82f6', mouth: 'M43,59 Q50,63 57,59' },
    done:      { shirt: '#ede9fe', shirtD: '#7c3aed', mouth: 'M40,57 Q50,65 60,57' },
  };
  const c = m[mood] || m.neutral;
  return (
    <svg width="120" height="140" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg"
      style={{ display:'block', margin:'0 auto', animation:'float 4s ease-in-out infinite' }}>
      <defs>
        <radialGradient id="sg2" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#fde8c8"/>
          <stop offset="100%" stopColor="#fcd9b6"/>
        </radialGradient>
      </defs>
      <path d="M26,92 Q50,86 74,92 L76,118 Q50,124 24,118 Z" fill={c.shirt}/>
      <path d="M44,85 Q50,93 56,85" stroke={c.shirtD} strokeWidth="2" fill="none" strokeLinecap="round"/>
      <rect x="44" y="78" width="12" height="10" rx="5" fill="url(#sg2)"/>
      <ellipse cx="50" cy="56" rx="26" ry="28" fill="url(#sg2)"/>
      <path d="M24,50 Q26,26 50,24 Q74,26 76,50 Q70,32 50,30 Q30,32 24,50 Z" fill="#78350f"/>
      <ellipse cx="25" cy="54" rx="4" ry="8" fill="#78350f"/>
      <ellipse cx="75" cy="54" rx="4" ry="8" fill="#78350f"/>
      <ellipse cx="24" cy="58" rx="4" ry="5" fill="#fcd9b6"/>
      <ellipse cx="76" cy="58" rx="4" ry="5" fill="#fcd9b6"/>
      <ellipse cx="40" cy="52" rx="5" ry="5.5" fill="white"/>
      <ellipse cx="60" cy="52" rx="5" ry="5.5" fill="white"/>
      <circle cx="41" cy="53" r="3" fill="#1e293b"/>
      <circle cx="61" cy="53" r="3" fill="#1e293b"/>
      <circle cx="42" cy="51.5" r="1.2" fill="white"/>
      <circle cx="62" cy="51.5" r="1.2" fill="white"/>
      <path d="M48,60 Q50,63 52,60" stroke="#e8b89a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d={c.mouth} stroke="#c2856a" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M26,94 Q16,104 18,114" stroke={c.shirt} strokeWidth="9" fill="none" strokeLinecap="round"/>
      <path d="M74,94 Q84,104 82,114" stroke={c.shirt} strokeWidth="9" fill="none" strokeLinecap="round"/>
      <circle cx="18" cy="116" r="6" fill="url(#sg2)"/>
      <circle cx="82" cy="116" r="6" fill="url(#sg2)"/>
    </svg>
  );
}

export default function CopingTool({ patientCode, therapistId, onBack }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [muted, setMuted] = useState(false);
  const [timerSec, setTimerSec] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const [breathCount, setBreathCount] = useState(0);
  const [breathPhase, setBreathPhase] = useState('');
  const [breathStarted, setBreathStarted] = useState(false);
  const [breathDone, setBreathDone] = useState(false);
  const [circleSize, setCircleSize] = useState(56);
  const [circleColor, setCircleColor] = useState('#eef2ff');
  const [circleStroke, setCircleStroke] = useState('#6366f1');
  const [textVal, setTextVal] = useState('');
  const [sliderVal, setSliderVal] = useState(50);
  const [saving, setSaving] = useState(false);

  const stepId = STEPS[current];
  const totalSteps = STEPS.length - 2;
  const progress = (current / (STEPS.length - 1)) * 100;
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const breathRef = useRef(null);

  const moodMap = {
    welcome:'neutral', trigger:'focused', anxiety_pre:'focused',
    breathing:'breathing', urge:'focused', sitting:'calm',
    anxiety_post:'calm', reflection:'calm', done:'done'
  };

  useEffect(() => () => { clearInterval(timerRef.current); clearInterval(breathRef.current); }, []);

  useEffect(() => {
    setTextVal('');
    setSliderVal(stepId === 'anxiety_post' ? 30 : 50);
    setTimerSec(60); setTimerRunning(false); setTimerDone(false);
    setBreathCount(0); setBreathPhase(''); setBreathStarted(false); setBreathDone(false);
    setCircleSize(56);
    clearInterval(timerRef.current);
    clearInterval(breathRef.current);
    if (stepId === 'welcome' && audioRef.current && !muted) {
      audioRef.current.volume = 0.18;
      audioRef.current.play().catch(() => {});
    }
    if (stepId === 'done' && audioRef.current) audioRef.current.pause();
  }, [current]);

  const toggleMute = () => {
    setMuted(m => { if (audioRef.current) audioRef.current.muted = !m; return !m; });
  };

  const next = (data = {}) => {
    setAnswers(prev => ({ ...prev, ...data }));
    setCurrent(c => c + 1);
  };

  const startTimer = () => {
    setTimerRunning(true);
    timerRef.current = setInterval(() => {
      setTimerSec(s => {
        if (s <= 1) { clearInterval(timerRef.current); setTimerRunning(false); setTimerDone(true); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const startBreath = () => {
    setBreathStarted(true);
    const phases = [
      { n:'שאף...',  d:4, size:82, bg:'#eef2ff', stroke:'#6366f1' },
      { n:'עצור...', d:4, size:82, bg:'#ede9fe', stroke:'#8b5cf6' },
      { n:'נשוף...', d:6, size:54, bg:'#f0fdf4', stroke:'#22c55e' },
    ];
    let pi = 0, ps = 0, count = 0;
    setBreathPhase(phases[0].n); setCircleSize(phases[0].size);
    setCircleColor(phases[0].bg); setCircleStroke(phases[0].stroke);
    breathRef.current = setInterval(() => {
      ps++;
      if (ps >= phases[pi].d) {
        ps = 0; pi++;
        if (pi >= phases.length) {
          pi = 0; count++;
          setBreathCount(count);
          if (count >= 3) { clearInterval(breathRef.current); setBreathPhase('סיום ✓'); setBreathDone(true); return; }
        }
        setBreathPhase(phases[pi].n); setCircleSize(phases[pi].size);
        setCircleColor(phases[pi].bg); setCircleStroke(phases[pi].stroke);
      }
    }, 1000);
  };

  const finishExercise = async (reflection) => {
    setSaving(true);
    try {
      await addDoc(collection(db, "copingSessions"), {
        patientCode, therapistId,
        timestamp: new Date().toISOString(),
        feeling: answers.trigger || '',
        urge: answers.urge || '',
        anxietyBefore: answers.anxiety_pre ?? 50,
        anxietyAfter: answers.anxiety_post ?? 30,
        reflection: reflection || '',
      });
    } catch(e) { console.error(e); }
    setSaving(false);
    next({ reflection });
  };

  const cardStyle = { background:'white', borderRadius:20, padding:24, width:'100%', border:'1px solid #e2e8f0' };
  const h2Style = { fontSize:17, fontWeight:700, marginBottom:10, color:'#1e293b' };
  const pStyle = { fontSize:15, lineHeight:1.7, color:'#475569' };
  const taStyle = { width:'100%', padding:'12px 14px', borderRadius:12, border:'1.5px solid #e2e8f0', fontFamily:'inherit', fontSize:15, resize:'none', outline:'none', background:'#f8f9fc', direction:'rtl', marginBottom:12 };

  return (
    <div style={{ minHeight:'100vh', background:'#f8f9fc', direction:'rtl', display:'flex', flexDirection:'column' }}>
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}`}</style>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 20px', background:'white', borderBottom:'1px solid #e2e8f0', position:'sticky', top:0, zIndex:100 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>← חזרה</button>
        <span style={{ fontWeight:700, fontSize:15, color:'#1e293b' }}>כלי תרגול</span>
        <button onClick={toggleMute} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:999, border:'1.5px solid #e2e8f0', background: muted?'#f1f5f9':'white', cursor:'pointer', fontSize:13, fontWeight:600, color: muted?'#94a3b8':'#64748b', fontFamily:'inherit' }}>
          {muted ? '🔇' : '🔊'} {muted ? 'מושתק' : 'שמע'}
        </button>
      </div>

      <div style={{ height:3, background:'#e2e8f0' }}>
        <div style={{ height:3, background:'#6366f1', width:`${progress}%`, transition:'width 0.5s ease' }}/>
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'20px 20px 40px', maxWidth:460, margin:'0 auto', width:'100%' }}>
        {stepId !== 'welcome' && stepId !== 'done' && (
          <div style={{ fontSize:12, fontWeight:600, color:'#94a3b8', marginBottom:8, alignSelf:'flex-start' }}>
            שלב {current} / {totalSteps} — {STEP_NAMES[stepId]}
          </div>
        )}

        <div style={{ margin:'12px 0 20px' }}>
          <Character mood={moodMap[stepId] || 'neutral'} />
        </div>

        <div style={cardStyle}>
          {stepId === 'welcome' && <>
            <h2 style={h2Style}>שלום 👋</h2>
            <p style={{ ...pStyle, marginBottom:18 }}>תרגיל קצר שיעזור לך להתמודד עם הרגע הזה. כ-5 דקות, צעד אחד בכל פעם.</p>
            <button className="btn-primary" onClick={() => {
              if (audioRef.current && !muted) {
                audioRef.current.volume = 0.18;
                audioRef.current.play().catch(() => {});
              }
              next();
            }}>בוא נתחיל ←</button>
          </>}

          {stepId === 'trigger' && <>
            <h2 style={h2Style}>מה קורה עכשיו?</h2>
            <p style={{ ...pStyle, marginBottom:12 }}>תאר בקצרה את מה שמפריע לך:</p>
            <textarea rows={3} value={textVal} onChange={e => setTextVal(e.target.value)}
              placeholder="לדוגמה: אני מרגיש חרדה לגבי..." style={taStyle}/>
            <button className="btn-primary" onClick={() => { if(textVal.trim()) next({trigger:textVal.trim()}); }}
              style={{ opacity: textVal.trim()?1:0.35 }}>המשך ←</button>
          </>}

          {stepId === 'anxiety_pre' && <>
            <h2 style={h2Style}>רמת חרדה עכשיו</h2>
            <p style={{ ...pStyle, marginBottom:14 }}>על סקלה של 0–100:</p>
            <div style={{ fontSize:48, fontWeight:800, textAlign:'center', color:anxColor(sliderVal), marginBottom:6 }}>{sliderVal}</div>
            <input type="range" min="0" max="100" value={sliderVal} onChange={e => setSliderVal(+e.target.value)} style={{ width:'100%', accentColor:anxColor(sliderVal) }}/>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#94a3b8', marginTop:6, marginBottom:16 }}>
              <span>0 — ללא חרדה</span><span>100 — גבוה מאוד</span>
            </div>
            <button className="btn-primary" onClick={() => next({ anxiety_pre: sliderVal })}>המשך ←</button>
          </>}

          {stepId === 'breathing' && <>
            <h2 style={{ ...h2Style, textAlign:'center' }}>נשימה מווסתת</h2>
            <p style={{ ...pStyle, textAlign:'center', marginBottom:12 }}>3 מחזורים — עקוב אחרי ההנחיה</p>
            <div style={{ fontSize:20, fontWeight:700, color:'#6366f1', textAlign:'center', height:30, marginBottom:8 }}>{breathPhase || 'לחץ התחל'}</div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:90, marginBottom:12 }}>
              <div style={{ width:circleSize, height:circleSize, borderRadius:'50%', background:circleColor, border:`2.5px solid ${circleStroke}`, transition:'all 0.8s ease' }}/>
            </div>
            <div style={{ textAlign:'center', fontSize:13, color:'#94a3b8', marginBottom:14 }}>מחזור {breathCount} / 3</div>
            {!breathStarted && (
              <button onClick={startBreath} style={{ width:'100%', padding:13, borderRadius:12, border:'1.5px solid #6366f1', background:'#eef2ff', color:'#6366f1', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit', marginBottom:10 }}>
                ▶ התחל נשימה
              </button>
            )}
            <button className="btn-primary" onClick={() => next({})} disabled={!breathDone} style={{ opacity: breathDone?1:0.3 }}>סיימתי ✓</button>
          </>}

          {stepId === 'urge' && <>
            <h2 style={h2Style}>הדחף</h2>
            <p style={{ ...pStyle, marginBottom:12 }}>האם יש דחף לבצע פעולה / להימנע ממשהו?</p>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {['כן, דחף חזק','כן, קצת','לא ממש'].map(opt => (
                <button key={opt} onClick={() => next({ urge: opt })}
                  style={{ padding:'13px 16px', borderRadius:12, border:'1.5px solid #e2e8f0', background:'white', fontSize:14, fontWeight:500, cursor:'pointer', textAlign:'right', fontFamily:'inherit', color:'#1e293b' }}>
                  {opt}
                </button>
              ))}
            </div>
          </>}

          {stepId === 'sitting' && <>
            <h2 style={{ ...h2Style, textAlign:'center' }}>ישיבה עם אי-נוחות</h2>
            <p style={{ ...pStyle, textAlign:'center', marginBottom:12 }}>בלי לבצע שום פעולה — שב עם התחושה.</p>
            <div style={{ fontSize:64, fontWeight:800, textAlign:'center', color:'#6366f1', marginBottom:4 }}>{timerDone ? '✓' : timerSec}</div>
            <div style={{ fontSize:13, color:'#94a3b8', textAlign:'center', marginBottom:16 }}>שניות נותרות</div>
            <div style={{ background:'#f8f9fc', borderRadius:12, padding:'12px 14px', fontSize:13, color:'#64748b', border:'1px solid #e2e8f0', marginBottom:14, lineHeight:1.6 }}>
              שים לב לתחושה בלי לנסות לשנות אותה.
            </div>
            {!timerRunning && !timerDone && (
              <button onClick={startTimer} style={{ width:'100%', padding:13, borderRadius:12, border:'1.5px solid #6366f1', background:'#eef2ff', color:'#6366f1', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit', marginBottom:10 }}>
                ▶ התחל טיימר
              </button>
            )}
            <button className="btn-primary" onClick={() => next({})} disabled={!timerDone} style={{ opacity: timerDone?1:0.3 }}>עמדתי בזה ✊</button>
          </>}

          {stepId === 'anxiety_post' && <>
            <h2 style={h2Style}>רמת חרדה עכשיו</h2>
            <p style={{ ...pStyle, marginBottom:14 }}>אחרי התרגיל:</p>
            <div style={{ fontSize:48, fontWeight:800, textAlign:'center', color:anxColor(sliderVal), marginBottom:6 }}>{sliderVal}</div>
            <input type="range" min="0" max="100" value={sliderVal} onChange={e => setSliderVal(+e.target.value)} style={{ width:'100%', accentColor:anxColor(sliderVal) }}/>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#94a3b8', marginTop:6, marginBottom:16 }}>
              <span>0 — ללא חרדה</span><span>100 — גבוה מאוד</span>
            </div>
            <button className="btn-primary" onClick={() => next({ anxiety_post: sliderVal })}>המשך ←</button>
          </>}

          {stepId === 'reflection' && <>
            <h2 style={h2Style}>רפלקציה קצרה</h2>
            <p style={{ ...pStyle, marginBottom:12 }}>מה שמת לב אליו במהלך התרגיל?</p>
            <textarea rows={3} value={textVal} onChange={e => setTextVal(e.target.value)}
              placeholder="לדוגמה: שמתי לב שהחרדה ירדה אחרי הנשימות..." style={taStyle}/>
            <button className="btn-primary" onClick={() => finishExercise(textVal.trim())} disabled={saving}>
              {saving ? 'שומר...' : 'סיים תרגיל ←'}
            </button>
          </>}

          {stepId === 'done' && (() => {
            const drop = (answers.anxiety_pre ?? 50) - (answers.anxiety_post ?? 30);
            const dc = drop > 0 ? '#22c55e' : drop < 0 ? '#ef4444' : '#64748b';
            return <>
              <div style={{ textAlign:'center', marginBottom:16 }}>
                <div style={{ fontSize:48, marginBottom:10 }}>✓</div>
                <h2 style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>סיימת את התרגיל</h2>
                <p style={{ fontSize:14, color:'#64748b', marginBottom:12 }}>הסיכום נשלח למטפל שלך.</p>
                <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:'10px 14px', fontSize:13, color:'#166534', fontWeight:600 }}>
                  ✅ המטפל יוכל לראות את הסיכום בפרופיל שלך
                </div>
              </div>
              <div style={{ borderTop:'1px solid #f1f5f9', paddingTop:14 }}>
                {[
                  ['טריגר', answers.trigger||'—', null],
                  ['דחף', answers.urge||'—', null],
                  ['חרדה לפני', answers.anxiety_pre??'—', anxColor(answers.anxiety_pre??50)],
                  ['חרדה אחרי', answers.anxiety_post??'—', anxColor(answers.anxiety_post??30)],
                  ['שינוי', drop>0?`↓ ${drop} נקודות`:drop<0?`↑ ${Math.abs(drop)} נקודות`:'ללא שינוי', dc],
                  ['רפלקציה', answers.reflection||'—', null],
                ].map(([label, val, color]) => (
                  <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:'1px solid #f1f5f9', fontSize:14, gap:12 }}>
                    <span style={{ color:'#64748b', flexShrink:0 }}>{label}</span>
                    <span style={{ fontWeight:600, ...(color?{color}:{}) }}>{val}</span>
                  </div>
                ))}
              </div>
              <button className="btn-primary" onClick={onBack} style={{ marginTop:20 }}>סיום</button>
            </>;
          })()}
        </div>
      </div>

      <audio ref={audioRef} loop>
        <source src="https://cdn.pixabay.com/audio/2022/03/10/audio_f879f49e5d.mp3" type="audio/mpeg"/>
      </audio>
    </div>
  );
}
