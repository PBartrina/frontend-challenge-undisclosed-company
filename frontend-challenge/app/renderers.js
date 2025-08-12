import { createElement, humanList, formatRelativeDate } from './utils.js';

export function renderListRow(doc) {
  const nameCol = createElement('div', { class: 'col' }, [
    createElement('div', { class: 'name' }, doc.Title),
    createElement(
      'div',
      { class: 'muted' },
      `Version ${doc.Version || '—'} · ${formatRelativeDate(doc.CreatedAt)}`
    ),
  ]);

  const contributors = createElement(
    'div',
    { class: 'col muted' },
    doc.Contributors?.map((c) => c.Name) ?? []
  );

  const attachments = createElement(
    'div',
    { class: 'col muted' },
    doc.Attachments ?? []
  );

  return createElement('article', { class: 'row', role: 'group', 'aria-label': doc.Title }, [
    nameCol,
    contributors,
    attachments,
  ]);
}

export function renderGridCard(doc) {
  const title = createElement('div', { class: 'title' }, doc.Title);
  const ver = createElement(
    'div',
    { class: 'version' },
    `Version ${doc.Version || '—'} · ${formatRelativeDate(doc.CreatedAt)}`
  );
  const contributors = createElement('div', { class: 'list' }, (doc.Contributors || []).map((c) => c.Name));
  const attachments = createElement('div', { class: 'list muted' }, doc.Attachments || []);

  return createElement('article', { class: 'card', role: 'group', 'aria-label': doc.Title }, [
    title,
    ver,
    contributors,
    attachments,
  ]);
}



