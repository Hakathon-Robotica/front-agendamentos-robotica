export function formatDate(date, options = { day: '2-digit', month: 'short', year: 'numeric' }) {
  if (!date) return '—';
  const value = /^\d{4}-\d{2}-\d{2}$/.test(String(date)) ? new Date(`${date}T00:00:00`) : new Date(date);
  return new Intl.DateTimeFormat('pt-BR', options).format(value);
}

export function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
}
