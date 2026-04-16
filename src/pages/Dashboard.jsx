import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const DAYS  = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function fmt(n) {
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 });
}
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function getDayFull(s) {
  if (!s) return "";
  const [y,m,d] = s.split("-");
  return DAYS[new Date(+y,+m-1,+d).getDay()];
}
function getDayShort(s) {
  if (!s) return "";
  const [y,m,d] = s.split("-");
  return SHORT[new Date(+y,+m-1,+d).getDay()];
}

const DAY_PILL = {
  Mon:"bg-blue-50 text-blue-800", Tue:"bg-blue-50 text-blue-800",
  Wed:"bg-blue-50 text-blue-800", Thu:"bg-blue-50 text-blue-800",
  Fri:"bg-blue-50 text-blue-800", Sat:"bg-emerald-50 text-emerald-800",
  Sun:"bg-amber-50 text-amber-800",
};

// ─── Shared styles ────────────────────────────────────────────────────────────
const iInput = {
  width:"100%", fontSize:"13px", padding:"8px 10px",
  border:"1px solid #e5e7eb", borderRadius:"7px",
  backgroundColor:"#f9fafb", color:"#1f2937",
  outline:"none", boxSizing:"border-box",
};
const iLabel = {
  display:"block", fontSize:"11px", color:"#9ca3af",
  textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"5px",
};

// ─── Modal portal ─────────────────────────────────────────────────────────────
function Modal({ onClose, children, maxWidth="460px" }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  return createPortal(
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{
      position:"fixed",inset:0,zIndex:9999,
      backgroundColor:"rgba(0,0,0,0.5)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",
    }}>
      <div style={{
        backgroundColor:"#fff",borderRadius:"16px",
        width:"100%",maxWidth,padding:"24px",
        boxShadow:"0 20px 60px rgba(0,0,0,0.25)",
        maxHeight:"90vh",overflowY:"auto",
      }}>
        {children}
      </div>
    </div>,
    document.body
  );
}

// ─── Entry Edit Modal ─────────────────────────────────────────────────────────
function EntryEditModal({ entry, isChime, onSave, onClose }) {
  const [name,   setName]   = useState(entry.name         ?? "");
  const [amt,    setAmt]    = useState(entry.amount       ?? "");
  const [cnum,   setCnum]   = useState(entry.chime_number ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(entry.id, {
      name:         name.trim(),
      amount:       parseFloat(amt)||0,
      chime_number: cnum.trim()||null,
    });
    setSaving(false); onClose();
  }

  const numLabel = isChime ? "Chime number" : "Cashapp number";

  return (
    <Modal onClose={onClose}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"18px"}}>
        <h2 style={{fontSize:"15px",fontWeight:600,color:"#111827",margin:0}}>Edit entry</h2>
        <button onClick={onClose} style={{fontSize:"22px",color:"#9ca3af",background:"none",border:"none",cursor:"pointer",lineHeight:1}}>×</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
        <div>
          <label style={iLabel}>Name</label>
          <input autoFocus style={iInput} value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSave()} />
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
          <div>
            <label style={iLabel}>Amount ($)</label>
            <input type="number" step="0.01" style={iInput} value={amt} onChange={e=>setAmt(e.target.value)} />
          </div>
        </div>
        <div>
          <label style={iLabel}>{numLabel}</label>
          <input style={iInput} placeholder="Phone or account number" value={cnum} onChange={e=>setCnum(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSave()} />
        </div>
      </div>
      <div style={{display:"flex",gap:"8px",marginTop:"20px"}}>
        <button onClick={onClose} style={{flex:1,fontSize:"13px",padding:"9px",border:"1px solid #e5e7eb",borderRadius:"8px",background:"#fff",color:"#6b7280",cursor:"pointer"}}>Cancel</button>
        <button onClick={handleSave} disabled={saving||!name.trim()} style={{flex:1,fontSize:"13px",padding:"9px",fontWeight:500,borderRadius:"8px",border:"none",background:saving?"#9ca3af":"#111827",color:"#fff",cursor:saving?"not-allowed":"pointer"}}>{saving?"Saving…":"Save changes"}</button>
      </div>
    </Modal>
  );
}

// ─── Record Edit Modal ────────────────────────────────────────────────────────
function RecordEditModal({ record, onSave, onClose }) {
  const [date,    setDate]    = useState(record.date          ?? "");
  const [chime,   setChime]   = useState(record.chime_total   ?? "");
  const [cashapp, setCashapp] = useState(record.cashapp_total ?? "");
  const [note,    setNote]    = useState(record.note          ?? "");
  const [saving,  setSaving]  = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(record.id, {
      date, day_name:getDayFull(date),
      chime_total:   parseFloat(chime)||0,
      cashapp_total: parseFloat(cashapp)||0,
      note:          note.trim()||null,
    });
    setSaving(false); onClose();
  }

  const preview = (parseFloat(chime)||0)+(parseFloat(cashapp)||0);

  return (
    <Modal onClose={onClose}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"18px"}}>
        <h2 style={{fontSize:"15px",fontWeight:600,color:"#111827",margin:0}}>Edit record</h2>
        <button onClick={onClose} style={{fontSize:"22px",color:"#9ca3af",background:"none",border:"none",cursor:"pointer",lineHeight:1}}>×</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
          <div><label style={iLabel}>Date</label><input type="date" style={iInput} value={date} onChange={e=>setDate(e.target.value)} /></div>
          <div><label style={iLabel}>Day</label><input readOnly style={{...iInput,color:"#6b7280",backgroundColor:"#f3f4f6"}} value={getDayFull(date)} /></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
          <div><label style={iLabel}>Chime ($)</label><input type="number" step="0.01" style={{...iInput,color:"#065f46"}} value={chime} onChange={e=>setChime(e.target.value)} /></div>
          <div><label style={iLabel}>Cashapp ($)</label><input type="number" step="0.01" style={{...iInput,color:"#1e40af"}} value={cashapp} onChange={e=>setCashapp(e.target.value)} /></div>
        </div>
        <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:"8px",padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:"12px",color:"#166534"}}>Total</span>
          <span style={{fontSize:"15px",fontWeight:600,color:"#166534",fontFamily:"monospace"}}>{fmt(preview)}</span>
        </div>
        <div><label style={iLabel}>Note</label><input type="text" placeholder="Optional…" style={iInput} value={note} onChange={e=>setNote(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSave()} /></div>
      </div>
      <div style={{display:"flex",gap:"8px",marginTop:"20px"}}>
        <button onClick={onClose} style={{flex:1,fontSize:"13px",padding:"9px",border:"1px solid #e5e7eb",borderRadius:"8px",background:"#fff",color:"#6b7280",cursor:"pointer"}}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{flex:1,fontSize:"13px",padding:"9px",fontWeight:500,borderRadius:"8px",border:"none",background:saving?"#9ca3af":"#059669",color:"#fff",cursor:saving?"not-allowed":"pointer"}}>{saving?"Saving…":"Save changes"}</button>
      </div>
    </Modal>
  );
}

// ─── Snapshot Modal ───────────────────────────────────────────────────────────
function SnapshotModal({ record, onClose }) {
  const [snapshots, setSnapshots] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("daily_snapshots").select("*")
        .eq("record_id", record.id)
        .order("side").order("created_at");
      setSnapshots(data ?? []);
      setLoading(false);
    }
    load();
  }, [record.id]);

  const chimeSnaps   = snapshots.filter(s=>s.side==="chime");
  const cashappSnaps = snapshots.filter(s=>s.side==="cashapp");
  const total = Number(record.chime_total)+Number(record.cashapp_total);

  const th = { fontSize:"10px",color:"#6b7280",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.04em",padding:"8px 10px",textAlign:"left",borderBottom:"1px solid #f3f4f6",whiteSpace:"nowrap" };
  const td = { fontSize:"12px",color:"#1f2937",padding:"8px 10px",borderBottom:"1px solid #f9fafb" };

  function SnapTable({ items, color, numLabel }) {
    if (!items.length) return <p style={{fontSize:"12px",color:"#9ca3af",padding:"8px 0"}}>No entries</p>;
    return (
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr>
          <th style={{...th,width:"36px"}}>#</th>
          <th style={th}>Name</th>
          <th style={{...th,width:"110px"}}>{numLabel}</th>
          <th style={{...th,textAlign:"right",width:"90px"}}>Amount</th>
        </tr></thead>
        <tbody>
          {items.map((s,i)=>(
            <tr key={s.id}>
              <td style={td}><span style={{background:"#f3f4f6",color:"#6b7280",fontSize:"11px",borderRadius:"4px",padding:"1px 5px",fontFamily:"monospace"}}>{i+1}</span></td>
              <td style={td}>{s.name}</td>
              <td style={{...td,fontFamily:"monospace",fontSize:"11px",color:"#4b5563"}}>{s.chime_number||"—"}</td>
              <td style={{...td,textAlign:"right",fontFamily:"monospace",fontWeight:600,color}}>{fmt(s.amount)}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={4} style={{...td,color:"#9ca3af",borderTop:"1px solid #e5e7eb"}}>Total</td>
            <td style={{...td,textAlign:"right",fontFamily:"monospace",fontWeight:700,color,borderTop:"1px solid #e5e7eb"}}>{fmt(items.reduce((s,r)=>s+Number(r.amount),0))}</td>
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <Modal onClose={onClose} maxWidth="580px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
        <div>
          <h2 style={{fontSize:"15px",fontWeight:600,color:"#111827",margin:0}}>{record.date}</h2>
          <p style={{fontSize:"12px",color:"#9ca3af",margin:"2px 0 0"}}>{record.day_name}{record.note?` · ${record.note}`:""}</p>
        </div>
        <button onClick={onClose} style={{fontSize:"22px",color:"#9ca3af",background:"none",border:"none",cursor:"pointer",lineHeight:1}}>×</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"20px"}}>
        {[
          {label:"Chime",   value:fmt(record.chime_total),   color:"#065f46",bg:"#f0fdf4",border:"#bbf7d0"},
          {label:"Cashapp", value:fmt(record.cashapp_total), color:"#1e3a8a",bg:"#eff6ff",border:"#bfdbfe"},
          {label:"Total",   value:fmt(total),                color:"#111827",bg:"#f9fafb",border:"#e5e7eb"},
        ].map(c=>(
          <div key={c.label} style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:"8px",padding:"10px 12px"}}>
            <p style={{fontSize:"10px",color:c.color,textTransform:"uppercase",letterSpacing:"0.05em",margin:"0 0 3px"}}>{c.label}</p>
            <p style={{fontSize:"16px",fontWeight:700,color:c.color,margin:0,fontFamily:"monospace"}}>{c.value}</p>
          </div>
        ))}
      </div>
      {loading ? (
        <p style={{textAlign:"center",fontSize:"13px",color:"#9ca3af",padding:"20px 0"}}>Loading…</p>
      ) : (
        <>
          <p style={{fontSize:"11px",fontWeight:600,color:"#059669",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:"8px"}}>Chime entries</p>
          <SnapTable items={chimeSnaps} color="#065f46" numLabel="Chime No." />
          <p style={{fontSize:"11px",fontWeight:600,color:"#2563eb",textTransform:"uppercase",letterSpacing:"0.05em",margin:"16px 0 8px"}}>Cashapp entries</p>
          <SnapTable items={cashappSnaps} color="#1e3a8a" numLabel="Cashapp No." />
        </>
      )}
    </Modal>
  );
}

// ─── Entry Table ──────────────────────────────────────────────────────────────
function EntryTable({ side, entries, onAdd, onHide, onEdit, loading }) {
  const [showForm,  setShowForm]  = useState(false);
  const [name,      setName]      = useState("");
  const [amt,       setAmt]       = useState("");
  const [cnum,      setCnum]      = useState("");
  const [saving,    setSaving]    = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [addHov,    setAddHov]    = useState(false);

  const isChime  = side === "chime";
  const label    = isChime ? "Chime" : "Cashapp";
  const dot      = isChime ? "#10b981" : "#3b82f6";
  const addBg    = isChime ? "#059669" : "#2563eb";
  const addHovBg = isChime ? "#047857" : "#1d4ed8";
  const amtColor = isChime ? "#065f46" : "#1e3a8a";
  const saveBg   = isChime ? "#059669" : "#2563eb";
  const numLabel = isChime ? "Chime No." : "Cashapp No.";
  const numPlaceholder = isChime ? "Chime number" : "Cashapp number";

  async function handleAdd() {
    if (!name.trim()) return;
    setSaving(true);
    await onAdd({
      side,
      number:       String(entries.length + 1),
      name:         name.trim(),
      amount:       parseFloat(amt) || 0,
      chime_number: cnum.trim() || null,
    });
    setName(""); setAmt(""); setCnum("");
    setShowForm(false); setSaving(false);
  }

  function onKey(e) { if (e.key === "Enter") handleAdd(); }

  // Sort entries by chime_number ascending (numeric if possible)
  const sorted = [...entries].sort((a, b) => {
    const an = parseFloat(a.chime_number);
    const bn = parseFloat(b.chime_number);
    if (!isNaN(an) && !isNaN(bn)) return an - bn;
    return (a.chime_number||"").localeCompare(b.chime_number||"");
  });

  const total = entries.reduce((s,r) => s + Number(r.amount), 0);

  return (
    <>
      {editEntry && (
        <EntryEditModal
          entry={editEntry} isChime={isChime}
          onSave={onEdit} onClose={()=>setEditEntry(null)}
        />
      )}

      <div style={{background:"#fff",border:"1px solid #f0f0f0",borderRadius:"14px",overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",borderBottom:"1px solid #f3f4f6"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{width:"9px",height:"9px",borderRadius:"50%",backgroundColor:dot,display:"inline-block"}} />
            <span style={{fontSize:"14px",fontWeight:600,color:"#111827"}}>{label}</span>
          </div>
          <button
            onMouseEnter={()=>setAddHov(true)} onMouseLeave={()=>setAddHov(false)}
            onClick={()=>setShowForm(v=>!v)}
            style={{
              fontSize:"13px",fontWeight:600,padding:"6px 18px",
              borderRadius:"8px",border:"none",cursor:"pointer",color:"#fff",
              background: showForm ? "#6b7280" : (addHov ? addHovBg : addBg),
              transition:"background 0.15s",
            }}
          >
            {showForm ? "Cancel" : "+ Add"}
          </button>
        </div>

        {/* Table — no tableLayout:fixed so columns size naturally */}
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:"13px"}}>
          <thead>
            <tr style={{borderBottom:"1px solid #f3f4f6",background:"#fafafa"}}>
              <th style={{fontSize:"10px",color:"#9ca3af",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.05em",padding:"9px 10px 9px 14px",textAlign:"left",width:"36px"}}>#</th>
              <th style={{fontSize:"10px",color:"#9ca3af",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.05em",padding:"9px 10px",textAlign:"left"}}>Name</th>
              <th style={{fontSize:"10px",color:"#9ca3af",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.05em",padding:"9px 10px",textAlign:"center",width:"90px"}}>{numLabel}</th>
              <th style={{fontSize:"10px",color:"#9ca3af",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.05em",padding:"9px 14px 9px 10px",textAlign:"right",width:"90px"}}>Amount</th>
              <th style={{width:"52px"}} />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{textAlign:"center",fontSize:"12px",color:"#9ca3af",padding:"24px"}}>Loading…</td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan={6} style={{textAlign:"center",fontSize:"12px",color:"#9ca3af",padding:"24px"}}>No entries yet</td></tr>
            ) : sorted.map((r, i) => (
              <tr key={r.id}
                style={{borderBottom:"1px solid #f9fafb",transition:"background 0.1s"}}
                onMouseEnter={e => { e.currentTarget.style.background="#f9fafb"; }}
                onMouseLeave={e => { e.currentTarget.style.background="";}}
              >
                <td style={{padding:"10px 10px 10px 14px"}}>
                  <span style={{background:"#f3f4f6",color:"#6b7280",fontSize:"11px",fontFamily:"monospace",borderRadius:"4px",padding:"2px 6px"}}>{i+1}</span>
                </td>
                {/* Name — full width, no truncation */}
                <td style={{padding:"10px",color:"#1f2937",fontWeight:500,wordBreak:"break-word"}}>{r.name}</td>
                {/* Chime/Cashapp number */}
                <td style={{padding:"10px",textAlign:"center",fontFamily:"monospace",fontSize:"12px",color:"#374151",fontWeight:500}}>{r.chime_number || <span style={{color:"#e5e7eb"}}>—</span>}</td>
                {/* Amount */}
                <td style={{padding:"10px 14px 10px 10px",textAlign:"right",fontFamily:"monospace",fontSize:"13px",color:amtColor,fontWeight:700}}>{fmt(r.amount)}</td>
                {/* Actions */}
                <td style={{padding:"10px 10px 10px 0"}}>
                  <div className="ra" style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:"2px"}}>
                    <button onClick={()=>setEditEntry(r)}
                      style={{background:"none",border:"none",cursor:"pointer",padding:"4px",color:"#9ca3af",borderRadius:"4px",display:"flex",alignItems:"center"}}
                      onMouseEnter={e=>{e.currentTarget.style.color="#3b82f6";e.currentTarget.style.background="#eff6ff";}}
                      onMouseLeave={e=>{e.currentTarget.style.color="#9ca3af";e.currentTarget.style.background="none";}}>
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 0110 16H8v-2a2 2 0 01.586-1.414z"/>
                      </svg>
                    </button>
                    <button onClick={()=>onHide(r.id)}
                      style={{background:"none",border:"none",cursor:"pointer",padding:"4px",color:"#d1d5db",borderRadius:"4px",fontSize:"15px",lineHeight:1}}
                      onMouseEnter={e=>{e.currentTarget.style.color="#f87171";e.currentTarget.style.background="#fef2f2";}}
                      onMouseLeave={e=>{e.currentTarget.style.color="#d1d5db";e.currentTarget.style.background="none";}}>×</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {sorted.length > 0 && (
            <tfoot>
              <tr style={{borderTop:"2px solid #f3f4f6",background:"#fafafa"}}>
                <td colSpan={4} style={{padding:"10px 10px 10px 14px",fontSize:"12px",color:"#9ca3af",fontWeight:500}}>Total</td>
                <td style={{padding:"10px 14px 10px 10px",textAlign:"right",fontFamily:"monospace",fontSize:"13px",fontWeight:700,color:amtColor}}>{fmt(total)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>

        {/* Add form */}
        {showForm && (
          <div style={{borderTop:"1px solid #f3f4f6",background:"#f9fafb",padding:"12px 14px"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 80px 110px 80px auto",gap:"8px",alignItems:"center"}}>
              <div>
                <label style={{...iLabel,marginBottom:"3px"}}>Name</label>
                <input placeholder="Full name" value={name} autoFocus onChange={e=>setName(e.target.value)} onKeyDown={onKey}
                  style={{...iInput,fontSize:"12px",padding:"7px 9px"}} />
              </div>
              <div>
                <label style={{...iLabel,marginBottom:"3px"}}>{numLabel}</label>
                <input placeholder={numPlaceholder} value={cnum} onChange={e=>setCnum(e.target.value)}
                  style={{...iInput,fontSize:"12px",padding:"7px 9px"}} />
              </div>
              <div>
                <label style={{...iLabel,marginBottom:"3px"}}>Amount</label>
                <input type="number" placeholder="$0" step="0.01" value={amt} onChange={e=>setAmt(e.target.value)} onKeyDown={onKey}
                  style={{...iInput,fontSize:"12px",padding:"7px 9px"}} />
              </div>
              <div style={{paddingTop:"18px"}}>
                <button onClick={handleAdd} disabled={saving}
                  style={{fontSize:"13px",fontWeight:600,padding:"7px 16px",borderRadius:"7px",border:"none",cursor:"pointer",
                    background:saveBg,color:"#fff",opacity:saving?0.5:1,whiteSpace:"nowrap"}}>
                  {saving ? "…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [entries,        setEntries]        = useState({ chime:[], cashapp:[] });
  const [records,        setRecords]        = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(true);

  const [recDate,    setRecDate]    = useState(todayStr());
  const [recChime,   setRecChime]   = useState("");
  const [recCashapp, setRecCashapp] = useState("");
  const [recNote,    setRecNote]    = useState("");
  const [savingRec,  setSavingRec]  = useState(false);

  const [editRecord, setEditRecord] = useState(null);
  const [showRecord, setShowRecord] = useState(null);
  
  const [showFilter,  setShowFilter]  = useState(false);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo,   setFilterTo]   = useState("");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchEntries = useCallback(async () => {
    setLoadingEntries(true);
    const { data } = await supabase.from("entries").select("*")
      .eq("hidden", false)
      .order("created_at", { ascending: true });
    if (data) setEntries({
      chime:   data.filter(r=>r.side==="chime"),
      cashapp: data.filter(r=>r.side==="cashapp"),
    });
    setLoadingEntries(false);
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoadingRecords(true);
    const { data } = await supabase.from("daily_records").select("*")
      .eq("hidden", false)
      .order("date", { ascending: false });
    if (data) setRecords(data);
    setLoadingRecords(false);
  }, []);

  useEffect(() => { fetchEntries(); fetchRecords(); }, [fetchEntries, fetchRecords]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const chimeTotal   = entries.chime.reduce((s,r)=>s+Number(r.amount),0);
  const cashappTotal = entries.cashapp.reduce((s,r)=>s+Number(r.amount),0);
  const dayTotal     = chimeTotal + cashappTotal;
  const filteredRecords = records.filter(r => {
  if (filterFrom && r.date < filterFrom) return false;
  if (filterTo   && r.date > filterTo)   return false;
  return true;
});
const grandTotal = filteredRecords.reduce((s,r)=>s+Number(r.chime_total)+Number(r.cashapp_total),0);

  // ── Entry handlers ─────────────────────────────────────────────────────────
  async function handleAddEntry(payload) {
    const { data } = await supabase.from("entries").insert([{...payload,hidden:false}]).select();
    if (data) setEntries(prev=>({...prev,[payload.side]:[...prev[payload.side],data[0]]}));
  }

  async function handleHideEntry(id) {
    await supabase.from("entries").update({hidden:true}).eq("id",id);
    setEntries(prev=>{
      const chime   = prev.chime.filter(r=>r.id!==id).map((r,i)=>({...r,number:String(i+1)}));
      const cashapp = prev.cashapp.filter(r=>r.id!==id).map((r,i)=>({...r,number:String(i+1)}));
      chime.forEach(r=>supabase.from("entries").update({number:r.number}).eq("id",r.id));
      cashapp.forEach(r=>supabase.from("entries").update({number:r.number}).eq("id",r.id));
      return { chime, cashapp };
    });
  }

  async function handleEditEntry(id, changes) {
    const { data } = await supabase.from("entries").update(changes).eq("id",id).select();
    if (data) setEntries(prev=>({
      chime:   prev.chime.map(r=>r.id===id?{...r,...data[0]}:r),
      cashapp: prev.cashapp.map(r=>r.id===id?{...r,...data[0]}:r),
    }));
  }

  // ── Record handlers ────────────────────────────────────────────────────────
  async function handleSaveRecord() {
    if (!recDate) return;
    setSavingRec(true);
    const payload = {
      date:recDate, day_name:getDayFull(recDate),
      chime_total:   parseFloat(recChime)||0,
      cashapp_total: parseFloat(recCashapp)||0,
      note:          recNote.trim()||null,
      hidden:        false,
    };
    const { data:recData, error } = await supabase.from("daily_records").insert([payload]).select();
    if (error) { console.error(error); setSavingRec(false); return; }

    const record_id = recData[0].id;
    const allEntries = [
      ...entries.chime.map((e,i)=>({record_id,side:"chime",  number:String(i+1),name:e.name,amount:Number(e.amount),chime_number:e.chime_number||null})),
      ...entries.cashapp.map((e,i)=>({record_id,side:"cashapp",number:String(i+1),name:e.name,amount:Number(e.amount),chime_number:e.chime_number||null})),
    ];
    if (allEntries.length > 0) await supabase.from("daily_snapshots").insert(allEntries);

    setRecords(prev=>[recData[0],...prev]);
    setRecChime(""); setRecCashapp(""); setRecNote(""); setRecDate(todayStr());
    setSavingRec(false);
  }

  async function handleHideRecord(id) {
    await supabase.from("daily_records").update({hidden:true}).eq("id",id);
    setRecords(prev=>prev.filter(r=>r.id!==id));
  }

  async function handleEditRecord(id, changes) {
    const { data } = await supabase.from("daily_records").update(changes).eq("id",id).select();
    if (data) setRecords(prev=>prev.map(r=>r.id===id?{...r,...data[0]}:r));
  }

  function fillLiveTotals() {
    setRecChime(chimeTotal.toFixed(2));
    setRecCashapp(cashappTotal.toFixed(2));
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    
    <div style={{minHeight:"100vh",backgroundColor:"#f8fafc"}}>
      <div style={{maxWidth:"960px",margin:"0 auto",padding:"40px 20px"}}>

        {editRecord && <RecordEditModal record={editRecord} onSave={handleEditRecord} onClose={()=>setEditRecord(null)} />}
        {showRecord  && <SnapshotModal  record={showRecord}                           onClose={()=>setShowRecord(null)} />}
      
        {/* Header */}
        <div style={{marginBottom:"28px"}}>
          <h1 style={{fontSize:"26px",fontWeight:600,color:"#111827",margin:0}}>Kaam</h1>
          <p style={{fontSize:"14px",color:"#9ca3af",marginTop:"4px"}}>Payment tracker · daily records</p>
        </div>

        {/* Stat cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"12px",marginBottom:"24px"}}>
          {[
            {label:"Today's total",value:fmt(dayTotal),    color:"#111827",bg:"#fff",border:"#f0f0f0"},
            {label:"Chime",        value:fmt(chimeTotal),  color:"#065f46",bg:"#f0fdf4",border:"#bbf7d0"},
            {label:"Cashapp",      value:fmt(cashappTotal),color:"#1e3a8a",bg:"#eff6ff",border:"#bfdbfe"},
          ].map(s=>(
            <div key={s.label} style={{background:s.bg,borderRadius:"12px",padding:"14px 18px",border:`1px solid ${s.border}`}}>
              <p style={{fontSize:"11px",color:s.color,textTransform:"uppercase",letterSpacing:"0.05em",margin:"0 0 4px"}}>{s.label}</p>
              <p style={{fontSize:"22px",fontWeight:700,fontFamily:"monospace",color:s.color,margin:0}}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Entry tables */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginBottom:"28px"}}>
          <EntryTable side="chime"   entries={entries.chime}   onAdd={handleAddEntry} onHide={handleHideEntry} onEdit={handleEditEntry} loading={loadingEntries} />
          <EntryTable side="cashapp" entries={entries.cashapp} onAdd={handleAddEntry} onHide={handleHideEntry} onEdit={handleEditEntry} loading={loadingEntries} />
        </div>

        <div style={{borderTop:"1px solid #f3f4f6",marginBottom:"28px"}} />

        {/* Save record */}
        <p style={{fontSize:"14px",fontWeight:600,color:"#374151",marginBottom:"12px"}}>Save today's record</p>
        <div style={{background:"#fff",border:"1px solid #f0f0f0",borderRadius:"12px",padding:"18px",marginBottom:"28px",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr auto",gap:"12px",marginBottom:"12px",alignItems:"end"}}>
            <div><label style={iLabel}>Date</label><input type="date" value={recDate} onChange={e=>setRecDate(e.target.value)} style={iInput} /></div>
            <div><label style={iLabel}>Day</label><input readOnly value={getDayFull(recDate)} style={{...iInput,color:"#9ca3af",backgroundColor:"#f3f4f6"}} /></div>
            <div><label style={iLabel}>Chime ($)</label><input type="number" step="0.01" placeholder="0.00" value={recChime} onChange={e=>setRecChime(e.target.value)} style={{...iInput,color:"#065f46"}} /></div>
            <div><label style={iLabel}>Cashapp ($)</label><input type="number" step="0.01" placeholder="0.00" value={recCashapp} onChange={e=>setRecCashapp(e.target.value)} style={{...iInput,color:"#1e3a8a"}} /></div>
            <div style={{paddingTop:"18px"}}>
              <button onClick={fillLiveTotals} style={{fontSize:"11px",color:"#059669",fontWeight:500,border:"1px solid #6ee7b7",borderRadius:"8px",padding:"9px 12px",background:"#f0fdf4",cursor:"pointer",whiteSpace:"nowrap"}}>Use live totals</button>
            </div>
          </div>
          <div style={{display:"flex",gap:"12px",alignItems:"flex-end"}}>
            <div style={{flex:1}}>
              <label style={iLabel}>Note (optional)</label>
              <input type="text" placeholder="e.g. slow day, holiday…" value={recNote} onChange={e=>setRecNote(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSaveRecord()} style={iInput} />
            </div>
            <button onClick={handleSaveRecord} disabled={savingRec||!recDate} style={{fontSize:"13px",fontWeight:600,padding:"9px 24px",borderRadius:"8px",border:"none",cursor:"pointer",background:savingRec?"#9ca3af":"#059669",color:"#fff",whiteSpace:"nowrap",opacity:!recDate?0.4:1}}>
              {savingRec?"Saving…":"Save record"}
            </button>
          </div>
        </div>

        {/* History */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"}}>
  <p style={{fontSize:"13px",fontWeight:600,color:"#059669",textTransform:"uppercase",letterSpacing:"0.05em",margin:0}}>History</p>
  <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
    {records.length>0 && (
      <span style={{fontSize:"12px",color:"#059669",background:"#f0fdf4",borderRadius:"6px",padding:"4px 10px",fontFamily:"monospace",border:"1px solid #bbf7d0"}}>
        Grand total: {fmt(grandTotal)}
      </span>
    )}
    <button onClick={()=>setShowFilter(v=>!v)} style={{
      fontSize:"12px",fontWeight:600,padding:"5px 14px",
      borderRadius:"7px",border:"1px solid #6ee7b7",
      background: showFilter?"#059669":"#f0fdf4",
      color: showFilter?"#fff":"#059669",cursor:"pointer",
    }}>
      {showFilter ? "Close filter" : "Filter"}
    </button>
  </div>
</div>

{/* Filter popup */}
{showFilter && (
  <div style={{background:"#fff",border:"1px solid #6ee7b7",borderRadius:"12px",padding:"16px",marginBottom:"16px",boxShadow:"0 4px 16px rgba(0,0,0,0.08)"}}>
    <p style={{fontSize:"12px",fontWeight:600,color:"#059669",margin:"0 0 12px",textTransform:"uppercase",letterSpacing:"0.05em"}}>Filter by date</p>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
      <div>
        <label style={{display:"block",fontSize:"11px",color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:"5px"}}>From</label>
        <input type="date" value={filterFrom} onChange={e=>setFilterFrom(e.target.value)}
          style={{width:"100%",fontSize:"13px",padding:"8px 10px",border:"1px solid #e5e7eb",borderRadius:"7px",background:"#f9fafb",color:"#374151",outline:"none",boxSizing:"border-box",cursor:"pointer",WebkitAppearance:"auto"}} />
      </div>
      <div>
        <label style={{display:"block",fontSize:"11px",color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:"5px"}}>To</label>
        <input type="date" value={filterTo} onChange={e=>setFilterTo(e.target.value)}
          style={{width:"100%",fontSize:"13px",padding:"8px 10px",border:"1px solid #e5e7eb",borderRadius:"7px",background:"#f9fafb",color:"#374151",outline:"none",boxSizing:"border-box"}} />
      </div>
    </div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <span style={{fontSize:"12px",color:"#6b7280"}}>
        {filteredRecords.length} of {records.length} records
        {(filterFrom||filterTo) && ` · ${fmt(filteredRecords.reduce((s,r)=>s+Number(r.chime_total)+Number(r.cashapp_total),0))}`}
      </span>
      <div style={{display:"flex",gap:"8px"}}>
        {(filterFrom||filterTo) && (
          <button onClick={()=>{setFilterFrom("");setFilterTo("");}}
            style={{fontSize:"12px",padding:"6px 14px",border:"1px solid #e5e7eb",borderRadius:"7px",background:"#fff",color:"#6b7280",cursor:"pointer"}}>
            Clear
          </button>
        )}
        <button onClick={()=>setShowFilter(false)}
          style={{fontSize:"12px",fontWeight:600,padding:"6px 14px",border:"none",borderRadius:"7px",background:"#059669",color:"#fff",cursor:"pointer"}}>
          Apply
        </button>
      </div>
    </div>
  </div>
)}

        {loadingRecords ? (
          <p style={{textAlign:"center",fontSize:"14px",color:"#9ca3af",padding:"40px 0"}}>Loading…</p>
        ) : records.length===0 ? (
          <div style={{textAlign:"center",fontSize:"14px",color:"#9ca3af",padding:"40px 0",border:"1px solid #f3f4f6",borderRadius:"12px",background:"#fff"}}>No records yet — save one above.</div>
        ) : (
          <div style={{background:"#fff",border:"2px solid #6ee7b7",borderRadius:"12px",overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:"13px"}}>
              <thead>
                <tr style={{borderBottom:"1px solid #d1fae5",background:"#f0fdf4"}}>
                  {["Date","Day","Chime","Cashapp","Total","Note",""].map((h,i)=>(
                    <th key={i} style={{
                      textAlign:[2,3,4].includes(i)?"right":"left",
                      fontSize:"10px",color:"#059669",fontWeight:600,
                      textTransform:"uppercase",letterSpacing:"0.05em",
                      padding:"10px 12px",whiteSpace:"nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(r=>{
                  const short  = getDayShort(r.date);
                  const pill   = DAY_PILL[short]??"bg-gray-100 text-gray-600";
                  const rowTot = Number(r.chime_total)+Number(r.cashapp_total);
                  return (
                    <tr key={r.id} style={{borderBottom:"1px solid #f0fdf4",transition:"background 0.1s"}}
                      onMouseEnter={e=>{e.currentTarget.style.background="#f0fdf4";}}
                      onMouseLeave={e=>{e.currentTarget.style.background="";}}
                    >
                      <td style={{padding:"10px 12px",fontFamily:"monospace",fontSize:"12px",color:"#4b5563",whiteSpace:"nowrap"}}>{r.date}</td>
                      <td style={{padding:"10px 12px"}}><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pill}`}>{r.day_name}</span></td>
                      <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"monospace",fontSize:"12px",color:"#065f46",fontWeight:600}}>{fmt(r.chime_total)}</td>
                      <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"monospace",fontSize:"12px",color:"#1e3a8a",fontWeight:600}}>{fmt(r.cashapp_total)}</td>
                      <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"monospace",fontSize:"12px",fontWeight:700,color:"#111827"}}>{fmt(rowTot)}</td>
                      <td style={{padding:"10px 12px",fontSize:"12px",color:"#9ca3af",maxWidth:"120px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.note??"—"}</td>
                      <td style={{padding:"10px 8px"}}>
                        <div className="ra2" style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:"4px",transition:"opacity 0.15s"}}>
                          <button onClick={()=>setShowRecord(r)}
                            style={{fontSize:"11px",fontWeight:600,padding:"3px 10px",borderRadius:"6px",border:"1px solid #6ee7b7",background:"#f0fdf4",color:"#059669",cursor:"pointer",whiteSpace:"nowrap"}}
                            onMouseEnter={e=>e.currentTarget.style.background="#dcfce7"}
                            onMouseLeave={e=>e.currentTarget.style.background="#f0fdf4"}>Show</button>
                          <button onClick={()=>setEditRecord(r)}
                            style={{background:"none",border:"none",cursor:"pointer",padding:"4px",color:"#9ca3af",borderRadius:"4px",display:"flex",alignItems:"center"}}
                            onMouseEnter={e=>{e.currentTarget.style.color="#059669";e.currentTarget.style.background="#f0fdf4";}}
                            onMouseLeave={e=>{e.currentTarget.style.color="#9ca3af";e.currentTarget.style.background="none";}}>
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 0110 16H8v-2a2 2 0 01.586-1.414z"/>
                            </svg>
                          </button>
                          <button onClick={()=>handleHideRecord(r.id)}
                            style={{background:"none",border:"none",cursor:"pointer",padding:"4px",color:"#d1d5db",borderRadius:"4px",fontSize:"15px",lineHeight:1}}
                            onMouseEnter={e=>{e.currentTarget.style.color="#f87171";e.currentTarget.style.background="#fef2f2";}}
                            onMouseLeave={e=>{e.currentTarget.style.color="#d1d5db";e.currentTarget.style.background="none";}}>×</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
