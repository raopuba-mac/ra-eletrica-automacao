import test from 'node:test';
import assert from 'node:assert/strict';
import { getDueReminder } from '../server/services/reminderSchedule.js';

const d = (s: string) => Date.parse(s);

test('5 minutos antes: dispara às 10:25 para compromisso às 10:30', () => {
  const out = getDueReminder({ date: d('2026-10-21T10:30:00Z'), notifyTime: '5_min' }, d('2026-10-21T10:25:00Z'));
  assert.equal(out?.plannedAt, d('2026-10-21T10:25:00Z'));
});

test('5 minutos antes: tolera atrasos sem avisar depois do início', () => {
  const evt = { date: d('2026-10-21T10:30:00Z'), notifyTime: '5_min' };
  assert.ok(getDueReminder(evt, d('2026-10-21T10:28:00Z')));
  assert.equal(getDueReminder(evt, d('2026-10-21T10:32:00Z')), null);
});

test('15 minutos antes: janela de recuperação', () => {
  const evt = { date: d('2026-10-21T10:30:00Z'), notifyTime: '15_min' };
  assert.ok(getDueReminder(evt, d('2026-10-21T10:22:00Z')));
});

test('lembrete desativado não dispara', () => {
  assert.equal(getDueReminder({ date: Date.now() + 5 * 60_000, notifyTime: 'none' }, Date.now()), null);
});

test('evento antigo sem recorrência não dispara', () => {
  assert.equal(getDueReminder({ date: d('2025-01-01T10:30:00Z'), notifyTime: 'at_event' }, d('2026-10-21T10:30:00Z')), null);
});

test('recorrência diária usa a ocorrência de hoje', () => {
  const out = getDueReminder({ date: d('2026-10-18T10:30:00Z'), notifyTime: '5_min', recurrence: 'daily' }, d('2026-10-21T10:25:00Z'));
  assert.equal(out?.occurrenceAt, d('2026-10-21T10:30:00Z'));
});

test('recorrência mensal preserva fim do mês', () => {
  const out = getDueReminder({ date: d('2026-01-31T10:30:00Z'), notifyTime: '5_min', recurrence: 'monthly' }, d('2026-02-28T10:25:00Z'));
  assert.equal(out?.occurrenceAt, d('2026-02-28T10:30:00Z'));
});
