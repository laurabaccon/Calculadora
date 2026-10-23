import { useEffect, useReducer, useRef, useState } from 'react';
import { initialState, reducer } from './lib/calculator';

const keys = [
  { label: 'sin', key: 'sin(', kind: 'science', aria: 'seno' }, { label: 'cos', key: 'cos(', kind: 'science', aria: 'cosseno' }, { label: 'tan', key: 'tan(', kind: 'science', aria: 'tangente' }, { label: 'log', key: 'log(', kind: 'science', aria: 'logaritmo base 10' }, { label: 'ln', key: 'ln(', kind: 'science', aria: 'logaritmo natural' },
  { label: '√', key: '√(', kind: 'science', aria: 'raiz quadrada' }, { label: 'ⁿ√', key: 'ⁿ√', kind: 'science', aria: 'raiz enésima' }, { label: 'x²', key: '²', kind: 'science', aria: 'elevar ao quadrado' }, { label: 'xʸ', key: '^', kind: 'science', aria: 'potência' }, { label: '±', key: '±', kind: 'science', aria: 'alternar sinal' },
  { label: 'C', key: 'C', kind: 'utility', aria: 'limpar tudo' }, { label: 'CE / ⌫', key: '⌫', kind: 'utility', aria: 'apagar último caractere' }, { label: '(', key: '(', kind: 'utility', aria: 'abrir parêntese' }, { label: ')', key: ')', kind: 'utility', aria: 'fechar parêntese' }, { label: '%', key: '%', kind: 'science', aria: 'porcentagem' },
  { label: '7', key: '7', kind: 'number', aria: '7' }, { label: '8', key: '8', kind: 'number', aria: '8' }, { label: '9', key: '9', kind: 'number', aria: '9' }, { label: '÷', key: '÷', kind: 'operator', aria: 'divisão' },
  { label: '4', key: '4', kind: 'number', aria: '4' }, { label: '5', key: '5', kind: 'number', aria: '5' }, { label: '6', key: '6', kind: 'number', aria: '6' }, { label: '×', key: '×', kind: 'operator', aria: 'multiplicação' },
  { label: '1', key: '1', kind: 'number', aria: '1' }, { label: '2', key: '2', kind: 'number', aria: '2' }, { label: '3', key: '3', kind: 'number', aria: '3' }, { label: '−', key: '−', kind: 'operator', aria: 'subtração' },
  { label: '0', key: '0', kind: 'number', aria: '0', span: true }, { label: '.', key: '.', kind: 'number', aria: 'ponto decimal' }, { label: '+', key: '+', kind: 'operator', aria: 'adição' },
];

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [scienceOpen, setScienceOpen] = useState(true);
  const displayRef = useRef<HTMLDivElement>(null);
  useEffect(() => { displayRef.current?.scrollTo({ left: displayRef.current.scrollWidth }); }, [state.expr, state.result]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const key = event.key;
      if (/^\d$/.test(key) || ['.', '+', '-', '*', '/', '^', '%', '(', ')'].includes(key)) { event.preventDefault(); dispatch({ type: 'key', key: key === '-' ? '−' : key === '*' ? '×' : key === '/' ? '÷' : key }); }
      else if (key === 'Enter' || key === '=') { event.preventDefault(); dispatch({ type: 'key', key: '=' }); }
      else if (key === 'Backspace') { event.preventDefault(); dispatch({ type: 'key', key: '⌫' }); }
      else if (key === 'Escape') dispatch({ type: 'key', key: 'C' });
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);
  return <main className="page-shell">
    <header className="page-heading"><div className="brand-mark" aria-hidden="true">ƒx</div><div><p className="eyebrow">PRECISÃO EM CADA CÁLCULO</p><h1>Calculadora <span>científica</span></h1></div></header>
    <section className="calculator" aria-label="Calculadora científica">
      <div className="topline"><span className="online"><i /> PRONTA PARA CALCULAR</span><button className="mode-toggle" onClick={() => dispatch({ type: 'key', key: 'mode' })} aria-label={`Alternar modo angular, atual ${state.mode}`}>{state.mode}<span className="switch-dot" /></button></div>
      <div className="display" ref={displayRef} aria-live="polite" aria-atomic="true"><div className="expression">{state.expr || <span className="placeholder">Digite uma expressão</span>}</div><div className={`result ${state.error ? 'error-text' : ''}`}>{state.error || state.result || '0'}</div></div>
      <div className="display-actions"><span className="keyboard-hint">Teclado: números · Enter · Backspace · Esc</span><button className="history-toggle" aria-expanded={historyOpen} onClick={() => setHistoryOpen(v => !v)}>◷ <span>Histórico</span><span className="chevron">{historyOpen ? '−' : '+'}</span></button></div>
      {historyOpen && <section className="history-panel" aria-label="Histórico de operações"><div className="history-header"><h2>Últimas operações</h2><button onClick={() => dispatch({ type: 'clearHistory' })} disabled={!state.history.length}>Limpar</button></div>{state.history.length ? state.history.map((item, i) => <button className="history-item" key={`${item.expr}-${i}`} onClick={() => dispatch({ type: 'insert', value: item.result })}><span>{item.expr}</span><strong>{item.result}</strong></button>) : <p className="empty-history">Seus cálculos aparecerão aqui.</p>}</section>}
      <div className="keypad-toolbar"><button className="science-toggle" onClick={() => setScienceOpen(v => !v)} aria-expanded={scienceOpen}>{scienceOpen ? '−' : '+'} Funções científicas</button><span>{state.mode === 'DEG' ? 'Ângulos em graus' : 'Ângulos em radianos'}</span></div>
      {scienceOpen && <div className="science-grid">{keys.filter(k => k.kind === 'science').map(k => <KeyButton key={k.key} item={k} onPress={v => dispatch({ type: 'key', key: v })} />)}</div>}
      <div className="utility-grid">{keys.filter(k => k.kind === 'utility').map(k => <KeyButton key={k.key} item={k} onPress={v => dispatch({ type: 'key', key: v })} />)}</div>
      <div className="number-grid">{keys.filter(k => ['number', 'operator'].includes(k.kind)).map(k => <KeyButton key={k.key} item={k} onPress={v => dispatch({ type: 'key', key: v })} />)}<button className="key equals" aria-label="Calcular resultado" onClick={() => dispatch({ type: 'key', key: '=' })}>=</button></div>
      <footer className="calculator-footer"><span>TEK RENKK <i>•</i> SCIENTIFIC</span><span>DESIGN FOR CLARITY</span></footer>
    </section>
    <p className="page-note">Uma ferramenta simples para ideias que vão longe.</p>
  </main>;
}
function KeyButton({ item, onPress }: { item: { label: string; key: string; kind: string; aria: string; span?: boolean }; onPress: (key: string) => void }) {
  return <button className={`key ${item.kind} ${item.span ? 'span-two' : ''}`} aria-label={item.aria} onClick={() => onPress(item.key)}>{item.label}</button>;
}
