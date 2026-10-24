// 獨立結構檢查；不代表星彧網站實盤驗證，也不驗證流派起局公式。
import assert from 'node:assert/strict';
import { computeQiMen, GANS, ZHIS, RING, STARS, DOORS, DEITIES } from '../src/features/qimen/engine.js';
import { daysInMonth } from '../src/features/qimen/civil-date.js';

const systems = ['1','2','6','4','5'];
const expectedStems = GANS.slice(1).sort();
const sameMembers = (actual, expected, label) => assert.deepEqual([...actual].sort(),[...expected].sort(),label);
const totals = Object.fromEntries(systems.map(s => [s,0]));
function check(y,m,d,h,minute='30') {
  for (const system of systems) {
    const input = [String(y),String(m),String(d),String(h),'auto',system,minute];
    const label = `${y}-${m}-${d} ${h}:${minute} system=${system}`;
    const r = computeQiMen(...input);
    assert.match(r.juText,/^[陰陽][1-9]$/,label);
    sameMembers(r.earthPan.slice(1).map(i=>GANS[i]),expectedStems,`${label} 地盤`);
    sameMembers(RING.map(p=>r.heavenPan[p].star),RING,`${label} 九星寄宮`);
    sameMembers(RING.map(p=>r.doorPan[p]),RING,`${label} 八門`);
    sameMembers(RING.map(p=>r.deityPan[p]),DEITIES,`${label} 八神`);
    sameMembers(RING.flatMap(p=>[r.heavenPan[p].stem,r.heavenPan[p].extraStem].filter(i=>i!=null).map(i=>GANS[i])),expectedStems,`${label} 天盤`);
    sameMembers(RING.flatMap(p=>[...r.outerStems[p]]),expectedStems,`${label} 外圈天干`);
    const pillar = system==='6'?r.bazi.d:system==='4'?r.chartPillar:system==='5'?r.bazi.y:r.bazi.h;
    const startBranch=(ZHIS.indexOf(pillar[1])-GANS.indexOf(pillar[0])+12)%12;
    assert.equal(r.xunText,`甲${ZHIS[startBranch]}`,`${label} 旬首`);
    assert.ok(STARS.includes(r.zhiFu) && DOORS.includes(r.zhiShi),`${label} 值符值使`);
    assert.equal(r.heavenPan[r.debug.targetFuPalace].star,STARS.indexOf(r.zhiFu),`${label} 值符落宮`);
    assert.ok(RING.includes(r.horsePalace) && r.emptyPalaces.every(p=>RING.includes(p)),`${label} 空馬`);
    totals[system]++;
  }
}

// 1901–2100 每月選四日、00/23時，涵蓋世紀、月底、跨年及子初換日。
for(let y=1901;y<=2100;y++) {
  for(let m=1;m<=12;m++) for(const d of [1,4,21,daysInMonth(y,m)]) for(const h of [0,23]) check(y,m,d,h);
  if(y%25===0) console.log(JSON.stringify({throughYear:y,totals}));
}
// 2025–2028 逐日午時，另外涵蓋所有一般日期與閏日。
for(let y=2025;y<=2028;y++) for(let m=1;m<=12;m++) for(let d=1;d<=daysInMonth(y,m);d++) check(y,m,d,12);
for(const [y,m,d,h,minute] of [
  [2026,2,4,4,'00'],[2026,2,4,4,'10'],[2028,2,4,15,'00'],[2028,2,4,15,'40'],
  [2026,3,5,21,'50'],[2026,3,5,22,'10'],
  [2026,6,21,16,'00'],[2026,6,21,16,'30'],[2028,6,21,4,'00'],[2028,6,21,4,'10'],
  [2026,12,22,4,'40'],[2026,12,22,4,'55'],[2026,12,22,12,'30'],
  [2027,12,22,10,'30'],[2027,12,22,10,'55'],[2028,12,21,16,'10'],[2028,12,21,16,'30'],
]) check(y,m,d,h,minute);
console.log(JSON.stringify({result:'PASS (structural checks only; no website comparison)',totals,total:Object.values(totals).reduce((a,b)=>a+b,0)}));
