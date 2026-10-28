import moment from 'moment-timezone/moment-timezone.js';
import timezoneData from '../data/timezones.json' with { type: 'json' };
moment.tz.load(timezoneData);
import { locationById, RANGE } from '../data/locations.js';
export const DAY_MS = 86400000;
export const formatTime = (ms, zone) => moment.tz(ms, zone).format('YYYY-MM-DD HH:mm:ss Z');
export const timezoneVersion = moment.tz.dataVersion;
export function validateBirth(input) {
  const b = { sex: input.sex, location: input.location };
  for (const key of ['year', 'month', 'day', 'hour', 'minute']) {
    b[key] = Number(input[key]);
    if (!Number.isInteger(b[key])) throw Error('出生日期與時間必須是整數。');
  }
  if (!['男', '女'].includes(b.sex)) throw Error('請選取性別。');
  if (b.year < RANGE.min || b.year > RANGE.max)
    throw Error(`支援出生年 ${RANGE.min}–${RANGE.max}。`);
  if (
    b.month < 1 ||
    b.month > 12 ||
    b.day < 1 ||
    b.day > new Date(Date.UTC(b.year, b.month, 0)).getUTCDate() ||
    b.hour < 0 ||
    b.hour > 23 ||
    b.minute < 0 ||
    b.minute > 59
  )
    throw Error('日期或時間無效。');
  const place = locationById(b.location);
  if (!place) throw Error('出生地不在本版支援清單。');
  const wall = Date.UTC(b.year, b.month - 1, b.day, b.hour, b.minute);
  // 掃描該地歷史上所有 offset，反向驗證。避免平台 Intl、預設 DST 折疊策略造成不一致。
  const z = moment.tz.zone(place.zone);
  const matches = [...new Set(z.offsets)]
    .map((offset) => wall + offset * 60000)
    .filter((ms) => {
      const m = moment.tz(ms, place.zone);
      return (
        m.year() === b.year &&
        m.month() === b.month - 1 &&
        m.date() === b.day &&
        m.hour() === b.hour &&
        m.minute() === b.minute
      );
    });
  if (matches.length === 0)
    throw Error('這個當地時間因夏令時間或法定時間跳轉而不存在，請核對出生紀錄。');
  if (matches.length > 1)
    throw Error(
      '這個當地時間落在夏令時間回撥的重複區間；僅靠目前出生資料無法唯一排盤，請先核對紀錄。本版不擅自選擇其中一次。',
    );
  return {
    ...b,
    place,
    zone: place.zone,
    ms: matches[0],
    offset: moment.tz(matches[0], place.zone).format('Z'),
  };
}
export function addCalendar(ms, zone, duration) {
  return moment.tz(ms, zone).add(duration).valueOf();
}
