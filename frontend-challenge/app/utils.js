export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k === 'style') el.style.cssText = v;
    else el.setAttribute(k, v);
  }
  if (!Array.isArray(children)) children = [children];
  for (const child of children) {
    if (child == null) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

export function formatVersion(value) {
  if (!value) return '1.0.0';
  const parts = value.split('.').map((n) => parseInt(n, 10) || 0);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0].join('.');
}

export function humanList(items) {
  if (!items || items.length === 0) return '';
  return items.join(', ');
}

export function uuid() {
  // Good-enough uuid for UI purposes only (no crypto)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function formatRelativeDate(isoString) {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const sec = Math.floor(diffMs / 1000);
    if (sec < 45) return 'just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return min === 1 ? '1 minute ago' : `${min} minutes ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return hr === 1 ? '1 hour ago' : `${hr} hours ago`;
    const day = Math.floor(hr / 24);
    if (day < 30) return day === 1 ? '1 day ago' : `${day} days ago`;
    const mon = Math.floor(day / 30);
    if (mon < 12) return mon === 1 ? '1 month ago' : `${mon} months ago`;
    const yr = Math.floor(mon / 12);
    return yr === 1 ? '1 year ago' : `${yr} years ago`;
  } catch {
    return '';
  }
}



