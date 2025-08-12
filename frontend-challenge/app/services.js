export async function fetchDocuments() {
  const res = await fetch('http://localhost:8080/documents', {
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch documents');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}



