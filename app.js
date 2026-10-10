const $ = (selector) => document.querySelector(selector);
const conversation = $('#conversation');
const welcome = $('#welcome');
const messageList = $('#messageList');
const messageInput = $('#messageInput');
const sendBtn = $('#sendBtn');
const webToggle = $('#webToggle');
const historyList = $('#historyList');
const toast = $('#toast');
const statusModal = $('#statusModal');
let busy = false;
let activeMessages = [];
let chatHistory = loadJson('aurai_history', []);
let currentChatId = null;
let toastTimer = null;

function loadJson(key, fallback) {
  try { const parsed = JSON.parse(localStorage.getItem(key) || 'null'); return parsed ?? fallback; }
  catch { return fallback; }
}
function saveHistory() {
  try { localStorage.setItem('aurai_history', JSON.stringify(chatHistory.slice(0, 30))); }
  catch { notify('Tarayıcı sohbet geçmişini kaydedemedi.'); }
}
function makeId() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }
function notify(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2900);
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function renderTextWithCode(text) {
  // Basit ve güvenli görüntüleme: kullanıcı/model metni HTML olarak yürütülmez.
  const chunks = String(text).split(/```([\w.+#-]*)\n([\s\S]*?)```/g);
  let output = '';
  for (let i = 0; i < chunks.length; i++) {
    if (i % 3 === 0) {
      const escaped = escapeHtml(chunks[i]);
      output += escaped.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    } else if (i % 3 === 1) {
      const language = chunks[i];
      const code = chunks[i + 1] || '';
      output += `<pre><code>${escapeHtml(code)}</code></pre>`;
      i++;
    }
  }
  return output;
}
function scrollToBottom() { conversation.scrollTop = conversation.scrollHeight; }
function showConversation() { welcome.hidden = activeMessages.length > 0; }
function createMessageNode(message, index) {
  const article = document.createElement('article');
  article.className = `message ${message.role === 'user' ? 'user' : 'assistant'}`;
  const avatar = message.role === 'user' ? 'S' : 'A';
  const name = message.role === 'user' ? 'Sen' : 'AURAI';
  const stamp = message.role === 'user' ? 'Kullanıcı' : (message.searched ? 'Web araştırması yapıldı' : 'Yanıt');
  const sources = Array.isArray(message.sources) ? message.sources : [];
  const sourceHtml = sources.length ? `<div class="source-list"><div class="source-label">Kullanılan kaynaklar · ${escapeHtml(message.searchProvider || 'Web')}</div>${sources.map((source, i) => `<a class="source-item" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer"><span class="source-number">${i + 1}</span><span class="source-copy"><strong>${escapeHtml(source.title || 'Kaynak')}</strong><small>${escapeHtml(source.snippet || '')}</small><span class="source-domain">${escapeHtml(getDomain(source.url))} ↗</span></span></a>`).join('')}</div>` : '';
  const googleHtml = message.googleUrl ? `<a class="google-fallback" href="${escapeHtml(message.googleUrl)}" target="_blank" rel="noopener noreferrer">⌕ Google'da bu konuyu ara ↗</a>` : '';
  article.innerHTML = `<div class="message-avatar" aria-hidden="true">${avatar}</div><div class="message-content"><div class="message-heading">${name}<span>${stamp}</span></div><div class="message-text">${renderTextWithCode(message.content)}</div>${sourceHtml}${googleHtml}${message.role === 'assistant' ? `<div class="message-tools"><button class="message-tool" data-copy-index="${index}">Yanıtı kopyala</button></div>` : ''}</div>`;
  return article;
}
function getDomain(value) { try { return new URL(value).hostname.replace(/^www\./, ''); } catch { return value || ''; } }
function renderMessages() {
  messageList.replaceChildren();
  activeMessages.forEach((message, i) => messageList.appendChild(createMessageNode(message, i)));
  showConversation();
  scrollToBottom();
}
function addTyping() {
  const article = document.createElement('article');
  article.className = 'message assistant';
  article.id = 'typingIndicator';
  article.innerHTML = '<div class="message-avatar" aria-hidden="true">A</div><div class="message-content"><div class="message-heading">AURAI <span>Yanıt hazırlıyor</span></div><div class="typing" aria-label="Yanıt hazırlanıyor"><span></span><span></span><span></span></div></div>';
  messageList.appendChild(article);
  scrollToBottom();
}
function removeTyping() { $('#typingIndicator')?.remove(); }
function saveCurrentChat() {
  if (!activeMessages.length) return;
  const firstUser = activeMessages.find((m) => m.role === 'user');
  const title = (firstUser?.content || 'Yeni sohbet').replace(/\s+/g, ' ').slice(0, 47);
  const item = { id: currentChatId || makeId(), title, messages: activeMessages, updatedAt: Date.now() };
  currentChatId = item.id;
  const index = chatHistory.findIndex((chat) => chat.id === item.id);
  if (index >= 0) chatHistory[index] = item;
  else chatHistory.unshift(item);
  chatHistory.sort((a, b) => b.updatedAt - a.updatedAt);
  chatHistory = chatHistory.slice(0, 30);
  saveHistory();
  renderHistory();
}
function renderHistory() {
  historyList.replaceChildren();
  if (!chatHistory.length) {
    const p = document.createElement('p'); p.className = 'history-empty'; p.textContent = 'Sohbetlerin burada görünür.'; historyList.appendChild(p); return;
  }
  chatHistory.slice(0, 12).forEach((chat) => {
    const button = document.createElement('button');
    button.className = 'history-item';
    button.innerHTML = `<span aria-hidden="true">◦</span><span>${escapeHtml(chat.title || 'Sohbet')}</span>`;
    button.title = chat.title;
    button.addEventListener('click', () => openChat(chat.id));
    historyList.appendChild(button);
  });
}
function openChat(id) {
  const chat = chatHistory.find((item) => item.id === id);
  if (!chat) return;
  currentChatId = chat.id;
  activeMessages = [...chat.messages];
  renderMessages();
  closeSidebar();
}
function newChat() {
  activeMessages = [];
  currentChatId = null;
  messageList.replaceChildren();
  welcome.hidden = false;
  messageInput.value = '';
  resizeInput();
  webToggle.checked = false;
  closeSidebar();
  messageInput.focus();
}
function resizeInput() {
  messageInput.style.height = 'auto';
  messageInput.style.height = `${Math.min(messageInput.scrollHeight, 160)}px`;
}
async function sendMessage(text = messageInput.value, explicitWeb = false) {
  const content = String(text).trim();
  if (!content || busy) return;
  activeMessages.push({ role: 'user', content });
  renderMessages();
  messageInput.value = '';
  resizeInput();
  busy = true;
  sendBtn.disabled = true;
  addTyping();
  try {
    const response = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: activeMessages.map(({ role, content }) => ({ role, content })), webSearch: explicitWeb || webToggle.checked })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Sunucu hatası (${response.status}).`);
    removeTyping();
    activeMessages.push({ role: 'assistant', content: data.answer || 'Boş yanıt alındı.', sources: data.sources || [], searchProvider: data.searchProvider, googleUrl: data.googleUrl, searched: data.searched });
    renderMessages();
    saveCurrentChat();
  } catch (error) {
    removeTyping();
    activeMessages.push({ role: 'assistant', content: `Şu anda yanıt alamadım. ${error.message}\n\nAURAI sunucusunu ve Z.AI API anahtarı ayarını kontrol et.` });
    renderMessages();
  } finally {
    busy = false;
    sendBtn.disabled = false;
    messageInput.focus();
  }
}

$('#composerForm').addEventListener('submit', (event) => { event.preventDefault(); sendMessage(); });
messageInput.addEventListener('input', resizeInput);
messageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); }
});
$('#newChatBtn').addEventListener('click', newChat);
$('#chatModeBtn').addEventListener('click', () => { webToggle.checked = false; $('#topbarMode').textContent = 'Sohbet alanı'; $('#chatModeBtn').classList.add('active'); $('#searchModeBtn').classList.remove('active'); closeSidebar(); messageInput.focus(); });
$('#searchModeBtn').addEventListener('click', () => { webToggle.checked = true; $('#topbarMode').textContent = 'Web araştırması'; $('#searchModeBtn').classList.add('active'); $('#chatModeBtn').classList.remove('active'); closeSidebar(); messageInput.focus(); notify('Sonraki mesajında web araması kullanılacak.'); });
$('#clearHistoryBtn').addEventListener('click', () => {
  if (!chatHistory.length) { notify('Temizlenecek bir geçmiş yok.'); return; }
  chatHistory = []; saveHistory(); renderHistory(); newChat(); notify('Sohbet geçmişi bu tarayıcıdan silindi.');
});
$('#attachBtn').addEventListener('click', () => notify('Dosya yükleme henüz bu başlangıç sürümünde yok.'));
$('#themeBtn').addEventListener('click', () => {
  document.documentElement.classList.toggle('light');
  const light = document.documentElement.classList.contains('light');
  try { localStorage.setItem('aurai_theme', light ? 'light' : 'dark'); } catch {}
});
messageList.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-copy-index]');
  if (!button) return;
  const index = Number(button.dataset.copyIndex);
  const content = activeMessages[index]?.content;
  if (!content) return;
  try { await navigator.clipboard.writeText(content); notify('Yanıt panoya kopyalandı.'); }
  catch { notify('Tarayıcı kopyalama izni vermedi. Yanıtı seçip kopyalayabilirsin.'); }
});
document.querySelectorAll('[data-prompt]').forEach((button) => button.addEventListener('click', () => {
  const useWeb = button.dataset.web === 'true';
  webToggle.checked = useWeb;
  if (useWeb) { $('#topbarMode').textContent = 'Web araştırması'; $('#searchModeBtn').classList.add('active'); $('#chatModeBtn').classList.remove('active'); }
  sendMessage(button.dataset.prompt, useWeb);
}));

const sidebar = $('#sidebar');
let overlay = null;
function openSidebar() {
  sidebar.classList.add('open');
  overlay = document.createElement('div'); overlay.className = 'mobile-overlay';
  overlay.addEventListener('click', closeSidebar);
  document.body.appendChild(overlay);
}
function closeSidebar() { sidebar.classList.remove('open'); overlay?.remove(); overlay = null; }
$('#mobileMenuBtn').addEventListener('click', () => sidebar.classList.contains('open') ? closeSidebar() : openSidebar());

async function refreshStatus() {
  const statusRows = $('#statusRows');
  statusRows.innerHTML = '<p>Bilgiler alınıyor…</p>';
  try {
    const response = await fetch('/api/health', { cache: 'no-store' });
    const data = await response.json();
    statusRows.innerHTML = [
      ['Uygulama', 'AURAI 0.2.0', 'ok'],
      ['Model sağlayıcısı', data.provider || 'Z.AI', 'ok'],
      ['API anahtarı', data.apiConfigured ? 'Sunucuya tanımlı' : 'Tanımlı değil', data.apiConfigured ? 'ok' : 'warn'],
      ['Seçili model', data.model || 'glm-4.6', ''],
      ['Web araştırması', data.webSearchConfigured ? 'Etkin/denenebilir' : 'Google bağlantısı yedeği', data.webSearchConfigured ? 'ok' : 'warn']
    ].map(([label, value, cls]) => `<div class="status-row"><span>${escapeHtml(label)}</span><strong class="${cls}">${escapeHtml(value)}</strong></div>`).join('');
    $('#modelPulse').classList.toggle('ok', Boolean(data.apiConfigured));
    $('#modelStatus').textContent = data.apiConfigured ? 'Z.AI API anahtarı sunucuda ayarlı.' : 'Z.AI API anahtarı ayarlanmamış.';
  } catch {
    statusRows.innerHTML = '<p>Durum bilgisi alınamadı. AURAI sunucusunun çalıştığını kontrol et.</p>';
    $('#modelStatus').textContent = 'Sunucuya ulaşılamıyor.';
  }
}
$('#modelDetailsBtn').addEventListener('click', async () => { statusModal.hidden = false; await refreshStatus(); });
$('#closeModalBtn').addEventListener('click', () => { statusModal.hidden = true; });
$('#refreshStatusBtn').addEventListener('click', refreshStatus);
statusModal.addEventListener('click', (event) => { if (event.target === statusModal) statusModal.hidden = true; });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { statusModal.hidden = true; closeSidebar(); } });

try { if (localStorage.getItem('aurai_theme') === 'light') document.documentElement.classList.add('light'); } catch {}
renderHistory();
fetch('/api/health', { cache: 'no-store' }).then((r) => r.json()).then((data) => {
  $('#modelPulse').classList.toggle('ok', Boolean(data.apiConfigured));
  $('#modelStatus').textContent = data.apiConfigured ? 'Z.AI API anahtarı sunucuda ayarlı.' : 'Z.AI API anahtarı ayarlanmamış.';
}).catch(() => { $('#modelStatus').textContent = 'Sunucuya ulaşılamıyor.'; });
