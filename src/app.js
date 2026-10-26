import { seedTickets, seedCustomers } from './data.js';
import { filterTickets, countByStatus, ticketsToCsv, getNextTicketId, getInitials } from './utils.js';

const STORE_KEY = 'helpnest.tickets.v1';
const PAGE_SIZE = 5;
const state = {
  tickets: loadTickets(), page: 'overview', query: '', status: 'all', priority: 'all', pageNumber: 1,
  selectedId: null, selectedIds: new Set(), editingId: null
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const capitalize = (value) => value ? value[0].toUpperCase() + value.slice(1) : '';

function loadTickets() {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.warn('HelpNest could not read saved data. Starting with sample tickets.', error);
  }
  return structuredClone(seedTickets);
}

function saveTickets() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state.tickets)); }
  catch (error) { showToast('Could not save changes in this browser.'); console.error(error); }
}

function currentTickets() {
  return filterTickets(state.tickets, { query: state.query, status: state.status, priority: state.priority });
}

function initialsColor(name) {
  const tones = ['avatar-purple', 'avatar-blue', 'avatar-green', 'avatar-rose', 'avatar-orange'];
  const hash = [...String(name)].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return tones[hash % tones.length];
}

function ticketRow(ticket) {
  return `<tr class="ticket-row ${state.selectedIds.has(ticket.id) ? 'selected-row' : ''}" data-ticket-row="${escapeHTML(ticket.id)}">
    <td class="check-col"><input type="checkbox" class="row-check" data-select-ticket="${escapeHTML(ticket.id)}" aria-label="Select ${escapeHTML(ticket.id)}" ${state.selectedIds.has(ticket.id) ? 'checked' : ''}></td>
    <td><button class="ticket-title-button" data-open-ticket="${escapeHTML(ticket.id)}"><span class="ticket-id">#${escapeHTML(ticket.id)}</span><strong>${escapeHTML(ticket.subject)}</strong><span class="ticket-channel">${escapeHTML(ticket.channel || 'Email')}</span></button></td>
    <td><div class="customer-cell"><span class="avatar avatar-small ${initialsColor(ticket.customer)}">${escapeHTML(getInitials(ticket.customer))}</span><span>${escapeHTML(ticket.customer)}</span></div></td>
    <td><span class="priority-tag priority-${escapeHTML(ticket.priority)}"><i></i>${capitalize(ticket.priority)}</span></td>
    <td><span class="status-tag status-${escapeHTML(ticket.status)}"><i></i>${capitalize(ticket.status)}</span></td>
    <td class="updated-cell">${escapeHTML(ticket.updated)}</td></tr>`;
}

function renderTickets() {
  const all = currentTickets();
  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  state.pageNumber = Math.min(state.pageNumber, totalPages);
  const start = (state.pageNumber - 1) * PAGE_SIZE;
  const visible = all.slice(start, start + PAGE_SIZE);
  $('#ticket-table-body').innerHTML = visible.map(ticketRow).join('');
  $('#tickets-empty').classList.toggle('hidden', all.length !== 0);
  $('.ticket-table').classList.toggle('hidden', all.length === 0);
  $('#table-summary').textContent = all.length ? `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, all.length)} of ${all.length} tickets` : 'No tickets to show';
  $('#page-number').textContent = `${state.pageNumber} / ${totalPages}`;
  $('#previous-page').disabled = state.pageNumber <= 1;
  $('#next-page').disabled = state.pageNumber >= totalPages;
  $('#select-all').checked = visible.length > 0 && visible.every((ticket) => state.selectedIds.has(ticket.id));
  const counts = countByStatus(state.tickets);
  $('#nav-open-count').textContent = counts.open;
  $('#count-all').textContent = state.tickets.length;
  $('#count-open').textContent = counts.open;
  $('#count-pending').textContent = counts.pending;
  $('#metric-open').textContent = String(counts.open).padStart(2, '0');
  $$('#overview-page .filter-pill[data-status]').forEach((button) => button.classList.toggle('active', button.dataset.status === state.status));
}

function renderOverview() {
  renderTickets();
  $('#heading-overview').classList.toggle('hidden', state.page !== 'overview');
  $('#heading-other').classList.toggle('hidden', state.page === 'overview');
  $('#overview-page').classList.toggle('hidden', state.page !== 'overview');
  $('#generic-page').classList.toggle('hidden', state.page === 'overview');
  const names = {
    tickets: ['All tickets', 'Search, filter, and manage every conversation in one place.'],
    customers: ['Customers', 'Get to know the people behind every conversation.'],
    reports: ['Reports', 'A simple snapshot of support performance in this demo workspace.'],
    settings: ['Settings', 'Make the demo workspace feel right for your workflow.']
  };
  const [title, subtitle] = names[state.page] || names.tickets;
  $('#other-title').textContent = title;
  $('#other-subtitle').textContent = subtitle;
  $('#page-crumb').textContent = state.page === 'overview' ? 'Overview' : title;
  $$('.nav-item[data-page]').forEach((item) => item.classList.toggle('active', item.dataset.page === state.page));
  renderGenericPage();
}

function renderGenericPage() {
  const host = $('#generic-panel');
  if (state.page === 'tickets') {
    host.innerHTML = `<div class="panel-heading generic-heading"><div><h2>All tickets <span class="heading-count">${state.tickets.length}</span></h2><p>Use the search bar and filters to find a conversation.</p></div><div class="generic-tools"><select id="generic-status-filter" aria-label="Filter ticket status"><option value="all">Every status</option><option value="open">Open</option><option value="pending">Pending</option><option value="resolved">Resolved</option></select><select id="generic-priority-filter" aria-label="Filter ticket priority"><option value="all">Every priority</option><option value="urgent">Urgent</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select></div></div><div class="ticket-toolbar"><div class="tab-pills" role="group" aria-label="Ticket status filter"><button class="filter-pill ${state.status === 'all' ? 'active' : ''}" data-status="all">All <span>${state.tickets.length}</span></button><button class="filter-pill ${state.status === 'open' ? 'active' : ''}" data-status="open">Open</button><button class="filter-pill ${state.status === 'pending' ? 'active' : ''}" data-status="pending">Pending</button><button class="filter-pill ${state.status === 'resolved' ? 'active' : ''}" data-status="resolved">Resolved</button></div><button class="button button-quiet" id="generic-export">↓ Export filtered</button></div><div class="ticket-list-wrap"><table class="ticket-table"><thead><tr><th class="check-col"></th><th>Ticket</th><th>Customer</th><th>Priority</th><th>Status</th><th>Updated</th></tr></thead><tbody id="generic-ticket-body"></tbody></table><div class="empty-state hidden" id="generic-empty"><div>⌕</div><strong>No tickets match</strong><p>Change your filters to see more conversations.</p></div></div>`;
    const filtered = currentTickets();
    $('#generic-ticket-body').innerHTML = filtered.map(ticketRow).join('');
    $('#generic-empty').classList.toggle('hidden', filtered.length > 0);
    host.querySelector('.ticket-table').classList.toggle('hidden', filtered.length === 0);
    $('#generic-status-filter').value = state.status;
    $('#generic-priority-filter').value = state.priority;
  } else if (state.page === 'customers') {
    host.innerHTML = `<div class="panel-heading generic-heading"><div><h2>Customer directory</h2><p>Sample customer profiles from the demo inbox.</p></div><span class="heading-count">${seedCustomers.length} customers</span></div><div class="customer-grid">${seedCustomers.map((person) => `<article class="customer-card"><div class="customer-card-top"><div class="avatar ${person.tone}">${escapeHTML(person.initials)}</div><span class="customer-ticket-count">${person.tickets} tickets</span></div><h3>${escapeHTML(person.name)}</h3><p>${escapeHTML(person.company)}</p><a href="mailto:${escapeHTML(person.email)}">${escapeHTML(person.email)}</a><div class="customer-card-bottom"><span>Customer since ${escapeHTML(person.joined)}</span><button class="text-button" data-customer-search="${escapeHTML(person.email)}">View tickets →</button></div></article>`).join('')}</div>`;
  } else if (state.page === 'reports') {
    const counts = countByStatus(state.tickets);
    const total = Math.max(state.tickets.length, 1);
    const percentage = (value) => Math.round(value / total * 100);
    host.innerHTML = `<div class="panel-heading generic-heading"><div><h2>Support performance</h2><p>Current status breakdown based on sample tickets.</p></div><span class="report-period">● Demo snapshot</span></div><div class="report-metrics"><article><span>Total tickets</span><strong>${state.tickets.length}</strong><p>All conversations in this workspace</p></article><article><span>Open workload</span><strong>${counts.open}</strong><p>Tickets awaiting a reply or action</p></article><article><span>Resolved</span><strong>${counts.resolved}</strong><p>Marked complete in the demo</p></article></div><div class="report-status-list"><div class="report-row"><div><span class="status-tag status-open"><i></i>Open</span><strong>${counts.open}</strong></div><div class="progress-track"><span style="width:${percentage(counts.open)}%"></span></div><small>${percentage(counts.open)}% of tickets</small></div><div class="report-row"><div><span class="status-tag status-pending"><i></i>Pending</span><strong>${counts.pending}</strong></div><div class="progress-track progress-pending"><span style="width:${percentage(counts.pending)}%"></span></div><small>${percentage(counts.pending)}% of tickets</small></div><div class="report-row"><div><span class="status-tag status-resolved"><i></i>Resolved</span><strong>${counts.resolved}</strong></div><div class="progress-track progress-resolved"><span style="width:${percentage(counts.resolved)}%"></span></div><small>${percentage(counts.resolved)}% of tickets</small></div></div><div class="report-disclaimer">These figures update when you create or change tickets. Response-time and satisfaction figures on the overview are illustrative demo values.</div>`;
  } else {
    host.innerHTML = `<div class="panel-heading generic-heading"><div><h2>Workspace preferences</h2><p>Settings are stored locally in this browser only.</p></div></div><div class="settings-list"><label class="setting-row"><div><strong>Compact ticket list</strong><p>Reduce row spacing in ticket tables.</p></div><input id="compact-toggle" type="checkbox" ${localStorage.getItem('helpnest.compact') === 'true' ? 'checked' : ''}></label><label class="setting-row"><div><strong>Dark appearance</strong><p>Switch to a darker color theme for low-light use.</p></div><input id="theme-toggle" type="checkbox" ${localStorage.getItem('helpnest.dark') === 'true' ? 'checked' : ''}></label><div class="setting-row"><div><strong>Reset demo data</strong><p>Restore the original sample tickets and clear local changes.</p></div><button class="button button-danger" id="reset-demo">Reset data</button></div><div class="settings-callout"><span>ⓘ</span><p>HelpNest runs entirely in your browser. It does not connect to a real support inbox or send customer messages.</p></div></div>`;
  }
}

function setPage(page) {
  state.page = page;
  state.pageNumber = 1;
  $('#sidebar').classList.remove('sidebar-open');
  renderOverview();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openModal(ticket = null) {
  state.editingId = ticket?.id || null;
  $('#ticket-form').reset();
  $('#ticket-id').value = ticket?.id || '';
  $('#ticket-subject').value = ticket?.subject || '';
  $('#ticket-customer').value = ticket?.customer || '';
  $('#ticket-email').value = ticket?.email || '';
  $('#ticket-priority').value = ticket?.priority || 'normal';
  $('#ticket-status').value = ticket?.status || 'open';
  $('#ticket-description').value = ticket?.description || '';
  $('#modal-title').textContent = ticket ? `Edit #${ticket.id}` : 'Create a new ticket';
  $('#save-ticket-button').textContent = ticket ? 'Save changes' : 'Create ticket';
  $('#form-error').classList.add('hidden');
  $('#modal-overlay').classList.remove('hidden');
  document.body.classList.add('modal-open');
  window.setTimeout(() => $('#ticket-subject').focus(), 30);
}

function closeModal() {
  $('#modal-overlay').classList.add('hidden');
  document.body.classList.remove('modal-open');
  state.editingId = null;
}

function submitTicket(event) {
  event.preventDefault();
  const subject = $('#ticket-subject').value.trim();
  const customer = $('#ticket-customer').value.trim();
  const email = $('#ticket-email').value.trim();
  if (!subject || !customer || !email) {
    $('#form-error').textContent = 'Please complete the subject, customer name, and valid email address.';
    $('#form-error').classList.remove('hidden');
    return;
  }
  const details = { subject, customer, email, priority: $('#ticket-priority').value, status: $('#ticket-status').value, description: $('#ticket-description').value.trim() };
  if (state.editingId) {
    const index = state.tickets.findIndex((ticket) => ticket.id === state.editingId);
    if (index >= 0) state.tickets[index] = { ...state.tickets[index], ...details, updated: 'Just now' };
    showToast('Ticket changes saved');
  } else {
    const ticket = { id: getNextTicketId(state.tickets), ...details, assignee: 'Alex Morgan', updated: 'Just now', created: new Date().toISOString(), replies: 0, channel: 'Web form' };
    state.tickets.unshift(ticket);
    showToast(`Ticket #${ticket.id} created`);
  }
  saveTickets(); closeModal(); state.page = 'tickets'; state.query = ''; state.status = 'all'; state.priority = 'all'; state.pageNumber = 1;
  $('#global-search').value = '';
  renderOverview();
  if (state.editingId) state.editingId = null;
}

function openDrawer(id) {
  const ticket = state.tickets.find((item) => item.id === id);
  if (!ticket) return;
  state.selectedId = id;
  $('#drawer-content').innerHTML = `<div class="drawer-ticket-head"><span class="ticket-id">#${escapeHTML(ticket.id)}</span><div class="drawer-action-row"><button class="button button-quiet" id="edit-current-ticket">✎ Edit</button><button class="button button-outline" id="resolve-current-ticket">${ticket.status === 'resolved' ? 'Reopen ticket' : '✓ Mark resolved'}</button></div><h2>${escapeHTML(ticket.subject)}</h2><div class="drawer-tags"><span class="priority-tag priority-${escapeHTML(ticket.priority)}"><i></i>${capitalize(ticket.priority)} priority</span><span class="status-tag status-${escapeHTML(ticket.status)}"><i></i>${capitalize(ticket.status)}</span></div></div><div class="drawer-section"><h3>Customer</h3><div class="drawer-customer"><div class="avatar ${initialsColor(ticket.customer)}">${escapeHTML(getInitials(ticket.customer))}</div><div><strong>${escapeHTML(ticket.customer)}</strong><a href="mailto:${escapeHTML(ticket.email)}">${escapeHTML(ticket.email)}</a></div></div></div><div class="drawer-section"><h3>Ticket details</h3><div class="detail-grid"><span>Assignee</span><strong>${escapeHTML(ticket.assignee || 'Unassigned')}</strong><span>Channel</span><strong>${escapeHTML(ticket.channel || 'Email')}</strong><span>Last updated</span><strong>${escapeHTML(ticket.updated)}</strong><span>Replies</span><strong>${Number(ticket.replies) || 0}</strong></div></div><div class="drawer-section"><h3>Description</h3><p class="description-text">${escapeHTML(ticket.description || 'No description was provided.')}</p></div><div class="drawer-section"><h3>Quick update</h3><label class="drawer-select">Status<select id="drawer-status"><option value="open" ${ticket.status === 'open' ? 'selected' : ''}>Open</option><option value="pending" ${ticket.status === 'pending' ? 'selected' : ''}>Pending</option><option value="resolved" ${ticket.status === 'resolved' ? 'selected' : ''}>Resolved</option></select></label><label class="drawer-select">Priority<select id="drawer-priority"><option value="urgent" ${ticket.priority === 'urgent' ? 'selected' : ''}>Urgent</option><option value="high" ${ticket.priority === 'high' ? 'selected' : ''}>High</option><option value="normal" ${ticket.priority === 'normal' ? 'selected' : ''}>Normal</option><option value="low" ${ticket.priority === 'low' ? 'selected' : ''}>Low</option></select></label><button class="button button-primary full-width" id="save-drawer-updates">Save ticket updates</button></div><div class="drawer-section drawer-delete"><button class="text-button danger-text" id="delete-current-ticket">Delete this demo ticket</button></div>`;
  $('#detail-drawer').classList.remove('hidden');
  $('#close-drawer').textContent = `← Back to ${state.page === 'overview' ? 'overview' : 'tickets'}`;
}

function closeDrawer() { $('#detail-drawer').classList.add('hidden'); state.selectedId = null; }

function saveDrawerUpdates() {
  const ticket = state.tickets.find((item) => item.id === state.selectedId);
  if (!ticket) return;
  ticket.status = $('#drawer-status').value;
  ticket.priority = $('#drawer-priority').value;
  ticket.updated = 'Just now';
  saveTickets(); renderOverview(); openDrawer(ticket.id); showToast('Ticket updated');
}

function deleteCurrentTicket() {
  const ticket = state.tickets.find((item) => item.id === state.selectedId);
  if (!ticket || !window.confirm(`Delete demo ticket ${ticket.id}? This cannot be undone.`)) return;
  state.tickets = state.tickets.filter((item) => item.id !== ticket.id);
  state.selectedIds.delete(ticket.id);
  saveTickets(); closeDrawer(); renderOverview(); showToast(`Ticket ${ticket.id} deleted`);
}

function exportCsv(tickets = currentTickets()) {
  if (!tickets.length) return showToast('There are no tickets to export');
  const csv = ticketsToCsv(tickets);
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url; link.download = `helpnest-tickets-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  showToast(`Exported ${tickets.length} ticket${tickets.length === 1 ? '' : 's'}`);
}

let toastTimer;
function showToast(message) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.remove('hidden');
  window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => toast.classList.add('hidden'), 2800);
}

function syncFilters() {
  $('#status-filter').value = state.status;
  $('#priority-filter').value = state.priority;
  state.pageNumber = 1; renderOverview();
}

function attachEvents() {
  $$('.nav-item[data-page]').forEach((button) => button.addEventListener('click', () => setPage(button.dataset.page)));
  $$('[data-go]').forEach((button) => button.addEventListener('click', () => setPage(button.dataset.go)));
  $('#new-ticket-button').addEventListener('click', () => openModal());
  $('#new-ticket-button-alt').addEventListener('click', () => openModal());
  $('#close-modal').addEventListener('click', closeModal); $('#cancel-modal').addEventListener('click', closeModal);
  $('#modal-overlay').addEventListener('click', (event) => { if (event.target === $('#modal-overlay')) closeModal(); });
  $('#ticket-form').addEventListener('submit', submitTicket);
  $('#global-search').addEventListener('input', (event) => { state.query = event.target.value; state.pageNumber = 1; renderOverview(); });
  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); $('#global-search').focus(); }
    if (event.key === 'Escape') { closeModal(); closeDrawer(); $('#sidebar').classList.remove('sidebar-open'); }
  });
  $('#filter-toggle').addEventListener('click', () => $('#advanced-filters').classList.toggle('hidden'));
  $('#status-filter').addEventListener('change', (event) => { state.status = event.target.value; syncFilters(); });
  $('#priority-filter').addEventListener('change', (event) => { state.priority = event.target.value; syncFilters(); });
  $('#previous-page').addEventListener('click', () => { state.pageNumber = Math.max(1, state.pageNumber - 1); renderOverview(); });
  $('#next-page').addEventListener('click', () => { state.pageNumber += 1; renderOverview(); });
  $('#export-button').addEventListener('click', () => exportCsv(state.selectedIds.size ? state.tickets.filter((t) => state.selectedIds.has(t.id)) : currentTickets()));
  $('#select-all').addEventListener('change', (event) => {
    const all = currentTickets().slice((state.pageNumber - 1) * PAGE_SIZE, state.pageNumber * PAGE_SIZE);
    all.forEach((ticket) => event.target.checked ? state.selectedIds.add(ticket.id) : state.selectedIds.delete(ticket.id));
    renderOverview();
  });
  document.addEventListener('change', (event) => {
    const id = event.target.dataset.selectTicket;
    if (id) { event.target.checked ? state.selectedIds.add(id) : state.selectedIds.delete(id); renderOverview(); }
    if (event.target.id === 'generic-status-filter') { state.status = event.target.value; state.pageNumber = 1; renderOverview(); }
    if (event.target.id === 'generic-priority-filter') { state.priority = event.target.value; state.pageNumber = 1; renderOverview(); }
    if (event.target.id === 'compact-toggle') { localStorage.setItem('helpnest.compact', String(event.target.checked)); document.body.classList.toggle('compact-mode', event.target.checked); showToast('Display preference saved'); }
    if (event.target.id === 'theme-toggle') { localStorage.setItem('helpnest.dark', String(event.target.checked)); document.body.classList.toggle('dark-mode', event.target.checked); showToast('Appearance preference saved'); }
    if (event.target.id === 'drawer-status' || event.target.id === 'drawer-priority') { /* Save button applies changes. */ }
  });
  document.addEventListener('click', (event) => {
    const statusButton = event.target.closest('.filter-pill[data-status]');
    if (statusButton) { state.status = statusButton.dataset.status; syncFilters(); return; }
    if (event.target.id === 'clear-filters') { state.query = ''; state.status = 'all'; state.priority = 'all'; $('#global-search').value = ''; syncFilters(); return; }
    const open = event.target.closest('[data-open-ticket]');
    if (open) { event.preventDefault(); openDrawer(open.dataset.openTicket); }
    const customerSearch = event.target.closest('[data-customer-search]');
    if (customerSearch) { state.query = customerSearch.dataset.customerSearch; $('#global-search').value = state.query; setPage('tickets'); }
    if (event.target.id === 'generic-export') exportCsv(currentTickets());
    if (event.target.id === 'edit-current-ticket') { const ticket = state.tickets.find((item) => item.id === state.selectedId); if (ticket) { closeDrawer(); openModal(ticket); } }
    if (event.target.id === 'resolve-current-ticket') { const ticket = state.tickets.find((item) => item.id === state.selectedId); if (ticket) { ticket.status = ticket.status === 'resolved' ? 'open' : 'resolved'; ticket.updated = 'Just now'; saveTickets(); renderOverview(); openDrawer(ticket.id); showToast(ticket.status === 'resolved' ? 'Ticket marked resolved' : 'Ticket reopened'); } }
    if (event.target.id === 'save-drawer-updates') saveDrawerUpdates();
    if (event.target.id === 'delete-current-ticket') deleteCurrentTicket();
    if (event.target.id === 'reset-demo') {
      if (window.confirm('Reset all ticket changes and restore the original sample data?')) { state.tickets = structuredClone(seedTickets); state.selectedIds.clear(); saveTickets(); renderOverview(); showToast('Sample data restored'); }
    }
  });
  $('#close-drawer').addEventListener('click', closeDrawer); $('#close-drawer-x').addEventListener('click', closeDrawer);
  $('#mobile-menu').addEventListener('click', () => $('#sidebar').classList.toggle('sidebar-open'));
  $('#notifications-button').addEventListener('click', () => showToast('You’re all caught up on demo notifications'));
  $('#profile-menu').addEventListener('click', () => showToast('Profile menu is part of the demo UI'));
  document.body.classList.toggle('dark-mode', localStorage.getItem('helpnest.dark') === 'true');
  document.body.classList.toggle('compact-mode', localStorage.getItem('helpnest.compact') === 'true');
}

attachEvents();
renderOverview();
