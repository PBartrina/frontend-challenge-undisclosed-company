import { createElement, formatVersion, humanList, uuid } from './utils.js';
import { fetchDocuments } from './services.js';
import { renderListRow, renderGridCard } from './renderers.js';

const state = {
  documents: [],
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
  loadDocuments();
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
    state.documents.unshift(doc); // newest first
    render();
    els.createModal.close();
    els.createForm.reset();
    showToast('New document added');
  });
}

async function loadDocuments() {
  try {
    const docs = await fetchDocuments();
    // Sort newest first by default using CreatedAt desc
    docs.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
    state.documents = docs;
    render();
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
      // Optionally reflect the incoming title as a placeholder entry (without full data)
      // but requirement says only notify in realtime, not add to list; we keep list intact.
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

// Expose minimal API for tests (if needed)
window.__app = { state, setView, sortDocsInPlace, compareSemver };



