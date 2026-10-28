import { describe, it, expect } from 'vitest';
import { calculate, dayIndex, yearPillarAt } from '../src/calendar/chart.js';
import { solarTerms, adjacentJie } from '../src/calendar/solar.js';
import { validateBirth, formatTime, DAY_MS, addCalendar } from '../src/calendar/time.js';
import { LOCATIONS } from '../src/data/locations.js';
const birth = (overrides = {}) => ({
  year: 1990,
  month: 6,
  day: 1,
  hour: 12,
  minute: 0,
  sex: '男',
  location: 'tw-0',
  ...overrides,
});
describe('曆日、節氣與四柱', () => {
  it('已知甲子日錨點與日序不依執行機時區', () => {
    expect(dayIndex(2000, 1, 7)).toBe(0);
    expect(dayIndex(1970, 1, 1)).toBe(17);
    expect(dayIndex(2000, 1, 8)).toBe(1);
  });
  it('1990-06-01 午時四柱固定回歸案例', () => {
    expect(calculate(birth()).pillars.map((p) => p.text)).toEqual(['庚午', '辛巳', '丁酉', '丙午']);
  });
  it('閏年有效日與整數範圍校驗', () => {
    expect(() => calculate(birth({ year: 2000, month: 2, day: 29 }))).not.toThrow();
    for (const b of [
      { year: 1900 },
      { year: 2001, month: 2, day: 29 },
      { day: 0 },
      { hour: 24 },
      { minute: 60 },
      { year: 2027 },
      { location: 'absent' },
      { sex: '其他' },
    ])
      expect(() => calculate(birth(b))).toThrow();
  });
  it('24節氣分為12節12中氣且依時序', () => {
    const ts = solarTerms(2024);
    expect(ts).toHaveLength(24);
    expect(ts.filter((t) => t.type === '節')).toHaveLength(12);
    expect(ts.every((t, i) => !i || t.ms > ts[i - 1].ms)).toBe(true);
    expect(ts[2].longitude).toBe(315);
  });
  it('2024立春與驚蟄接近香港天文台分鐘表（容差120秒）', () => {
    const ts = solarTerms(2024);
    expect(Math.abs(ts[2].ms - Date.parse('2024-02-04T16:27:00+08:00'))).toBeLessThan(120000);
    expect(Math.abs(ts[4].ms - Date.parse('2024-03-05T10:23:00+08:00'))).toBeLessThan(120000);
  });
  it('立春實際交節前後換年與換月，包含精確毫秒邊界', () => {
    const t = solarTerms(2024)[2];
    expect(yearPillarAt(t.ms - 1, 2024).text).toBe('癸卯');
    expect(yearPillarAt(t.ms, 2024).text).toBe('甲辰');
    expect(
      calculate(birth({ year: 2024, month: 2, day: 4, hour: 16, minute: 26 }))
        .pillars.slice(0, 2)
        .map((p) => p.text),
    ).toEqual(['癸卯', '乙丑']);
    expect(
      calculate(birth({ year: 2024, month: 2, day: 4, hour: 16, minute: 28 }))
        .pillars.slice(0, 2)
        .map((p) => p.text),
    ).toEqual(['甲辰', '丙寅']);
  });
  it('驚蟄換月、不換年', () => {
    const b1 = calculate(birth({ year: 2024, month: 3, day: 5, hour: 10, minute: 22 })),
      b2 = calculate(birth({ year: 2024, month: 3, day: 5, hour: 10, minute: 24 }));
    expect(b1.pillars[1].text).toBe('丙寅');
    expect(b2.pillars[1].text).toBe('丁卯');
    expect(b1.pillars[0]).toEqual(b2.pillars[0]);
  });
  it('22:59亥、23:00當日子、00:00次日子且換日干', () => {
    const a = calculate(birth({ hour: 22, minute: 59 })),
      b = calculate(birth({ hour: 23 })),
      c = calculate(birth({ day: 2, hour: 0 }));
    expect(a.pillars[3].branch).toBe(11);
    expect(b.pillars[3].branch).toBe(0);
    expect(c.pillars[3].branch).toBe(0);
    expect(a.pillars[2].text).toBe(b.pillars[2].text);
    expect(c.pillars[2].index).toBe((b.pillars[2].index + 1) % 60);
    expect(c.pillars[3].stem).toBe((b.pillars[3].stem + 2) % 10);
  });
  it('一月立春前仍屬上一干支年；小寒前後月柱', () => {
    expect(calculate(birth({ year: 2024, month: 1, day: 1 })).pillars[0].text).toBe('癸卯');
    expect(calculate(birth({ year: 2024, month: 1, day: 1 })).pillars[1].branch).toBe(0);
    expect(calculate(birth({ year: 2024, month: 1, day: 8 })).pillars[1].branch).toBe(1);
  });
});
describe('固定時區資料與DST', () => {
  it('紐約冬夏offset不同', () => {
    expect(validateBirth(birth({ year: 2024, month: 1, day: 15, location: 'us-ny' })).offset).toBe(
      '-05:00',
    );
    expect(validateBirth(birth({ year: 2024, month: 7, day: 15, location: 'us-ny' })).offset).toBe(
      '-04:00',
    );
  });
  it('紐約夏令時間不存在/重複均拒絕', () => {
    expect(() =>
      validateBirth(
        birth({ year: 2024, month: 3, day: 10, hour: 2, minute: 30, location: 'us-ny' }),
      ),
    ).toThrow('不存在');
    expect(() =>
      validateBirth(
        birth({ year: 2024, month: 11, day: 3, hour: 1, minute: 30, location: 'us-ny' }),
      ),
    ).toThrow('重複');
  });
  it('臺灣1979歷史夏令時間與現代不同', () => {
    expect(validateBirth(birth({ year: 1979, month: 7 })).offset).toBe('+09:00');
    expect(validateBirth(birth({ year: 2024, month: 7 })).offset).toBe('+08:00');
  });
  it('相同UTC時刻在東京/洛杉磯屬不同當地曆日與日柱', () => {
    const a = calculate(birth({ year: 2024, month: 1, day: 2, hour: 1, location: 'jp' })),
      b = calculate(birth({ year: 2024, month: 1, day: 1, hour: 8, location: 'us-la' }));
    expect(a.birth.ms).toBe(b.birth.ms);
    expect(a.pillars[2].text).not.toBe(b.pillars[2].text);
    expect(a.pillars[0].text).toBe(b.pillars[0].text);
  });
  it('全部列示出生地均可用且只使用已打包資料', () => {
    for (const l of LOCATIONS) expect(calculate(birth({ location: l.id })).birth.zone).toBe(l.zone);
  });
});
describe('大運', () => {
  it.each([
    ['男', 1990, true],
    ['女', 1990, false],
    ['男', 1991, false],
    ['女', 1991, true],
  ])('%s %i 順逆=%s', (sex, year, direction) => {
    const c = calculate(birth({ sex, year }));
    expect(c.startLuck.forward).toBe(direction);
    expect(c.luck[0].index).toBe((c.pillars[1].index + (direction ? 1 : 59)) % 60);
    expect(c.startLuck.target.type).toBe('節');
    expect(
      direction ? c.startLuck.target.ms > c.birth.ms : c.startLuck.target.ms <= c.birth.ms,
    ).toBe(true);
  });
  it('起運不足一日換算至秒且十步日期無縫銜接', () => {
    const c = calculate(birth()),
      s = c.startLuck,
      a = s.age;
    const seconds = a.years * 360 * 86400 + a.months * 30 * 86400 + a.days * 86400 + a.seconds;
    expect(seconds).toBe(Math.round(s.gapDays * 120 * 86400));
    expect(s.ms).toBe(
      addCalendar(c.birth.ms, c.birth.zone, {
        years: a.years,
        months: a.months,
        days: a.days,
        seconds: a.seconds,
      }),
    );
    expect(c.luck).toHaveLength(10);
    c.luck.slice(1).forEach((l, i) => expect(l.start).toBe(c.luck[i].end));
  });
  it('只取節，不取中氣', () => {
    const c = calculate(birth({ year: 2024, month: 2, day: 17 }));
    expect(c.startLuck.target.name).toBe('驚蟄');
    expect(adjacentJie(c.birth.ms, 2024).previous.name).toBe('立春');
  });
  it('曆月進位收至月底', () => {
    expect(
      formatTime(
        addCalendar(Date.parse('2024-01-31T12:00:00+08:00'), 'Asia/Taipei', { months: 1 }),
        'Asia/Taipei',
      ),
    ).toContain('2024-02-29 12:00:00');
  });
});

describe('額外交節與時間基準回歸', () => {
  it('香港天文台2024曆表：3月5日為戊辰日', () => {
    expect(calculate(birth({ year: 2024, month: 3, day: 5 })).pillars[2].text).toBe('戊辰');
  });
  it('同一交節UTC在不同地點得到同一年月柱', () => {
    const a = calculate(
        birth({ year: 2024, month: 2, day: 4, hour: 16, minute: 28, location: 'tw-0' }),
      ),
      b = calculate(
        birth({ year: 2024, month: 2, day: 4, hour: 3, minute: 28, location: 'us-ny' }),
      );
    expect(a.birth.ms).toBe(b.birth.ms);
    expect(a.pillars.slice(0, 2).map((p) => p.text)).toEqual(
      b.pillars.slice(0, 2).map((p) => p.text),
    );
  });
  it('所有節的前後交接，previous/next精確採左含右不含', () => {
    for (const t of solarTerms(2024).filter((x) => x.type === '節')) {
      expect(adjacentJie(t.ms - 1, 2024).next.ms).toBe(t.ms);
      expect(adjacentJie(t.ms, 2024).previous.ms).toBe(t.ms);
    }
  });
});
