// Тест ведущего. Сервер МИС может стоять в Москве или в облаке в UTC, а заявки приходят из Сургута.
process.env.TZ = 'UTC'; // сервер в UTC; Node применяет смену пояса на лету

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHomeVisit } from '../src/home-visit.js';

const visit = (iso) =>
  createHomeVisit({ patientName: 'Тестова Анна', district: 2, requestedAt: new Date(iso), complaints: [] }).visitDate;

test('Сургут 14:30 — визит завтра, даже если сервер в UTC', () => {
  assert.equal(visit('2026-10-15T14:30:00+05:00'), '2026-10-16');
});

test('Сургут 18:00 — визит завтра, даже если сервер в UTC', () => {
  assert.equal(visit('2026-10-15T18:00:00+05:00'), '2026-10-16');
});

test('Сургут 13:59 — визит сегодня', () => {
  assert.equal(visit('2026-10-15T13:59:00+05:00'), '2026-10-15');
});
