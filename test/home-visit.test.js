import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHomeVisit } from '../src/home-visit.js';

const base = { patientName: 'Тестова Анна', district: 2, requestedAt: new Date(2026, 9, 15, 10, 0), complaints: ['температура'] };

test('пустое ФИО — ошибка', () => {
  const r = createHomeVisit({ ...base, patientName: '   ' });
  assert.equal(r.status, 'invalid');
  assert.ok(r.errors.includes('Укажите ФИО пациента'));
});

test('участок 7 — ошибка', () => {
  const r = createHomeVisit({ ...base, district: 7 });
  assert.equal(r.status, 'invalid');
  assert.ok(r.errors.includes('Участок должен быть от 1 до 5'));
});

test('судороги — отказ, 103', () => {
  const r = createHomeVisit({ ...base, complaints: ['температура', 'судороги'] });
  assert.deepEqual(r, { status: 'refused', message: 'Вызовите скорую помощь: 103' });
});

test('температура — заявка принята', () => {
  assert.equal(createHomeVisit(base).status, 'registered');
});

test('13:59 — визит сегодня', () => {
  const r = createHomeVisit({ ...base, requestedAt: new Date(2026, 9, 15, 13, 59) });
  assert.equal(r.visitDate, '2026-10-15');
});

test('ровно 14:00 — визит завтра', () => {
  const r = createHomeVisit({ ...base, requestedAt: new Date(2026, 9, 15, 14, 0) });
  assert.equal(r.visitDate, '2026-10-16');
});

test('31 октября 16:00 — визит 1 ноября', () => {
  const r = createHomeVisit({ ...base, requestedAt: new Date(2026, 9, 31, 16, 0) });
  assert.equal(r.visitDate, '2026-11-01');
});
