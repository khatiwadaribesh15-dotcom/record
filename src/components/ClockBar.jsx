import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

function fmtElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = n => String(n).padStart(2, "0");
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

export default function ClockBar() {
  const [activeShift, setActiveShift] = useState(null);
  const [elapsed,     setElapsed]     = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [name,        setName]        = useState("");
  const [offsetMs,    setOffsetMs]    = useState(0);

  async function syncServerOffset() {
    const t0 = Date.now();
    const { data } = await supabase.rpc("server_now");
    const t1 = Date.now();
    if (data) {
      const serverMs = new Date(data).getTime();
      setOffsetMs(serverMs - (t0 + t1) / 2);
    }
  }

  useEffect(() => {
    async function load() {
      await syncServerOffset();
      const { data } = await supabase
        .from("shifts")
        .select("*")
        .is("clock_out", null)
        .order("clock_in", { ascending: false })
        .limit(1);
      setActiveShift(data?.[0] ?? null);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!activeShift) { setElapsed(0); return; }
    function tick() {
      const serverNow = Date.now() + offsetMs;
      setElapsed(Math.max(0, Math.floor((serverNow - new Date(activeShift.clock_in).getTime()) / 1000)));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeShift, offsetMs]);

  async function clockIn() {
    setSaving(true);
    await syncServerOffset();
    const { data } = await supabase
      .from("shifts")
      .insert({ name: name.trim() || null })
      .select()
      .single();
    setActiveShift(data);
    setName("");
    setSaving(false);
  }

  async function clockOut() {
    if (!activeShift) return;
    setSaving(true);
    await supabase
      .from("shifts")
      .update({ clock_out: new Date().toISOString() })
      .eq("id", activeShift.id);
    setActiveShift(null);
    setSaving(false);
  }

  if (loading) return null;

  const clocked = !!activeShift;

  return (
    <div style={{
      position:       "fixed",
      bottom:         0,
      left:           0,
      right:          0,
      zIndex:         200,
      background:     clocked ? "#0f172a" : "#f8fafc",
      borderTop:      `1px solid ${clocked ? "#1e293b" : "#e5e7eb"}`,
      padding:        "10px 20px",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "space-between",
      gap:            "16px",
      boxShadow:      "0 -2px 12px rgba(0,0,0,0.08)",
      minHeight:      "58px",
    }}>
      {/* Left: status / name input */}
      <div style={{ flex: 1 }}>
        {clocked ? (
          <>
            <div style={{ fontSize:"10px", color:"#64748b", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"2px" }}>
              Active Shift
            </div>
            <div style={{ fontSize:"12px", color:"#94a3b8" }}>
              {activeShift.name ? <strong style={{ color:"#cbd5e1" }}>{activeShift.name}</strong> : null}
              {activeShift.name ? " · " : ""}
              Since {new Date(activeShift.clock_in).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
            </div>
          </>
        ) : (
          <input
            type="text"
            placeholder="Name (optional)"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !saving && clockIn()}
            style={{
              fontSize:        "13px",
              padding:         "7px 10px",
              border:          "1px solid #e5e7eb",
              borderRadius:    "7px",
              background:      "#fff",
              color:           "#1f2937",
              outline:         "none",
              width:           "100%",
              maxWidth:        "200px",
              boxSizing:       "border-box",
            }}
          />
        )}
      </div>

      {/* Center: live timer */}
      {clocked && (
        <div style={{
          fontFamily:    "monospace",
          fontSize:      "22px",
          fontWeight:    700,
          color:         "#f1f5f9",
          letterSpacing: "0.04em",
          flexShrink:    0,
        }}>
          {fmtElapsed(elapsed)}
        </div>
      )}

      {/* Right: button */}
      <button
        onClick={clocked ? clockOut : clockIn}
        disabled={saving}
        style={{
          padding:      "9px 22px",
          borderRadius: "8px",
          border:       "none",
          fontSize:     "13px",
          fontWeight:   600,
          cursor:       saving ? "not-allowed" : "pointer",
          background:   saving ? "#9ca3af" : clocked ? "#ef4444" : "#059669",
          color:        "#fff",
          minWidth:     "100px",
          flexShrink:   0,
          transition:   "background 0.15s",
        }}
      >
        {saving ? "…" : clocked ? "Clock Out" : "Clock In"}
      </button>
    </div>
  );
}
