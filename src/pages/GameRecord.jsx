import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const DAYS  = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

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
function num(v) { return isNaN(parseFloat(v)) ? 0 : parseFloat(v); }

const DAY_PILL = {
  Mon:"bg-blue-50 text-blue-800", Tue:"bg-blue-50 text-blue-800",
  Wed:"bg-blue-50 text-blue-800", Thu:"bg-blue-50 text-blue-800",
  Fri:"bg-blue-50 text-blue-800", Sat:"bg-emerald-50 text-emerald-800",
  Sun:"bg-amber-50 text-amber-800",
};

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
const thStyle = (extra={}) => ({
  fontSize:"11px", color:"#6b7280", fontWeight:500,
  textTransform:"uppercase", letterSpacing:"0.05em",
  padding:"9px 12px", textAlign:"left",
  borderBottom:"1px solid #f3f4f6", background:"#fafafa",
  whiteSpace:"nowrap", ...extra,
});
const tdStyle = (extra={}) => ({
  fontSize:"13px", color:"#1f2937",
  padding:"10px 12px", borderBottom:"1px solid #f9fafb", ...extra,
});

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ onClose, children, maxWidth="640px" }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  return createPortal(
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{
      position:"fixed", inset:0, zIndex:9999,
      backgroundColor:"rgba(0,0,0,0.5)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:"16px",
    }}>
      <div style={{
        backgroundColor:"#fff", borderRadius:"16px",
        width:"100%", maxWidth, padding:"24px",
        boxShadow:"0 20px 60px rgba(0,0,0,0.25)",
        maxHeight:"92vh", overflowY:"auto",
      }}>
        {children}
      </div>
    </div>,
    document.body
  );
}

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
function ConfirmModal({ session, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false);
  async function handleDelete() {
    setDeleting(true);
    await onConfirm(session.id);
    setDeleting(false);
    onClose();
  }
  return (
    <Modal onClose={onClose} maxWidth="380px">
      <div style={{textAlign:"center",padding:"8px 0"}}>
        <div style={{fontSize:"40px",marginBottom:"12px"}}>🗑️</div>
        <h2 style={{fontSize:"16px",fontWeight:700,color:"#111827",margin:"0 0 8px"}}>Delete session?</h2>
        <p style={{fontSize:"13px",color:"#6b7280",margin:"0 0 24px",lineHeight:1.5}}>
          Session #{session.session_number} on {session.date} and all its player records will be permanently deleted.
        </p>
        <div style={{display:"flex",gap:"8px"}}>
          <button onClick={onClose} style={{flex:1,fontSize:"13px",padding:"10px",border:"1px solid #e5e7eb",borderRadius:"8px",background:"#fff",color:"#6b7280",cursor:"pointer"}}>
            Cancel
          </button>
          <button onClick={handleDelete} disabled={deleting} style={{flex:1,fontSize:"13px",fontWeight:600,padding:"10px",borderRadius:"8px",border:"none",background:deleting?"#9ca3af":"#dc2626",color:"#fff",cursor:deleting?"not-allowed":"pointer"}}>
            {deleting?"Deleting…":"Yes, delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Session Detail Modal ─────────────────────────────────────────────────────
function SessionDetailModal({ session, onClose }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("game_players").select("*")
      .eq("game_id", session.id)
      .order("number", { ascending:true })
      .then(({ data }) => { setPlayers(data??[]); setLoading(false); });
  }, [session.id]);

  const totalNet = players.reduce((s,p)=>s+num(p.net_point),0);

  return (
    <Modal onClose={onClose} maxWidth="680px">
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"18px"}}>
        <div>
          <h2 style={{fontSize:"16px",fontWeight:700,color:"#111827",margin:0}}>
            Session #{session.session_number} — {session.date}
          </h2>
          <p style={{fontSize:"12px",color:"#9ca3af",margin:"3px 0 0"}}>
            {getDayFull(session.date)}{session.note?` · ${session.note}`:""}
          </p>
        </div>
        <button onClick={onClose} style={{fontSize:"22px",color:"#9ca3af",background:"none",border:"none",cursor:"pointer",lineHeight:1}}>×</button>
      </div>

      {loading ? (
        <p style={{textAlign:"center",color:"#9ca3af",padding:"20px 0"}}>Loading…</p>
      ) : (
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:"13px"}}>
            <thead>
              <tr>
                <th style={thStyle({width:"44px"})}>#</th>
                <th style={thStyle()}>Name</th>
                <th style={thStyle({textAlign:"right"})}>Previous</th>
                <th style={thStyle({textAlign:"right"})}>Current</th>
                <th style={thStyle({textAlign:"right"})}>Added</th>
                <th style={thStyle({textAlign:"right",color:"#7c3aed",background:"#faf5ff"})}>Net Point</th>
              </tr>
            </thead>
            <tbody>
              {players.map(p=>(
                <tr key={p.id}
                  onMouseEnter={e=>e.currentTarget.style.background="#faf5ff"}
                  onMouseLeave={e=>e.currentTarget.style.background=""}>
                  <td style={tdStyle()}><span style={{background:"#f3f4f6",color:"#6b7280",fontSize:"11px",fontFamily:"monospace",borderRadius:"4px",padding:"2px 6px"}}>{p.number}</span></td>
                  <td style={tdStyle({fontWeight:500})}>{p.name}</td>
                  <td style={tdStyle({textAlign:"right",fontFamily:"monospace",color:"#4b5563"})}>{num(p.previous_point)}</td>
                  <td style={tdStyle({textAlign:"right",fontFamily:"monospace",color:"#4b5563"})}>{num(p.current_point)}</td>
                  <td style={tdStyle({textAlign:"right",fontFamily:"monospace",color:"#059669",fontWeight:500})}>{p.added_point!=null?num(p.added_point):"—"}</td>
                  <td style={tdStyle({textAlign:"right",fontFamily:"monospace",fontWeight:700,color:"#7c3aed",background:"#faf5ff"})}>{num(p.net_point)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{borderTop:"2px solid #e9d5ff",background:"#faf5ff"}}>
                <td colSpan={5} style={{padding:"10px 12px",fontSize:"13px",fontWeight:600,color:"#7c3aed"}}>Total Net</td>
                <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"monospace",fontSize:"15px",fontWeight:700,color:"#7c3aed"}}>{totalNet}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Modal>
  );
}

// ─── Edit Session Modal ───────────────────────────────────────────────────────
function EditSessionModal({ session, existingPlayers, onSave, onClose }) {
  const [date,    setDate]    = useState(session.date ?? "");
  const [note,    setNote]    = useState(session.note ?? "");
  const [saving,  setSaving]  = useState(false);
  const [players, setPlayers] = useState(
    existingPlayers.map(p=>({
      id:             p.id,
      number:         p.number,
      name:           p.name,
      previous_point: String(num(p.previous_point)),
      current_point:  String(num(p.current_point)),
      added_point:    p.added_point!=null ? String(num(p.added_point)) : "",
    }))
  );

  function addPlayer() {
    setPlayers(prev=>[...prev,{ id:null, number:prev.length+1, name:"", previous_point:"", current_point:"", added_point:"" }]);
  }
  function removePlayer(i) {
    setPlayers(prev=>prev.filter((_,idx)=>idx!==i).map((p,idx)=>({...p,number:idx+1})));
  }
  function update(i, field, value) {
    setPlayers(prev=>prev.map((p,idx)=>idx===i?{...p,[field]:value}:p));
  }
  function calcNet(p) {
    const prev  = num(p.previous_point);
    const curr  = num(p.current_point);
    const added = num(p.added_point);
    if (!p.current_point && !p.added_point) return null;
    return prev - curr + added;
  }
  const totalNet = players.reduce((s,p)=>{ const n=calcNet(p); return n!=null?s+n:s; },0);

  async function handleSave() {
    if (!date) return;
    setSaving(true);

    // Update game record
    await supabase.from("game_records").update({
      date, day_name:getDayFull(date),
      note:note.trim()||null, total_net:totalNet,
    }).eq("id", session.id);

    // Delete all existing players and re-insert
    await supabase.from("game_players").delete().eq("game_id", session.id);
    const validPlayers = players.filter(p=>p.name.trim());
    if (validPlayers.length>0) {
      const rows = validPlayers.map(p=>({
        game_id:        session.id,
        number:         p.number,
        name:           p.name.trim(),
        previous_point: num(p.previous_point),
        current_point:  num(p.current_point),
        added_point:    p.added_point!==""?num(p.added_point):null,
        net_point:      calcNet(p)??0,
      }));
      await supabase.from("game_players").insert(rows);
    }

    onSave();
    setSaving(false);
    onClose();
  }

  return (
    <Modal onClose={onClose} maxWidth="720px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"18px"}}>
        <h2 style={{fontSize:"15px",fontWeight:700,color:"#111827",margin:0}}>Edit session #{session.session_number}</h2>
        <button onClick={onClose} style={{fontSize:"22px",color:"#9ca3af",background:"none",border:"none",cursor:"pointer",lineHeight:1}}>×</button>
      </div>

      {/* Date + note */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 2fr",gap:"12px",marginBottom:"18px"}}>
        <div>
          <label style={iLabel}>Date</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={iInput} />
        </div>
        <div>
          <label style={iLabel}>Day</label>
          <input readOnly value={getDayFull(date)} style={{...iInput,color:"#9ca3af",background:"#f3f4f6"}} />
        </div>
        <div>
          <label style={iLabel}>Shift person (optional)</label>
          <input type="text" value={note} onChange={e=>setNote(e.target.value)} style={iInput} />
        </div>
      </div>

      {/* Players */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px"}}>
        <p style={{fontSize:"12px",fontWeight:600,color:"#374151",textTransform:"uppercase",letterSpacing:"0.05em",margin:0}}>Games</p>
        <button onClick={addPlayer} style={{fontSize:"12px",fontWeight:600,padding:"4px 12px",borderRadius:"6px",border:"1px solid #e5e7eb",background:"#f9fafb",color:"#374151",cursor:"pointer"}}>+ Add Game Name</button>
      </div>

      <div style={{overflowX:"auto",marginBottom:"16px"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:"13px"}}>
          <thead>
            <tr>
              <th style={thStyle({width:"36px"})}>#</th>
              <th style={thStyle()}>Name</th>
              <th style={thStyle({textAlign:"right"})}>Previous</th>
              <th style={thStyle({textAlign:"right"})}>Current</th>
              <th style={thStyle({textAlign:"right"})}>Added</th>
              <th style={thStyle({textAlign:"right",color:"#7c3aed",background:"#faf5ff"})}>Net</th>
              <th style={thStyle({width:"32px"})} />
            </tr>
          </thead>
          <tbody>
            {players.map((p,i)=>{
              const net = calcNet(p);
              return (
                <tr key={i} style={{borderBottom:"1px solid #f3f4f6"}}>
                  <td style={tdStyle()}>
                    <span style={{background:"#f3f4f6",color:"#6b7280",fontSize:"11px",fontFamily:"monospace",borderRadius:"4px",padding:"2px 6px"}}>{p.number}</span>
                  </td>
                  <td style={tdStyle()}>
                    <input placeholder="Player name" value={p.name} onChange={e=>update(i,"name",e.target.value)}
                      style={{...iInput,fontSize:"12px",padding:"6px 8px"}} />
                  </td>
                  <td style={tdStyle({textAlign:"right"})}>
                    <input type="number" placeholder="0" value={p.previous_point} onChange={e=>update(i,"previous_point",e.target.value)}
                      style={{...iInput,fontSize:"12px",padding:"6px 8px",textAlign:"right",width:"80px"}} />
                  </td>
                  <td style={tdStyle({textAlign:"right"})}>
                    <input type="number" placeholder="0" value={p.current_point} onChange={e=>update(i,"current_point",e.target.value)}
                      style={{...iInput,fontSize:"12px",padding:"6px 8px",textAlign:"right",width:"80px"}} />
                  </td>
                  <td style={tdStyle({textAlign:"right"})}>
                    <input type="number" placeholder="—" value={p.added_point} onChange={e=>update(i,"added_point",e.target.value)}
                      style={{...iInput,fontSize:"12px",padding:"6px 8px",textAlign:"right",width:"80px",color:"#059669"}} />
                  </td>
                  <td style={{...tdStyle({textAlign:"right",background:"#faf5ff"})}}>
                    <span style={{fontFamily:"monospace",fontWeight:700,color:net==null?"#9ca3af":net>0?"#7c3aed":"#dc2626"}}>
                      {net!=null?net:"—"}
                    </span>
                  </td>
                  <td style={tdStyle()}>
                    {players.length>1 && (
                      <button onClick={()=>removePlayer(i)}
                        style={{background:"none",border:"none",cursor:"pointer",color:"#d1d5db",fontSize:"16px",lineHeight:1,padding:"2px"}}
                        onMouseEnter={e=>e.currentTarget.style.color="#f87171"}
                        onMouseLeave={e=>e.currentTarget.style.color="#d1d5db"}>×</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{borderTop:"2px solid #e9d5ff",background:"#faf5ff"}}>
              <td colSpan={5} style={{padding:"10px 12px",fontSize:"13px",fontWeight:600,color:"#7c3aed"}}>Total Net</td>
              <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"monospace",fontSize:"15px",fontWeight:700,color:"#7c3aed"}}>{totalNet}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <p style={{fontSize:"11px",color:"#9ca3af",marginBottom:"16px",background:"#f9fafb",padding:"8px 12px",borderRadius:"7px",border:"1px solid #f3f4f6"}}>
        Net = Previous − Current + Added
      </p>

      <div style={{display:"flex",gap:"8px"}}>
        <button onClick={onClose} style={{flex:1,fontSize:"13px",padding:"10px",border:"1px solid #e5e7eb",borderRadius:"8px",background:"#fff",color:"#6b7280",cursor:"pointer"}}>Cancel</button>
        <button onClick={handleSave} disabled={saving||!date||!players.some(p=>p.name.trim())}
          style={{flex:2,fontSize:"13px",fontWeight:600,padding:"10px",borderRadius:"8px",border:"none",
            background:saving?"#9ca3af":"#7c3aed",color:"#fff",cursor:saving?"not-allowed":"pointer"}}>
          {saving?"Saving…":"Save changes"}
        </button>
      </div>
    </Modal>
  );
}

// ─── New Session Modal ────────────────────────────────────────────────────────
function NewSessionModal({ lastSession, onSave, onClose }) {
  const [date,   setDate]   = useState(todayStr());
  const [note,   setNote]   = useState("");
  const [saving, setSaving] = useState(false);

  const initPlayers = lastSession?.players?.length
    ? lastSession.players.map((p,i)=>({
        number:         i+1,
        name:           p.name,
        previous_point: String(num(p.current_point)),
        current_point:  "",
        added_point:    "",
      }))
    : [{ number:1, name:"", previous_point:"", current_point:"", added_point:"" }];

  const [players, setPlayers] = useState(initPlayers);

  function addPlayer() {
    setPlayers(prev=>[...prev,{ number:prev.length+1, name:"", previous_point:"", current_point:"", added_point:"" }]);
  }
  function removePlayer(i) {
    setPlayers(prev=>prev.filter((_,idx)=>idx!==i).map((p,idx)=>({...p,number:idx+1})));
  }
  function update(i, field, value) {
    setPlayers(prev=>prev.map((p,idx)=>idx===i?{...p,[field]:value}:p));
  }
  function calcNet(p) {
    const prev=num(p.previous_point), curr=num(p.current_point), added=num(p.added_point);
    if (!p.current_point && !p.added_point) return null;
    return prev - curr + added;
  }
  const totalNet = players.reduce((s,p)=>{ const n=calcNet(p); return n!=null?s+n:s; },0);

  async function handleSave() {
    if (!date) return;
    const validPlayers = players.filter(p=>p.name.trim());
    if (!validPlayers.length) return;
    setSaving(true);
    const sessionNum = (lastSession?.session_number??0)+1;
    const { data:gameData, error } = await supabase.from("game_records").insert([{
      date, session_number:sessionNum, note:note.trim()||null, total_net:totalNet,
    }]).select();
    if (error) { console.error(error); setSaving(false); return; }
    const game_id = gameData[0].id;
    const rows = validPlayers.map(p=>({
      game_id, number:p.number, name:p.name.trim(),
      previous_point:num(p.previous_point), current_point:num(p.current_point),
      added_point:p.added_point!==""?num(p.added_point):null,
      net_point:calcNet(p)??0,
    }));
    await supabase.from("game_players").insert(rows);
    onSave(gameData[0]);
    setSaving(false);
    onClose();
  }

  return (
    <Modal onClose={onClose} maxWidth="720px">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"18px"}}>
        <h2 style={{fontSize:"15px",fontWeight:700,color:"#111827",margin:0}}>
          New session {lastSession?`#${(lastSession.session_number??0)+1}`:"#1"}
        </h2>
        <button onClick={onClose} style={{fontSize:"22px",color:"#9ca3af",background:"none",border:"none",cursor:"pointer",lineHeight:1}}>×</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 2fr",gap:"12px",marginBottom:"18px"}}>
        <div><label style={iLabel}>Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={iInput} /></div>
        <div><label style={iLabel}>Day</label><input readOnly value={getDayFull(date)} style={{...iInput,color:"#9ca3af",background:"#f3f4f6"}} /></div>
        <div><label style={iLabel}>Shift person (optional)</label><input type="text" placeholder="e.g. Name of the person" value={note} onChange={e=>setNote(e.target.value)} style={iInput} /></div>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px"}}>
        <p style={{fontSize:"12px",fontWeight:600,color:"#374151",textTransform:"uppercase",letterSpacing:"0.05em",margin:0}}>Games</p>
        <button onClick={addPlayer} style={{fontSize:"12px",fontWeight:600,padding:"4px 12px",borderRadius:"6px",border:"1px solid #e5e7eb",background:"#f9fafb",color:"#374151",cursor:"pointer"}}>+ Add Game Name</button>
      </div>
      <div style={{overflowX:"auto",marginBottom:"16px"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:"13px"}}>
          <thead>
            <tr>
              <th style={thStyle({width:"36px"})}>#</th>
              <th style={thStyle()}>Name</th>
              <th style={thStyle({textAlign:"right"})}>Previous</th>
              <th style={thStyle({textAlign:"right"})}>Current</th>
              <th style={thStyle({textAlign:"right"})}>Added</th>
              <th style={thStyle({textAlign:"right",color:"#7c3aed",background:"#faf5ff"})}>Net</th>
              <th style={thStyle({width:"32px"})} />
            </tr>
          </thead>
          <tbody>
            {players.map((p,i)=>{
              const net=calcNet(p);
              return (
                <tr key={i} style={{borderBottom:"1px solid #f3f4f6"}}>
                  <td style={tdStyle()}><span style={{background:"#f3f4f6",color:"#6b7280",fontSize:"11px",fontFamily:"monospace",borderRadius:"4px",padding:"2px 6px"}}>{p.number}</span></td>
                  <td style={tdStyle()}><input placeholder="Player name" value={p.name} onChange={e=>update(i,"name",e.target.value)} style={{...iInput,fontSize:"12px",padding:"6px 8px"}} /></td>
                  <td style={tdStyle({textAlign:"right"})}><input type="number" placeholder="0" value={p.previous_point} onChange={e=>update(i,"previous_point",e.target.value)} style={{...iInput,fontSize:"12px",padding:"6px 8px",textAlign:"right",width:"80px"}} /></td>
                  <td style={tdStyle({textAlign:"right"})}><input type="number" placeholder="0" value={p.current_point} onChange={e=>update(i,"current_point",e.target.value)} style={{...iInput,fontSize:"12px",padding:"6px 8px",textAlign:"right",width:"80px"}} /></td>
                  <td style={tdStyle({textAlign:"right"})}><input type="number" placeholder="—" value={p.added_point} onChange={e=>update(i,"added_point",e.target.value)} style={{...iInput,fontSize:"12px",padding:"6px 8px",textAlign:"right",width:"80px",color:"#059669"}} /></td>
                  <td style={{...tdStyle({textAlign:"right",background:"#faf5ff"})}}>
                    <span style={{fontFamily:"monospace",fontWeight:700,color:net==null?"#9ca3af":net>0?"#7c3aed":"#dc2626"}}>{net!=null?net:"—"}</span>
                  </td>
                  <td style={tdStyle()}>
                    {players.length>1&&<button onClick={()=>removePlayer(i)} style={{background:"none",border:"none",cursor:"pointer",color:"#d1d5db",fontSize:"16px",lineHeight:1,padding:"2px"}} onMouseEnter={e=>e.currentTarget.style.color="#f87171"} onMouseLeave={e=>e.currentTarget.style.color="#d1d5db"}>×</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{borderTop:"2px solid #e9d5ff",background:"#faf5ff"}}>
              <td colSpan={5} style={{padding:"10px 12px",fontSize:"13px",fontWeight:600,color:"#7c3aed"}}>Total Net</td>
              <td style={{padding:"10px 12px",textAlign:"right",fontFamily:"monospace",fontSize:"15px",fontWeight:700,color:"#7c3aed"}}>{totalNet}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <div style={{display:"flex",gap:"8px"}}>
        <button onClick={onClose} style={{flex:1,fontSize:"13px",padding:"10px",border:"1px solid #e5e7eb",borderRadius:"8px",background:"#fff",color:"#6b7280",cursor:"pointer"}}>Cancel</button>
        <button onClick={handleSave} disabled={saving||!date||!players.some(p=>p.name.trim())}
          style={{flex:2,fontSize:"13px",fontWeight:600,padding:"10px",borderRadius:"8px",border:"none",background:saving?"#9ca3af":"#7c3aed",color:"#fff",cursor:saving?"not-allowed":"pointer"}}>
          {saving?"Saving…":"Save session"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Game Record Page ─────────────────────────────────────────────────────────
export default function GameRecord() {
  const [sessions,   setSessions]   = useState([]);
  const [playerMap,  setPlayerMap]  = useState({});
  const [loading,    setLoading]    = useState(true);
  const [showNew,    setShowNew]    = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editSession,setEditSession]= useState(null);
  const [delSession, setDelSession] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo,   setFilterTo]   = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data:games } = await supabase.from("game_records").select("*").order("date",{ascending:false}).order("session_number",{ascending:false});
    if (games) {
      setSessions(games);
      const ids = games.map(g=>g.id);
      if (ids.length>0) {
        const { data:players } = await supabase.from("game_players").select("*").in("game_id",ids).order("number");
        if (players) {
          const map={};
          players.forEach(p=>{ if(!map[p.game_id])map[p.game_id]=[]; map[p.game_id].push(p); });
          setPlayerMap(map);
        }
      }
    }
    setLoading(false);
  },[]);

  useEffect(()=>{ fetchAll(); },[fetchAll]);

  const filtered = sessions.filter(s=>{
    if (filterFrom && s.date<filterFrom) return false;
    if (filterTo   && s.date>filterTo)   return false;
    return true;
  });

  const lastSession = sessions.length>0
    ? { ...sessions[0], players:playerMap[sessions[0].id]??[] }
    : null;

  async function handleDelete(id) {
    await supabase.from("game_records").delete().eq("id",id);
    setSessions(prev=>prev.filter(s=>s.id!==id));
    setPlayerMap(prev=>{ const m={...prev}; delete m[id]; return m; });
  }

  return (
    <div style={{minHeight:"100vh",backgroundColor:"#f8fafc"}}>
      <div style={{maxWidth:"900px",margin:"0 auto",padding:"40px 20px"}}>

        {showNew      && <NewSessionModal    lastSession={lastSession} onSave={()=>{ setSessions([]); fetchAll(); }} onClose={()=>setShowNew(false)} />}
        {showDetail   && <SessionDetailModal session={showDetail}      onClose={()=>setShowDetail(null)} />}
        {editSession  && <EditSessionModal   session={editSession} existingPlayers={playerMap[editSession.id]??[]} onSave={fetchAll} onClose={()=>setEditSession(null)} />}
        {delSession   && <ConfirmModal       session={delSession}  onConfirm={handleDelete} onClose={()=>setDelSession(null)} />}

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"28px"}}>
          <div>
            <h1 style={{fontSize:"26px",fontWeight:700,color:"#111827",margin:0}}>Game Records</h1>
            <p style={{fontSize:"14px",color:"#9ca3af",marginTop:"4px"}}>Point tracker · session by session</p>
          </div>
          <button onClick={()=>setShowNew(true)} style={{fontSize:"13px",fontWeight:600,padding:"10px 22px",borderRadius:"10px",border:"none",cursor:"pointer",background:"#7c3aed",color:"#fff"}}
            onMouseEnter={e=>e.currentTarget.style.background="#6d28d9"}
            onMouseLeave={e=>e.currentTarget.style.background="#7c3aed"}>
            + New Record
          </button>
        </div>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"12px",marginBottom:"24px"}}>
          {[
            {label:"Total sessions",  value:sessions.length,                                                                      color:"#374151",bg:"#fff",    border:"#f0f0f0"},
            {label:"Total net pts",   value:sessions.reduce((s,g)=>s+num(g.total_net),0),                                         color:"#7c3aed",bg:"#faf5ff", border:"#e9d5ff"},
            {label:"Avg per session", value:sessions.length?Math.round(sessions.reduce((s,g)=>s+num(g.total_net),0)/sessions.length):0, color:"#1e40af",bg:"#eff6ff",border:"#bfdbfe"},
          ].map(s=>(
            <div key={s.label} style={{background:s.bg,borderRadius:"12px",padding:"14px 18px",border:`1px solid ${s.border}`}}>
              <p style={{fontSize:"11px",color:s.color,textTransform:"uppercase",letterSpacing:"0.05em",margin:"0 0 4px",opacity:0.6}}>{s.label}</p>
              <p style={{fontSize:"22px",fontWeight:700,fontFamily:"monospace",color:s.color,margin:0}}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* History header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"}}>
          <p style={{fontSize:"13px",fontWeight:600,color:"#7c3aed",textTransform:"uppercase",letterSpacing:"0.05em",margin:0}}>Session history</p>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{fontSize:"12px",color:"#7c3aed",background:"#faf5ff",borderRadius:"6px",padding:"4px 10px",border:"1px solid #e9d5ff"}}>{filtered.length} sessions</span>
            <button onClick={()=>setShowFilter(v=>!v)} style={{fontSize:"12px",fontWeight:600,padding:"5px 14px",borderRadius:"7px",border:"1px solid #e9d5ff",background:showFilter?"#7c3aed":"#faf5ff",color:showFilter?"#fff":"#7c3aed",cursor:"pointer"}}>
              {showFilter?"Close":"Filter"}
            </button>
          </div>
        </div>

        {/* Filter */}
        {showFilter && (
          <div style={{background:"#fff",border:"1px solid #e9d5ff",borderRadius:"12px",padding:"16px",marginBottom:"16px",boxShadow:"0 4px 16px rgba(124,58,237,0.08)"}}>
            <p style={{fontSize:"12px",fontWeight:600,color:"#7c3aed",margin:"0 0 12px",textTransform:"uppercase",letterSpacing:"0.05em"}}>Filter by date</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
              <div><label style={iLabel}>From</label><input type="date" value={filterFrom} onChange={e=>setFilterFrom(e.target.value)} style={iInput} /></div>
              <div><label style={iLabel}>To</label><input type="date" value={filterTo} onChange={e=>setFilterTo(e.target.value)} style={iInput} /></div>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:"12px",color:"#6b7280"}}>{filtered.length} of {sessions.length} sessions</span>
              <div style={{display:"flex",gap:"8px"}}>
                {(filterFrom||filterTo)&&<button onClick={()=>{setFilterFrom("");setFilterTo("");}} style={{fontSize:"12px",padding:"6px 14px",border:"1px solid #e5e7eb",borderRadius:"7px",background:"#fff",color:"#6b7280",cursor:"pointer"}}>Clear</button>}
                <button onClick={()=>setShowFilter(false)} style={{fontSize:"12px",fontWeight:600,padding:"6px 14px",border:"none",borderRadius:"7px",background:"#7c3aed",color:"#fff",cursor:"pointer"}}>Apply</button>
              </div>
            </div>
          </div>
        )}

        {/* Sessions list */}
        {loading ? (
          <p style={{textAlign:"center",fontSize:"14px",color:"#9ca3af",padding:"40px 0"}}>Loading…</p>
        ) : filtered.length===0 ? (
          <div style={{textAlign:"center",fontSize:"14px",color:"#9ca3af",padding:"40px 0",border:"1px solid #f3f4f6",borderRadius:"12px",background:"#fff"}}>
            {sessions.length===0?`No sessions yet — click "+ New session" to start.`:"No sessions match your filter."}
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
            {filtered.map(g=>{
              const players = playerMap[g.id]??[];
              const short   = getDayShort(g.date);
              const pill    = DAY_PILL[short]??"bg-gray-100 text-gray-600";
              return (
                <div key={g.id} style={{background:"#fff",border:"1px solid #f0f0f0",borderRadius:"12px",overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
                  {/* Session header */}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:"1px solid #f9f0ff",background:"#fdfbff"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap"}}>
                      <span style={{fontSize:"12px",fontWeight:700,color:"#7c3aed",background:"#f5f3ff",border:"1px solid #e9d5ff",borderRadius:"6px",padding:"3px 10px"}}>
                        Session #{g.session_number}
                      </span>
                      <span style={{fontFamily:"monospace",fontSize:"13px",color:"#4b5563",fontWeight:500}}>{g.date}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pill}`}>{getDayFull(g.date)}</span>
                      {g.note&&<span style={{fontSize:"12px",color:"#9ca3af"}}>· {g.note}</span>}
                    </div>

                    {/* Action buttons */}
                    <div style={{display:"flex",gap:"6px",marginLeft:"12px",flexShrink:0}}>
                      <button onClick={()=>setShowDetail(g)}
                        style={{fontSize:"12px",fontWeight:600,padding:"5px 12px",borderRadius:"7px",border:"1px solid #e9d5ff",background:"#f5f3ff",color:"#7c3aed",cursor:"pointer"}}
                        onMouseEnter={e=>e.currentTarget.style.background="#ede9fe"}
                        onMouseLeave={e=>e.currentTarget.style.background="#f5f3ff"}>Show</button>
                      <button onClick={()=>setEditSession(g)}
                        style={{fontSize:"12px",fontWeight:600,padding:"5px 12px",borderRadius:"7px",border:"1px solid #bfdbfe",background:"#eff6ff",color:"#1d4ed8",cursor:"pointer"}}
                        onMouseEnter={e=>e.currentTarget.style.background="#dbeafe"}
                        onMouseLeave={e=>e.currentTarget.style.background="#eff6ff"}>Edit</button>
                      <button onClick={()=>setDelSession(g)}
                        style={{fontSize:"12px",fontWeight:600,padding:"5px 12px",borderRadius:"7px",border:"1px solid #fecaca",background:"#fef2f2",color:"#dc2626",cursor:"pointer"}}
                        onMouseEnter={e=>e.currentTarget.style.background="#fee2e2"}
                        onMouseLeave={e=>e.currentTarget.style.background="#fef2f2"}>Delete</button>
                    </div>
                  </div>

                  {/* Player table */}
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:"13px"}}>
                      <thead>
                        <tr>
                          <th style={thStyle({width:"40px"})}>#</th>
                          <th style={thStyle()}>Name</th>
                          <th style={thStyle({textAlign:"right"})}>Previous</th>
                          <th style={thStyle({textAlign:"right"})}>Current</th>
                          <th style={thStyle({textAlign:"right"})}>Added</th>
                          <th style={thStyle({textAlign:"right",color:"#7c3aed",background:"#faf5ff"})}>Net Point</th>
                        </tr>
                      </thead>
                      <tbody>
                        {players.map(p=>(
                          <tr key={p.id}
                            onMouseEnter={e=>e.currentTarget.style.background="#faf5ff"}
                            onMouseLeave={e=>e.currentTarget.style.background=""}>
                            <td style={tdStyle()}><span style={{background:"#f3f4f6",color:"#6b7280",fontSize:"11px",fontFamily:"monospace",borderRadius:"4px",padding:"2px 5px"}}>{p.number}</span></td>
                            <td style={tdStyle({fontWeight:500})}>{p.name}</td>
                            <td style={tdStyle({textAlign:"right",fontFamily:"monospace",color:"#6b7280"})}>{num(p.previous_point)}</td>
                            <td style={tdStyle({textAlign:"right",fontFamily:"monospace",color:"#6b7280"})}>{num(p.current_point)}</td>
                            <td style={tdStyle({textAlign:"right",fontFamily:"monospace",color:"#059669",fontWeight:500})}>{p.added_point!=null?num(p.added_point):"—"}</td>
                            <td style={{...tdStyle({textAlign:"right",fontFamily:"monospace",fontWeight:700,background:"#faf5ff"}),color:num(p.net_point)>0?"#7c3aed":"#dc2626"}}>
                              {num(p.net_point)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{borderTop:"2px solid #e9d5ff",background:"#faf5ff"}}>
                          <td colSpan={5} style={{padding:"9px 12px",fontSize:"12px",fontWeight:600,color:"#7c3aed"}}>Total Net</td>
                          <td style={{padding:"9px 12px",textAlign:"right",fontFamily:"monospace",fontSize:"14px",fontWeight:700,color:"#7c3aed"}}>{num(g.total_net)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
