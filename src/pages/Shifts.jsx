import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

function fmtDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}
function fmtTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function fmtDuration(mins) {
  if (mins == null) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const th = (extra = {}) => ({
  fontSize: "11px", color: "#6b7280", fontWeight: 500,
  textTransform: "uppercase", letterSpacing: "0.05em",
  padding: "10px 16px", textAlign: "left",
  borderBottom: "1px solid #f3f4f6", background: "#fafafa",
  whiteSpace: "nowrap", ...extra,
});
const td = (extra = {}) => ({
  fontSize: "13px", color: "#1f2937",
  padding: "12px 16px", ...extra,
});

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ shift, onSave, onClose }) {
  const [name,   setName]   = useState(shift.name ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(shift.id, name.trim() || null);
    setSaving(false);
    onClose();
  }

  return createPortal(
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
      }}
    >
      <div style={{
        backgroundColor: "#fff", borderRadius: "16px",
        width: "100%", maxWidth: "360px", padding: "24px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#111827", margin: 0 }}>Edit shift name</h2>
          <button onClick={onClose} style={{ fontSize: "22px", color: "#9ca3af", background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ marginBottom: "8px" }}>
          <label style={{ display: "block", fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "5px" }}>Name</label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSave()}
            placeholder="Enter name…"
            style={{ width: "100%", fontSize: "13px", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: "7px", backgroundColor: "#f9fafb", color: "#1f2937", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {/* Read-only info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "12px", marginBottom: "20px" }}>
          {[["Clock In", fmtTime(shift.clock_in)], ["Clock Out", shift.clock_out ? fmtTime(shift.clock_out) : "Active"]].map(([label, val]) => (
            <div key={label} style={{ background: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: "7px", padding: "8px 10px" }}>
              <div style={{ fontSize: "10px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>{label}</div>
              <div style={{ fontSize: "13px", color: "#6b7280" }}>{val}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onClose} style={{ flex: 1, fontSize: "13px", padding: "9px", border: "1px solid #e5e7eb", borderRadius: "8px", background: "#fff", color: "#6b7280", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, fontSize: "13px", padding: "9px", fontWeight: 600, borderRadius: "8px", border: "none", background: saving ? "#9ca3af" : "#111827", color: "#fff", cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
function DeleteModal({ shift, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await onConfirm(shift.id);
    setDeleting(false);
    onClose();
  }

  return createPortal(
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
      }}
    >
      <div style={{
        backgroundColor: "#fff", borderRadius: "16px",
        width: "100%", maxWidth: "340px", padding: "24px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)", textAlign: "center",
      }}>
        <div style={{ fontSize: "36px", marginBottom: "12px" }}>🗑️</div>
        <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>Delete shift?</h2>
        <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 24px", lineHeight: 1.5 }}>
          {fmtDate(shift.clock_in)} · {fmtTime(shift.clock_in)} – {shift.clock_out ? fmtTime(shift.clock_out) : "Active"}<br />
          This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onClose} style={{ flex: 1, fontSize: "13px", padding: "9px", border: "1px solid #e5e7eb", borderRadius: "8px", background: "#fff", color: "#6b7280", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, fontSize: "13px", padding: "9px", fontWeight: 600, borderRadius: "8px", border: "none", background: deleting ? "#9ca3af" : "#ef4444", color: "#fff", cursor: deleting ? "not-allowed" : "pointer" }}>
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Shifts() {
  const [shifts,      setShifts]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [editShift,   setEditShift]   = useState(null);
  const [deleteShift, setDeleteShift] = useState(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("shifts")
        .select("*")
        .order("clock_in", { ascending: false });
      setShifts(data ?? []);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel("shifts-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "shifts" }, payload => {
        if (payload.eventType === "INSERT") {
          setShifts(prev => [payload.new, ...prev.filter(s => s.id !== payload.new.id)]);
        } else if (payload.eventType === "UPDATE") {
          setShifts(prev => prev.map(s => s.id === payload.new.id ? payload.new : s));
        } else if (payload.eventType === "DELETE") {
          setShifts(prev => prev.filter(s => s.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function handleSaveName(id, name) {
    await supabase.from("shifts").update({ name }).eq("id", id);
    setShifts(prev => prev.map(s => s.id === id ? { ...s, name } : s));
  }

  async function handleDelete(id) {
    await supabase.from("shifts").delete().eq("id", id);
    setShifts(prev => prev.filter(s => s.id !== id));
  }

  const completed    = shifts.filter(s => s.clock_out);
  const totalMinutes = completed.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "40px 20px 80px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
          Shift Records
        </h1>
        <p style={{ fontSize: "13px", color: "#9ca3af", margin: 0 }}>
          {completed.length} completed shift{completed.length !== 1 ? "s" : ""}
          {totalMinutes > 0 && ` · Total: ${fmtDuration(totalMinutes)}`}
        </p>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "#9ca3af", fontSize: "13px", padding: "40px 0" }}>Loading…</p>
      ) : shifts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>⏱️</div>
          <p style={{ fontSize: "14px", color: "#9ca3af", margin: 0 }}>No shifts recorded yet. Tap Clock In to start.</p>
        </div>
      ) : (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th()}>Name</th>
                <th style={th()}>Date</th>
                <th style={th()}>Clock In</th>
                <th style={th()}>Clock Out</th>
                <th style={th({ textAlign: "right" })}>Duration</th>
                <th style={th({ width: "80px" })} />
              </tr>
            </thead>
            <tbody>
              {shifts.map((s, i) => (
                <tr key={s.id} style={{ borderTop: i > 0 ? "1px solid #f3f4f6" : "none" }}>
                  <td style={td({ fontWeight: 500, color: s.name ? "#111827" : "#9ca3af" })}>
                    {s.name ?? "—"}
                  </td>
                  <td style={td()}>{fmtDate(s.clock_in)}</td>
                  <td style={td()}>{fmtTime(s.clock_in)}</td>
                  <td style={td()}>
                    {s.clock_out
                      ? fmtTime(s.clock_out)
                      : <span style={{ fontSize: "11px", fontWeight: 600, color: "#059669", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", padding: "2px 8px" }}>Active</span>
                    }
                  </td>
                  <td style={td({ textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: s.clock_out ? "#1f2937" : "#9ca3af" })}>
                    {fmtDuration(s.duration_minutes)}
                  </td>
                  <td style={td({ textAlign: "right" })}>
                    <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => setEditShift(s)}
                        style={{ fontSize: "11px", fontWeight: 500, padding: "4px 10px", borderRadius: "6px", border: "1px solid #e5e7eb", background: "#f9fafb", color: "#374151", cursor: "pointer" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => s.clock_out && setDeleteShift(s)}
                        disabled={!s.clock_out}
                        title={!s.clock_out ? "Clock out before deleting" : ""}
                        style={{
                          fontSize: "11px", fontWeight: 500, padding: "4px 10px", borderRadius: "6px",
                          border: `1px solid ${s.clock_out ? "#fecaca" : "#e5e7eb"}`,
                          background:  s.clock_out ? "#fff1f2" : "#f9fafb",
                          color:       s.clock_out ? "#ef4444" : "#d1d5db",
                          cursor:      s.clock_out ? "pointer" : "not-allowed",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editShift   && <EditModal   shift={editShift}   onSave={handleSaveName} onClose={() => setEditShift(null)}   />}
      {deleteShift && <DeleteModal shift={deleteShift} onConfirm={handleDelete} onClose={() => setDeleteShift(null)} />}
    </div>
  );
}
