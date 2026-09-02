import React, { useState, useEffect, useCallback } from "react";
import {
  Boxes, PlusCircle, Play, FileText, BookOpen, Target, Theater, LayoutGrid, Shield,
  BarChart3, Users, Eye, Star, LayoutTemplate, PenTool, Mic,
  Trophy, CalendarDays, Lock, Settings, Download,
  Activity, Zap, TrendingUp,
  ChevronRight, PanelLeftClose, PanelLeft, LogOut, HelpCircle, Briefcase, Menu,
  AudioWaveform
} from "lucide-react";

/* ============================================================
   Enterprise Sidebar — clean grouped navigation with Lucide icons
   Features: collapse/expand, grouped nav, active highlight, responsive
   ============================================================ */

const NAV_GROUPS = [
  {
    id: "sell",
    label: "Sell",
    items: [
      { id: "products", label: "Products" },
      { id: "studio", label: "Call Studio" },
      { id: "scripts", label: "Scripts" },
    ],
  },
  {
    id: "prepare",
    label: "Prepare",
    items: [
      { id: "training", label: "Training" },
      { id: "practice", label: "Practice" },
      { id: "roleplay", label: "Role-play" },
      { id: "components", label: "Components" },
      { id: "battle", label: "Battle Cards" },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    items: [
      { id: "analytics", label: "Analytics" },
      { id: "coaching", label: "Coaching" },
      { id: "competitor", label: "Competitors" },
      { id: "dealscore", label: "Deal Scores" },
      { id: "heatmap", label: "Conversation Intelligence" },
      { id: "analysis", label: "Call Analysis" },
    ],
  },
  {
    id: "optimize",
    label: "Optimize",
    items: [
      { id: "refinement", label: "Script Refinement" },
      { id: "auto_opt", label: "AI Optimization" },
      { id: "selfimprove", label: "Self-Improvement" },
      { id: "abtesting", label: "A/B Tests" },
      { id: "voice", label: "Voice DNA" },
    ],
  },
  {
    id: "team",
    label: "Team",
    items: [
      { id: "team", label: "Team" },
      { id: "leaderboard", label: "Leaderboard" },
      { id: "schedule", label: "Scheduled Calls" },
      { id: "permissions", label: "Permissions" },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    items: [
      { id: "settings", label: "Settings" },
      { id: "export", label: "Export" },
      { id: "automation", label: "Automation" },
    ],
  },
];

const ICON_MAP = {
  products: Boxes,
  add: PlusCircle,
  studio: Play,
  scripts: FileText,
  training: BookOpen,
  practice: Target,
  roleplay: Theater,
  components: LayoutGrid,
  battle: Shield,
  analytics: BarChart3,
  coaching: Users,
  competitor: Eye,
  dealscore: Star,
  heatmap: Activity,
  analysis: AudioWaveform,
  selfimprove: TrendingUp,
  refinement: PenTool,
  auto_opt: TrendingUp,
  abtesting: Boxes,
  voice: Mic,
  team: Users,
  leaderboard: Trophy,
  schedule: CalendarDays,
  permissions: Lock,
  settings: Settings,
  export: Download,
  automation: Zap,
};

function NavIcon({ id }) {
  const Icon = ICON_MAP[id];
  if (!Icon) return null;
  return <Icon size={18} strokeWidth={2} />;
}

function getInitials(email) {
  if (!email) return "?";
  const parts = email.split("@")[0].split(/[._-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

export default function Sidebar({ view, setView, active, company, workspace, user, logout, canGenerate }) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("ps_sidebar_collapsed") === "true"; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(() => {
    try {
      const raw = localStorage.getItem("ps_sidebar_groups");
      if (raw) return new Set(JSON.parse(raw));
    } catch { /* noop */ }
    return new Set(["sell", "intelligence", "optimize"]);
  });

  useEffect(() => {
    try { localStorage.setItem("ps_sidebar_collapsed", String(collapsed)); } catch { /* noop */ }
  }, [collapsed]);

  useEffect(() => {
    try { localStorage.setItem("ps_sidebar_groups", JSON.stringify([...expandedGroups])); } catch { /* noop */ }
  }, [expandedGroups]);

  const toggleGroup = useCallback((gid) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(gid)) next.delete(gid);
      else next.add(gid);
      return next;
    });
  }, []);

  const navigateTo = useCallback((id) => {
    setView(id);
    setMobileOpen(false);
  }, [setView]);

  const isMember = !canGenerate; // canGenerate is true for admin/manager, false for member

  // Filter nav groups based on role
  const filteredGroups = NAV_GROUPS.map((group) => {
    let items = group.items;
    let label = group.label;
    if (isMember) {
      // Members only see "Scripts" in the sell group, renamed to "My Scripts"
      if (group.id === 'sell') {
        items = items.filter((item) => item.id === 'scripts');
        label = 'My Scripts';
      }
      // Members don't see Team group at all
      if (group.id === 'team') {
        return null;
      }
      // Members don't see Admin group
      if (group.id === 'admin') {
        return null;
      }
    } else {
      // Non-members (admin/manager) see Team nav item but not "Permissions" unless admin
      if (group.id === 'team') {
        // Keep team visible for admin/manager
        items = items.filter((item) => item.id !== 'permissions' || user?.role === 'admin');
      }
    }
    return { ...group, items, label };
  }).filter(Boolean).filter((g) => g.items.length > 0);

  // Bottom tab items for mobile
  const BT_ITEMS = [
    { id: "products", label: "Products", icon: Boxes },
    { id: "studio", label: "Studio", icon: Play },
    { id: "scripts", label: "Scripts", icon: FileText },
    { id: "practice", label: "Practice", icon: Target },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="es-mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile toggle (hidden on mobile via CSS — "More" tab replaces it) */}
      <button className="es-mobile-toggle" onClick={() => setMobileOpen((o) => !o)} aria-label="Toggle menu">
        <Menu size={20} />
      </button>

      {/* Bottom tab bar (mobile) */}
      <div className="bt-bar">
        {BT_ITEMS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = view === tab.id;
          return (
            <button
              key={tab.id}
              className={`bt-item${isActive ? " es-active" : ""}`}
              onClick={() => navigateTo(tab.id)}
            >
              <span className="bt-icon"><TabIcon size={18} strokeWidth={2} /></span>
              {tab.label}
            </button>
          );
        })}
        <button
          className={`bt-item${mobileOpen ? " es-active" : ""}`}
          onClick={() => setMobileOpen((o) => !o)}
        >
          <span className="bt-icon"><Menu size={18} strokeWidth={2} /></span>
          More
        </button>
      </div>

      {/* Sidebar */}
      <nav className={`es-sidebar ${collapsed ? "es-collapsed" : ""} ${mobileOpen ? "es-mobile-open" : ""}`} role="navigation" aria-label="Main navigation">
        {/* Brand */}
        <div className="es-brand">
          <div className="es-brand-mark">
            <span className="es-brand-dot" />
            {!collapsed && <span className="es-brand-text">Pitch Studio</span>}
          </div>
          <button className="es-collapse-btn" onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? "Expand" : "Collapse"}>
            {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {/* Workspace */}
        <div className="es-workspace">
          <span className="es-workspace-icon"><Briefcase size={16} strokeWidth={2} /></span>
          {!collapsed && (
            <span className="es-workspace-name">{company || workspace?.name || user?.company_name || "Workspace"}</span>
          )}
        </div>

        {/* Nav groups */}
        <div className="es-nav-scroll">
          {filteredGroups.map((group) => (
            <div key={group.id} className="es-section">
              <button
                className={`es-group-header ${expandedGroups.has(group.id) ? "es-expanded" : ""}`}
                onClick={() => toggleGroup(group.id)}
                aria-expanded={expandedGroups.has(group.id)}
              >
                <span className={`es-group-chevron ${expandedGroups.has(group.id) ? "es-rotated" : ""}`}>
                  <ChevronRight size={14} />
                </span>
                {!collapsed && <span className="es-group-label">{group.label}</span>}
              </button>
              {(!collapsed && expandedGroups.has(group.id)) && (
                <div className="es-section-items">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      className={`es-nav-item ${view === item.id ? "es-active" : ""}`}
                      onClick={() => navigateTo(item.id)}
                      aria-current={view === item.id ? "page" : undefined}
                    >
                      <span className="es-nav-icon"><NavIcon id={item.id} /></span>
                      <span className="es-nav-label">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="es-footer">
          <div className="es-user">
            <div className="es-user-avatar">{getInitials(user?.email)}</div>
            {!collapsed && (
              <div className="es-user-info">
                <div className="es-user-name">{user?.email?.split("@")[0] || "User"}</div>
                <div className="es-user-email">{user?.email}</div>
              </div>
            )}
          </div>
          <div className="es-footer-actions">
            <button className="es-footer-btn" onClick={() => navigateTo("settings")}>
              <Settings size={16} />
              {!collapsed && <span>Settings</span>}
            </button>
            <button className="es-footer-btn" disabled title="Coming soon">
              <HelpCircle size={16} />
              {!collapsed && <span>Help</span>}
            </button>
            <button className="es-footer-btn" onClick={logout}>
              <LogOut size={16} />
              {!collapsed && <span>Sign out</span>}
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
