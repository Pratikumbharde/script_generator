import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import { X } from "lucide-react";
import LoginView from "./src/components/LoginView.jsx";
import LandingPage from "./src/components/LandingPage.jsx";
import ProductsView from "./src/components/ProductsView.jsx";
import ScriptsView from "./src/components/ScriptsView.jsx";
import TrainingView from "./src/components/TrainingView.jsx";
import PracticeView from "./src/components/PracticeView.jsx";
import ComponentLibrary from "./src/components/ComponentLibrary.jsx";
import BattleCardsView from "./src/components/BattleCardsView.jsx";
import AnalyticsDashboard from "./src/components/AnalyticsDashboard.jsx";
import RolePlayView from "./src/components/RolePlayView.jsx";
import ScheduledCallsView from "./src/components/ScheduledCallsView.jsx";
import FollowUpsView from "./src/components/FollowUpsView.jsx";
import SettingsView from "./src/components/SettingsView.jsx";
import AutomationRulesView from "./src/components/AutomationRulesView.jsx";
import DataExportView from "./src/components/DataExportView.jsx";
import PermissionsView from "./src/components/PermissionsView.jsx";
import ABTestingView from "./src/components/ABTestingView.jsx";
import ProductForm from "./src/components/ProductForm.jsx";
import ProductDetail from "./src/components/ProductDetail.jsx";
import StudioView from "./src/components/StudioView.jsx";
import TeamView from "./src/components/TeamView.jsx";
import InviteAcceptView from "./src/components/InviteAcceptView.jsx";
import CallAnalysisView from "./src/components/CallAnalysisView.jsx";
import SelfImprovementView from "./src/components/SelfImprovementView.jsx";
import VoiceDNA from "./src/components/VoiceDNA.jsx";
import Sidebar from "./src/components/Sidebar.jsx";
import TourGuide from "./src/components/TourGuide.jsx";
import { useAuth } from "./src/context/AuthContext.jsx";
import { useBrand } from "./src/context/BrandContext.jsx";
import { getPreferences } from "./src/api/client.js";
import { STYLES } from "./src/styles/styles.js";
import { S } from "./src/utils/helpers.js";
import { CardSkeleton, SidebarSkeleton } from "./src/components/shared/Skeletons.jsx";

/* ---------- Lazy-loaded heavy views ----------
   After a new deploy, hashed chunk filenames change and the old ones are
   deleted from the server. A tab still running the previous bundle will 404
   when it tries to lazy-load a view by its stale hash, leaving the chunk's
   exports (e.g. an icon component) undefined mid-render. Retry once with a
   full reload so the tab picks up the current bundle instead of crashing. */
function lazyWithReload(importer) {
  return lazy(() =>
    importer().catch((err) => {
      const key = "ps-chunk-reload-" + importer.toString().match(/["'`]([^"'`]+)["'`]/)?.[1];
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
        return new Promise(() => {}); // suspend forever; reload is already in flight
      }
      throw err;
    })
  );
}

const CoachingInsightsView = lazyWithReload(() => import("./src/components/CoachingInsightsView.jsx"));
const CompetitorIntelView   = lazyWithReload(() => import("./src/components/CompetitorIntelView.jsx"));
const DealScoreView         = lazyWithReload(() => import("./src/components/DealScoreView.jsx"));
const ScriptRefinementView  = lazyWithReload(() => import("./src/components/ScriptRefinementView.jsx"));
const AutoOptimizationView  = lazyWithReload(() => import("./src/components/AutoOptimizationView.jsx"));
const HeatmapView           = lazyWithReload(() => import("./src/components/HeatmapView.jsx"));
const LeaderboardView       = lazyWithReload(() => import("./src/components/LeaderboardView.jsx"));

/* ---------- URL routing ----------
   Every page has a real URL path. `setView` is the single navigation funnel:
   it updates state AND pushes the matching route, so browser back/forward,
   refresh and shareable deep links all work. */
const ROUTE_PATHS = {
  products: "/products",
  product: "/product",           // /product/:id for deep links
  add: "/products/new",          // /product/:id/edit for edit mode
  studio: "/studio",
  scripts: "/scripts",
  followups: "/follow-ups",
  training: "/training",
  practice: "/practice",
  roleplay: "/roleplay",
  components: "/components",
  battle: "/battle-cards",
  analytics: "/analytics",
  coaching: "/coaching",
  competitor: "/competitors",
  dealscore: "/deal-scores",
  heatmap: "/conversation-intelligence",
  analysis: "/call-analysis",    // ?script=:id when opened from studio
  refinement: "/script-refinement",
  auto_opt: "/ai-optimization",
  selfimprove: "/self-improvement",
  abtesting: "/ab-testing",
  voice: "/voice-dna",
  team: "/team",
  leaderboard: "/leaderboard",
  schedule: "/scheduled-calls",
  permissions: "/permissions",
  export: "/export",
  automation: "/automation-rules",
  settings: "/settings",
};
const ROUTE_VIEWS = Object.fromEntries(Object.entries(ROUTE_PATHS).map(([v, p]) => [p, v]));
const AUTH_PATHS = { "/": "landing", "/login": "auth", "/register": "auth-register" };
const AUTH_ROUTE_FOR_SCREEN = { landing: "/", auth: "/login", "auth-register": "/register" };
const normalizePath = (p) => (String(p || "/").replace(/\/+$/, "") || "/");

// URL path → { view, id }. `view` null means "/" (use saved/default view) or unknown.
function parseRoute(pathname) {
  const p = normalizePath(pathname);
  if (p === "/") return { view: null, id: null };
  let m;
  if ((m = p.match(/^\/product\/([^/]+)\/edit$/))) return { view: "add", id: m[1] };
  if ((m = p.match(/^\/product\/([^/]+)$/))) return { view: "product", id: m[1] };
  if ((m = p.match(/^\/invite\/([^/]+)$/))) return { view: "invite", id: m[1] }; // from team-invite emails
  return { view: ROUTE_VIEWS[p] || null, id: null };
}

/* ============================================================
   Pitch Studio — a live-call cockpit for sales teams.
   Enter a product once → pick methodology + call type + duration →
   AI generates a time-segmented script + objection handling, and
   SAVES it. Scripts never regenerate unless you explicitly ask.
   Persistence: window.storage (per-workspace). Generation: Anthropic API.
   ============================================================ */

export default function PitchStudio() {
  const { user, workspace, loading: authLoading, logout, canGenerate } = useAuth();
  const { branding } = useBrand();

  const [ready, setReady] = useState(false);
  // Public landing page before auth; 'auth' shows the login/register form.
  // Password-reset email links (?resetToken=…) skip the landing entirely.
  const [authScreen, setAuthScreen] = useState(() => {
    const p = normalizePath(window.location.pathname);
    if (AUTH_PATHS[p]) return AUTH_PATHS[p];
    return new URLSearchParams(window.location.search).get("resetToken") ? "auth" : "landing";
  });
  const [company, setCompany] = useState("");
  // Deep-linked product id from the URL (/product/:id, /product/:id/edit),
  // resolved once the products list loads.
  const initialRoute = parseRoute(window.location.pathname);
  const routeIdRef = useRef(initialRoute.id || null);
  // Team-invite email links land on /invite/:token — a public accept page.
  const inviteTokenRef = useRef(initialRoute.view === "invite" ? initialRoute.id : null);
  const [view, setViewState] = useState(() => {
    if (initialRoute.view) return initialRoute.view;
    // Members default to scripts view
    const saved = localStorage.getItem('ps_view');
    return saved || 'products';
  }); // products | product | add | studio | team | scripts | training | practice | roleplay | components | battle | analytics | schedule | settings | automation | export | permissions | coaching | abtesting | selfimprove | leaderboard | competitor | dealscore | refinement | auto_opt | heatmap | voice
  // Persist current view so refresh stays on the same page (only while
  // signed in — logged-out page loads shouldn't poison the saved view)
  useEffect(() => { if (user) localStorage.setItem('ps_view', view); }, [view, user]);

  // Auto-refresh products & staff when navigating to views that depend on them
  useEffect(() => {
    const viewsNeedingFreshProducts = ['products', 'product', 'add', 'studio', 'scripts', 'schedule', 'practice', 'roleplay', 'battle', 'team'];
    if (viewsNeedingFreshProducts.includes(view) && user) {
      refreshProducts();
      if (view === 'team') refreshStaff();
    }
  }, [view, user]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [active, setActive] = useState(null); // active product for studio
  const [preset, setPreset] = useState(null); // preset setup when opening from library
  const [studioNonce, setStudioNonce] = useState(0);
  const [studioFrom, setStudioFrom] = useState(null); // where the user entered Call Studio from ("scripts" | null)
  const [staff, setStaff] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [analysisScriptId, setAnalysisScriptId] = useState(
    () => new URLSearchParams(window.location.search).get("script") || null // for navigating to analysis from studio
  );

  // P2.1: PWA install prompt
  const [installPrompt, setInstallPrompt] = useState(null);
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  const installPWA = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  // P6.5: Load theme preference
  useEffect(() => {
    const saved = localStorage.getItem('ps_theme');
    if (saved) {
      document.querySelector('.ps-root')?.setAttribute('data-theme', saved);
    } else {
      // No local theme yet — try loading from server preferences
      getPreferences().then(p => {
        if (p?.theme) {
          localStorage.setItem('ps_theme', p.theme);
          document.querySelector('.ps-root')?.setAttribute('data-theme', p.theme);
        }
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!user) { setReady(true); return; }
    (async () => {
      const settings = await S.get("psettings:company");
      setCompany(settings?.name || workspace?.name || "");
      setProducts(await S.list("pproduct:"));
      setStaff(await S.list("pstaff:"));
      setReady(true);
    })();
  }, [user, workspace]);

  const saveCompany = async (name) => { setCompany(name); await S.set("psettings:company", { name }); };
  const refreshProducts = async () => setProducts(await S.list("pproduct:"));
  const refreshStaff = async () => setStaff(await S.list("pstaff:"));
  const openStudio = (product, ps = null, from = null) => { setActive(product); setPreset(ps); setStudioFrom(from); setStudioNonce((n) => n + 1); setView("studio"); };
  const backFromStudio = () => { // "Back" in Call Studio returns to where the user came from — the workspace picker by default
    setActive(null); setPreset(null);
    if (studioFrom === "scripts") { setStudioFrom(null); setView("scripts"); }
    else setStudioFrom(null);
  };
  const teamLanguages = [...new Set(staff.flatMap((s) => s.languages || ["en"]))];
  const isMember = user?.role === 'member';

  /* ---------- URL <-> view sync ---------- */
  // Current state for product ids, readable inside setView without stale closures
  const selectedProductRef = useRef(null);
  selectedProductRef.current = selectedProduct;
  const editingProductRef = useRef(null);
  editingProductRef.current = editingProduct;

  const pathForView = (v, opts = {}) => {
    // opts.productId lets callers pass the id synchronously (the setter in
    // the same handler hasn't re-rendered the ref mirror yet)
    if (v === "product") {
      const p = opts.productId !== undefined ? { id: opts.productId } : selectedProductRef.current;
      return p?.id ? `/product/${p.id}` : ROUTE_PATHS.products;
    }
    if (v === "add") {
      const p = opts.productId !== undefined ? { id: opts.productId } : editingProductRef.current;
      return p?.id ? `/product/${p.id}/edit` : ROUTE_PATHS.add;
    }
    if (v === "analysis") {
      const sid = opts.script !== undefined ? opts.script : analysisScriptId;
      return sid ? `${ROUTE_PATHS.analysis}?script=${sid}` : ROUTE_PATHS.analysis;
    }
    return ROUTE_PATHS[v] || "/";
  };

  // Single navigation funnel: every redirect (sidebar, tour, product flows,
  // practice, member guard…) goes through here and updates the URL too.
  const setView = (v, opts = {}) => {
    setViewState(v);
    const path = pathForView(v, opts);
    if (window.location.pathname + window.location.search !== path) {
      window.history.pushState({ view: v }, "", path);
    }
  };

  // Auth screens (landing / login / register) get their own URL paths
  const goAuthScreen = (screen) => {
    setAuthScreen(screen);
    const path = AUTH_ROUTE_FOR_SCREEN[screen] || "/";
    if (window.location.pathname !== path) {
      window.history.pushState({ auth: screen }, "", path);
    }
  };

  // Browser back/forward — re-derive the view (and auth screen) from the URL
  useEffect(() => {
    const onPop = () => {
      const { view: v, id } = parseRoute(window.location.pathname);
      routeIdRef.current = id || null;
      // Deep link to a different product than the one currently held → re-resolve
      setSelectedProduct((cur) => (v === "product" && id && String(cur?.id ?? "") !== String(id) ? null : cur));
      setEditingProduct((cur) => (v === "add" && id && String(cur?.id ?? "") !== String(id) ? null : cur));
      setAnalysisScriptId(new URLSearchParams(window.location.search).get("script") || null);
      const authScr = AUTH_PATHS[normalizePath(window.location.pathname)];
      if (authScr) setAuthScreen(authScr);
      setViewState(v || localStorage.getItem("ps_view") || "products");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Resolve deep-linked product ids (e.g. /product/12, /product/12/edit)
  // once the products list is available.
  useEffect(() => {
    if (!ready || !routeIdRef.current) return;
    const pid = routeIdRef.current;
    if (view === "product" && !selectedProduct) {
      const p = products.find((x) => String(x.id) === String(pid));
      if (p) { routeIdRef.current = null; setSelectedProduct(p); }
    } else if (view === "add" && pid && !editingProduct) {
      const p = products.find((x) => String(x.id) === String(pid));
      if (p) { routeIdRef.current = null; setEditingProduct(p); }
    }
  }, [ready, view, products, selectedProduct, editingProduct]);

  // Once authenticated, normalize the URL to the active view — covers
  // /login or /register after sign-in, root "/", and unknown paths.
  // Skipped while a deep-linked product id is still resolving.
  useEffect(() => {
    if (!user || !ready || routeIdRef.current) return;
    const target = pathForView(view);
    if (window.location.pathname + window.location.search !== target) {
      window.history.replaceState({ view }, "", target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, ready]);

  // Logged out again (logout / expired session) → back to the public root.
  // Never hijacks /invite/:token — that public page accepts team invitations.
  useEffect(() => {
    if (user || authLoading) return;
    if (inviteTokenRef.current) return;
    if (!AUTH_PATHS[normalizePath(window.location.pathname)]) {
      window.history.replaceState({}, "", "/");
      setAuthScreen("landing");
    }
  }, [user, authLoading]);

  // Redirect members to scripts view on mount if they're on products/studio
  useEffect(() => {
    if (user && isMember && (view === 'products' || view === 'product' || view === 'add')) {
      setView('scripts');
    }
  }, [user, isMember]);

  // Logout wrapper: reset the auth screen to the landing page in the SAME
  // event that clears the user, so the first logged-out render is already
  // the landing page — no login-page flash. (authScreen stays whatever the
  // sign-in flow left it at, e.g. "auth", for the rest of the session.)
  const handleLogout = () => {
    setAuthScreen("landing");
    if (!inviteTokenRef.current && window.location.pathname !== "/") {
      window.history.replaceState({}, "", "/");
    }
    logout();
  };

  if (authLoading) return (
    <div className="ps-root"><style>{STYLES}</style>
      <div className="ps-shell">
        <SidebarSkeleton />
        <main className="ps-main" style={{ padding: '40px 34px', flex: 1, minWidth: 0 }}>
          <CardSkeleton count={4} />
        </main>
      </div>
    </div>
  );

  // Public team-invite accept page (from email links) — works logged in or out.
  if (inviteTokenRef.current) return (
    <div className="ps-root"><style>{STYLES}</style>
      <InviteAcceptView token={inviteTokenRef.current} />
    </div>
  );

  if (!user) return (
    <div className="ps-root"><style>{STYLES}</style>
      {authScreen === "landing" ? (
        <LandingPage
          onSignIn={() => goAuthScreen("auth")}
          onRegister={() => goAuthScreen("auth-register")}
        />
      ) : (
        <LoginView
          initialMode={authScreen === "auth-register" ? "register" : "login"}
          onBack={() => goAuthScreen("landing")}
          onModeChange={(m) => {
            if (m === "register") goAuthScreen("auth-register");
            else if (m === "login") goAuthScreen("auth");
          }}
        />
      )}
    </div>
  );

  if (!ready) return (
    <div className="ps-root"><style>{STYLES}</style>
      <div className="ps-shell">
        <SidebarSkeleton />
        <main className="ps-main" style={{ padding: '40px 34px', flex: 1, minWidth: 0 }}>
          <CardSkeleton count={4} />
        </main>
      </div>
    </div>
  );
  return (
    <div className="ps-root"><style>{STYLES}</style>
      <div className="ps-shell">
        <Sidebar view={view} setView={setView} active={active} company={company} workspace={workspace} user={user} logout={handleLogout} canGenerate={canGenerate} />
        <TourGuide view={view} setView={setView} user={user} canGenerate={canGenerate} />

        <main className="ps-main">
          <Suspense fallback={<div style={{ padding: 40 }}><CardSkeleton count={4} /></div>}>
          {view === "products" && (
            <ProductsView products={products} company={company}
              onOpen={(p) => { setSelectedProduct(p); setView("product", { productId: p.id }); }}
              onAdd={() => { setEditingProduct(null); setView("add", { productId: null }); }}
              onSetup={saveCompany}
              onEdit={(p) => { setEditingProduct(p); setView("add", { productId: p.id }); }}
              onDelete={async (p) => { await S.del(`pproduct:${p.id}`); await refreshProducts(); }}
              onDuplicate={(p) => { setEditingProduct({ ...p, id: null, name: p.name + " (copy)" }); setView("add", { productId: null }); }} />
          )}
          {view === "product" && selectedProduct && (
            <ProductDetail product={selectedProduct}
              onBack={async () => { setSelectedProduct(null); await refreshProducts(); setView("products"); }}
              onOpenStudio={() => openStudio(selectedProduct)}
              onEdit={() => { setEditingProduct(selectedProduct); setView("add", { productId: selectedProduct.id }); }}
              onDelete={async (p) => { await S.del(`pproduct:${p.id}`); setSelectedProduct(null); await refreshProducts(); setView("products"); }}
              onDuplicate={(p) => { setEditingProduct({ ...p, id: null, name: p.name + " (copy)" }); setView("add", { productId: null }); }} />
          )}
          {view === "add" && (
            <ProductForm product={editingProduct} onCancel={async () => { setEditingProduct(null); await refreshProducts(); setView("products"); }} onSaved={async () => { setEditingProduct(null); await refreshProducts(); setView("products"); }} />
          )}
          {view === "studio" && (
            <StudioView
              key={active ? active.id + "-" + studioNonce : "empty"}
              product={active}
              products={products}
              onSelectProduct={(p) => { setActive(p); setPreset(null); setStudioNonce((n) => n + 1); }}
              preset={preset}
              teamLanguages={teamLanguages}
              staff={staff}
              onBack={backFromStudio}
              canGenerate={canGenerate}
              onAnalyze={(script) => { setAnalysisScriptId(script?.id || null); setView("analysis", { script: script?.id || null }); }}
            />
          )}
          {view === "scripts" && (
            <ScriptsView products={products} teamLanguages={teamLanguages}
              onOpen={(rec) => { const prod = products.find((p) => p.id === rec.meta.productId); if (prod) openStudio(prod, rec.meta, "scripts"); }}
              onVariant={(rec) => { const prod = products.find((p) => p.id === rec.meta.productId); if (prod) openStudio(prod, { ...rec.meta, setupOnly: true }, "scripts"); }}
              onGoStudio={() => products[0] ? openStudio(products[0]) : setView("products")} />
          )}
          {view === "team" && (
            <TeamView company={company} staff={staff} products={products} workspace={workspace} onSaveCompany={saveCompany} onRefresh={refreshStaff} user={user} canGenerate={canGenerate} />
          )}
          {view === "training" && (
            <TrainingView />
          )}
          {view === "practice" && (
            <PracticeView products={products} />
          )}
          {view === "roleplay" && (
            <RolePlayView products={products} />
          )}
          {view === "components" && (
            <ComponentLibrary />
          )}
          {view === "battle" && (
            <BattleCardsView products={products} />
          )}
          {view === "analytics" && (
            <AnalyticsDashboard />
          )}
          {view === "schedule" && (
            <ScheduledCallsView products={products} />
          )}
          {view === "followups" && (
            <FollowUpsView />
          )}
          {view === "settings" && (
            <SettingsView />
          )}
          {view === "automation" && (
            <AutomationRulesView />
          )}
          {view === "export" && (
            <DataExportView />
          )}
          {view === "permissions" && (
            <PermissionsView />
          )}
          {view === "coaching" && (
            <CoachingInsightsView />
          )}
          {view === "analysis" && (
            <CallAnalysisView products={products} initialScriptId={analysisScriptId} onBack={() => setView("scripts")} />
          )}
          {view === "abtesting" && (
            <ABTestingView products={products} />
          )}
          {view === "selfimprove" && (
            <SelfImprovementView />
          )}
          {view === "voice" && (
            <VoiceDNA />
          )}
          {view === "leaderboard" && (
            <LeaderboardView />
          )}
          {view === "competitor" && (
            <CompetitorIntelView />
          )}
          {view === "dealscore" && (
            <DealScoreView />
          )}
          {view === "refinement" && (
            <ScriptRefinementView products={products} onOpenStudio={(product) => openStudio(product)} />
          )}
          {view === "auto_opt" && (
            <AutoOptimizationView />
          )}
          {view === "heatmap" && (
            <HeatmapView onPractice={() => setView("practice")} />
          )}
          </Suspense>
        </main>
      </div>

      {/* P2.1: PWA install prompt */}
      {installPrompt && (
        <div className="ds-install-prompt">
          <div>
            <div className="title">Install {branding.site_name}</div>
            <div className="body">Access your workspace faster from your home screen.</div>
          </div>
          <div className="actions">
            <button className="ds-btn-pri" style={{ padding: "7px 12px", fontSize: 12 }} onClick={installPWA}>Install</button>
            <button className="ds-btn-ico" onClick={() => setInstallPrompt(null)} title="Dismiss">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

