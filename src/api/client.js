const API_BASE = '/api'

function getToken() {
  return localStorage.getItem('ps_token') || ''
}

function headers() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  }
}

/* ---------- retry logic ---------- */
async function fetchWithRetry(url, opts, retries = 3, delay = 500) {
  let lastErr
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, opts)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
      return data
    } catch (err) {
      lastErr = err
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, delay * Math.pow(2, i)))
      }
    }
  }
  throw lastErr
}

async function fetchJson(path, opts = {}) {
  return fetchWithRetry(`${API_BASE}${path}`, {
    ...opts,
    headers: { ...headers(), ...(opts.headers || {}) },
  })
}

/* ---------- auth ---------- */
export async function register(email, password, company_name) {
  const data = await fetchJson('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, company_name }),
  })
  if (data.token) localStorage.setItem('ps_token', data.token)
  return data
}

export async function login(email, password) {
  const data = await fetchJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  if (data.token) localStorage.setItem('ps_token', data.token)
  return data
}

export async function me() {
  return fetchJson('/auth/me')
}

export function logout() {
  localStorage.removeItem('ps_token')
}

/* ---------- settings ---------- */
export async function getSettings() {
  return fetchJson('/settings')
}

export async function updateSettings(company_name) {
  return fetchJson('/settings', {
    method: 'PUT',
    body: JSON.stringify({ company_name }),
  })
}

/* ---------- products ---------- */
export async function listProducts() {
  const data = await fetchJson('/products')
  return data.products || []
}

export async function createProduct(product) {
  const data = await fetchJson('/products', {
    method: 'POST',
    body: JSON.stringify(product),
  })
  return data.product
}

export async function updateProduct(id, product) {
  const data = await fetchJson(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  })
  return data.product
}

export async function deleteProduct(id) {
  return fetchJson(`/products/${id}`, { method: 'DELETE' })
}

/* ---------- staff ---------- */
export async function listStaff() {
  const data = await fetchJson('/staff')
  return data.staff || []
}

export async function createStaff(member) {
  const data = await fetchJson('/staff', {
    method: 'POST',
    body: JSON.stringify(member),
  })
  return data.staff
}

export async function deleteStaff(id) {
  return fetchJson(`/staff/${id}`, { method: 'DELETE' })
}

/* ---------- scripts ---------- */
export async function listScripts() {
  const data = await fetchJson('/scripts')
  return data.scripts || []
}

export async function createScript(script) {
  const data = await fetchJson('/scripts', {
    method: 'POST',
    body: JSON.stringify(script),
  })
  return data.script
}

export async function updateScript(id, updates) {
  const data = await fetchJson(`/scripts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
  return data.script
}

export async function deleteScript(id) {
  return fetchJson(`/scripts/${id}`, { method: 'DELETE' })
}

/* ---------- workspace ---------- */
export async function getWorkspace() {
  const data = await fetchJson('/workspace')
  return data.workspace
}

export async function updateWorkspace(name) {
  const data = await fetchJson('/workspace', {
    method: 'PUT',
    body: JSON.stringify({ name }),
  })
  return data
}

export async function inviteMember(email, role = 'member') {
  const data = await fetchJson('/workspace/invite', {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  })
  return data
}

export async function joinWorkspace(token) {
  const data = await fetchJson('/workspace/join', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
  return data
}

/* ---------- api keys ---------- */
export async function listApiKeys() {
  const data = await fetchJson('/api-keys')
  return data.keys || []
}

export async function createApiKey(name) {
  const data = await fetchJson('/api-keys', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
  return data
}

export async function deleteApiKey(id) {
  return fetchJson(`/api-keys/${id}`, { method: 'DELETE' })
}

/* ---------- webhooks ---------- */
export async function listWebhooks() {
  const data = await fetchJson('/webhooks')
  return data.webhooks || []
}

export async function createWebhook({ url, events, secret }) {
  const data = await fetchJson('/webhooks', {
    method: 'POST',
    body: JSON.stringify({ url, events, secret }),
  })
  return data.webhook
}

export async function updateWebhook(id, updates) {
  const data = await fetchJson(`/webhooks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
  return data.webhook
}

export async function deleteWebhook(id) {
  return fetchJson(`/webhooks/${id}`, { method: 'DELETE' })
}

/* ---------- components ---------- */
export async function listComponents(type) {
  const url = type ? `/components?type=${encodeURIComponent(type)}` : '/components'
  return fetchJson(url).then((r) => r.components)
}

export async function createComponent(component) {
  return fetchJson('/components', { method: 'POST', body: JSON.stringify(component) }).then((r) => r.component)
}

export async function updateComponent(id, component) {
  return fetchJson(`/components/${id}`, { method: 'PUT', body: JSON.stringify(component) }).then((r) => r.component)
}

export async function deleteComponent(id) {
  return fetchJson(`/components/${id}`, { method: 'DELETE' })
}

/* ---------- CRM connections ---------- */
export async function listCrmConnections() {
  return fetchJson('/crm').then((r) => r.connections)
}

export async function createCrmConnection(connection) {
  return fetchJson('/crm', { method: 'POST', body: JSON.stringify(connection) }).then((r) => r.connection)
}

export async function updateCrmConnection(id, updates) {
  return fetchJson(`/crm/${id}`, { method: 'PUT', body: JSON.stringify(updates) }).then((r) => r.connection)
}

export async function deleteCrmConnection(id) {
  return fetchJson(`/crm/${id}`, { method: 'DELETE' })
}

/* ---------- voice docs ---------- */
export async function listVoiceDocs() {
  return fetchJson('/voice-docs').then((r) => r.docs)
}

export async function getVoiceContext() {
  return fetchJson('/voice-docs/content').then((r) => r.voiceContext)
}

export async function createVoiceDoc(doc) {
  return fetchJson('/voice-docs', { method: 'POST', body: JSON.stringify(doc) }).then((r) => r.doc)
}

export async function deleteVoiceDoc(id) {
  return fetchJson(`/voice-docs/${id}`, { method: 'DELETE' })
}

/* ---------- feedback ---------- */
export async function listFeedback() {
  return fetchJson('/feedback').then((r) => r.feedback)
}

export async function createFeedback(data) {
  return fetchJson('/feedback', { method: 'POST', body: JSON.stringify(data) }).then((r) => r.feedback)
}

export async function getWinningPatterns() {
  return fetchJson('/feedback/winning-patterns').then((r) => r.patterns)
}

/* ---------- marketplace ---------- */
export async function listMarketplaceTemplates(category) {
  const url = category ? `/marketplace?category=${encodeURIComponent(category)}` : '/marketplace'
  return fetchJson(url).then((r) => r.templates)
}

export async function getMarketplaceTemplate(id) {
  return fetchJson(`/marketplace/${id}`).then((r) => r.template)
}

export async function downloadMarketplaceTemplate(id) {
  return fetchJson(`/marketplace/${id}/download`, { method: 'POST' })
}

/* ---------- analytics ---------- */
export async function getAnalyticsOverview() {
  return fetchJson('/analytics/overview')
}

export async function getWinRateTrend() {
  return fetchJson('/analytics/win-rate-trend')
}

export async function getTopMethods() {
  return fetchJson('/analytics/top-methods')
}

export async function getTeamActivity() {
  return fetchJson('/analytics/team-activity')
}

/* ---------- script sharing ---------- */
export async function createShareLink(scriptId, expiresInDays = 7) {
  return fetchJson(`/scripts/${scriptId}/share`, {
    method: 'POST',
    body: JSON.stringify({ expires_in_days: expiresInDays }),
  })
}

export async function getSharedScript(token) {
  return fetch(`/api/s/${token}`).then((r) => r.json())
}

/* ---------- scheduled calls ---------- */
export async function listScheduledCalls() {
  return fetchJson('/scheduled-calls').then((r) => r.calls)
}

export async function createScheduledCall(data) {
  return fetchJson('/scheduled-calls', { method: 'POST', body: JSON.stringify(data) }).then((r) => r.call)
}

export async function updateScheduledCall(id, data) {
  return fetchJson(`/scheduled-calls/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then((r) => r.call)
}

export async function deleteScheduledCall(id) {
  return fetchJson(`/scheduled-calls/${id}`, { method: 'DELETE' })
}

/* ---------- script comments ---------- */
export async function listScriptComments(scriptId) {
  return fetchJson(`/scripts/${scriptId}/comments`).then((r) => r.comments)
}

export async function createScriptComment(scriptId, content, type = 'comment') {
  return fetchJson(`/scripts/${scriptId}/comments`, { method: 'POST', body: JSON.stringify({ content, type }) }).then((r) => r.comment)
}

export async function deleteScriptComment(commentId) {
  return fetchJson(`/comments/${commentId}`, { method: 'DELETE' })
}

/* ---------- P6: user preferences ---------- */
export async function getPreferences() {
  return fetchJson('/preferences').then((r) => r.preferences)
}

export async function updatePreferences(data) {
  return fetchJson('/preferences', { method: 'PUT', body: JSON.stringify(data) }).then((r) => r.preferences)
}

/* ---------- P6.2: automation rules ---------- */
export async function listAutomationRules() {
  return fetchJson('/automation-rules').then((r) => r.rules)
}

export async function createAutomationRule(rule) {
  return fetchJson('/automation-rules', { method: 'POST', body: JSON.stringify(rule) }).then((r) => r.rule)
}

export async function updateAutomationRule(id, rule) {
  return fetchJson(`/automation-rules/${id}`, { method: 'PUT', body: JSON.stringify(rule) }).then((r) => r.rule)
}

export async function deleteAutomationRule(id) {
  return fetchJson(`/automation-rules/${id}`, { method: 'DELETE' })
}

/* ---------- P7.1: coaching insights ---------- */
export async function listCoachingInsights() {
  return fetchJson('/coaching-insights').then((r) => r.insights)
}

export async function generateCoachingInsight(data) {
  return fetchJson('/coaching-insights/generate', { method: 'POST', body: JSON.stringify(data) }).then((r) => r)
}

export async function deleteCoachingInsight(id) {
  return fetchJson(`/coaching-insights/${id}`, { method: 'DELETE' })
}

/* ---------- P7.2: sentiment analysis ---------- */
export async function analyzeSentiment(data) {
  return fetchJson('/sentiment/analyze', { method: 'POST', body: JSON.stringify(data) }).then((r) => r)
}

export async function getSentimentSession(id) {
  return fetchJson(`/sentiment/${id}`).then((r) => r.session)
}

/* ---------- P7.3: A/B script testing ---------- */
export async function listScriptVariants(group) {
  const url = group ? `/script-variants?group=${encodeURIComponent(group)}` : '/script-variants'
  return fetchJson(url).then((r) => r.variants)
}

export async function createScriptVariant(data) {
  return fetchJson('/script-variants', { method: 'POST', body: JSON.stringify(data) }).then((r) => r.variant)
}

export async function useScriptVariant(id, outcome) {
  return fetchJson(`/script-variants/${id}/use`, { method: 'POST', body: JSON.stringify({ outcome }) }).then((r) => r.variant)
}

export async function getVariantWinner(group) {
  return fetchJson(`/script-variants/${encodeURIComponent(group)}/winner`)
}

export async function deleteScriptVariant(id) {
  return fetchJson(`/script-variants/${id}`, { method: 'DELETE' })
}

/* ---------- P7.4: CRM OAuth connections ---------- */
export async function listCrmOAuthConnections(crmType) {
  return fetchJson(`/crm-connections/oauth?crm_type=${encodeURIComponent(crmType)}`).then((r) => r.connections)
}

export async function saveCrmOAuthConnection(data) {
  return fetchJson('/crm-connections/oauth', { method: 'POST', body: JSON.stringify(data) }).then((r) => r.connection)
}

export async function deleteCrmOAuthConnection(id) {
  return fetchJson(`/crm-connections/oauth/${id}`, { method: 'DELETE' })
}

/* ---------- P7.5: leaderboard ---------- */
export async function getLeaderboard(period) {
  const url = period ? `/leaderboard?period=${encodeURIComponent(period)}` : '/leaderboard'
  return fetchJson(url).then((r) => r)
}

export async function getRepTrends(userId) {
  return fetchJson(`/leaderboard/trends/${userId}`).then((r) => r.trends)
}

/* ---------- P8.1: workspace permissions ---------- */
export async function getWorkspacePermissions() {
  return fetchJson('/workspace/permissions')
}

export async function getAllWorkspacePermissions() {
  return fetchJson('/workspace/permissions/all').then((r) => r.permissions)
}

export async function updateWorkspacePermission(role, data) {
  return fetchJson(`/workspace/permissions/${encodeURIComponent(role)}`, { method: 'PUT', body: JSON.stringify(data) }).then((r) => r.permission)
}

/* ---------- P8.2: audit logs ---------- */
export async function listAuditLogs(opts = {}) {
  const params = new URLSearchParams()
  if (opts.limit) params.set('limit', String(opts.limit))
  if (opts.offset) params.set('offset', String(opts.offset))
  if (opts.action) params.set('action', opts.action)
  return fetchJson(`/audit-logs?${params.toString()}`).then((r) => r.logs)
}

export async function listWorkspaceAuditLogs(opts = {}) {
  const params = new URLSearchParams()
  if (opts.limit) params.set('limit', String(opts.limit))
  return fetchJson(`/audit-logs/workspace?${params.toString()}`).then((r) => r.logs)
}

/* ---------- P8.3: data export ---------- */
export async function exportWorkspaceJSON() {
  return fetch('/api/export/workspace', { headers: { Authorization: `Bearer ${localStorage.getItem('ps_token') || ''}` } })
}

export async function exportWorkspaceCSV() {
  return fetch('/api/export/workspace.csv', { headers: { Authorization: `Bearer ${localStorage.getItem('ps_token') || ''}` } })
}

/* ---------- P8.4: custom AI prompts ---------- */
export async function listCustomPrompts() {
  return fetchJson('/custom-prompts').then((r) => r.prompts)
}

export async function getCustomPrompt(id) {
  return fetchJson(`/custom-prompts/${id}`).then((r) => r.prompt)
}

export async function createCustomPrompt(data) {
  return fetchJson('/custom-prompts', { method: 'POST', body: JSON.stringify(data) }).then((r) => r.prompt)
}

export async function updateCustomPrompt(id, data) {
  return fetchJson(`/custom-prompts/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then((r) => r.prompt)
}

export async function deleteCustomPrompt(id) {
  return fetchJson(`/custom-prompts/${id}`, { method: 'DELETE' })
}

/* ---------- P9.1: competitor monitoring ---------- */
export async function listCompetitors() {
  return fetchJson('/competitors').then((r) => r.competitors)
}

export async function createCompetitor(data) {
  return fetchJson('/competitors', { method: 'POST', body: JSON.stringify(data) }).then((r) => r.competitor)
}

export async function updateCompetitor(id, data) {
  return fetchJson(`/competitors/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then((r) => r.competitor)
}

export async function deleteCompetitor(id) {
  return fetchJson(`/competitors/${id}`, { method: 'DELETE' })
}

export async function listCompetitorSources(id) {
  return fetchJson(`/competitors/${id}/sources`).then((r) => r.sources)
}

export async function addCompetitorSource(id, data) {
  return fetchJson(`/competitors/${id}/sources`, { method: 'POST', body: JSON.stringify(data) }).then((r) => r.source)
}

export async function deleteCompetitorSource(cid, sid) {
  return fetchJson(`/competitors/${cid}/sources/${sid}`, { method: 'DELETE' })
}

export async function listCompetitorIntel(cid) {
  return fetchJson(`/competitors/${cid}/intel`).then((r) => r.intel)
}

export async function analyzeCompetitor(data) {
  return fetchJson('/competitor-intel/analyze', { method: 'POST', body: JSON.stringify(data) }).then((r) => r)
}

export async function deleteCompetitorIntel(id) {
  return fetchJson(`/competitor-intel/${id}`, { method: 'DELETE' })
}

/* ---------- P9.2: predictive deal scoring ---------- */
export async function analyzeDealScore(data) {
  return fetchJson('/deal-scores/analyze', { method: 'POST', body: JSON.stringify(data) }).then((r) => r)
}

export async function listDealScores() {
  return fetchJson('/deal-scores').then((r) => r.scores)
}

export async function deleteDealScore(id) {
  return fetchJson(`/deal-scores/${id}`, { method: 'DELETE' })
}

/* ---------- P9.3: organizations ---------- */
export async function getOrganization() {
  return fetchJson('/organization')
}

export async function createOrganization(data) {
  return fetchJson('/organization', { method: 'POST', body: JSON.stringify(data) }).then((r) => r.organization)
}

export async function updateOrganization(data) {
  return fetchJson('/organization', { method: 'PUT', body: JSON.stringify(data) }).then((r) => r.organization)
}

/* ---------- P9.4: script refinement ---------- */
export async function generateScriptRefinement(data) {
  return fetchJson('/script-refinements/generate', { method: 'POST', body: JSON.stringify(data) }).then((r) => r)
}

export async function listScriptRefinements() {
  return fetchJson('/script-refinements').then((r) => r.refinements)
}

export async function listScriptRefinementsForScript(scriptId) {
  return fetchJson(`/script-refinements/script/${scriptId}`).then((r) => r.refinements)
}

export async function deleteScriptRefinement(id) {
  return fetchJson(`/script-refinements/${id}`, { method: 'DELETE' })
}

/* ---------- P9.5: voice recordings ---------- */
export async function listVoiceRecordings() {
  return fetchJson('/voice-recordings').then((r) => r.recordings)
}

export async function createVoiceRecording(data) {
  return fetchJson('/voice-recordings', { method: 'POST', body: JSON.stringify(data) }).then((r) => r.recording)
}

export async function updateVoiceRecordingStatus(id, data) {
  return fetchJson(`/voice-recordings/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }).then((r) => r.recording)
}

export async function deleteVoiceRecording(id) {
  return fetchJson(`/voice-recordings/${id}`, { method: 'DELETE' })
}

/* ---------- P8.5: usage dashboard ---------- */
export async function getUsage(days = 30) {
  return fetchJson(`/usage?days=${days}`)
}

export async function getWorkspaceUsage(days = 30) {
  return fetchJson(`/usage/workspace?days=${days}`)
}

/* ---------- P10.1: auto-script optimization ---------- */
export async function getAutoOptimizationOverview() {
  return fetchJson('/auto-optimizations/overview').then((r) => r.overview)
}

export async function listAutoOptimizations() {
  return fetchJson('/auto-optimizations').then((r) => r.optimizations)
}

export async function generateAutoOptimization(data) {
  return fetchJson('/auto-optimizations/generate', { method: 'POST', body: JSON.stringify(data) }).then((r) => r)
}

export async function applyAutoOptimization(id) {
  return fetchJson(`/auto-optimizations/${id}/apply`, { method: 'POST' })
}

export async function deleteAutoOptimization(id) {
  return fetchJson(`/auto-optimizations/${id}`, { method: 'DELETE' })
}

/* ---------- P10.2: conversation intelligence ---------- */
export async function listHeatmaps(category, source) {
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (source) params.set('source', source)
  const url = params.toString() ? `/heatmaps?${params.toString()}` : '/heatmaps'
  return fetchJson(url).then((r) => r.heatmaps)
}

export async function generateHeatmaps(transcripts) {
  return fetchJson('/heatmaps/generate', { method: 'POST', body: JSON.stringify({ transcripts }) }).then((r) => r)
}

export async function analyzeScriptsCI() {
  return fetchJson('/conversation-intelligence/analyze-scripts', { method: 'POST' }).then((r) => r)
}

export async function getCIOverview() {
  return fetchJson('/conversation-intelligence/overview').then((r) => r)
}

export async function getCICalls(query = {}) {
  const params = new URLSearchParams()
  if (query.product_id) params.set('product_id', query.product_id)
  if (query.outcome) params.set('outcome', query.outcome)
  const url = params.toString() ? `/conversation-intelligence/calls?${params.toString()}` : '/conversation-intelligence/calls'
  return fetchJson(url).then((r) => r.calls)
}

/* ---------- P10.3: AI sales assistant chat ---------- */
export async function listChatSessions() {
  return fetchJson('/chat/sessions').then((r) => r.sessions)
}

export async function createChatSession(title) {
  return fetchJson('/chat/sessions', { method: 'POST', body: JSON.stringify({ title }) }).then((r) => r.session)
}

export async function deleteChatSession(id) {
  return fetchJson(`/chat/sessions/${id}`, { method: 'DELETE' })
}

export async function getChatMessages(sessionId) {
  return fetchJson(`/chat/sessions/${sessionId}/messages`).then((r) => r)
}

export async function sendChatMessage(sessionId, content) {
  return fetchJson(`/chat/sessions/${sessionId}/messages`, { method: 'POST', body: JSON.stringify({ content }) }).then((r) => r.messages)
}

/* ---------- P10.4: smart alerts ---------- */
export async function listSmartAlerts() {
  return fetchJson('/smart-alerts').then((r) => r.alerts)
}

export async function listAllSmartAlerts() {
  return fetchJson('/smart-alerts/all').then((r) => r.alerts)
}

export async function generateSmartAlerts() {
  return fetchJson('/smart-alerts/generate', { method: 'POST' }).then((r) => r.alerts)
}

export async function dismissSmartAlert(id) {
  return fetchJson(`/smart-alerts/${id}/dismiss`, { method: 'PUT' })
}

/* ---------- P10.5: multi-model routing ---------- */
export async function routeChat(taskType, messages, preferredModel) {
  return fetchJson('/chat/route', { method: 'POST', body: JSON.stringify({ task_type: taskType, messages, preferred_model: preferredModel }) })
}

export async function getModelRoutingLogs() {
  return fetchJson('/model-routing/logs').then((r) => r.logs)
}

/* ---------- P11.2: AI model accounts ---------- */
export async function listAiAccounts() {
  return fetchJson('/ai-accounts').then((r) => r.accounts)
}

export async function createAiAccount(data) {
  return fetchJson('/ai-accounts', { method: 'POST', body: JSON.stringify(data) }).then((r) => r.account)
}

export async function updateAiAccount(id, data) {
  return fetchJson(`/ai-accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then((r) => r.account)
}

export async function deleteAiAccount(id) {
  return fetchJson(`/ai-accounts/${id}`, { method: 'DELETE' })
}

export async function setPrimaryAiAccount(id) {
  return fetchJson(`/ai-accounts/${id}/primary`, { method: 'POST' }).then((r) => r.account)
}

/* ---------- P11.3: email templates & SMTP ---------- */
export async function listEmailTemplates() {
  return fetchJson('/email-templates').then((r) => r.templates)
}

export async function createEmailTemplate(data) {
  return fetchJson('/email-templates', { method: 'POST', body: JSON.stringify(data) }).then((r) => r.template)
}

export async function updateEmailTemplate(id, data) {
  return fetchJson(`/email-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then((r) => r.template)
}

export async function deleteEmailTemplate(id) {
  return fetchJson(`/email-templates/${id}`, { method: 'DELETE' })
}

export async function duplicateEmailTemplate(id) {
  return fetchJson(`/email-templates/${id}/duplicate`, { method: 'POST' }).then((r) => r.template)
}

export async function testSmtp(data) {
  return fetchJson('/email/test-smtp', { method: 'POST', body: JSON.stringify(data) }).then((r) => r)
}
