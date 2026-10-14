// Логика заявки на вызов врача на дом (без DOM).
export const RED_FLAGS = ['боль в груди', 'потеря сознания', 'затруднённое дыхание', 'судороги'];
export const COMPLAINTS = ['температура', 'кашель', 'боль в горле', 'слабость', 'головная боль', ...RED_FLAGS];

const CUTOFF_HOUR = 14;
const SATURDAY_CUTOFF_HOUR = 12;
const SUNDAY = 0;
const SATURDAY = 6;
// ponytail: фиксированный UTC+5 — Сургут (Asia/Yekaterinburg) без летнего времени с 2014; для нескольких регионов — Intl.DateTimeFormat с timeZone
export const CLINIC_UTC_OFFSET = '+05:00';
const OFFSET_MS = 5 * 60 * 60 * 1000;

export function createHomeVisit({ patientName, district, requestedAt, complaints = [] }) {
  const errors = [];
  if (!patientName?.trim()) errors.push('Укажите ФИО пациента');
  if (!Number.isInteger(district) || district < 1 || district > 5) errors.push('Участок должен быть от 1 до 5');
  if (!(requestedAt instanceof Date) || Number.isNaN(requestedAt.getTime())) errors.push('Укажите время заявки');
  if (errors.length) return { status: 'invalid', errors };

  if (complaints.some((c) => RED_FLAGS.includes(c))) {
    return { status: 'refused', message: 'Вызовите скорую помощь: 103' };
  }

  // «Часы» UTC сдвинутой даты = местное время поликлиники, независимо от пояса сервера
  const local = new Date(requestedAt.getTime() + OFFSET_MS);
  const cutoff = local.getUTCDay() === SATURDAY ? SATURDAY_CUTOFF_HOUR : CUTOFF_HOUR;
  if (local.getUTCHours() >= cutoff) local.setUTCDate(local.getUTCDate() + 1);
  if (local.getUTCDay() === SUNDAY) local.setUTCDate(local.getUTCDate() + 1);
  return { status: 'registered', district, visitDate: local.toISOString().slice(0, 10) };
}
