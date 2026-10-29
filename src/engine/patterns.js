import { HIDDEN, god } from '../data/constants.js';
import { trace } from '../data/rules.js';
export function judgePatterns(f, c, chart) {
  const g = f.gods,
    印 = g.正印 + g.偏印,
    財 = g.正財 + g.偏財;
  const connected = (left, right) =>
    f.items.some(
      (a) =>
        left.includes(a.god) &&
        a.force >= 0.2 &&
        f.items.some(
          (b) =>
            right.includes(b.god) &&
            b.force >= 0.2 &&
            (Math.abs(a.position - b.position) <= 1 || a.position >= 4 || b.position >= 4) &&
            a.id !== b.id,
        ),
    );
  const specs = [
    [
      'PAT-02',
      '食神生財',
      ['食神'],
      ['正財', '偏財'],
      g.食神,
      財,
      g.偏印 < g.食神 && c.state !== '承格不足',
      '梟印壓制或承格不足',
    ],
    [
      'PAT-03',
      '食神制殺',
      ['食神'],
      ['七殺'],
      g.食神,
      g.七殺,
      g.七殺 / Math.max(0.01, g.食神) >= 0.5 &&
        g.七殺 / Math.max(0.01, g.食神) <= 2.5 &&
        印 < g.食神,
      '制殺比例或印星干擾',
    ],
    ['PAT-04', '殺印相生', ['七殺'], ['正印', '偏印'], g.七殺, 印, 財 < 印, '財星壓印'],
    [
      'PAT-05',
      '財官相生',
      ['正財', '偏財'],
      ['正官'],
      財,
      g.正官,
      g.傷官 < g.正官 && c.state !== '承格不足',
      '傷官擾官或承格不足',
    ],
    [
      'PAT-06',
      '傷官配印',
      ['傷官'],
      ['正印'],
      g.傷官,
      g.正印,
      g.正印 / Math.max(0.01, g.傷官) >= 0.5 &&
        g.正印 / Math.max(0.01, g.傷官) <= 2.5 &&
        財 < g.正印,
      '財破印或印傷比例不合',
    ],
  ];
  const candidates = specs.map(([id, name, l, r, a, b, extra, damage]) => {
    const present = a >= 0.8 && b >= 0.8,
      link = connected(l, r),
      passed = present && link && extra;
    const support = f.items.filter((x) => [...l, ...r].includes(x.god)).map(f.factText);
    const damaged = (!present ? ['參與力量未達 .8'] : []).concat(
      !link ? ['參與位置無相鄰承接'] : [],
      !extra ? [damage] : [],
    );
    const defects = (f.interactions || []).filter(
      (x) =>
        x.type === '天干剋' &&
        x.affectedPositions?.some((pos) =>
          f.items.some((i) => i.position === pos && i.exposed && r.includes(i.god)),
        ),
    );
    const status = passed ? (defects.length ? '成立有瑕' : '成立') : present ? '受損' : '待條件';
    const rescue = damaged.length
      ? f.items
          .filter((x) => ['正印', '食神'].includes(x.god) && x.force >= 0.8)
          .map((x) => `${f.factText(x)}可作救應候選，仍需檢查副作用`)
      : [];
    return {
      id,
      name,
      status,
      defects: defects.map((x) => x.detail),
      support,
      damage: damaged,
      rescue,
      score: Math.min(a, b) + (passed ? 5 : 0),
      trace: trace(
        id,
        passed,
        [...support, `相鄰承接=${link}`, `額外排除條件通過=${extra}`],
        passed ? status : damaged.join('；'),
      ),
    };
  });
  const monthly = HIDDEN[f.month].map((s, i) => ({
    god: god(f.dm, s),
    stem: s,
    rank: i,
    exposed: chart.pillars.slice(0, 4).some((p, k) => k !== 2 && p.stem === s),
  }));
  const monthName = monthly.find((x) => x.exposed)?.god || monthly[0].god;
  const requiredAssist = {
    食神: ['正財', '偏財'],
    傷官: ['正印'],
    七殺: ['正印', '偏印', '食神'],
    正官: ['正財', '正印'],
    正財: ['正官', '食神'],
    偏財: ['正官', '食神'],
    正印: ['正官', '七殺'],
    偏印: ['七殺', '偏財'],
    比肩: ['食神', '傷官'],
    劫財: ['食神', '傷官'],
  }[monthName];
  const monthPower = g[monthName],
    assistPower = requiredAssist.reduce((n, s) => n + g[s], 0);
  const monthSupport = f.items.filter((x) => x.god === monthName).map(f.factText);
  const monthDamage = [
    ...(monthPower < 0.8 ? ['月令主導十神聚合力量低於 .8'] : []),
    ...(assistPower < 0.8 ? ['所需相神尚未達 .8'] : []),
    ...(c.state === '承格不足' && !['正印', '偏印', '比肩', '劫財'].includes(monthName)
      ? ['日主承受月令負荷不足']
      : []),
  ];
  const monthRescue = f.items
    .filter((x) => requiredAssist.includes(x.god) && x.force >= 0.8)
    .map(f.factText);
  const monthJudgment = {
    name: monthName,
    power: monthPower,
    requiredAssist,
    assistPower,
    support: monthSupport,
    damage: monthDamage,
    rescue: monthRescue,
    selectedStem: monthly.find((x) => x.exposed)?.stem ?? monthly[0].stem,
    status: monthDamage.length ? '受損／待配合' : '可發用',
  };
  // 月令優先：與月令主導十神無關的成立組合只列背景，不取代主結構。
  const established = candidates
    .filter((x) => ['成立', '成立有瑕'].includes(x.status))
    .sort((a, b) => {
      const priority = (x) => {
        const spec = specs.find((s) => s[0] === x.id);
        return spec[2].includes(monthly[0].god) ? 0 : spec[2].includes(monthName) ? 1 : 2;
      };
      return priority(a) - priority(b) || a.id.localeCompare(b.id);
    });
  const leading = established.find((x) => {
    const spec = specs.find((s) => s[0] === x.id);
    return [...spec[2], ...spec[3]].includes(monthName);
  });
  const primary = leading || {
    id: 'PAT-01',
    name: `${monthName}月令結構`,
    status: monthJudgment.status,
  };
  const monthTrace = trace(
    'PAT-01',
    monthDamage.length === 0,
    [
      ...monthly.map((x) => `${x.god} ${x.rank === 0 ? '本氣' : '藏氣'}；透出=${x.exposed}`),
      `月令主導 ${monthName} 聚合力量 ${monthPower.toFixed(2)}`,
      `所需相神 ${requiredAssist.join('/')} 聚合力量 ${assistPower.toFixed(2)}`,
      ...monthDamage,
    ],
    `${primary.name}；${monthJudgment.status}`,
  );
  return {
    primary,
    monthly,
    monthJudgment,
    candidates,
    monthTrace,
    mainGods: leading ? specs.find((x) => x[0] === primary.id)[2] : [monthName],
    assist: leading ? specs.find((x) => x[0] === primary.id)[3] : requiredAssist,
  };
}
