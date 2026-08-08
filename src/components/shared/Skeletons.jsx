import React from 'react'

/* ── generic shimmer ── */
function Shimmer({ width, height, borderRadius = 8, style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, #E9EDF3 25%, #F2F5FA 50%, #E9EDF3 75%)',
        backgroundSize: '200% 100%',
        animation: 'psSkeletonShimmer 1.4s ease-in-out infinite',
        ...style,
      }}
    />
  )
}

/* ── card skeleton (for product cards, script rows) ── */
export function CardSkeleton({ count = 3 }) {
  return (
    <>
      <style>{`@keyframes psSkeletonShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))' }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #D9E0E9', borderRadius: 14, padding: 18 }}>
            <Shimmer width={80} height={14} borderRadius={20} style={{ marginBottom: 10 }} />
            <Shimmer width="60%" height={20} borderRadius={6} style={{ marginBottom: 8 }} />
            <Shimmer width="100%" height={12} borderRadius={4} style={{ marginBottom: 6 }} />
            <Shimmer width="85%" height={12} borderRadius={4} style={{ marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #E9EDF3', paddingTop: 11 }}>
              <Shimmer width={60} height={22} borderRadius={20} />
              <Shimmer width={50} height={22} borderRadius={20} />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

/* ── list row skeleton (for scripts library, staff list) ── */
export function RowSkeleton({ count = 5 }) {
  return (
    <>
      <style>{`@keyframes psSkeletonShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: '1px solid #D9E0E9', borderRadius: 13, padding: '15px 17px' }}>
            <Shimmer width={30} height={30} borderRadius={8} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Shimmer width="40%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 7 }}>
                <Shimmer width={50} height={18} borderRadius={20} />
                <Shimmer width={60} height={18} borderRadius={20} />
                <Shimmer width={45} height={18} borderRadius={20} />
              </div>
            </div>
            <Shimmer width={70} height={32} borderRadius={9} />
          </div>
        ))}
      </div>
    </>
  )
}

/* ── form skeleton ── */
export function FormSkeleton() {
  return (
    <>
      <style>{`@keyframes psSkeletonShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ background: '#fff', border: '1px solid #D9E0E9', borderRadius: 16, padding: 26, maxWidth: 760 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ marginBottom: 17 }}>
            <Shimmer width={120} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
            <Shimmer width="100%" height={40} borderRadius={9} />
          </div>
        ))}
        <Shimmer width={120} height={40} borderRadius={9} style={{ marginTop: 8 }} />
      </div>
    </>
  )
}

/* ── sidebar skeleton ── */
export function SidebarSkeleton() {
  return (
    <>
      <style>{`@keyframes psSkeletonShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ position:'fixed',left:0,top:0,height:'100vh',width:260,background:'#0F1724',padding:'16px 14px 14px',display:'flex',flexDirection:'column',gap:12,zIndex:50,borderRight:'1px solid #1E293B' }}>
        <Shimmer width="80%" height={22} borderRadius={6} style={{ background: '#1E293B' }} />
        <Shimmer width="60%" height={12} borderRadius={4} style={{ background: '#1E293B', marginBottom: 10 }} />
        {Array.from({ length: 8 }).map((_, i) => (
          <Shimmer key={i} width="90%" height={32} borderRadius={7} style={{ background: '#1E293B' }} />
        ))}
        <div style={{ marginTop: 'auto', paddingTop: 10 }}>
          <Shimmer width={30} height={30} borderRadius={8} style={{ background: '#1E293B', marginBottom: 8 }} />
          <Shimmer width="70%" height={14} borderRadius={4} style={{ background: '#1E293B' }} />
        </div>
      </div>
    </>
  )
}

/* ── script cockpit skeleton ── */
export function CockpitSkeleton() {
  return (
    <>
      <style>{`@keyframes psSkeletonShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        <div>
          <div style={{ background: '#131A24', borderRadius: 16, padding: '20px 22px', marginBottom: 16 }}>
            <Shimmer width={100} height={12} borderRadius={4} style={{ background: '#1E2836', marginBottom: 10 }} />
            <Shimmer width="80%" height={24} borderRadius={6} style={{ background: '#1E2836' }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
              <Shimmer width={80} height={26} borderRadius={20} style={{ background: '#1E2836' }} />
              <Shimmer width="60%" height={14} borderRadius={4} style={{ background: '#1E2836' }} />
            </div>
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #D9E0E9', borderRadius: 14, padding: '15px 18px', marginBottom: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <Shimmer width={30} height={30} borderRadius={8} />
                <Shimmer width="40%" height={18} borderRadius={4} />
                <Shimmer width={60} height={24} borderRadius={20} style={{ marginLeft: 'auto' }} />
              </div>
              <Shimmer width="100%" height={12} borderRadius={4} style={{ marginBottom: 6 }} />
              <Shimmer width="90%" height={12} borderRadius={4} />
            </div>
          ))}
        </div>
        <div style={{ background: '#fff', border: '1px solid #D9E0E9', borderRadius: 16, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px', borderBottom: '1px solid #E9EDF3', background: '#FBF1DE' }}>
            <Shimmer width="60%" height={18} borderRadius={4} style={{ marginBottom: 6 }} />
            <Shimmer width="80%" height={12} borderRadius={4} />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ padding: '13px 18px', borderBottom: '1px solid #E9EDF3' }}>
              <Shimmer width="90%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
              <Shimmer width="85%" height={12} borderRadius={4} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
