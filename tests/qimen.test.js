import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { computeQiMen, getChangShengForPalace, GANS, STARS, DOORS, RING } from '../src/features/qimen/engine.js';

// Expected values transcribed from the user's star-artint.com reference image,
// 2026-10-23. Ordering is palace 1,8,3,4,9,2,7,6 (clockwise from north).
const chart = (y,m,d,h,system='2') => computeQiMen(y,m,d,h,'auto',system);
const doors = r => RING.map(p => DOORS[r.doorPan[p]]);
const stars = r => RING.map(p => STARS[r.heavenPan[p].star]);

test('陽三局：旬首在中五，乙酉時值使落乾六，不從寄宮坤二起算', () => {
  const r = chart('2026','03','02','17');
  assert.equal(r.juText, '陽3');
  assert.equal(r.bazi.h, '乙酉');
  assert.deepEqual(doors(r), ['驚門','開門','休門','生門','傷門','杜門','景門','死門']);
  assert.deepEqual(stars(r), ['天蓬','天任','天沖','天輔','天英','天芮','天柱','天心']);
  assert.deepEqual(RING.map(p => r.outerStems[p]), ['壬','辛','丙','癸','戊','己','丁','乙庚']);
});

test('陰盤陽五局也保留中五原宮起算，天禽仍隨天芮寄坤', () => {
  const r = chart('2026','03','01','01','1');
  assert.equal(r.juText, '陽5');
  assert.deepEqual(doors(r), ['驚門','開門','休門','生門','傷門','杜門','景門','死門']);
  assert.deepEqual(stars(r), ['天沖','天輔','天英','天芮','天柱','天心','天蓬','天任']);
  assert.deepEqual(RING.map(p => r.outerStems[p]), ['壬','丁戊','庚','己','癸','辛','丙','乙']);
  assert.equal(GANS[r.heavenPan[4].extraStem], '戊');
});

test('陰遁六局：中五起算逆行三宮，值使仍落坤二', () => {
  const r = chart('2026','10','03','01');
  assert.equal(r.juText, '陰6');
  assert.deepEqual(r.bazi, {y:'丙午',m:'丁酉',d:'庚戌',h:'丁丑'});
  assert.deepEqual(doors(r), ['休門','生門','傷門','杜門','景門','死門','驚門','開門']);
  assert.deepEqual(stars(r), ['天任','天沖','天輔','天英','天芮','天柱','天心','天蓬']);
  assert.deepEqual(RING.map(p => r.outerStems[p]), ['戊','癸','丙','辛','庚','丁','壬己','乙']);
});

test('置閏延長週期：2027/12/15陰四，12/16陰七', () => {
  const a = chart('2027','12','15','13');
  assert.equal(a.juText, '陰4');
  assert.equal(chart('2027','12','16','13').juText, '陰7');
  assert.deepEqual(doors(a), ['開門','休門','生門','傷門','杜門','景門','死門','驚門']);
  assert.deepEqual(stars(a), ['天心','天蓬','天任','天沖','天輔','天英','天芮','天柱']);
  assert.deepEqual(RING.map(p => a.outerStems[p]), ['辛','癸','己','戊','壬','庚乙','丁','丙']);
});

test('原本相符的普通盤與夏至置閏交界保持相符', () => {
  const r = chart('2026','10','23','20');
  assert.equal(r.juText, '陰8');
  assert.deepEqual(r.bazi, {y:'丙午',m:'戊戌',d:'庚午',h:'丙戌'});
  assert.deepEqual(doors(r), ['景門','死門','驚門','開門','休門','生門','傷門','杜門']);
  assert.equal(chart('2027','06','14','13').juText, '陰9');
});

test('23時子初換日與參考盤一致，農曆進一日', () => {
  const r = chart('2026','10','23','23');
  assert.deepEqual(r.bazi, {y:'丙午',m:'戊戌',d:'辛未',h:'戊子'});
  assert.equal(r.lunar, '丙午 年 09 月 15 日');
  assert.equal(r.juText, '陰8');
  assert.equal(r.displayHStr, '00');
  assert.deepEqual(doors(r), ['傷門','杜門','景門','死門','驚門','開門','休門','生門']);
});

test('台灣輸入日期不受宿主時區或夏令時間影響', () => {
  const inputs = [
    ['2026','10','23','01','2'], ['2026','10','23','23','2'],
    ['2026','12','31','23','1'], ['2026','03','08','01','1'],
    ['2026','11','01','01','2'], ['2027','12','15','13','2'],
    ['2026','02','03','23','4'], ['2026','06','20','23','6'],
    ['2026','01','01','00','5'],
  ];
  const engine = new URL('../src/features/qimen/engine.js', import.meta.url).href;
  const source = `import {computeQiMen as c} from ${JSON.stringify(engine)}; console.log(JSON.stringify(${JSON.stringify(inputs)}.map(([y,m,d,h,s])=>c(y,m,d,h,'auto',s))));`;
  const run = tz => JSON.parse(execFileSync(process.execPath, ['--input-type=module','-e',source], {env:{...process.env,TZ:tz},encoding:'utf8'}));
  const expected = run('Asia/Taipei');
  assert.deepEqual(expected[0].bazi, {y:'丙午',m:'戊戌',d:'庚午',h:'丁丑'});
  assert.equal(expected[0].lunar, '丙午 年 09 月 14 日');
  for (const zone of ['UTC','America/Los_Angeles','America/New_York','Europe/London']) assert.deepEqual(run(zone), expected, zone);
});

// Reference badges in palace order 4,9,2,3,7,8,1,6; each two-character
// entry is the first branch (star row) followed by the second (door row).
const growth = {
  甲:['衰病','死','墓絕','旺','胎','冠臨','沐','養生'],
  乙:['冠沐','生','養胎','臨','絕','衰旺','病','墓死'],
  丙:['冠臨','旺','衰病','沐','死','養生','胎','墓絕'],
  丁:['衰旺','臨','冠沐','病','生','墓死','絕','養胎'],
  戊:['冠臨','旺','衰病','沐','死','養生','胎','墓絕'],
  己:['衰旺','臨','冠沐','病','生','墓死','絕','養胎'],
  庚:['養生','沐','冠臨','胎','旺','墓絕','死','衰病'],
  辛:['墓死','病','衰旺','絕','臨','養胎','生','冠沐'],
  壬:['墓絕','胎','養生','死','沐','衰病','旺','冠臨'],
  癸:['養胎','絕','墓死','生','病','冠沐','臨','衰旺'],
};
for (const [stem, expected] of Object.entries(growth)) test(`十二長生參考盤：${stem}干的十二地支位置`, () => {
  assert.deepEqual([4,9,2,3,7,8,1,6].map(p => getChangShengForPalace(stem,p).map(x => x.stage).join('')), expected);
  assert.deepEqual(getChangShengForPalace(stem,5), []);
});
