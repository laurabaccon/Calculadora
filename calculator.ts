import { CalcError, evaluate, formatNumber, type AngleMode } from './evaluator';

export interface HistoryItem {
  expr: string;
  result: string;
}

export interface CalcState {
  expr: string;
  result: string;
  error: string;
  /** true logo após "=": o próximo dígito inicia uma nova conta */
  fresh: boolean;
  mode: AngleMode;
  history: HistoryItem[];
}

export type Action =
  | { type: 'key'; key: string }
  | { type: 'insert'; value: string }
  | { type: 'clearHistory' };

export const HISTORY_LIMIT = 10;

export const initialState: CalcState = {
  expr: '',
  result: '',
  error: '',
  fresh: false,
  mode: 'DEG',
  history: [],
};

const BIN_OPS = ['+', '−', '×', '÷', '^', 'ⁿ√'];
const FUNCS = ['sin(', 'cos(', 'tan(', 'log(', 'ln(', '√('];
const TRAIL_TOKEN = /(sin\(|cos\(|tan\(|log\(|ln\(|√\(|ⁿ√)$/;
const TRAIL_OP = /(ⁿ√|[+−×÷^])$/;
const ENDS_WITH_VALUE = /[\d.)%]$/;

const norm = (s: string) => s.replace(/-/g, '−');
const count = (s: string, ch: string) => s.split(ch).length - 1;

export function backspace(expr: string): string {
  const m = TRAIL_TOKEN.exec(expr);
  return m ? expr.slice(0, -m[0].length) : expr.slice(0, -1);
}

export function toggleSign(expr: string): string {
  if (/^−[\d.]+$/.test(expr)) return expr.slice(1);
  if (/\(−[\d.]+\)$/.test(expr)) return expr.replace(/\(−([\d.]+)\)$/, '$1');
  if (/[\d.]+$/.test(expr)) return expr.replace(/([\d.]+)$/, '(−$1)');
  return /[)%]$/.test(expr) ? expr : expr + '(−';
}

function edit(e: string, k: string): string {
  if (/^\d$/.test(k)) {
    const seg = /[\d.]*$/.exec(e)![0];
    if (seg === '0') return e.slice(0, -1) + k; // evita "05"
    return (/[)%]$/.test(e) ? e + '×' : e) + k;
  }
  if (FUNCS.includes(k)) return e + k;
  switch (k) {
    case '.': {
      if (/[\d.]*$/.exec(e)![0].includes('.') || /[)%]$/.test(e)) return e;
      return e + '.';
    }
    case '⌫':
      return backspace(e);
    case '±':
      return toggleSign(e);
    case '²':
      return ENDS_WITH_VALUE.test(e) ? e + '^2' : e;
    case '%':
      return ENDS_WITH_VALUE.test(e) ? e + '%' : e;
    case '(':
      return e + '(';
    case ')':
      return count(e, '(') > count(e, ')') && ENDS_WITH_VALUE.test(e) ? e + ')' : e;
  }
  if (BIN_OPS.includes(k)) {
    if (!e) return k === '−' ? '−' : '0' + k;
    const m = TRAIL_OP.exec(e);
    if (m) {
      const head = e.slice(0, -m[0].length);
      return (head === '' || head.endsWith('(')) && k !== '−' ? e : head + k;
    }
    if (e.endsWith('(')) return k === '−' ? e + k : e;
    return e + k;
  }
  return e;
}

function equals(s: CalcState): CalcState {
  if (s.fresh || !s.expr) return s;
  try {
    const result = formatNumber(evaluate(s.expr, s.mode));
    return {
      ...s,
      result,
      error: '',
      fresh: true,
      history: [{ expr: s.expr, result }, ...s.history].slice(0, HISTORY_LIMIT),
    };
  } catch (err) {
    return { ...s, result: '', error: err instanceof CalcError ? err.message : 'Expressão inválida' };
  }
}

function press(s: CalcState, k: string): CalcState {
  if (k === 'mode') return { ...s, mode: s.mode === 'DEG' ? 'RAD' : 'DEG' };
  if (k === 'C') return { ...s, expr: '', result: '', error: '', fresh: false };
  if (k === '=') return equals(s);

  let expr = s.expr;
  if (s.fresh && k !== '⌫') {
    // operadores continuam a partir do resultado; qualquer outra tecla começa do zero
    expr = BIN_OPS.includes(k) || k === '%' || k === '²' || k === '±' ? norm(s.result) : '';
  }
  return { ...s, expr: edit(expr, k), result: '', error: '', fresh: false };
}

export function reducer(s: CalcState, a: Action): CalcState {
  switch (a.type) {
    case 'clearHistory':
      return { ...s, history: [] };
    case 'insert': {
      const base = s.fresh ? '' : s.expr;
      const value = norm(a.value);
      return {
        ...s,
        expr: (ENDS_WITH_VALUE.test(base) ? base + '×' : base) + value,
        result: '',
        error: '',
        fresh: false,
      };
    }
    case 'key':
      return press(s, a.key);
  }
}
