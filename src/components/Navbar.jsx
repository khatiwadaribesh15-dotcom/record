import { useLocation, useNavigate } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { path: "/",      label: "Payment Records" },
    { path: "/game",  label: "Game Records" },
  ];

  return (
    <div style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      backgroundColor: "#fff",
      borderBottom: "1px solid #f0f0f0",
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    }}>
      <div style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "56px",
      }}>
        {/* Logo */}
        <span style={{ fontSize: "18px", fontWeight: 700, color: "#111827", letterSpacing: "-0.5px" }}>
          Kaam
        </span>

        {/* Nav buttons */}
        <div style={{ display: "flex", gap: "6px" }}>
          {links.map(link => {
            const active = location.pathname === link.path;
            const isGame = link.path === "/game";
            const activeColor  = isGame ? "#7c3aed" : "#059669";
            const activeBg     = isGame ? "#f5f3ff" : "#f0fdf4";
            const activeBorder = isGame ? "#e9d5ff" : "#bbf7d0";

            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                style={{
                  fontSize: "13px",
                  fontWeight: active ? 600 : 500,
                  padding: "7px 18px",
                  borderRadius: "8px",
                  border: active ? `1px solid ${activeBorder}` : "1px solid transparent",
                  background: active ? activeBg : "transparent",
                  color: active ? activeColor : "#6b7280",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = "#f9fafb";
                    e.currentTarget.style.color = "#374151";
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#6b7280";
                  }
                }}
              >
                {link.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
