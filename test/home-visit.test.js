import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHomeVisit } from '../src/home-visit.js';

const base = { patientName: 'Тестова Анна', district: 2, requestedAt: new Date('2026-10-15T10:00:00+05:00'), complaints: ['температура'] };

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
  const r = createHomeVisit({ ...base, requestedAt: new Date('2026-10-15T13:59:00+05:00') });
  assert.equal(r.visitDate, '2026-10-15');
});

test('ровно 14:00 — визит завтра', () => {
  const r = createHomeVisit({ ...base, requestedAt: new Date('2026-10-15T14:00:00+05:00') });
  assert.equal(r.visitDate, '2026-10-16');
});

const visitDate = (iso) => createHomeVisit({ ...base, requestedAt: new Date(iso) }).visitDate;

test('31 октября (суббота) 11:00 — визит в тот же день', () => {
  assert.equal(visitDate('2026-10-31T11:00:00+05:00'), '2026-10-31');
});

test('суббота 11:59 — визит в субботу', () => {
  assert.equal(visitDate('2026-10-17T11:59:00+05:00'), '2026-10-17');
});

test('31 октября (суббота) 12:30 — визит 2 ноября: 1 ноября воскресенье', () => {
  assert.equal(visitDate('2026-10-31T12:30:00+05:00'), '2026-11-02');
});

test('суббота ровно 12:00 — визит в понедельник', () => {
  assert.equal(visitDate('2026-10-17T12:00:00+05:00'), '2026-10-19');
});

test('суббота 12:30 — визит в понедельник, а не в воскресенье', () => {
  assert.equal(visitDate('2026-10-17T12:30:00+05:00'), '2026-10-19');
});

test('воскресенье — визит в понедельник', () => {
  assert.equal(visitDate('2026-10-18T09:00:00+05:00'), '2026-10-19');
});

test('пятница 15:00 — визит в субботу', () => {
  assert.equal(visitDate('2026-10-16T15:00:00+05:00'), '2026-10-17');
});
