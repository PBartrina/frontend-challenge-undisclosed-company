import { createElement, formatVersion, humanList, uuid } from './utils.js';
import { fetchDocuments } from './services.js';
import { renderListRow, renderGridCard } from './renderers.js';

const state = {
  documents: [], // merged view: localDocuments + remoteDocuments
  localDocuments: [],
  remoteDocuments: [],
  view: 'list', // 'list' | 'grid'
  sort: '', // 'name' | 'version' | 'createdAt'
  unseenNotifications: 0,
};

const els = {
  listView: document.getElementById('list-view'),
  gridView: document.getElementById('grid-view'),
  listBtn: document.getElementById('list-view-btn'),
  gridBtn: document.getElementById('grid-view-btn'),
  sortSelect: document.getElementById('sort-select'),
  addBtn: document.getElementById('add-document'),
  toast: document.getElementById('toast'),
  toastText: document.getElementById('toast-text'),
  bell: document.getElementById('bell'),
  bellCount: document.getElementById('bell-count'),
  createModal: document.getElementById('create-modal'),
  createForm: document.getElementById('create-form'),
  fieldTitle: document.getElementById('field-title'),
  fieldVersion: document.getElementById('field-version'),
  fieldContributors: document.getElementById('field-contributors'),
  fieldAttachments: document.getElementById('field-attachments'),
};

init();

function init() {
  wireUI();
  refreshFromServer();
  connectWebSocket();
}

function wireUI() {
  els.listBtn.addEventListener('click', () => setView('list'));
  els.gridBtn.addEventListener('click', () => setView('grid'));
  els.sortSelect.addEventListener('change', () => {
    state.sort = els.sortSelect.value;
    render();
  });
  els.addBtn.addEventListener('click', () => openCreateModal());

  // Reset notification counter when pressing the bell
  els.bell.addEventListener('click', () => {
    state.unseenNotifications = 0;
    updateBell();
  });

  // Modal interactions
  els.createForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const now = new Date();
    const doc = {
      ID: uuid(),
      Title: els.fieldTitle.value.trim() || 'Untitled',
      Version: formatVersion(els.fieldVersion.value.trim()),
      CreatedAt: now.toISOString(),
      UpdatedAt: now.toISOString(),
      Contributors: (els.fieldContributors.value || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name) => ({ ID: uuid(), Name: name })),
      Attachments: (els.fieldAttachments.value || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    state.localDocuments.unshift(doc); // newest first
    recomputeDocuments();
    els.createModal.close();
    els.createForm.reset();
    showToast('New document added');
  });
}

async function refreshFromServer() {
  try {
    const docs = await fetchDocuments();
    // Merge new documents into the existing remote set (do not replace)
    const byId = new Map(state.remoteDocuments.map((d) => [d.ID, d]));
    for (const d of docs) {
      if (byId.has(d.ID)) {
        Object.assign(byId.get(d.ID), d);
      } else {
        state.remoteDocuments.push(d);
        byId.set(d.ID, d);
      }
    }
    // Keep newest first by creation date
    state.remoteDocuments.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
    recomputeDocuments();
  } catch (err) {
    console.error('Failed to load documents', err);
  }
}

function connectWebSocket() {
  const url = `ws://localhost:8080/notifications`;
  let socket;
  try {
    socket = new WebSocket(url);
  } catch (err) {
    console.warn('WebSocket not available', err);
    return;
  }

  socket.addEventListener('message', (event) => {
    try {
      const msg = JSON.parse(event.data);
      // Increment bell counter and show toast
      state.unseenNotifications += 1;
      updateBell();
      showToast('New document added');
      // Refresh from server to pull latest complete items (no placeholders)
      refreshFromServer();
    } catch (_) {
      // ignore
    }
  });
  socket.addEventListener('error', () => {
    console.warn('WebSocket error');
  });
}

function setView(view) {
  state.view = view;
  els.listBtn.classList.toggle('active', view === 'list');
  els.gridBtn.classList.toggle('active', view === 'grid');
  els.listBtn.setAttribute('aria-pressed', String(view === 'list'));
  els.gridBtn.setAttribute('aria-pressed', String(view === 'grid'));
  els.listView.classList.toggle('hidden', view !== 'list');
  els.gridView.classList.toggle('hidden', view !== 'grid');
  render();
}

function render() {
  const docs = [...state.documents];
  sortDocsInPlace(docs, state.sort);

  // List view
  els.listView.replaceChildren();
  if (docs.length === 0) {
    els.listView.append(
      createElement('div', { class: 'empty' }, 'No documents yet')
    );
  } else {
    // Header row with column titles
    const header = createElement('div', { class: 'row header', role: 'presentation' }, [
      createElement('div', { class: 'col name' }, 'Name'),
      createElement('div', { class: 'col' }, 'Contributors'),
      createElement('div', { class: 'col' }, 'Attachments'),
    ]);
    els.listView.append(header);
    for (const d of docs) {
      els.listView.append(renderListRow(d));
    }
  }

  // Grid view
  els.gridView.replaceChildren();
  if (docs.length === 0) {
    els.gridView.append(
      createElement('div', { class: 'empty' }, 'No documents yet')
    );
  } else {
    for (const d of docs) {
      els.gridView.append(renderGridCard(d));
    }
  }
}

function sortDocsInPlace(docs, key) {
  switch (key) {
    case 'name':
      docs.sort((a, b) => a.Title.localeCompare(b.Title));
      break;
    case 'version':
      docs.sort((a, b) => compareSemver(a.Version, b.Version));
      break;
    case 'createdAt':
      docs.sort((a, b) => new Date(a.CreatedAt) - new Date(b.CreatedAt));
      break;
    default:
      // already newest first from load
      break;
  }
}

function compareSemver(a, b) {
  const pa = (a || '').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = (b || '').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i += 1) {
    const da = pa[i] || 0;
    const db = pb[i] || 0;
    if (da !== db) return da - db;
  }
  return 0;
}

function showToast(text) {
  els.toastText.textContent = text;
  els.toast.classList.remove('hidden');
  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(() => {
    els.toast.classList.add('hidden');
  }, 2000);
}

function openCreateModal() {
  els.createModal.showModal();
  els.fieldTitle.focus();
}

function updateBell() {
  els.bellCount.textContent = String(state.unseenNotifications);
  els.bellCount.classList.toggle('hidden', state.unseenNotifications === 0);
}

function recomputeDocuments() {
  // Merge local and remote documents, preferring local order first
  const byId = new Map();
  const merged = [];
  for (const d of state.localDocuments) {
    if (!byId.has(d.ID)) {
      byId.set(d.ID, true);
      merged.push(d);
    }
  }
  for (const d of state.remoteDocuments) {
    if (!byId.has(d.ID)) {
      byId.set(d.ID, true);
      merged.push(d);
    }
  }
  // Keep order: local (already newest first) followed by remote newest first
  state.documents = merged;
  render();
}

// Expose minimal API for tests (if needed)
window.__app = { state, setView, sortDocsInPlace, compareSemver };



