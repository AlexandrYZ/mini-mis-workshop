// Логика заявки на вызов врача на дом (без DOM).
export const RED_FLAGS = ['боль в груди', 'потеря сознания', 'затруднённое дыхание', 'судороги'];
export const COMPLAINTS = ['температура', 'кашель', 'боль в горле', 'слабость', 'головная боль', ...RED_FLAGS];

const CUTOFF_HOUR = 14;
const pad = (n) => String(n).padStart(2, '0');
const toDateString = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function createHomeVisit({ patientName, district, requestedAt, complaints = [] }) {
  const errors = [];
  if (!patientName?.trim()) errors.push('Укажите ФИО пациента');
  if (!Number.isInteger(district) || district < 1 || district > 5) errors.push('Участок должен быть от 1 до 5');
  if (!(requestedAt instanceof Date) || Number.isNaN(requestedAt.getTime())) errors.push('Укажите время заявки');
  if (errors.length) return { status: 'invalid', errors };

  if (complaints.some((c) => RED_FLAGS.includes(c))) {
    return { status: 'refused', message: 'Вызовите скорую помощь: 103' };
  }

  const visit = new Date(requestedAt);
  if (requestedAt.getHours() >= CUTOFF_HOUR) visit.setDate(visit.getDate() + 1);
  return { status: 'registered', district, visitDate: toDateString(visit) };
}
