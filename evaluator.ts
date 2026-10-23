import { CalcError, tokenize, type BinOp, type FnName, type Token } from './tokenizer';

export { CalcError };
export type AngleMode = 'DEG' | 'RAD';

const PRECISION = 12;
const EPS = 1e-12;

type Node =
  | { k: 'num'; v: number }
  | { k: 'neg'; a: Node }
  | { k: 'pct'; a: Node }
  | { k: 'fn'; f: FnName; a: Node }
  | { k: 'bin'; op: BinOp; l: Node; r: Node };

/**
 * Gramática (menor → maior precedência):
 *   expr    := term (('+'|'-') term)*
 *   term    := unary (('*'|'/') unary | <multiplicação implícita> unary)*
 *   unary   := ('-'|'+') unary | power
 *   power   := postfix (('^'|'root') unary)?      (associativo à direita)
 *   postfix := primary '%'*
 *   primary := num | '(' expr ')' | fn '(' expr ')'
 */
class Parser {
  private p = 0;
  constructor(private toks: Token[]) {}

  parse(): Node {
    const n = this.expr();
    if (this.p < this.toks.length) throw new CalcError('Expressão inválida');
    return n;
  }

  private peek(): Token | undefined {
    return this.toks[this.p];
  }

  private expectRp(): void {
    if (this.peek()?.t !== 'rp') throw new CalcError('Parêntese não fechado');
    this.p++;
  }

  private expr(): Node {
    let l = this.term();
    for (;;) {
      const t = this.peek();
      if (t?.t === 'op' && (t.v === '+' || t.v === '-')) {
        this.p++;
        l = { k: 'bin', op: t.v, l, r: this.term() };
      } else return l;
    }
  }

  private term(): Node {
    let l = this.unary();
    for (;;) {
      const t = this.peek();
      if (t?.t === 'op' && (t.v === '*' || t.v === '/')) {
        this.p++;
        l = { k: 'bin', op: t.v, l, r: this.unary() };
      } else if (t?.t === 'lp' || t?.t === 'fn') {
        l = { k: 'bin', op: '*', l, r: this.unary() }; // 2(3+1), 2sin(30)
      } else return l;
    }
  }

  private unary(): Node {
    const t = this.peek();
    if (t?.t === 'op' && (t.v === '-' || t.v === '+')) {
      this.p++;
      const a = this.unary();
      return t.v === '-' ? { k: 'neg', a } : a;
    }
    return this.power();
  }

  private power(): Node {
    const base = this.postfix();
    const t = this.peek();
    if (t?.t === 'op' && (t.v === '^' || t.v === 'root')) {
      this.p++;
      return { k: 'bin', op: t.v, l: base, r: this.unary() };
    }
    return base;
  }

  private postfix(): Node {
    let n = this.primary();
    while (this.peek()?.t === 'pct') {
      this.p++;
      n = { k: 'pct', a: n };
    }
    return n;
  }

  private primary(): Node {
    const t = this.toks[this.p++];
    if (!t) throw new CalcError('Expressão incompleta');
    switch (t.t) {
      case 'num':
        return { k: 'num', v: t.v };
      case 'lp': {
        const a = this.expr();
        this.expectRp();
        return a;
      }
      case 'fn': {
        if (this.peek()?.t !== 'lp') throw new CalcError('Use parênteses após a função');
        this.p++;
        const a = this.expr();
        this.expectRp();
        return { k: 'fn', f: t.v, a };
      }
      default:
        throw new CalcError('Expressão inválida');
    }
  }
}

const snap = (x: number) => (Math.abs(x) < EPS ? 0 : x);

function applyFn(f: FnName, x: number, deg: boolean): number {
  const rad = deg ? (x * Math.PI) / 180 : x;
  switch (f) {
    case 'sin':
      return snap(Math.sin(rad));
    case 'cos':
      return snap(Math.cos(rad));
    case 'tan':
      if (Math.abs(Math.cos(rad)) < EPS) throw new CalcError('Tangente indefinida para este ângulo');
      return snap(Math.tan(rad));
    case 'log':
    case 'ln':
      if (x <= 0) throw new CalcError('Logaritmo só existe para números maiores que zero');
      return f === 'log' ? Math.log10(x) : Math.log(x);
    case 'sqrt':
      if (x < 0) throw new CalcError('Raiz quadrada de número negativo');
      return Math.sqrt(x);
  }
}

function applyBin(op: BinOp, l: number, r: number): number {
  switch (op) {
    case '+':
    case '-': {
      const v = op === '+' ? l + r : l - r;
      return Math.abs(v) <= EPS * Math.max(Math.abs(l), Math.abs(r)) ? 0 : v;
    }
    case '*':
      return l * r;
    case '/':
      if (r === 0) throw new CalcError('Divisão por zero');
      return l / r;
    case '^':
      if (l === 0 && r < 0) throw new CalcError('Divisão por zero');
      return Math.pow(l, r);
    case 'root': {
      // l = índice n, r = radicando x  →  n-ésima raiz de x
      if (l === 0) throw new CalcError('O índice da raiz não pode ser zero');
      if (r < 0) {
        if (Number.isInteger(l) && l % 2 !== 0) return -Math.pow(-r, 1 / l);
        throw new CalcError('Raiz de número negativo');
      }
      return Math.pow(r, 1 / l);
    }
  }
}

function ev(n: Node, deg: boolean): number {
  let v: number;
  switch (n.k) {
    case 'num':
      v = n.v;
      break;
    case 'neg':
      v = -ev(n.a, deg);
      break;
    case 'pct':
      v = ev(n.a, deg) / 100;
      break;
    case 'fn':
      v = applyFn(n.f, ev(n.a, deg), deg);
      break;
    case 'bin': {
      const l = ev(n.l, deg);
      // "50 + 10%" = 50 + (50 × 10%) = 55
      const r =
        (n.op === '+' || n.op === '-') && n.r.k === 'pct'
          ? (l * ev(n.r.a, deg)) / 100
          : ev(n.r, deg);
      v = applyBin(n.op, l, r);
      break;
    }
  }
  if (Number.isNaN(v)) throw new CalcError('Operação inválida');
  if (!Number.isFinite(v)) throw new CalcError('Resultado fora do intervalo');
  return Number(v.toPrecision(PRECISION));
}

export function evaluate(src: string, mode: AngleMode = 'DEG'): number {
  const toks = tokenize(src);
  if (toks.length === 0) throw new CalcError('Expressão vazia');
  let open = 0;
  for (const t of toks) {
    if (t.t === 'lp' || t.t === 'fn') open += t.t === 'lp' ? 1 : 0;
    if (t.t === 'rp') open--;
    if (open < 0) throw new CalcError('Parêntese fechado sem abertura');
  }
  for (; open > 0; open--) toks.push({ t: 'rp' }); // fecha parênteses automaticamente
  return ev(new Parser(toks).parse(), mode === 'DEG');
}

export function formatNumber(n: number): string {
  if (n === 0) return '0';
  return String(Number(n.toPrecision(PRECISION)));
}
