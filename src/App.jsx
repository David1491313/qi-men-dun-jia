import React, { useState, useEffect } from 'react';
import { GANS, PALACES, STARS, DOORS, CHANG_SHENG_BLUE_STAGES, getChangShengForPalace, checkXing, checkMu, checkPo, computeQiMen } from './features/qimen/engine.js';
import { MIN_YEAR, MAX_YEAR, daysInMonth, clampCivilDay, shiftCivilDate, taipeiNow } from './features/qimen/civil-date.js';

// ===================== UI =====================
export default function QiMenDunJiaApp(){
  const [year,setYear]=useState('2026');const [month,setMonth]=useState('03');const [day,setDay]=useState('07');
  const [hour,setHour]=useState('13');const [minute,setMinute]=useState('22');
  const [system,setSystem]=useState('2');const [juSetting,setJuSetting]=useState('auto');
  // 星彧預設不顯示十二長生，選定天干後才逐宮標示。
  const [changShengStem,setChangShengStem]=useState('');
  const [showResult,setShowResult]=useState(false);const [calcData,setCalcData]=useState(null);const [showDebug,setShowDebug]=useState(false);

  const years=Array.from({length:MAX_YEAR-MIN_YEAR+1},(_,i)=>(MIN_YEAR+i).toString());
  const months=Array.from({length:12},(_,i)=>(i+1).toString().padStart(2,'0'));
  const days=Array.from({length:daysInMonth(year,month)},(_,i)=>(i+1).toString().padStart(2,'0'));
  const hours=Array.from({length:24},(_,i)=>i.toString().padStart(2,'0'));
  const minutes=Array.from({length:60},(_,i)=>i.toString().padStart(2,'0'));
  const juOpts=[{v:'auto',l:'自動計算'},...Array.from({length:9},(_,i)=>({v:`yang${i+1}`,l:`陽遁${i+1}局`})),...Array.from({length:9},(_,i)=>({v:`yin${i+1}`,l:`陰遁${i+1}局`}))];
  const sysMap={'1':'陰盤','2':'時家(置閏)','6':'日家','4':'月家','5':'年家'};

  useEffect(()=>{ if(showResult) setCalcData(computeQiMen(year,month,day,hour,juSetting,system,minute)); },[year,month,day,hour,minute,juSetting,system,showResult]);
  const selectedDate={year,month,day,hour,minute};
  const applyDate=value=>{setYear(value.year);setMonth(value.month);setDay(value.day);setHour(value.hour);setMinute(value.minute);};
  const changeDatePart=(part,value)=>applyDate(clampCivilDay({...selectedDate,[part]:value}));
  const handleNow=()=>applyDate(taipeiNow());
  const handleCalc=()=>{setCalcData(computeQiMen(year,month,day,hour,juSetting,system,minute));setShowResult(true);};
  const qc=(t,a)=>{const next=shiftCivilDate(selectedDate,t,a);if(next)applyDate(next);};
  const sel="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:outline-none text-sm bg-white";

  const Cell=({p})=>{
    if(p===5)return <div className="border border-black bg-gray-50 flex items-center justify-center p-2"><span className="text-gray-300 text-sm">中₅</span></div>;
    const hp=calcData.heavenPan[p];
    let hStems=[]; if(hp?.stem!=null)hStems.push(GANS[hp.stem]); if(hp?.extraStem!=null)hStems.push(GANS[hp.extraStem]);
    let eStems=[GANS[calcData.earthPan[p]]]; if(p===2&&calcData.earthPan[5]!=null)eStems.push(GANS[calcData.earthPan[5]]);
    const dn=DOORS[calcData.doorPan[p]]; const isDP=checkPo(dn,p);
    const changSheng = getChangShengForPalace(changShengStem,p); const starChangSheng = changSheng[0] ?? null; const doorChangSheng = changSheng[1] ?? null; const renderChangShengBadge = item => item && (<span title={`${item.branch}：${item.stage}`} className={`border text-[10px] leading-4 min-w-4 px-0.5 text-center font-bold shrink-0 ${CHANG_SHENG_BLUE_STAGES.has(item.stage)?'border-blue-600 text-blue-700':'border-gray-800 text-gray-900'}`}>{item.stage}</span>);
    return(
      <div className="border border-black bg-white flex flex-col p-1.5" style={{minHeight:'120px'}}>
        <div className="flex justify-between items-start mb-1">
          <span className="text-xs text-gray-500 font-bold">{PALACES[p]}</span>
          <div className="flex items-center gap-1">
            
            {calcData.emptyPalaces.includes(p)&&<span className="text-xs text-red-500 font-bold">空</span>}{calcData.horsePalace===p&&<span className="text-xs text-green-600 font-bold">馬</span>}
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-around">
          <span className="text-sm text-purple-700 font-semibold">{calcData.deityPan[p]}</span>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1 min-w-0">{renderChangShengBadge(starChangSheng)}<span className="text-sm text-blue-800 font-semibold">{STARS[hp?.star]}</span></div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-0.5">{hStems.map((s,i)=><span key={i} className={`text-base font-black ${checkXing(s,p)?'text-red-600':'text-gray-900'}`}>{s}</span>)}</div>
              <div className="flex">{hStems.map((s,i)=>checkXing(s,p)?<span key={i} className="text-[8px] text-red-500">刑</span>:checkMu(s,p)?<span key={i} className="text-[8px] text-gray-400">墓</span>:null)}</div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1 min-w-0">{renderChangShengBadge(doorChangSheng)}<div className="flex flex-col"><span className={`text-sm font-semibold ${isDP?'text-red-600':'text-green-800'}`}>{dn}</span>{isDP&&<span className="text-[8px] text-red-400 font-bold">迫</span>}</div></div>
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
            <span className="text-xs font-normal bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">V19 日家交界校正</span>
          </h1>
        </div>
        <div className="mb-4"><h2 className="text-sm font-bold text-gray-600 mb-2">設定時間</h2>
          <div className="flex flex-wrap gap-2">
            <select className={sel} value={year} onChange={e=>changeDatePart('year',e.target.value)}>{years.map(v=><option key={v} value={v}>{v}年</option>)}</select>
            <select className={sel} value={month} onChange={e=>changeDatePart('month',e.target.value)}>{months.map(v=><option key={v} value={v}>{v}月</option>)}</select>
            <select className={sel} value={day} onChange={e=>setDay(e.target.value)}>{days.map(v=><option key={v} value={v}>{v}日</option>)}</select>
            <select className={sel} value={hour} onChange={e=>setHour(e.target.value)}>{hours.map(v=><option key={v} value={v}>{v}時</option>)}</select>
            <select className={sel} value={minute} onChange={e=>setMinute(e.target.value)}>{minutes.map(v=><option key={v} value={v}>{v}分</option>)}</select>
            <button onClick={handleNow} className="border border-cyan-500 text-cyan-600 rounded px-3 py-2 text-sm hover:bg-cyan-50">台灣現在時間</button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div><h2 className="text-sm font-bold text-gray-600 mb-1">排盤系統</h2>
            <select className={sel+" w-full"} value={system} onChange={e=>setSystem(e.target.value)}>
              <option value="1">陰盤</option><option value="2">時家(置閏)</option><option value="6">日家</option><option value="4">月家</option><option value="5">年家</option>
            </select></div>
          <div><h2 className="text-sm font-bold text-gray-600 mb-1">局數設定</h2>
            <select className={sel+" w-full"} value={juSetting} onChange={e=>setJuSetting(e.target.value)}>
              {juOpts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
            </select></div>
          <div><h2 className="text-sm font-bold text-gray-600 mb-1">十二長生</h2>
            <select className={sel+" w-full"} value={changShengStem} onChange={e=>setChangShengStem(e.target.value)}>
              <option value="">不選擇</option>{GANS.map(g=><option key={g} value={g}>{g}</option>)}
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
                {system==='4'&&<span>月家：年支{calcData.yuanInfo.yearBranch}＝{calcData.yuanInfo.yearBranchType}；起盤月柱{calcData.chartPillar}（交節整日，23時換日）</span>}
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
              {getNavButtons().map(([l,t,a])=>(<button key={l} onClick={()=>qc(t,a)} disabled={!shiftCivilDate(selectedDate,t,a)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-1.5 rounded border border-gray-300 text-sm disabled:opacity-40 disabled:cursor-not-allowed">{l}</button>))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
