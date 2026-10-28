import { cycle, mod, HIDDEN, god, VERSION } from '../data/constants.js';
import { validateBirth, DAY_MS, addCalendar, timezoneVersion } from './time.js';
import { solarTerms, adjacentJie } from './solar.js';
export function dayIndex(y, m, d) {
  return mod(Math.floor(Date.UTC(y, m - 1, d) / DAY_MS) + 17, 60);
}
export function yearPillarAt(ms, year) {
  return cycle((ms >= solarTerms(year)[2].ms ? year : year - 1) - 4);
}
export function calculate(input) {
  const birth = validateBirth(input),
    { ms, year, month, day, hour, zone } = birth;
  const yp = yearPillarAt(ms, year),
    adjacent = adjacentJie(ms, year);
  const solarYear = ms >= solarTerms(year)[2].ms ? year : year - 1;
  const months = [
    ...solarTerms(solarYear).filter((t) => t.type === '節' && t.name !== '小寒'),
    solarTerms(solarYear + 1)[0],
  ];
  const mi = months.filter((t) => t.ms <= ms).length - 1;
  const mb = mod(mi + 2, 12),
    mst = mod((yp.stem % 5) * 2 + 2 + mi, 10);
  const mp = Array.from({ length: 60 }, (_, i) => cycle(i)).find(
    (x) => x.stem === mst && x.branch === mb,
  );
  const dp = cycle(dayIndex(year, month, day)),
    hb = Math.floor((hour + 1) / 2) % 12,
    hs = mod((dp.stem % 5) * 2 + hb, 10);
  const hp = Array.from({ length: 60 }, (_, i) => cycle(i)).find(
    (x) => x.stem === hs && x.branch === hb,
  );
  const pillars = [yp, mp, dp, hp].map((p, i) => ({
    ...p,
    position: i,
    god: i === 2 ? '日主' : god(dp.stem, p.stem),
    hidden: HIDDEN[p.branch].map((s) => ({ stem: s, god: god(dp.stem, s) })),
  }));
  const forward = (yp.stem % 2 === 0) === (birth.sex === '男');
  const target = forward ? adjacent.next : adjacent.previous;
  const gapDays = Math.abs(target.ms - ms) / DAY_MS;
  // 1 太陽日 -> 4 個月；1 小時 -> 5 日。以 30 日月換算成整數起運秒，四捨五入。
  const ageSeconds = Math.round((gapDays * 120 * DAY_MS) / 1000);
  let rest = ageSeconds;
  const ageYears = Math.floor(rest / (360 * 86400));
  rest -= ageYears * 360 * 86400;
  const ageMonths = Math.floor(rest / (30 * 86400));
  rest -= ageMonths * 30 * 86400;
  const ageDays = Math.floor(rest / 86400);
  rest -= ageDays * 86400;
  const start = addCalendar(ms, zone, {
    years: ageYears,
    months: ageMonths,
    days: ageDays,
    seconds: rest,
  });
  const luck = Array.from({ length: 10 }, (_, i) => ({
    ...cycle(mp.index + (forward ? 1 : -1) * (i + 1)),
    order: i + 1,
    start: addCalendar(start, zone, { years: i * 10 }),
    end: addCalendar(start, zone, { years: (i + 1) * 10 }),
  }));
  return {
    birth,
    pillars,
    adjacent,
    solarYear,
    luck,
    startLuck: {
      forward,
      target,
      gapDays,
      age: { years: ageYears, months: ageMonths, days: ageDays, seconds: rest },
      ms: start,
    },
    versions: { ...VERSION, tzdb: timezoneVersion },
    validation: {
      valid: true,
      checks: ['有效曆日', '支援地點與年代', '法定時間唯一', '節令交接已比較', '00:00 換日'],
    },
  };
}
