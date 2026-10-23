import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
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

test('陰盤夏至交界：同一申時16:00陽一、16:30陰一', () => {
  const before = computeQiMen('2026','06','21','16','auto','1','00');
  const after = computeQiMen('2026','06','21','16','auto','1','30');
  assert.equal(before.juText,'陽1');
  assert.equal(after.juText,'陰1');
  assert.deepEqual(doors(after), ['生門','傷門','杜門','景門','死門','驚門','開門','休門']);
  assert.deepEqual(stars(after), ['天英','天芮','天柱','天心','天蓬','天任','天沖','天輔']);
  assert.equal(computeQiMen('2026','06','21','17','auto','1','30').juText,'陰2');
});

test('陰盤夏至前一日23時換日不代表提前交夏至', () => {
  const r = computeQiMen('2026','06','20','23','auto','1','30');
  assert.equal(r.juText,'陽2');
  assert.equal(r.bazi.d,'丙寅');
  assert.equal(r.bazi.h,'戊子');
  assert.equal(r.lunar,'丙午 年 05 月 07 日');
});

test('陰盤不同年份夏至不用固定18時：2028/6/21 04:10已陰一', () => {
  assert.equal(computeQiMen('2028','06','21','04','auto','1','10').juText,'陰1');
});

test('陰盤立春年支參與起局：2026/2/4 05:30陽四，非陽三', () => {
  const r = computeQiMen('2026','02','04','05','auto','1','30');
  assert.equal(r.juText,'陽4');
  assert.deepEqual([r.bazi.y,r.bazi.m],['丙午','庚寅']);
});

test('陰盤2028立春同一申時跨交節，局數由陽一變陽二', () => {
  const before = computeQiMen('2028','02','04','15','auto','1','00');
  const after = computeQiMen('2028','02','04','15','auto','1','40');
  assert.deepEqual([before.juText,before.bazi.y,before.bazi.m],['陽1','丁未','癸丑']);
  assert.deepEqual([after.juText,after.bazi.y,after.bazi.m],['陽2','戊申','甲寅']);
});

// V13 (90bdbc0) 的完整結果快照；只保護本輪未修改的四種系統。
// 這些是相容性基準，不代表日/月/年家已被外部網站驗證；修正它們時應
// 先加入網站盤例，再有意識地更新基準，不能為過測試而保留已知錯誤。
const previousSystemDigests = {
  '2':'f55cb4d79fee505e04705c92c5f6f921a00bbfa071c080275e2d9dc8a64e7f8f',
  '4':'901b64b41e57145a94e235516db3b2ee6031dc8d0c9b2545cde01a0554b0e955',
  '5':'4e73c572809f52c104dd2a7e35ad2abe7872f52a0fa37a8312e19585b300bd10',
  '6':'928af78cdc876ad7c413a2d03021b069bcde56c33917c2d07a952e4c57ad02a9',
};
test('陰盤一般日期與12/31子初換日：244組完整結果保持V13相容', () => {
  const values=[];
  for(let y=2025;y<=2028;y++)for(let m=1;m<=12;m++)for(let h of [0,5,11,16,23]) values.push(computeQiMen(String(y),String(m),'15',String(h),'auto','1','30'));
  for(let y=2025;y<=2028;y++) values.push(computeQiMen(String(y),'12','31','23','auto','1','30'));
  assert.equal(createHash('sha256').update(JSON.stringify(values)).digest('hex'),'0c65de435c116abdeb64adc733db07fe79ac8e835e80c244390580446aa666fc');
});
for (const [system,expected] of Object.entries(previousSystemDigests)) test(`陰盤修正不改系統${system}：960組完整結果與V13一致`, () => {
  const values=[];
  for(let y=2025;y<=2028;y++)for(let m=1;m<=12;m++)for(let d of [1,4,21,28])for(let h of [0,5,11,16,23]) {
    values.push(computeQiMen(String(y),String(m),String(d),String(h),'auto',system,'30'));
  }
  assert.equal(createHash('sha256').update(JSON.stringify(values)).digest('hex'),expected);
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

test('時家立春依交節時刻換年、換月，不在閏年提前一天', () => {
  const a = computeQiMen('2028','02','03','13','auto','2','30');
  const b = computeQiMen('2028','02','04','13','auto','2','30');
  assert.deepEqual([a.bazi.y,a.bazi.m,a.juText], ['丁未','癸丑','陽9']);
  assert.deepEqual([b.bazi.y,b.bazi.m,b.juText], ['丁未','癸丑','陽6']);
});

test('分鐘真正參與時家交節判斷，同一申時15:00與15:40年、月柱不同', () => {
  const before = computeQiMen('2028','02','04','15','auto','2','00');
  const after = computeQiMen('2028','02','04','15','auto','2','40');
  assert.deepEqual([before.bazi.y,before.bazi.m], ['丁未','癸丑']);
  assert.deepEqual([after.bazi.y,after.bazi.m], ['戊申','甲寅']);
  assert.equal(before.bazi.d, after.bazi.d);
  assert.equal(before.bazi.h, after.bazi.h);
  // 天文年/月柱交節不改機械式置閏局數或九宮旋轉。
  for (const key of ['juText','earthPan','heavenPan','doorPan','outerStems']) assert.deepEqual(before[key],after[key]);
});

test('2026驚蟄當晚已換辛卯月，不延到3月6日', () => {
  const before = computeQiMen('2026','03','05','13','auto','2','30');
  const after = computeQiMen('2026','03','05','22','auto','2','30');
  assert.equal(before.bazi.m, '庚寅');
  assert.equal(after.bazi.m, '辛卯');
  assert.equal(before.juText, '陽3');
  assert.equal(after.juText, '陽3');
});

test('符頭超前八日仍採前符頭：2030夏至、2035冬至', () => {
  const r = chart('2030','06','18','13');
  assert.equal(r.juText,'陰3');
  assert.equal(chart('2030','06','28','13').juText,'陰8');
  assert.equal(chart('2035','12','20','13').juText,'陽7');
  assert.deepEqual(doors(r), ['死門','驚門','開門','休門','生門','傷門','杜門','景門']);
  assert.deepEqual(stars(r), ['天柱','天心','天蓬','天任','天沖','天輔','天英','天芮']);
  assert.deepEqual(RING.map(p=>r.outerStems[p]), ['丁','庚','壬','戊','乙','辛','己丙','癸']);
});

test('符頭超前九至十日才順延：門檻不能無限制向前', () => {
  assert.equal(chart('2033','06','18','13').juText,'陽3');
  assert.equal(chart('2036','06','18','13').juText,'陽3');
  assert.equal(chart('2038','12','20','13').juText,'陰7');
});

test('跨年份、冬夏至子初換日的新增網站對照盤例', () => {
  for (const [y,m,d,h,expected] of [
    ['1967','06','20','13','陰3'], ['1992','12','20','13','陽7'],
    ['2000','01','01','00','陽7'], ['2026','06','18','23','陰9'],
    ['2026','12','15','23','陽1'], ['2027','06','13','23','陰9'],
    ['2028','06','22','23','陰9'],
    ['2030','06','12','22','陽9'], ['2030','06','12','23','陰9'],
  ]) assert.equal(chart(y,m,d,h).juText,expected,`${y}-${m}-${d} ${h}`);
});

test('台灣輸入日期不受宿主時區或夏令時間影響', () => {
  const inputs = [
    ['2026','10','23','01','2'], ['2026','10','23','23','2'],
    ['2026','12','31','23','1'], ['2026','03','08','01','1'],
    ['2026','11','01','01','2'], ['2027','12','15','13','2'],
    ['2026','02','03','23','4'], ['2026','06','20','23','6'],
    ['2026','01','01','00','5'],
    ['2028','02','04','15','2','00'], ['2028','02','04','15','2','40'],
  ];
  const engine = new URL('../src/features/qimen/engine.js', import.meta.url).href;
  const source = `import {computeQiMen as c} from ${JSON.stringify(engine)}; console.log(JSON.stringify(${JSON.stringify(inputs)}.map(([y,m,d,h,s,mi])=>c(y,m,d,h,'auto',s,mi))));`;
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
