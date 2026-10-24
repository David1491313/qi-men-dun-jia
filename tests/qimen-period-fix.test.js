import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import lunarCalendar from 'lunar-javascript';
import {computeQiMen as c,RING,GANS,STARS,DOORS} from '../src/features/qimen/engine.js';

const rows=JSON.parse(readFileSync(new URL('../docs/period-fix-20261024/results.json',import.meta.url),'utf8'));
assert.equal(rows.length,18);
for (const e of rows) test(`V21網站原盤九項盤頭：${e.id}`,()=>{
  const r=c(String(e.year),String(e.month),String(e.day),String(e.hour),'auto',e.system,String(e.minute));
  assert.deepEqual({ju:r.juText,xun:r.xunText,fu:r.fuText,star:r.zhiFu,door:r.zhiShi,empty:r.emptyText,horse:r.horseText,bazi_y:r.bazi.y,bazi_m:r.bazi.m},e.reference);
});

// Values transcribed from the retained reference images, clockwise from Kan 1.
for (const [year,system,minute,stars,doors,earth,center,heaven,deities] of [
  ['1984','4','0',['天沖','天輔','天英','天芮','天柱','天心','天蓬','天任'],['生門','傷門','杜門','景門','死門','驚門','開門','休門'],['丁','乙','壬','辛','丙','癸','戊','己'],'庚',['壬','辛','丙','癸庚','戊','己','丁','乙'],['白虎','六合','太陰','騰蛇','值符','九天','九地','玄武']],
  ['2044','5','44',['天蓬','天任','天沖','天輔','天英','天芮','天柱','天心'],['休門','生門','傷門','杜門','景門','死門','驚門','開門'],['戊','庚','丙','丁','己','乙','辛','壬'],'癸',['戊','庚','丙','丁','己','乙癸','辛','壬'],['值符','九天','九地','玄武','白虎','六合','太陰','騰蛇']]
]) test(`V21修復代表盤九宮：${year}/2/4 12:${minute} 系統${system}`,()=>{
  const r=c(year,'2','4','12','auto',system,minute);
  assert.deepEqual(RING.map(p=>STARS[r.heavenPan[p].star]),stars);
  assert.deepEqual(RING.map(p=>DOORS[r.doorPan[p]]),doors);
  assert.deepEqual(RING.map(p=>GANS[r.earthPan[p]]),earth);
  assert.equal(GANS[r.earthPan[5]],center);
  assert.deepEqual(RING.map(p=>GANS[r.heavenPan[p].stem]+(r.heavenPan[p].extraStem!=null?GANS[r.heavenPan[p].extraStem]:'')),heaven);
  assert.deepEqual(RING.map(p=>r.deityPan[p]),deities);
});

test('歷史午夜立春保留秒數：1980子初23:09未交節、23:10已交節',()=>{
  assert.deepEqual(c('1980','2','4','23','auto','5','9').bazi.y,'己未');
  assert.deepEqual(c('1980','2','4','23','auto','5','10').bazi.y,'庚申');
});

test('相容曆法不修改套件共用的Delta-T係數或原始節氣表',()=>{
  const before=[...lunarCalendar.ShouXingUtil.DT_AT];
  c('2044','2','4','12','auto','5','44');
  assert.deepEqual(lunarCalendar.ShouXingUtil.DT_AT,before);
  assert.equal(lunarCalendar.Solar.fromYmd(2044,7,1).getLunar().getJieQiTable()['立春'].toYmdHms(),'2044-02-04 12:44:21');
});
