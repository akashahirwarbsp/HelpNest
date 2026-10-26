import test from 'node:test';
import assert from 'node:assert/strict';
import { filterTickets, countByStatus, escapeCsv, ticketsToCsv, getNextTicketId, getInitials } from '../src/utils.js';

const tickets = [
  { id: 'HN-10', subject: 'Billing question', customer: 'Ava Moore', email: 'ava@example.com', assignee: 'Sam', status: 'open', priority: 'high', channel: 'Email', updated: 'Now' },
  { id: 'HN-11', subject: 'Login trouble', customer: 'Ben Lee', email: 'ben@example.com', assignee: 'Riley', status: 'pending', priority: 'normal', channel: 'Chat', updated: 'Yesterday' },
  { id: 'HN-12', subject: 'Thanks for the help', customer: 'Cara Diaz', email: 'cara@example.com', assignee: 'Sam', status: 'resolved', priority: 'low', channel: 'Email', updated: 'Monday' }
];

test('filterTickets searches ticket subject and customer without case sensitivity', () => {
  assert.equal(filterTickets(tickets, { query: 'BILLING' }).length, 1);
  assert.equal(filterTickets(tickets, { query: 'cara' })[0].id, 'HN-12');
});

test('filterTickets combines status and priority filters', () => {
  assert.deepEqual(filterTickets(tickets, { status: 'open', priority: 'high' }).map((t) => t.id), ['HN-10']);
  assert.equal(filterTickets(tickets, { status: 'pending', priority: 'low' }).length, 0);
});

test('countByStatus includes zero counts and counts all states', () => {
  assert.deepEqual(countByStatus(tickets), { open: 1, pending: 1, resolved: 1 });
  assert.deepEqual(countByStatus([]), { open: 0, pending: 0, resolved: 0 });
});

test('escapeCsv quotes cells with commas, newlines, and escaped quotes', () => {
  assert.equal(escapeCsv('plain'), 'plain');
  assert.equal(escapeCsv('hello, world'), '"hello, world"');
  assert.equal(escapeCsv('say "hello"'), '"say ""hello"""');
});

test('ticketsToCsv includes the agreed header and safely escaped values', () => {
  const csv = ticketsToCsv([{ ...tickets[0], subject: 'Refund, please' }]);
  assert.ok(csv.startsWith('id,subject,customer,email,priority,status,assignee,channel,updated\r\n'));
  assert.ok(csv.includes('"Refund, please"'));
});

test('getNextTicketId chooses a number above the current maximum', () => {
  assert.equal(getNextTicketId(tickets), 'HN-1001');
  assert.equal(getNextTicketId([{ id: 'HN-1052' }, { id: 'ticket-9' }]), 'HN-1053');
});

test('getInitials returns up to two initials and handles empty input', () => {
  assert.equal(getInitials('Alex Morgan'), 'AM');
  assert.equal(getInitials('  riley kim tan '), 'RK');
  assert.equal(getInitials(''), '?');
});
