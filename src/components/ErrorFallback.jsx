import React from 'react'

export default function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#EAEEF4',
      padding: 24,
    }}>
      <div style={{
        background: '#fff',
        border: '1px solid #D9E0E9',
        borderRadius: 16,
        padding: 32,
        maxWidth: 480,
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: '#FDF2F2',
          color: '#D23B3F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          margin: '0 auto 16px',
        }}>
          ⚠
        </div>
        <h2 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: 20,
          color: '#131A24',
          marginBottom: 8,
          letterSpacing: '-0.02em',
        }}>
          Something went wrong
        </h2>
        <p style={{
          color: '#667180',
          fontSize: 14,
          lineHeight: 1.55,
          marginBottom: 20,
        }}>
          {error?.message || 'An unexpected error occurred. We have retried the request, but it still failed.'}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={resetErrorBoundary}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 13.5,
              border: 'none',
              borderRadius: 9,
              padding: '10px 16px',
              cursor: 'pointer',
              background: '#2B4CF0',
              color: '#fff',
              transition: '.13s',
            }}
            onMouseEnter={(e) => (e.target.style.background = '#1D33B0')}
            onMouseLeave={(e) => (e.target.style.background = '#2B4CF0')}
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: 13.5,
              border: '1px solid #D9E0E9',
              borderRadius: 9,
              padding: '10px 16px',
              cursor: 'pointer',
              background: '#fff',
              color: '#131A24',
              transition: '.13s',
            }}
            onMouseEnter={(e) => (e.target.style.borderColor = '#98A2B0')}
            onMouseLeave={(e) => (e.target.style.borderColor = '#D9E0E9')}
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  )
}
