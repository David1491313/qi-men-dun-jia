import React, { useState } from 'react';
import { DIRECTIONS, directionForBearing, normalizeBearing } from './directions';
import Compass from './Compass';
import NinePalaceGrid from './NinePalaceGrid';

export default function FengShuiPage() {
  const [input, setInput] = useState('0');
  const [orientation, setOrientation] = useState('north');
  const [selected, setSelected] = useState(DIRECTIONS[0]);
  const angle = normalizeBearing(input);
  const current = directionForBearing(input);
  function changeBearing(value) {
    setInput(value);
    const direction = directionForBearing(value);
    if (direction) setSelected(direction);
  }
  return <main className="fs-page">
    <section className="fs-intro">
      <div><p className="fs-eyebrow">空間探索 / 01</p><h1>從一個角度，認識你的方位。</h1><p className="fs-lead">輸入羅盤讀數，將方向轉換成看得懂的九宮與八卦。</p></div>
      <span className="fs-version">後天八卦 · 基礎工具 V1</span>
    </section>
    <div className="fs-workspace">
      <section className="fs-panel fs-controls" aria-labelledby="fs-bearing-title">
        <div className="fs-section-title"><span>01</span><h2 id="fs-bearing-title">輸入羅盤方位</h2></div>
        <p className="fs-muted">正北為 0°，順時針增加。</p>
        <label htmlFor="fs-bearing" className="fs-label">羅盤角度</label>
        <div className={`fs-angle-input ${angle === null ? 'fs-invalid' : ''}`}><input id="fs-bearing" type="number" step="any" inputMode="decimal" value={input} onChange={e => changeBearing(e.target.value)} aria-invalid={angle === null} aria-describedby="fs-bearing-help" /><span aria-hidden="true">°</span></div>
        <p id="fs-bearing-help" className="fs-input-help">{angle === null ? '請輸入有效數字，例：135 或 22.5。' : `換算角度 ${angle}° · 360° 等同 0°，支援負角度。`}</p>
        <label htmlFor="fs-slider" className="fs-sr-only">拖曳調整角度</label>
        <input id="fs-slider" className="fs-slider" type="range" min="0" max="359.9" step="0.1" value={angle ?? 0} onChange={e => changeBearing(e.target.value)} />
        <div className="fs-scale" aria-hidden="true"><span>0° 北</span><span>180° 南</span><span>360°</span></div>
        <div className="fs-presets" aria-label="快速選擇方向">{DIRECTIONS.map(d => <button type="button" key={d.id} aria-pressed={current?.id === d.id} onClick={() => changeBearing(String(d.bearing))}>{d.name}</button>)}</div>
        <Compass angle={angle} orientation={orientation} />
        <div className="fs-reading" role="status" aria-live="polite"><span>目前方向</span><strong>{current ? `${current.name} · ${current.trigram}卦` : '等待有效角度'}</strong><small>{current ? `${current.palace}宮 / 五行${current.element}` : '請在上方輸入羅盤讀數'}</small></div>
      </section>
      <section className="fs-panel fs-map" aria-labelledby="fs-map-title">
        <div className="fs-map-heading"><div className="fs-section-title"><span>02</span><h2 id="fs-map-title">九宮方位圖</h2></div><div className="fs-toggle" role="group" aria-label="圖面方位">{[['north','上北下南'],['south','上南下北']].map(([value,label]) => <button type="button" key={value} aria-pressed={orientation === value} onClick={() => setOrientation(value)}>{label}</button>)}</div></div>
        <p className="fs-muted">{orientation === 'north' ? '上北 · 下南 · 左西 · 右東' : '上南 · 下北 · 左東 · 右西'}<span className="fs-map-note">點選任一宮位查看對照</span></p>
        <NinePalaceGrid orientation={orientation} current={current} selected={selected} onSelect={setSelected} />
        <div className="fs-legend"><span><i className="fs-dot" />目前角度</span><span><i className="fs-outline" />點選宮位</span><span>切換圖面不改變羅盤角度</span></div>
        <section className="fs-detail" aria-label="宮位詳細資料" aria-live="polite">
          <div className="fs-detail-symbol" aria-hidden="true">{selected.symbol || '◎'}</div><div className="fs-detail-body"><p className="fs-eyebrow">宮位對照{selected.id === current?.id ? ' / 目前角度' : ' / 點選查看'}</p><h3>{selected.name} · {selected.trigram ? `${selected.trigram}為${selected.image}` : '空間中心'}</h3><p>{selected.id === 'C' ? '中宮不對應羅盤角度，也沒有獨立八卦。' : `${selected.range}（含起點、不含終點；360° = 0°）`}</p></div><div className="fs-detail-meta"><span>洛書<strong>{selected.palace} 宮</strong></span><span>五行<strong>{selected.element}</strong></span></div>
        </section>
      </section>
    </div>
    <section className="fs-guide" aria-labelledby="fs-guide-title"><div><p className="fs-eyebrow">開始使用</p><h2 id="fs-guide-title">三步看懂方位</h2></div><ol><li><span>1</span><div><strong>取得羅盤讀數</strong><p>使用手機指南針，確認量測方向並記下角度；遠離金屬與磁性物品。</p></div></li><li><span>2</span><div><strong>輸入並對照</strong><p>輸入角度或拖曳滑桿，查看目前方向、卦象與對應宮位。</p></div></li><li><span>3</span><div><strong>探索其他宮位</strong><p>點選九宮查看詳細資料；重新調整角度即可回到量測宮位。</p></div></li></ol></section>
    <footer className="fs-footer"><p>此版提供後天八卦與洛書九宮的方位對照，未加入八宅、飛星或吉凶判定。九宮圖為方位示意，不代表已完成住宅平面圖定位。</p><details><summary>角度規則與使用說明</summary><p>八方各占 45°，邊界歸入下一個順時針方位：例如 22.5° 為東北、337.5° 為正北。以輸入讀數的北方基準為準，本工具不校正磁偏角，也不讀取手機感測器；目前角度不會自動視為住宅坐向。</p><p>對照依據：<a href="https://ghc.yuntech.edu.tw/images/Journal/Journal24.pdf" target="_blank" rel="noreferrer">《雲科漢學學刊》第 24 期，後天八卦與洛書數對照</a>。各流派後續計算將以獨立模組擴充。</p></details></footer>
  </main>;
}
