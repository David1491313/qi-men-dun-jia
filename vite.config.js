import React, { useState, useEffect } from 'react';

const GANS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const ZHIS = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const PALACES = [null,'坎₁','坤₂','震₃','巽₄','中₅','乾₆','兌₇','艮₈','離₉'];
const STARS = [null,'天蓬','天芮','天沖','天輔','天禽','天心','天柱','天任','天英'];
const DOORS = [null,'休門','死門','傷門','杜門','中門','開門','驚門','生門','景門'];
const DEITIES = ['值符','騰蛇','太陰','六合','白虎','玄武','九地','九天'];
const RING = [1,8,3,4,9,2,7,6];
const QI_GANS = [4,5,6,7,8,9,3,2,1];

const getRingIndex = p => RING.indexOf(p);
const advanceRing = (p, steps) => RING[(getRingIndex(p) + steps + 64) % 8];
const checkXing = (stem, palace) => ({'戊':3,'己':2,'庚':8,'辛':9,'壬':4,'癸':4})[stem] === palace;
const checkMu = (stem, palace) => ({'甲':2,'乙':6,'丙':6,'丁':8,'戊':6,'己':8,'庚':8,'辛':4,'壬':4,'癸':2})[stem] === palace;
const checkPo = (door, palace) => ({'休門':[9],'生門':[1],'傷門':[2,8],'杜門':[2,8],'景門':[6,7],'死門':[1],'驚門':[3,4],'開門':[3,4]})[door]?.includes(palace);

const JIEQI_C = {
  '小寒':5.4055,'大寒':20.12,'立春':3.87,'雨水':18.73,
  '驚蟄':5.63,'春分':20.646,'清明':4.81,'穀雨':20.1,
  '立夏':5.52,'小滿':21.04,'芒種':5.678,'夏至':21.37,
  '小暑':7.108,'大暑':22.83,'立秋':7.5,'處暑':23.13,
  '白露':7.646,'秋分':23.042,'寒露':8.318,'霜降':23.438,
  '立冬':7.438,'小雪':22.36,'大雪':7.18,'冬至':21.94
};
const JIEQI_ORDER = [
  ['小寒','大寒'],['立春','雨水'],['驚蟄','春分'],['清明','穀雨'],
  ['立夏','小滿'],['芒種','夏至'],['小暑','大暑'],['立秋','處暑'],
  ['白露','秋分'],['寒露','霜降'],['立冬','小雪'],['大雪','冬至']
];
const JU_TABLE = {
  '冬至':[1,7,4],'驚蟄':[1,7,4],'小寒':[2,8,5],'大寒':[3,9,6],'春分':[3,9,6],
  '立春':[8,5,2],'雨水':[9,6,3],'清明':[4,1,7],'立夏':[4,1,7],
  '穀雨':[5,2,8],'小滿':[5,2,8],'芒種':[6,3,9],
  '夏至':[9,3,6],'白露':[9,3,6],'小暑':[8,2,5],'大暑':[7,1,4],'秋分':[7,1,4],
  '立秋':[2,5,8],'處暑':[1,4,7],'寒露':[6,9,3],'立冬':[6,9,3],
  '霜降':[5,8,2],'小雪':[5,8,2],'大雪':[4,7,1]
};

const JIEQI_CORRECTIONS = { '2026_驚蟄': 6 };
function calcJieQiDay(year, jqName) {
  const key = `${year}_${jqName}`;
  if (JIEQI_CORRECTIONS[key] !== undefined) return JIEQI_CORRECTIONS[key];
  const C = JIEQI_C[jqName]; const Y = year % 100; const L = Math.floor(Y / 4);
  return Math.floor(Y * 0.2422 + C) - L;
}
function getJieQiForMonth(year, month) {
  const pair = JIEQI_ORDER[month - 1];
  return [
    { name: pair[0], day: calcJieQiDay(year, pair[0]), month },
    { name: pair[1], day: calcJieQiDay(year, pair[1]), month }
  ];
}

// ===== 置閏法：機械式節氣系統 =====
// 以離冬至/夏至最近的符頭(甲子/己卯/甲午/己酉)為起點，每15天切換節氣
const YANG_SEQ = ['冬至','小寒','大寒','立春','雨水','驚蟄','春分','清明','穀雨','立夏','小滿','芒種'];
const YIN_SEQ = ['夏至','小暑','大暑','立秋','處暑','白露','秋分','寒露','霜降','立冬','小雪','大雪'];

const REF_DATE = new Date(2000, 0, 7); REF_DATE.setHours(12,0,0,0);
function toAbsDay(y,m,d){ const dt=new Date(y,m-1,d); dt.setHours(12,0,0,0); return Math.round((dt-REF_DATE)/86400000); }
function getFutouAbs(solsticeAbs) {
  const idx60 = ((solsticeAbs % 60) + 60) % 60;
  const offset = idx60 % 15;
  return offset <= 7 ? solsticeAbs - offset : solsticeAbs + (15 - offset);
}

function determineZhiRunJu(year, month, day) {
  const targetAbs = toAbsDay(year, month, day);
  const candidates = [];
  for (let yr = year - 1; yr <= year; yr++) {
    const dzAbs = toAbsDay(yr, 12, calcJieQiDay(yr, '冬至'));
    candidates.push({ abs: getFutouAbs(dzAbs), isYang: true, label: `冬至${yr}` });
    const xzAbs = toAbsDay(yr, 6, calcJieQiDay(yr, '夏至'));
    candidates.push({ abs: getFutouAbs(xzAbs), isYang: false, label: `夏至${yr}` });
  }
  candidates.sort((a,b) => a.abs - b.abs);
  let chosen = candidates[0];
  for (const c of candidates) { if (c.abs <= targetAbs) chosen = c; }

  const daysFromStart = targetAbs - chosen.abs;
  const jqIndex = Math.min(Math.floor(daysFromStart / 15), 11);
  const dayInJQ = daysFromStart - jqIndex * 15;
  const yuan = Math.min(Math.floor(dayInJQ / 5), 2);
  const jqSeq = chosen.isYang ? YANG_SEQ : YIN_SEQ;
  const jq = jqSeq[jqIndex];

  return {
    isYangDun: chosen.isYang, juShu: JU_TABLE[jq][yuan],
    jieQi: jq, yuan: ['上元','中元','下元'][yuan], jqDay: dayInJQ + 1,
    startLabel: chosen.label
  };
}

// ===== 天文節氣法（日家用）=====
function determineYinYangDun(year, month, day) {
  const YANG_JQ = ['冬至','小寒','大寒','立春','雨水','驚蟄','春分','清明','穀雨','立夏','小滿','芒種'];
  let currentJQ = '', jqDay = 0;
  const jqList = getJieQiForMonth(year, month);
  for (let jq of jqList) { if (day >= jq.day) { currentJQ = jq.name; jqDay = day - jq.day + 1; } }
  if (!currentJQ || day < jqList[0].day) {
    let pm = month - 1, py = year; if (pm < 1) { pm = 12; py--; }
    const prev = getJieQiForMonth(py, pm); currentJQ = prev[1].name;
    const lastDay = new Date(year, month - 1, 0).getDate();
    jqDay = day + (lastDay - prev[1].day) + 1;
  }
  const isYangDun = YANG_JQ.includes(currentJQ);
  let yuanIdx = Math.floor((jqDay - 1) / 5); if (yuanIdx > 2) yuanIdx = 2;
  return { isYangDun, juShu: JU_TABLE[currentJQ]?.[yuanIdx] || 1, jieQi: currentJQ, yuan: ['上元','中元','下元'][yuanIdx], jqDay };
}

const isYinPanYangJu = (m, d) => { if (m===12&&d>=21) return true; if (m>=1&&m<=5) return true; if (m===6&&d<21) return true; return false; };

// ===== 主計算 =====
const computeQiMen = (yStr, mStr, dStr, hStr, juSetting, system) => {
  const y=parseInt(yStr),m=parseInt(mStr),d=parseInt(dStr),h=parseInt(hStr);
  let astroDate = new Date(`${y}-${mStr.padStart(2,'0')}-${dStr.padStart(2,'0')}T${hStr.padStart(2,'0')}:00:00+08:00`);
  let isNextDay = h>=23; if(isNextDay) astroDate.setDate(astroDate.getDate()+1);
  const astroHStr = isNextDay?'00':hStr.padStart(2,'0');

  let lunarM=1,lunarD=1,lunarYearStr='';
  try {
    let lcd=new Date(astroDate.getTime()); lcd.setHours(12,0,0,0);
    const parts=new Intl.DateTimeFormat('en-US-u-ca-chinese',{month:'numeric',day:'numeric',timeZone:'Asia/Taipei'}).formatToParts(lcd);
    parts.forEach(p=>{ if(p.type==='month'){const x=p.value.match(/\d+/);if(x)lunarM=parseInt(x[0],10);} if(p.type==='day'){const x=p.value.match(/\d+/);if(x)lunarD=parseInt(x[0],10);} });
    const yp=new Intl.DateTimeFormat('zh-TW-u-ca-chinese',{year:'numeric',timeZone:'Asia/Taipei'}).formatToParts(lcd);
    lunarYearStr=yp.find(p=>p.type==='yearName')?.value||'';
  } catch(e){}

  const refDate = new Date(2000, 0, 7); refDate.setHours(12,0,0,0);
  const astroMid = new Date(astroDate.getTime()); astroMid.setHours(12,0,0,0);
  const diffDays = Math.round((astroMid - refDate) / 86400000);
  const dayIdx60 = ((diffDays % 60) + 60) % 60;
  const dGanIndex = dayIdx60 % 10, dZhiIndex = dayIdx60 % 12;
  const hZhiIndex = Math.floor((h+1)/2)%12;
  const hGanIndex = (dGanIndex*2+hZhiIndex)%10;

  const aY=astroDate.getFullYear(), aM=astroDate.getMonth()+1, aD=astroDate.getDate();
  let baziYear=aY, baziMonthZhi=aM;
  const jqTM = getJieQiForMonth(aY, aM);
  if(aD < jqTM[0].day) baziMonthZhi -= 1;
  if(baziMonthZhi < 2) baziYear -= 1;
  baziMonthZhi = (baziMonthZhi + 12) % 12;
  const yGanIndex=(baziYear-4+1000)%10, yZhiIndex=(baziYear-4+1200)%12;
  const monthOffset=(baziMonthZhi-2+12)%12;
  const monthStemStart=((yGanIndex%5)*2+2)%10;
  const mGanIndex=(monthStemStart+monthOffset)%10;
  const dispYGan=(aY-4+1000)%10, dispYZhi=(aY-4+1200)%12;
  const bazi = { y: GANS[dispYGan]+ZHIS[dispYZhi], m: GANS[mGanIndex]+ZHIS[baziMonthZhi], d: GANS[dGanIndex]+ZHIS[dZhiIndex], h: GANS[hGanIndex]+ZHIS[hZhiIndex] };
  const isWuBuYuShi = (hGanIndex-dGanIndex+10)%10===6;

  let tGanIndex,tZhiIndex;
  if(system==='6'){tGanIndex=dGanIndex;tZhiIndex=dZhiIndex;}
  else if(system==='4'){tGanIndex=mGanIndex;tZhiIndex=baziMonthZhi;}
  else if(system==='5'){tGanIndex=yGanIndex;tZhiIndex=yZhiIndex;}
  else{tGanIndex=hGanIndex;tZhiIndex=hZhiIndex;}

  let isYin, juNum, dunInfo = null;
  if(juSetting!=='auto'){
    isYin=juSetting.startsWith('yin'); juNum=parseInt(juSetting.replace('yin','').replace('yang',''));
  } else if(system==='1'){
    isYin=!isYinPanYangJu(aM,aD); juNum=((yZhiIndex+1)+lunarM+lunarD+(hZhiIndex+1))%9||9;
  } else if(system==='5'){
    isYin=true; const yf=((baziYear-1864)%180+180)%180; juNum=[1,4,7][Math.floor(yf/60)];
  } else if(system==='4'){
    isYin=true;
    const mf = (baziYear - 2024) * 12 + (baziMonthZhi - 2 + 12) % 12;
    juNum = ((7 - Math.floor(mf / 10)) % 9 + 9) % 9 || 9;
  } else if(system==='6'){
    // ===== 日家：陽遁順推、陰遁逆推，與時家完全獨立 =====
    // 陰遁：以甲寅旬(idx50)為界分段，逆推局數
    // 陽遁：順推局數
    const di=determineYinYangDun(aY,aM,aD); isYin=!di.isYangDun; dunInfo=di;
    if(isYin){ const ref=dayIdx60>=50?60:30; juNum=((ref-dayIdx60)%9+9)%9||9; }
    else { juNum=(dayIdx60+4)%9||9; }
  } else {
    // ===== 時家置閏：使用機械式節氣系統 =====
    const di=determineZhiRunJu(aY,aM,aD);
    isYin=!di.isYangDun; juNum=di.juShu; dunInfo=di;
  }

  const earthPan=Array(10).fill(null);
  for(let i=0;i<9;i++){ let p=isYin?(juNum-i-1+9)%9+1:(juNum+i-1)%9+1; earthPan[p]=QI_GANS[i]; }

  const xunIndex=(tZhiIndex-tGanIndex+12)%12;
  const xunShouMap={0:4,10:5,8:6,6:7,4:8,2:9};
  const xunStem=xunShouMap[xunIndex]; const xunText='甲'+ZHIS[xunIndex];
  let fuPalace=earthPan.indexOf(xunStem); if(fuPalace===5)fuPalace=2;

  const heavenPan=Array(10).fill(null);
  const effStem=tGanIndex===0?xunStem:tGanIndex;
  let targetFuPalace=earthPan.indexOf(effStem); if(targetFuPalace===5)targetFuPalace=2;
  const starOffset=getRingIndex(targetFuPalace)-getRingIndex(fuPalace);
  const starTrace=[];
  for(let p of RING){ const tP=advanceRing(p,starOffset); heavenPan[tP]={star:p, stem:earthPan[p], fromPalace:p}; if(p===2&&earthPan[5]!==null)heavenPan[tP].extraStem=earthPan[5]; starTrace.push({sn:STARS[p],fp:p,tp:tP,st:GANS[earthPan[p]],ed:GANS[earthPan[tP]]}); }

  const doorPan=Array(10).fill(null);
  let steps=tGanIndex; if(tGanIndex===0)steps=0; let curP=fuPalace;
  for(let i=0;i<steps;i++){ curP+=(isYin?-1:1); if(curP>9)curP-=9; if(curP<1)curP+=9; }
  let targetShiPalace=curP; if(targetShiPalace===5)targetShiPalace=2;
  const doorOffset=getRingIndex(targetShiPalace)-getRingIndex(fuPalace);
  for(let p of RING){ doorPan[advanceRing(p,doorOffset)]=p; }

  const deityPan=Array(10).fill(null); const dSI=getRingIndex(targetFuPalace);
  for(let i=0;i<8;i++){ deityPan[RING[(dSI+(isYin?-i:i)+8)%8]]=DEITIES[i]; }

  const empty1=(xunIndex-2+12)%12, empty2=(xunIndex-1+12)%12;
  const b2p={0:1,1:8,2:8,3:3,4:4,5:4,6:9,7:2,8:2,9:7,10:6,11:6};
  const emptyPalaces=[b2p[empty1],b2p[empty2]];
  const horseMap={0:8,4:8,8:8,3:4,7:4,11:4,2:2,6:2,10:2,1:6,5:6,9:6};
  const horsePalace=horseMap[tZhiIndex];

  const outerStems=Array(10).fill('');
  if(system==='1'){
    let hpLoc=null;
    for(let p of RING){ if(heavenPan[p].stem===effStem){hpLoc=p;break;} if(heavenPan[p].star===2&&earthPan[5]===effStem){hpLoc=p;break;} }
    if(hpLoc!==null){ let os=getRingIndex(targetShiPalace)-getRingIndex(hpLoc); for(let p of RING){ let sp=advanceRing(p,-os); let th=heavenPan[sp]; if(th&&th.stem!==null){ let str=GANS[th.stem]; if(th.star===2&&earthPan[5]!==null)str+=GANS[earthPan[5]]; outerStems[p]=str; } } }
  } else {
    const outerShift = starOffset - doorOffset;
    for(let p of RING){ const srcP = advanceRing(p, outerShift); let str = GANS[earthPan[srcP]]; if(srcP===2&&earthPan[5]!==null) str += GANS[earthPan[5]]; outerStems[p] = str; }
  }

  let yuanInfo = null;
  if(system==='5'&&juSetting==='auto'){ const yf=((baziYear-1864)%180+180)%180; const yi=Math.floor(yf/60); yuanInfo={yuan:['上元','中元','下元'][yi],startPalace:[1,4,7][yi],yearIn180:yf+1}; }
  else if(system==='4'&&juSetting==='auto'){ const myt=yZhiIndex%3; yuanInfo={yuan:['中元','下元','上元'][myt],yearBranchType:['四仲→中元','四季→下元','四孟→上元'][myt],yearBranch:ZHIS[yZhiIndex]}; }

  return {
    bazi, lunar:`${lunarYearStr||bazi.y} 年 ${String(lunarM).padStart(2,'0')} 月 ${String(lunarD).padStart(2,'0')} 日`,
    displayHStr:astroHStr, juText:(isYin?'陰':'陽')+juNum,
    xunText, fuText:GANS[xunStem], zhiFu:STARS[fuPalace], zhiShi:DOORS[fuPalace],
    earthPan,heavenPan,doorPan,deityPan,outerStems,
    emptyText:ZHIS[empty1]+ZHIS[empty2],
    horseText:ZHIS[horsePalace===8?2:horsePalace===4?5:horsePalace===2?8:11],
    emptyPalaces,horsePalace,doorOffset,starOffset,isWuBuYuShi,
    starTrace,dunInfo,yuanInfo,
    debug:{fuPalace,targetFuPalace,starOffset,doorOffset,outerShift:starOffset-doorOffset,
      effStem:GANS[effStem],day:bazi.d,hour:bazi.h,juNum,isYin,xunText,xunStem:GANS[xunStem],
      earthStr:RING.map(p=>`${p}宮=${GANS[earthPan[p]]}`).join(' ')}
  };
};

// ===================== UI =====================
export default function QiMenDunJiaApp(){
  const [year,setYear]=useState('2026');const [month,setMonth]=useState('03');const [day,setDay]=useState('07');
  const [hour,setHour]=useState('13');const [minute,setMinute]=useState('22');
  const [system,setSystem]=useState('2');const [juSetting,setJuSetting]=useState('auto');
  const [showResult,setShowResult]=useState(false);const [calcData,setCalcData]=useState(null);const [showDebug,setShowDebug]=useState(false);

  const years=Array.from({length:200},(_,i)=>(1901+i).toString());
  const months=Array.from({length:12},(_,i)=>(i+1).toString().padStart(2,'0'));
  const getDIM=(y,m)=>new Date(parseInt(y),parseInt(m),0).getDate();
  const days=Array.from({length:getDIM(year,month)},(_,i)=>(i+1).toString().padStart(2,'0'));
  const hours=Array.from({length:24},(_,i)=>i.toString().padStart(2,'0'));
  const minutes=Array.from({length:60},(_,i)=>i.toString().padStart(2,'0'));
  const juOpts=[{v:'auto',l:'自動計算'},...Array.from({length:9},(_,i)=>({v:`yang${i+1}`,l:`陽遁${i+1}局`})),...Array.from({length:9},(_,i)=>({v:`yin${i+1}`,l:`陰遁${i+1}局`}))];
  const sysMap={'1':'陰盤','2':'時家(置閏)','6':'日家','4':'月家','5':'年家'};

  useEffect(()=>{ if(showResult) setCalcData(computeQiMen(year,month,day,hour,juSetting,system)); },[year,month,day,hour,juSetting,system,showResult]);
  const handleNow=()=>{const n=new Date();setYear(n.getFullYear().toString());setMonth((n.getMonth()+1).toString().padStart(2,'0'));setDay(n.getDate().toString().padStart(2,'0'));setHour(n.getHours().toString().padStart(2,'0'));setMinute(n.getMinutes().toString().padStart(2,'0'));};
  const handleCalc=()=>{setCalcData(computeQiMen(year,month,day,hour,juSetting,system));setShowResult(true);};
  const qc=(t,a)=>{ let dt=new Date(parseInt(year),parseInt(month)-1,parseInt(day),parseInt(hour)); if(t==='day')dt.setDate(dt.getDate()+a); if(t==='hour')dt.setHours(dt.getHours()+a); if(t==='month')dt.setMonth(dt.getMonth()+a); if(t==='year')dt.setFullYear(dt.getFullYear()+a); setYear(dt.getFullYear().toString());setMonth((dt.getMonth()+1).toString().padStart(2,'0'));setDay(dt.getDate().toString().padStart(2,'0'));setHour(dt.getHours().toString().padStart(2,'0')); };
  const sel="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:outline-none text-sm bg-white";

  const Cell=({p})=>{
    if(p===5)return <div className="border border-black bg-gray-50 flex items-center justify-center p-2"><span className="text-gray-300 text-sm">中₅</span></div>;
    const hp=calcData.heavenPan[p];
    let hStems=[]; if(hp?.stem!=null)hStems.push(GANS[hp.stem]); if(hp?.extraStem!=null)hStems.push(GANS[hp.extraStem]);
    let eStems=[GANS[calcData.earthPan[p]]]; if(p===2&&calcData.earthPan[5]!=null)eStems.push(GANS[calcData.earthPan[5]]);
    const dn=DOORS[calcData.doorPan[p]]; const isDP=checkPo(dn,p);
    return(
      <div className="border border-black bg-white flex flex-col p-1.5" style={{minHeight:'120px'}}>
        <div className="flex justify-between items-start mb-1">
          <span className="text-xs text-gray-500 font-bold">{PALACES[p]}</span>
          <div className="flex gap-1">{calcData.emptyPalaces.includes(p)&&<span className="text-xs text-red-500 font-bold">空</span>}{calcData.horsePalace===p&&<span className="text-xs text-green-600 font-bold">馬</span>}</div>
        </div>
        <div className="flex-1 flex flex-col justify-around">
          <span className="text-sm text-purple-700 font-semibold">{calcData.deityPan[p]}</span>
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-800 font-semibold">{STARS[hp?.star]}</span>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-0.5">{hStems.map((s,i)=><span key={i} className={`text-base font-black ${checkXing(s,p)?'text-red-600':'text-gray-900'}`}>{s}</span>)}</div>
              <div className="flex">{hStems.map((s,i)=>checkXing(s,p)?<span key={i} className="text-[8px] text-red-500">刑</span>:checkMu(s,p)?<span key={i} className="text-[8px] text-gray-400">墓</span>:null)}</div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex flex-col"><span className={`text-sm font-semibold ${isDP?'text-red-600':'text-green-800'}`}>{dn}</span>{isDP&&<span className="text-[8px] text-red-400 font-bold">迫</span>}</div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-0.5">{eStems.map((s,i)=><span key={i} className={`text-base font-black ${checkXing(s,p)?'text-red-600':'text-gray-900'}`}>{s}</span>)}</div>
              <div className="flex">{eStems.map((s,i)=>checkXing(s,p)?<span key={i} className="text-[8px] text-red-500">刑</span>:checkMu(s,p)?<span key={i} className="text-[8px] text-gray-400">墓</span>:null)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getNavButtons = () => {
    if(system==='5') return [['⬅ 上一年','year',-1],['下一年 ➡','year',1]];
    if(system==='4') return [['⬅ 上一月','month',-1],['下一月 ➡','month',1]];
    if(system==='6') return [['⬅ 上一日','day',-1],['下一日 ➡','day',1]];
    return [['⬅ 上一日','day',-1],['下一日 ➡','day',1],['⬆ 上一時','hour',-2],['下一時 ⬇','hour',2]];
  };

  return(
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <div className="max-w-2xl mx-auto p-4 bg-white shadow-sm min-h-screen">
        <div className="mb-5 border-b border-gray-200 pb-4">
          <h1 className="text-xl font-bold flex items-center gap-2">奇門遁甲
            <span className="text-xs font-normal bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">V9d 日家陰遁修正</span>
          </h1>
        </div>
        <div className="mb-4"><h2 className="text-sm font-bold text-gray-600 mb-2">設定時間</h2>
          <div className="flex flex-wrap gap-2">
            <select className={sel} value={year} onChange={e=>setYear(e.target.value)}>{years.map(v=><option key={v} value={v}>{v}年</option>)}</select>
            <select className={sel} value={month} onChange={e=>setMonth(e.target.value)}>{months.map(v=><option key={v} value={v}>{v}月</option>)}</select>
            <select className={sel} value={day} onChange={e=>setDay(e.target.value)}>{days.map(v=><option key={v} value={v}>{v}日</option>)}</select>
            <select className={sel} value={hour} onChange={e=>setHour(e.target.value)}>{hours.map(v=><option key={v} value={v}>{v}時</option>)}</select>
            <select className={sel} value={minute} onChange={e=>setMinute(e.target.value)}>{minutes.map(v=><option key={v} value={v}>{v}分</option>)}</select>
            <button onClick={handleNow} className="border border-cyan-500 text-cyan-600 rounded px-3 py-2 text-sm hover:bg-cyan-50">現在時間</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div><h2 className="text-sm font-bold text-gray-600 mb-1">排盤系統</h2>
            <select className={sel+" w-full"} value={system} onChange={e=>setSystem(e.target.value)}>
              <option value="1">陰盤</option><option value="2">時家(置閏)</option><option value="6">日家</option><option value="4">月家</option><option value="5">年家</option>
            </select></div>
          <div><h2 className="text-sm font-bold text-gray-600 mb-1">局數設定</h2>
            <select className={sel+" w-full"} value={juSetting} onChange={e=>setJuSetting(e.target.value)}>
              {juOpts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
            </select></div>
        </div>
        {!showResult&&<div className="text-center py-2"><button onClick={handleCalc} className="bg-orange-600 hover:bg-orange-700 text-white px-10 py-2.5 rounded font-medium shadow">開始排盤</button></div>}
        {showResult&&calcData&&(
          <div className="mt-6 pt-5 border-t border-gray-200">
            <div className="text-sm leading-6 mb-5">
              <div className="text-gray-600">西元：{year}年 {month}月 {day}日 {hour}時 {minute}分</div>
              <div className="text-gray-600">農曆：{calcData.lunar} {calcData.displayHStr}時</div>
              <div className="my-2 font-mono">
                <div className="grid grid-cols-4 w-48 text-center text-xs text-gray-400 mb-0.5"><span>年</span><span>月</span><span>日</span><span>時</span></div>
                <div className="grid grid-cols-4 w-48 text-center text-base font-bold"><span>{calcData.bazi.y[0]}</span><span>{calcData.bazi.m[0]}</span><span>{calcData.bazi.d[0]}</span><span>{calcData.bazi.h[0]}</span></div>
                <div className="grid grid-cols-4 w-48 text-center text-base font-bold"><span>{calcData.bazi.y[1]}</span><span>{calcData.bazi.m[1]}</span><span>{calcData.bazi.d[1]}</span><span>{calcData.bazi.h[1]}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 text-sm mt-2">
                <div className="space-y-0.5">
                  <div>起局：<span className="font-bold text-orange-700">{calcData.juText} 局</span></div>
                  <div>旬首：{calcData.xunText} 旬</div><div>符頭：{calcData.fuText}</div><div>值符：{calcData.zhiFu}</div>
                </div>
                <div className="space-y-0.5">
                  <div>系統：{sysMap[system]}</div><div>空亡：{calcData.emptyText}</div><div>驛馬：{calcData.horseText}</div><div>值使：{calcData.zhiShi}</div>
                </div>
              </div>
              {calcData.dunInfo&&<div className="text-xs text-gray-500 mt-1">
                {system==='2'&&calcData.dunInfo.startLabel&&<span>置閏：{calcData.dunInfo.startLabel}符頭起→</span>}
                節氣：{calcData.dunInfo.jieQi} {calcData.dunInfo.yuan}（第{calcData.dunInfo.jqDay}天）
              </div>}
              {calcData.yuanInfo&&<div className="text-xs text-gray-500 mt-1">
                {system==='5'&&<span>年家：{calcData.yuanInfo.yuan}（180年第{calcData.yuanInfo.yearIn180}年）固定局{calcData.yuanInfo.startPalace}</span>}
                {system==='4'&&<span>月家：年支{calcData.yuanInfo.yearBranch}＝{calcData.yuanInfo.yearBranchType}</span>}
              </div>}
              <div className="flex flex-wrap gap-2 mt-2">
                {calcData.isWuBuYuShi&&<span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded font-bold">⚠️ 五不遇時</span>}
                {((calcData.doorOffset+8)%8)===4&&<span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded font-bold">門反</span>}
                {calcData.doorOffset===0&&<span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded font-bold">門伏</span>}
                {((calcData.starOffset+8)%8)===4&&<span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded font-bold">星反</span>}
                {calcData.starOffset===0&&<span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded font-bold">星伏</span>}
              </div>
            </div>
            <div className="flex justify-center mb-5">
              <div className="w-full max-w-[520px]">
                <div className="flex justify-center mb-1"><span className="font-black text-lg w-10 text-center text-amber-700">{calcData.outerStems[9]}</span></div>
                <div className="flex items-stretch">
                  <div className="flex flex-col justify-around pr-1.5 w-8 text-center font-black text-base text-amber-700"><span>{calcData.outerStems[4]}</span><span>{calcData.outerStems[3]}</span><span>{calcData.outerStems[8]}</span></div>
                  <div className="flex-1 grid grid-cols-3 border-2 border-black">{[4,9,2,3,5,7,8,1,6].map((p,i)=><Cell key={i} p={p}/>)}</div>
                  <div className="flex flex-col justify-around pl-1.5 w-8 text-center font-black text-base text-amber-700"><span>{calcData.outerStems[2]}</span><span>{calcData.outerStems[7]}</span><span>{calcData.outerStems[6]}</span></div>
                </div>
                <div className="flex justify-center mt-1"><span className="font-black text-lg w-10 text-center text-amber-700">{calcData.outerStems[1]}</span></div>
              </div>
            </div>
            <div className="flex justify-center mb-3"><button onClick={()=>setShowDebug(!showDebug)} className="text-xs text-gray-400 underline">{showDebug?'隱藏':'顯示'}驗證資訊</button></div>
            {showDebug&&(<div className="mb-5 border border-blue-200 rounded-lg p-3 bg-blue-50 text-xs font-mono text-gray-600 space-y-1">
              <div>{calcData.debug.day}日 {calcData.debug.hour}時 | {calcData.juText}局 | effStem={calcData.debug.effStem}</div>
              <div>值符原宮={calcData.debug.fuPalace} → 目標宮={calcData.debug.targetFuPalace} | starOffset={calcData.debug.starOffset} | doorOffset={calcData.debug.doorOffset} | outerShift={calcData.debug.outerShift}</div>
              <div>{calcData.debug.earthStr}</div>
              <table className="w-full border-collapse mt-2 text-xs"><thead><tr className="bg-blue-100"><th className="border border-blue-300 px-1 py-0.5">星</th><th className="border border-blue-300 px-1 py-0.5">原宮</th><th className="border border-blue-300 px-1 py-0.5">→</th><th className="border border-blue-300 px-1 py-0.5">目標</th><th className="border border-blue-300 px-1 py-0.5">引干</th><th className="border border-blue-300 px-1 py-0.5">目標地盤</th></tr></thead>
              <tbody>{calcData.starTrace.map((t,i)=>(<tr key={i} className={i%2?'bg-blue-50':'bg-white'}><td className="border border-blue-200 px-1 py-0.5">{t.sn}</td><td className="border border-blue-200 px-1 py-0.5 text-center">{t.fp}</td><td className="border border-blue-200 px-1 py-0.5 text-center">→</td><td className="border border-blue-200 px-1 py-0.5 text-center font-bold">{t.tp}</td><td className="border border-blue-200 px-1 py-0.5 text-center font-bold text-blue-800">{t.st}</td><td className="border border-blue-200 px-1 py-0.5 text-center text-orange-600">{t.ed}</td></tr>))}</tbody></table>
            </div>)}
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {getNavButtons().map(([l,t,a])=>(<button key={l} onClick={()=>qc(t,a)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-1.5 rounded border border-gray-300 text-sm">{l}</button>))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
