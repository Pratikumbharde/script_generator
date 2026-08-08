import React, { useEffect, useRef, useState } from 'react'
import { listChatSessions, createChatSession, deleteChatSession, getChatMessages, sendChatMessage } from '../api/client.js'

export default function AIAssistantChat() {
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const messagesEndRef = useRef(null)

  async function loadSessions() {
    try {
      const data = await listChatSessions()
      setSessions(data || [])
    } catch (e) { console.error(e) }
  }

  useEffect(() => { loadSessions() }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function openSession(session) {
    setActiveSession(session)
    setLoading(true)
    try {
      const res = await getChatMessages(session.id)
      setMessages(res.messages || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleNewSession() {
    setCreating(true)
    try {
      const session = await createChatSession('New Chat')
      await loadSessions()
      await openSession(session)
    } catch (e) {
      alert(e.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleDeleteSession(id) {
    if (!confirm('Delete this chat session?')) return
    await deleteChatSession(id)
    if (activeSession?.id === id) {
      setActiveSession(null)
      setMessages([])
    }
    await loadSessions()
  }

  async function handleSend() {
    if (!input.trim() || !activeSession) return
    const text = input.trim()
    setInput('')
    setLoading(true)
    try {
      const updated = await sendChatMessage(activeSession.id, text)
      setMessages(updated)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const suggestions = [
    "Generate a script for my enterprise product",
    "How did my team perform last week?",
    "What objections should I prepare for?",
    "Help me improve my closing technique",
  ]

  return (
    <div className="ps-container">
      <div className="ps-header">
        <h1>💬 AI Sales Assistant</h1>
        <p className="ps-muted">Ask anything about scripts, strategy, performance, or sales techniques.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16, height: 'calc(100vh - 200px)' }}>
        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="ps-btn" onClick={handleNewSession} disabled={creating}>
            {creating ? '...' : '➕ New Chat'}
          </button>
          <div style={{ overflow: 'auto', flex: 1 }}>
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`ps-card ${activeSession?.id === s.id ? 'ps-accent-bg' : ''}`}
                style={{ padding: 10, marginBottom: 6, cursor: 'pointer', fontSize: 13 }}
                onClick={() => openSession(s)}
              >
                <div className="ps-flex-between">
                  <span style={{ fontWeight: activeSession?.id === s.id ? 700 : 400 }}>{s.title || 'Chat'}</span>
                  <button className="ps-btn-ghost" onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id) }}>🗑</button>
                </div>
                <div className="ps-muted" style={{ fontSize: 11, marginTop: 2 }}>
                  {new Date(s.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="ps-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          {!activeSession ? (
            <div className="ps-empty" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="big">💬</div>
              <p>Start a new chat or select an existing session.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                {suggestions.map((s) => (
                  <button key={s} className="ps-btn ghost sm" onClick={() => { handleNewSession().then(() => setInput(s)) }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {messages.length === 0 && (
                  <div className="ps-empty" style={{ textAlign: 'center', margin: 'auto' }}>
                    <p>How can I help you today?</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 12 }}>
                      {suggestions.map((s) => (
                        <button key={s} className="ps-btn ghost sm" onClick={() => { setInput(s); }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.id} style={{
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    background: m.role === 'user' ? 'var(--accent-bg)' : 'var(--paper)',
                    color: m.role === 'user' ? 'var(--accent-ink)' : 'var(--ink)',
                    padding: '10px 14px',
                    borderRadius: m.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    fontSize: 14,
                    lineHeight: 1.5,
                    border: m.role === 'assistant' ? '1px solid var(--line)' : 'none',
                  }}>
                    {m.content}
                  </div>
                ))}
                {loading && (
                  <div style={{ alignSelf: 'flex-start', padding: '10px 14px', fontSize: 13, color: 'var(--muted)' }}>
                    <div className="ps-spinner" style={{ width: 16, height: 16, display: 'inline-block', marginRight: 8 }} /> Thinking...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div style={{ padding: 12, borderTop: '1px solid var(--line-soft)', display: 'flex', gap: 8 }}>
                <input
                  className="ps-input"
                  style={{ flex: 1 }}
                  placeholder="Ask me anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button className="ps-btn" onClick={handleSend} disabled={loading || !input.trim()}>Send</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
