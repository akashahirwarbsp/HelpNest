export function filterTickets(tickets, { query = '', status = 'all', priority = 'all' } = {}) {
  const needle = String(query).trim().toLowerCase();
  return tickets.filter((ticket) => {
    const matchesQuery = !needle || [ticket.id, ticket.subject, ticket.customer, ticket.email, ticket.assignee]
      .some((value) => String(value ?? '').toLowerCase().includes(needle));
    const matchesStatus = status === 'all' || ticket.status === status;
    const matchesPriority = priority === 'all' || ticket.priority === priority;
    return matchesQuery && matchesStatus && matchesPriority;
  });
}

export function countByStatus(tickets) {
  return tickets.reduce((counts, ticket) => {
    counts[ticket.status] = (counts[ticket.status] || 0) + 1;
    return counts;
  }, { open: 0, pending: 0, resolved: 0 });
}

export function escapeCsv(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function ticketsToCsv(tickets) {
  const columns = ['id', 'subject', 'customer', 'email', 'priority', 'status', 'assignee', 'channel', 'updated'];
  return [columns.join(','), ...tickets.map((ticket) => columns.map((column) => escapeCsv(ticket[column])).join(','))].join('\r\n');
}

export function getNextTicketId(tickets) {
  const maxId = tickets.reduce((max, ticket) => {
    const number = Number(String(ticket.id).match(/HN-(\d+)/)?.[1] || 0);
    return Math.max(max, number);
  }, 1000);
  return `HN-${maxId + 1}`;
}

export function getInitials(name) {
  return String(name || '?').trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || '?';
}
