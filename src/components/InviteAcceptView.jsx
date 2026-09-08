import React, { useEffect, useState } from "react";
import { Check, AlertCircle, Mail, Loader2 } from "lucide-react";
import { useBrand, withSiteName } from "../context/BrandContext.jsx";

/* ============================================================
   InviteAcceptView — public page at /invite/:token, linked from
   the team-invite email. Accepts the invitation via the public
   accept endpoint, signs the invitee in with the returned JWT,
   and lands them on the Team page.
   ============================================================ */

export default function InviteAcceptView({ token }) {
  const { branding } = useBrand();
  const siteName = branding.site_name || "Pitch Studio";
  const [state, setState] = useState("working"); // working | ok | error
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/team/invite/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));
        if (!alive) return;
        if (!res.ok) {
          setState("error");
          setMessage(data.error || `Invitation could not be accepted (${res.status})`);
          return;
        }
        // Sign in as the invited account and go to the team page.
        if (data.token) localStorage.setItem("ps_token", data.token);
        setState("ok");
        setMessage("You're in! Taking you to your team…");
        setTimeout(() => { window.location.href = "/team"; }, 1400);
      } catch (e) {
        if (!alive) return;
        setState("error");
        setMessage("Network error — please try again.");
      }
    })();
    return () => { alive = false; };
  }, [token]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg, #F6F7FB)", padding: 20, fontFamily: "Inter, system-ui, sans-serif",
    }}>
      <div style={{
        width: "100%", maxWidth: 420, background: "var(--card, #fff)", borderRadius: 16,
        border: "1px solid var(--line, #E6E8F0)", padding: "36px 30px", textAlign: "center",
        boxShadow: "0 12px 40px rgba(20,24,60,.08)",
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, margin: "0 auto 16px",
          background: "var(--accent-soft, #EFEBFF)", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {state === "working" && <Loader2 size={24} style={{ color: "var(--accent, #7B61FF)", animation: "spin 1s linear infinite" }} />}
          {state === "ok" && <Check size={24} style={{ color: "#12A374" }} />}
          {state === "error" && <AlertCircle size={24} style={{ color: "#B23237" }} />}
        </div>

        <div style={{ fontWeight: 800, fontSize: 19, marginBottom: 8 }}>
          {state === "ok" ? "Invite accepted" : state === "error" ? "Invite problem" : `Joining ${withSiteName("Pitch Studio", siteName)}…`}
        </div>

        {state === "working" && (
          <div style={{ color: "var(--muted, #6B7280)", fontSize: 14, lineHeight: 1.6 }}>
            Accepting your team invitation — this only takes a second.
          </div>
        )}
        {state === "ok" && (
          <div style={{ color: "var(--ok, #0B7A5B)", fontSize: 14, lineHeight: 1.6 }}>
            {message}
          </div>
        )}
        {state === "error" && (
          <>
            <div style={{ color: "#B23237", fontSize: 14, lineHeight: 1.6, marginBottom: 18 }}>{message}</div>
            <a href="/login" style={{
              display: "inline-block", padding: "10px 18px", borderRadius: 10, fontWeight: 700, fontSize: 14,
              background: "var(--accent, #7B61FF)", color: "#fff", textDecoration: "none",
            }}>
              Go to sign in
            </a>
          </>
        )}

        <div style={{ marginTop: 24, color: "var(--faint, #9AA1B0)", fontSize: 12 }}>
          <Mail size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
          Invited via {withSiteName("Pitch Studio", siteName)}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}