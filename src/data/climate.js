import { STEMS, BRANCHES, STEM_ELEMENT as E, mod } from './constants.js';
// 完整 120 格索引。以寒暖燥濕四類規約生成，並非逐字採錄某古籍調候表。
export const CLIMATE = Object.fromEntries(
  STEMS.flatMap((stem, d) =>
    BRANCHES.map((branch, m) => {
      const cold = [11, 0, 1].includes(m),
        hot = [5, 6, 7].includes(m),
        dry = [7, 10].includes(m),
        wet = [1, 4].includes(m);
      const target = cold ? 1 : hot ? 4 : dry ? 4 : wet ? 1 : null;
      return [
        `${d}-${m}`,
        {
          day: stem,
          month: branch,
          cold,
          hot,
          dry,
          wet,
          target,
          priority: cold || hot ? 2 : dry || wet ? 1 : 0,
          needsRoot:
            E[d] === target
              ? '同氣仍須根氣承接'
              : `候選與日主為相對五行關係 ${mod((target ?? E[d]) - E[d], 5)}`,
          description: cold
            ? '寒月需要溫暖承接'
            : hot
              ? '熱月需要降燥與承接'
              : dry
                ? '燥土月份檢查水氣'
                : wet
                  ? '濕土月份檢查火氣'
                  : '寒暖不是本版優先矛盾',
        },
      ];
    }),
  ),
);
