import React from 'react';
import { DIRECTIONS } from './directions';

export default function Compass({ angle, orientation }) {
  const offset = orientation === 'south' ? 180 : 0;
  return <svg className="fs-compass" viewBox="0 0 280 280" role="img" aria-label={angle === null ? '羅盤：尚未輸入有效角度' : `羅盤指向 ${angle} 度，${orientation === 'south' ? '上南' : '上北'}`}>
    <circle cx="140" cy="140" r="122" className="fs-compass-ring" />
    <circle cx="140" cy="140" r="87" className="fs-compass-inner" />
    {Array.from({ length: 72 }, (_, i) => <line key={i} x1="140" y1={i % 9 === 0 ? 26 : 30} x2="140" y2="36" transform={`rotate(${i * 5} 140 140)`} className="fs-tick" />)}
    {DIRECTIONS.map(d => {
      const radians = (d.bearing - offset) * Math.PI / 180;
      return <text key={d.id} x={140 + Math.sin(radians) * 103} y={140 - Math.cos(radians) * 103} textAnchor="middle" dominantBaseline="central" className={d.id === 'N' ? 'fs-north' : ''}>{d.name.replace('正', '')}</text>;
    })}
    {angle !== null && <g transform={`rotate(${angle - offset} 140 140)`}>
      <path d="M140 55 L153 142 L140 132 L127 142 Z" className="fs-needle" />
      <path d="M140 220 L150 143 L140 150 L130 143 Z" className="fs-needle-tail" />
    </g>}
    <circle cx="140" cy="140" r="7" className="fs-compass-pin" />
  </svg>;
}
