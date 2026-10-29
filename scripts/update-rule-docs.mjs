import { readFile, writeFile } from 'node:fs/promises';
import { VERSION } from '../src/data/constants.js';
import { RULES } from '../src/data/rules.js';
const path = new URL('../docs/RULES.md', import.meta.url);
const previous = await readFile(path, 'utf8');
const mapping = previous.slice(previous.indexOf('## 模組與測試對照'));
const intro =
  '# 規則索引｜' +
  VERSION.rules +
  '\n\n此表由 `npm run docs:rules` 生成；維護時請以 `src/data/rules.js` 為單一來源。每條規則保存成立、排除、版本、適用頁，執行結果 `trace` 另保存實際盤面事實及裁決。\n\n';
await writeFile(
  path,
  intro +
    Object.values(RULES)
      .map(
        (r) =>
          `## ${r.id} ${r.name}\n\n- 版本：${r.version}\n- 成立：${r.condition}\n- 排除：${r.exclusion}\n- 適用：${r.pages.join('、')}\n\n`,
      )
      .join('') +
    mapping,
);
