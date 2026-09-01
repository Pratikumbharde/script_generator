import React, { useState, useEffect, Suspense, lazy } from "react";
import { X } from "lucide-react";
import LoginView from "./src/components/LoginView.jsx";
import ProductsView from "./src/components/ProductsView.jsx";
import ScriptsView from "./src/components/ScriptsView.jsx";
import TrainingView from "./src/components/TrainingView.jsx";
import PracticeView from "./src/components/PracticeView.jsx";
import ComponentLibrary from "./src/components/ComponentLibrary.jsx";
import BattleCardsView from "./src/components/BattleCardsView.jsx";
import AnalyticsDashboard from "./src/components/AnalyticsDashboard.jsx";
import RolePlayView from "./src/components/RolePlayView.jsx";
import ScheduledCallsView from "./src/components/ScheduledCallsView.jsx";
import SettingsView from "./src/components/SettingsView.jsx";
import AutomationRulesView from "./src/components/AutomationRulesView.jsx";
import ABTestingView from "./src/components/ABTestingView.jsx";
import ProductForm from "./src/components/ProductForm.jsx";
import ProductDetail from "./src/components/ProductDetail.jsx";
import StudioView from "./src/components/StudioView.jsx";
import TeamView from "./src/components/TeamView.jsx";
import Sidebar from "./src/components/Sidebar.jsx";
import { useAuth } from "./src/context/AuthContext.jsx";
import { STYLES } from "./src/styles/styles.js";
import { S } from "./src/utils/helpers.js";
import { CardSkeleton, SidebarSkeleton } from "./src/components/shared/Skeletons.jsx";

/* ---------- Lazy-loaded heavy views ---------- */
const CoachingInsightsView = lazy(() => import("./src/components/CoachingInsightsView.jsx"));
const CompetitorIntelView   = lazy(() => import("./src/components/CompetitorIntelView.jsx"));
const DealScoreView         = lazy(() => import("./src/components/DealScoreView.jsx"));
const ScriptRefinementView  = lazy(() => import("./src/components/ScriptRefinementView.jsx"));
const AutoOptimizationView  = lazy(() => import("./src/components/AutoOptimizationView.jsx"));
const HeatmapView           = lazy(() => import("./src/components/HeatmapView.jsx"));
const LeaderboardView       = lazy(() => import("./src/components/LeaderboardView.jsx"));

/* ============================================================
   Pitch Studio — a live-call cockpit for sales teams.
   Enter a product once → pick methodology + call type + duration →
   AI generates a time-segmented script + objection handling, and
   SAVES it. Scripts never regenerate unless you explicitly ask.
   Persistence: window.storage (per-workspace). Generation: Anthropic API.
   ============================================================ */

export default function PitchStudio() {
  const { user, workspace, loading: authLoading, logout, canGenerate } = useAuth();

  const [ready, setReady] = useState(false);
  const [company, setCompany] = useState("");
  const [view, setView] = useState(() => {
    // Members default to scripts view
    const saved = localStorage.getItem('ps_view');
    return saved || 'products';
  }); // products | product | add | studio | team | scripts | training | practice | roleplay | components | battle | analytics | schedule | settings | automation | coaching | abtesting | leaderboard | competitor | dealscore | refinement | auto_opt | heatmap
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [active, setActive] = useState(null); // active product for studio
  const [preset, setPreset] = useState(null); // preset setup when opening from library
  const [studioNonce, setStudioNonce] = useState(0);
  const [staff, setStaff] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);

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
    if (saved) document.querySelector('.ps-root')?.setAttribute('data-theme', saved);
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
  const openStudio = (product, ps = null) => { setActive(product); setPreset(ps); setStudioNonce((n) => n + 1); setView("studio"); };
  const teamLanguages = [...new Set(staff.flatMap((s) => s.languages || ["en"]))];
  const isMember = user?.role === 'member';

  // Redirect members to scripts view on mount if they're on products/studio
  useEffect(() => {
    if (user && isMember && (view === 'products' || view === 'product' || view === 'add')) {
      setView('scripts');
    }
  }, [user, isMember]);

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

  if (!user) return (
    <div className="ps-root"><style>{STYLES}</style>
      <LoginView />
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
        <Sidebar view={view} setView={setView} active={active} company={company} workspace={workspace} user={user} logout={logout} canGenerate={canGenerate} />

        <main className="ps-main">
          <Suspense fallback={<div style={{ padding: 40 }}><CardSkeleton count={4} /></div>}>
          {view === "products" && (
            <ProductsView products={products} company={company}
              onOpen={(p) => { setSelectedProduct(p); setView("product"); }}
              onAdd={() => { setEditingProduct(null); setView("add"); }}
              onSetup={saveCompany}
              onEdit={(p) => { setEditingProduct(p); setView("add"); }}
              onDelete={async (p) => { await S.del(`pproduct:${p.id}`); await refreshProducts(); }}
              onDuplicate={(p) => { setEditingProduct({ ...p, id: null, name: p.name + " (copy)" }); setView("add"); }} />
          )}
          {view === "product" && selectedProduct && (
            <ProductDetail product={selectedProduct}
              onBack={() => { setSelectedProduct(null); setView("products"); }}
              onOpenStudio={() => openStudio(selectedProduct)}
              onEdit={() => { setEditingProduct(selectedProduct); setView("add"); }}
              onDelete={async (p) => { await S.del(`pproduct:${p.id}`); setSelectedProduct(null); await refreshProducts(); setView("products"); }}
              onDuplicate={(p) => { setEditingProduct({ ...p, id: null, name: p.name + " (copy)" }); setView("add"); }} />
          )}
          {view === "add" && (
            <ProductForm product={editingProduct} onCancel={() => { setEditingProduct(null); setView("products"); }} onSaved={async () => { setEditingProduct(null); await refreshProducts(); setView("products"); }} />
          )}
          {view === "studio" && (
            <StudioView
              key={active ? active.id + "-" + studioNonce : "empty"}
              product={active}
              products={products}
              onSelectProduct={(p) => { setActive(p); setStudioNonce((n) => n + 1); }}
              preset={preset}
              teamLanguages={teamLanguages}
              staff={staff}
              onBack={() => setView("products")}
              canGenerate={canGenerate}
            />
          )}
          {view === "scripts" && (
            <ScriptsView products={products} teamLanguages={teamLanguages}
              onOpen={(rec) => { const prod = products.find((p) => p.id === rec.meta.productId); if (prod) openStudio(prod, rec.meta); }}
              onVariant={(rec) => { const prod = products.find((p) => p.id === rec.meta.productId); if (prod) openStudio(prod, { ...rec.meta, setupOnly: true }); }}
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
          {view === "settings" && (
            <SettingsView />
          )}
          {view === "automation" && (
            <AutomationRulesView />
          )}
          {view === "coaching" && (
            <CoachingInsightsView />
          )}
          {view === "abtesting" && (
            <ABTestingView products={products} />
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
            <HeatmapView />
          )}
          </Suspense>
        </main>
      </div>

      {/* P2.1: PWA install prompt */}
      {installPrompt && (
        <div className="ds-install-prompt">
          <div>
            <div className="title">Install Pitch Studio</div>
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

