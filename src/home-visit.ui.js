// Вкладка «Вызов врача на дом».
import { CLINIC_UTC_OFFSET, COMPLAINTS, createHomeVisit } from './home-visit.js';

// Текущее время поликлиники (UTC+5) в формате поля datetime-local
const nowClinic = () => new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 16);
const formatDate = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export function mount(container) {
  container.innerHTML = `
    <form class="form">
      <label>ФИО пациента (синтетическое)
        <input name="patientName" placeholder="Тестова Анна Петровна" autocomplete="off">
      </label>
      <label>Участок
        <select name="district">${[1, 2, 3, 4, 5].map((n) => `<option value="${n}">Участок ${n}</option>`).join('')}</select>
      </label>
      <label>Время заявки (по Сургуту)
        <input name="requestedAt" type="datetime-local" required>
      </label>
      <fieldset><legend>Жалобы</legend>
        ${COMPLAINTS.map((c) => `<label><input type="checkbox" name="complaints" value="${c}"> ${c}</label>`).join('')}
      </fieldset>
      <button type="submit">Зарегистрировать вызов</button>
    </form>
    <div class="result" hidden></div>`;

  const form = container.querySelector('form');
  const out = container.querySelector('.result');
  form.requestedAt.value = nowClinic();

  form.onsubmit = (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const r = createHomeVisit({
      patientName: data.get('patientName'),
      district: Number(data.get('district')),
      requestedAt: new Date(`${data.get('requestedAt')}${CLINIC_UTC_OFFSET}`),
      complaints: data.getAll('complaints'),
    });
    out.hidden = false;
    out.className = `result ${r.status === 'registered' ? 'ok' : r.status === 'refused' ? 'danger' : 'invalid'}`;
    if (r.status === 'registered') {
      out.innerHTML = `<b>Вызов зарегистрирован</b><br>Участок ${r.district}<br>Визит: <b>${formatDate(r.visitDate)}</b>`;
    } else if (r.status === 'refused') {
      out.innerHTML = `<b>${r.message}</b><br>Заявка на вызов врача на дом не зарегистрирована.`;
    } else {
      out.innerHTML = `<b>Проверьте заявку:</b><ul>${r.errors.map((x) => `<li>${x}</li>`).join('')}</ul>`;
    }
    out.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); // на телефоне карточка ниже первого экрана
  };
}
