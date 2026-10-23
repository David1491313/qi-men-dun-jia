import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { clampCivilDay, shiftCivilDate, taipeiNow } from '../src/features/qimen/civil-date.js';
import { computeQiMen } from '../src/features/qimen/engine.js';

const date = (year,month,day,hour='13',minute='30') => ({year,month,day,hour,minute});

test('改選月份或年份後，日數同步縮至該月最後一天，五盤皆排選定日期', () => {
  const feb = clampCivilDay(date('2026','02','31'));
  assert.deepEqual(feb,date('2026','02','28'));
  assert.deepEqual(clampCivilDay(date('2028','02','31')),date('2028','02','29'));
  assert.deepEqual(clampCivilDay(date('2029','02','29')),date('2029','02','28'));
  for (const system of ['1','2','6','4','5']) {
    const r = computeQiMen(feb.year,feb.month,feb.day,feb.hour,'auto',system,feb.minute);
    assert.equal(r.bazi.d,'癸酉',system);
    assert.equal(r.bazi.h,'己未',system);
  }
});

test('月家月底前後一月不跳月，跨年保留時分', () => {
  assert.deepEqual(shiftCivilDate(date('2026','01','31'),'month',1),date('2026','02','28'));
  assert.deepEqual(shiftCivilDate(date('2028','03','31'),'month',-1),date('2028','02','29'));
  assert.deepEqual(shiftCivilDate(date('2026','12','31','23','59'),'month',1),date('2027','01','31','23','59'));
});

test('年家閏日移往平年仍在二月，2100不是閏年', () => {
  assert.deepEqual(shiftCivilDate(date('2028','02','29'),'year',1),date('2029','02','28'));
  assert.deepEqual(clampCivilDay(date('2100','02','29')),date('2100','02','28'));
  assert.deepEqual(shiftCivilDate(date('2028','02','29'),'year',-4),date('2024','02','29'));
});

test('日家與時家跨閏日、跨年、23時導覽保留分鐘', () => {
  assert.deepEqual(shiftCivilDate(date('2028','02','28'),'day',1),date('2028','02','29'));
  assert.deepEqual(shiftCivilDate(date('2028','02','29'),'day',1),date('2028','03','01'));
  assert.deepEqual(shiftCivilDate(date('2026','12','31','23','45'),'hour',2),date('2027','01','01','01','45'));
  assert.deepEqual(shiftCivilDate(date('2026','01','01','01','45'),'hour',-2),date('2025','12','31','23','45'));
});

test('導覽不產生年份選單之外的日期', () => {
  assert.equal(shiftCivilDate(date('1901','01','01'),'day',-1),null);
  assert.equal(shiftCivilDate(date('2100','12','31'),'month',1),null);
  assert.equal(shiftCivilDate(date('2100','12','31','23'),'hour',2),null);
});

test('現在時間以台灣日期顯示，午夜用00時', () => {
  assert.deepEqual(taipeiNow(new Date('2026-10-23T16:00:00Z')),date('2026','10','24','00','00'));
});

test('日期導覽不受宿主夏令時間影響，五盤完整結果在五時區相同', () => {
  const helper = new URL('../src/features/qimen/civil-date.js',import.meta.url).href;
  const engine = new URL('../src/features/qimen/engine.js',import.meta.url).href;
  const source = `import {shiftCivilDate,taipeiNow} from ${JSON.stringify(helper)};
    import {computeQiMen} from ${JSON.stringify(engine)};
    const input={year:'2026',month:'03',day:'08',hour:'01',minute:'30'};
    const next=shiftCivilDate(input,'hour',2);
    console.log(JSON.stringify({next,now:taipeiNow(new Date('2026-10-23T20:00:00Z')),
      charts:['1','2','6','4','5'].map(s=>computeQiMen(next.year,next.month,next.day,next.hour,'auto',s,next.minute))}));`;
  const run = tz => JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',source],{env:{...process.env,TZ:tz},encoding:'utf8'}));
  const expected = run('Asia/Taipei');
  assert.deepEqual(expected.next,date('2026','03','08','03','30'));
  assert.deepEqual(expected.now,date('2026','10','24','04','00'));
  for (const zone of ['UTC','America/Los_Angeles','America/New_York','Europe/London']) assert.deepEqual(run(zone),expected,zone);
});
