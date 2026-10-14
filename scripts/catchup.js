// Догнать группу: npm run catchup -- 2   (перейти на этап 2)
// Ваша работа не теряется: незакоммиченные изменения уходят в git stash.
import { execFileSync } from 'node:child_process';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const tags = git('tag', '-l', 'step-*').split('\n').filter(Boolean).sort();
const n = process.argv[2];
const tag = tags.find((t) => t.startsWith(`step-${n}-`));

if (!tag) {
  console.log('Использование: npm run catchup -- <номер этапа>\nЭтапы:\n' + tags.map((t) => `  ${t}`).join('\n'));
  process.exit(n === undefined ? 0 : 1);
}

if (git('status', '--porcelain')) {
  git('stash', 'push', '-u', '-m', `моя работа до перехода на ${tag}`);
  console.log('Ваши изменения сохранены: git stash list (вернуть: git stash pop)');
}
git('switch', '-C', 'work', tag);
console.log(`Готово: вы на этапе ${tag} (ветка work). Перезапустите opencode, если он был открыт.`);
