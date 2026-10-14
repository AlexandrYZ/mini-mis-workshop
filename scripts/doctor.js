// Самопроверка рабочего места: npm run doctor  (без пробного запроса к модели: npm run doctor -- --no-ping)
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const isWin = process.platform === 'win32';
let failed = 0;

const ok = (msg) => console.log(`✅ ${msg}`);
const warn = (msg, hint) => console.log(`⚠️  ${msg}${hint ? `\n   → ${hint}` : ''}`);
const fail = (msg, hint) => { failed++; console.log(`❌ ${msg}\n   → ${hint}`); };

function run(cmd, args, timeout = 15000) {
  // shell на Windows нужен, чтобы находились npm-обёртки *.cmd
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', timeout, shell: isWin });
  return { ok: r.status === 0, out: `${r.stdout ?? ''}${r.stderr ?? ''}`.trim(), timedOut: r.error?.code === 'ETIMEDOUT' };
}

const firstLine = (s) => s.split('\n')[0];

// 1. Node
const [maj, min] = process.versions.node.split('.').map(Number);
if (maj > 20 || (maj === 20 && min >= 19)) ok(`Node ${process.versions.node}`);
else fail(`Node ${process.versions.node} — нужна версия 20.19 или новее`, 'Установите Node LTS с nodejs.org (или с флешки) и откройте терминал заново');

// 2. git (необязателен: можно работать из ZIP)
const git = run('git', ['--version']);
if (git.ok) ok(firstLine(git.out));
else warn('git не найден', 'Можно работать без git, но догонять этапы (npm run catchup) не получится');

// 3. OpenSpec
const os = run('openspec', ['--version']);
if (os.ok) ok(`openspec ${firstLine(os.out)}`);
else fail('openspec не найден', 'npm i -g @fission-ai/openspec   (Windows: откройте терминал заново; macOS при EACCES — с sudo)');

// 4. OpenCode
const oc = run('opencode', ['--version']);
if (oc.ok) ok(`opencode ${firstLine(oc.out)}`);
else fail('opencode не найден', 'npm i -g opencode-ai   (Windows: откройте терминал заново; macOS при EACCES — с sudo)');

// 5. Файл настроек с ключами
const cfgName = ['opencode.json', 'opencode.jsonc'].find((f) => existsSync(new URL(`../${f}`, import.meta.url)));
if (!cfgName) {
  fail('Нет файла настроек opencode.json в папке проекта', 'Скачайте его по QR-коду со слайда и положите рядом с README.md');
} else {
  const cfg = readFileSync(new URL(`../${cfgName}`, import.meta.url), 'utf8');
  const keys = [...cfg.matchAll(/"apiKey"\s*:\s*"([^"]*)"/g)].map((m) => m[1]);
  if (keys.length && keys.every((k) => k && !k.startsWith('<'))) ok(`${cfgName}: ключей — ${keys.length}`);
  else fail(`${cfgName}: ключ не заполнен`, 'Возьмите файл настроек у ведущего, не правьте пример opencode.example.json');
}

// 6. Команды OpenSpec для OpenCode
if (existsSync(new URL('../.opencode/commands/opsx-propose.md', import.meta.url))) ok('Команды OpenSpec для OpenCode на месте (/opsx-…)');
else fail('Нет .opencode/commands', 'Вы не в папке проекта или распаковали архив не полностью');

// 7. Порт для npm start
const port = Number(process.env.PORT) || 3000;
const free = await new Promise((resolve) => {
  const s = createServer().once('error', () => resolve(false)).listen(port, '127.0.0.1', () => s.close(() => resolve(true)));
});
if (free) ok(`Порт ${port} свободен`);
else warn(`Порт ${port} занят`, 'Если это уже запущенный npm start — всё в порядке. Иначе: PORT=3001 npm start');

// 8. Пробный запрос к модели
if (process.argv.includes('--no-ping')) {
  warn('Пробный запрос к модели пропущен (--no-ping)');
} else if (oc.ok && cfgName) {
  console.log('…  Пробный запрос к модели (до 60 секунд)');
  const ping = run('opencode', ['run', 'Ответь одним словом: готово'], 60000);
  if (ping.ok && ping.out) ok(`Модель отвечает: «${firstLine(ping.out).slice(0, 60)}»`);
  else fail(ping.timedOut ? 'Модель не ответила за 60 секунд' : 'Модель не отвечает',
    `Проверьте интернет и ключ в ${cfgName}. Если медленно — в opencode наберите /models и выберите другого провайдера\n   ${firstLine(ping.out).slice(0, 200)}`);
}

console.log(failed ? `\nИсправьте пункты с ❌ (${failed}). Не получается за 5 минут — садитесь в пару к соседу.` : '\nВсё готово. Запускайте: opencode');
process.exit(failed ? 1 : 0);
