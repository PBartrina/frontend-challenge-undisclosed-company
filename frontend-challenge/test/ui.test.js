import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';

// Helper to load our app in JSDOM and stub fetch/WebSocket
async function loadApp({ documents = [] } = {}) {
  const dom = new JSDOM(`<!doctype html><html><head></head><body></body></html>`, {
    url: 'http://localhost/',
    pretendToBeVisual: true,
    runScripts: 'dangerously',
  });

  // Minimal HTML structure expected by app
  dom.window.document.body.innerHTML = `
    <div id="toast" class="toast hidden"><span id="toast-text"></span></div>
    <main class="container">
      <button id="list-view-btn"></button>
      <button id="grid-view-btn"></button>
      <select id="sort-select"></select>
      <button id="add-document"></button>
      <section id="list-view"></section>
      <section id="grid-view"></section>
      <button id="bell"></button><span id="bell-count" class="badge hidden">0</span>
    </main>
    <dialog id="create-modal"></dialog>
    <form id="create-form"></form>
    <input id="field-title" />
    <input id="field-version" />
    <input id="field-contributors" />
    <input id="field-attachments" />
  `;

  // Stub fetch
  dom.window.fetch = async () => ({ ok: true, json: async () => documents });

  // Stub WebSocket to avoid network
  class WS {
    constructor() {}
    addEventListener() {}
  }
  dom.window.WebSocket = WS;

  // Provide globals for module code
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.Node = dom.window.Node;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.window.__TEST__ = true;
  // Dialog polyfills for JSDOM
  if (!('showModal' in dom.window.HTMLDialogElement.prototype)) {
    dom.window.HTMLDialogElement.prototype.showModal = function () {};
    dom.window.HTMLDialogElement.prototype.close = function () {};
  }

  // Load modules
  const utilsUrl = new URL('../app/utils.js', import.meta.url);
  const servicesUrl = new URL('../app/services.js', import.meta.url);
  const renderersUrl = new URL('../app/renderers.js', import.meta.url);
  const mainUrl = new URL('../app/main.js', import.meta.url);
  // Import modules into the JSDOM window context
  await import(utilsUrl);
  await import(servicesUrl);
  await import(renderersUrl);
  // main will boot automatically, relying on globals above
  await import(mainUrl);

  return dom;
}

test('renders list with headers and rows', { timeout: 2000 }, async (t) => {
  const docs = [
    {
      ID: '1',
      Title: 'A',
      Version: '1.0.0',
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
      Contributors: [{ ID: 'c1', Name: 'Alice' }],
      Attachments: ['Light Lager'],
    },
  ];
  const dom = await loadApp({ documents: docs });
  const list = dom.window.document.getElementById('list-view');
  // header + 1 row
  assert.ok(list.children.length >= 2, 'should have header and at least one row');
  assert.match(list.textContent, /Name/i);
  assert.match(list.textContent, /Contributors/i);
  assert.match(list.textContent, /Attachments/i);
  dom.window.close();
});

test('grid shows per-line contributors and attachments', { timeout: 2000 }, async (t) => {
  const docs = [
    {
      ID: '2',
      Title: 'B',
      Version: '1.2.3',
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
      Contributors: [{ ID: 'c1', Name: 'Alice' }, { ID: 'c2', Name: 'Bob' }],
      Attachments: ['Stout', 'IPA'],
    },
  ];
  const dom = await loadApp({ documents: docs });
  // Switch to grid view
  dom.window.document.getElementById('grid-view-btn').click();
  const grid = dom.window.document.getElementById('grid-view');
  assert.match(grid.textContent, /Alice/);
  assert.match(grid.textContent, /Bob/);
  assert.match(grid.textContent, /Stout/);
  assert.match(grid.textContent, /IPA/);
  dom.window.close();
});


