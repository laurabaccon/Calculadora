export class CalcError extends Error {}
export type FnName = 'sin' | 'cos' | 'tan' | 'log' | 'ln' | 'sqrt';
export type BinOp = '+' | '-' | '*' | '/' | '^' | 'root';
export type Token = { t: 'num'; v: number } | { t: 'op'; v: BinOp } | { t: 'fn'; v: FnName } | { t: 'lp' | 'rp' | 'pct' };

const OPS: Record<string, BinOp> = { '+': '+', '-': '-', '−': '-', '×': '*', '*': '*', '÷': '/', '/': '/', '^': '^' };
const FUNCS: Record<string, FnName> = { sin: 'sin', cos: 'cos', tan: 'tan', log: 'log', ln: 'ln' };
const NUM = /(?:\d+\.?\d*|\.\d+)(?:e[+\-−]?\d+)?/iy;

export function tokenize(src: string): Token[] {
  const out: Token[] = [];
  for (let i = 0; i < src.length;) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (/[\d.]/.test(ch)) {
      NUM.lastIndex = i; const m = NUM.exec(src);
      if (!m) throw new CalcError('Número inválido');
      out.push({ t: 'num', v: Number(m[0].replace('−', '-')) }); i += m[0].length; continue;
    }
    if (src.startsWith('ⁿ√', i)) { out.push({ t: 'op', v: 'root' }); i += 2; continue; }
    if (ch === '√') { out.push({ t: 'fn', v: 'sqrt' }); i++; continue; }
    if (ch in OPS) { out.push({ t: 'op', v: OPS[ch] }); i++; continue; }
    if (ch === '(') { out.push({ t: 'lp' }); i++; continue; }
    if (ch === ')') { out.push({ t: 'rp' }); i++; continue; }
    if (ch === '%') { out.push({ t: 'pct' }); i++; continue; }
    const word = /^[a-z]+/i.exec(src.slice(i))?.[0].toLowerCase();
    if (!word || !(word in FUNCS)) throw new CalcError(`Caractere inválido: "${ch}"`);
    out.push({ t: 'fn', v: FUNCS[word] }); i += word.length;
  }
  return out;
}
