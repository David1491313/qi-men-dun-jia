import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {computeQiMen as c,RING,GANS,STARS,DOORS} from '../src/features/qimen/engine.js';

// reference 均由網站原始盤圖字形獨立辨識。三筆未解差異另存，不當作通過。
const rows=JSON.parse(readFileSync(new URL('../docs/period-expanded-20261024/results.json',import.meta.url),'utf8'));
assert.deepEqual(rows.filter(r=>r.status==='pending').map(r=>r.id).sort(),['4-198402042259','5-204402041244','5-210002040300']);
for(const [system,total,verified]of[['1',2,2],['2',2,2],['4',50,49],['5',38,36],['6',2,2]])test(`擴大實盤系統${system}：${verified}/${total}組完整盤頭固定對照`,()=>{
  const group=rows.filter(r=>r.system===system);
  assert.equal(group.length,total);
  assert.equal(group.filter(r=>r.status==='verified').length,verified);
  for(const e of group.filter(r=>r.status==='verified')){
    const r=c(String(e.year),String(e.month),String(e.day),String(e.hour),'auto',system,String(e.minute));
    assert.deepEqual({ju:r.juText,xun:r.xunText,fu:r.fuText,star:r.zhiFu,door:r.zhiShi,empty:r.emptyText,horse:r.horseText,bazi_y:r.bazi.y,bazi_m:r.bazi.m},e.reference,e.id);
  }
});

// 1980立春00:09:28；23:10已採次日00:10，年家九宮另由原圖放大抄錄。
test('年家午夜立春子初：1980/2/4 23:10網站九宮',()=>{
  const r=c('1980','2','4','23','auto','5','10');
  assert.deepEqual(RING.map(p=>STARS[r.heavenPan[p].star]),['天英','天芮','天柱','天心','天蓬','天任','天沖','天輔']);
  assert.deepEqual(RING.map(p=>DOORS[r.doorPan[p]]),['景門','死門','驚門','開門','休門','生門','傷門','杜門']);
  assert.deepEqual(RING.map(p=>GANS[r.earthPan[p]]),['辛','癸','己','戊','壬','庚','丁','丙']);
  assert.equal(GANS[r.earthPan[5]],'乙');
  assert.deepEqual(RING.map(p=>GANS[r.heavenPan[p].stem]+(r.heavenPan[p].extraStem!=null?GANS[r.heavenPan[p].extraStem]:'')),['壬','庚乙','丁','丙','辛','癸','己','戊']);
  assert.deepEqual(RING.map(p=>r.deityPan[p]),['玄武','白虎','六合','太陰','騰蛇','值符','九天','九地']);
  assert.deepEqual([r.emptyText,r.horseText,r.horsePalace],['子丑','寅',8]);
});
