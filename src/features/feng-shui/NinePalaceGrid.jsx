import React from 'react';
import { palaceLayout } from './directions';

export default function NinePalaceGrid({ orientation, current, selected, onSelect }) {
  return <div className="fs-grid" role="group" aria-label={`後天八卦九宮格，${orientation === 'south' ? '上南下北' : '上北下南'}`}>
    {palaceLayout(orientation).map(p => <button type="button" key={p.id}
      className={`fs-palace ${current?.id === p.id ? 'fs-current' : ''} ${selected.id === p.id ? 'fs-selected' : ''} ${p.id === 'C' ? 'fs-center' : ''}`}
      aria-label={`${p.name}，${p.trigram ? `${p.trigram}卦，` : ''}${p.palace}宮，五行${p.element}${current?.id === p.id ? '，目前角度' : ''}`}
      aria-pressed={selected.id === p.id} onClick={() => onSelect(p)}>
      <span className="fs-palace-top"><span>{p.name} <small>{p.id === 'C' ? 'CENTER' : p.id}</small></span><span>{p.palace}</span></span>
      <span className="fs-trigram" aria-hidden="true">{p.symbol || '◎'}</span>
      <span className="fs-palace-name">{p.trigram ? `${p.trigram}卦` : '中宮'} <small>· {p.element}</small></span>
      <span className="fs-palace-marker">{current?.id === p.id ? '● 目前角度' : p.id === 'C' ? '空間中心' : `${p.bearing}°`}</span>
    </button>)}
  </div>;
}
