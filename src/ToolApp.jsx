import React, { useEffect, useState } from 'react';
import QiMenDunJiaApp from './App';
import FengShuiPage from './features/feng-shui/FengShuiPage';

const readPage = () => window.location.hash.startsWith('#/feng-shui') ? 'feng-shui' : 'qimen';

export default function ToolApp() {
  const [page, setPage] = useState(readPage);
  useEffect(() => {
    const update = () => setPage(readPage());
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return <>
    <header className="tool-header">
      <a className="tool-brand" href="#/feng-shui" aria-label="九宮方位工具首頁"><span aria-hidden="true">☷</span> 方位研習室</a>
      <nav aria-label="工具導覽">
        <a href="#/feng-shui" aria-current={page === 'feng-shui' ? 'page' : undefined}>風水九宮</a>
        <a href="#/qimen" aria-current={page === 'qimen' ? 'page' : undefined}>奇門排盤</a>
      </nav>
    </header>
    <div hidden={page !== 'feng-shui'}><FengShuiPage /></div>
    <div hidden={page !== 'qimen'}><QiMenDunJiaApp /></div>
  </>;
}
