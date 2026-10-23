import { describe, expect, it } from 'vitest';
import { evaluate, formatNumber } from './evaluator';
import { initialState, reducer } from './calculator';

const err = (src: string, mode: 'DEG' | 'RAD' = 'DEG') => () => evaluate(src, mode);

describe('evaluate — básico e precedência', () => {
  it('respeita precedência e parênteses', () => {
    expect(evaluate('2+3×4')).toBe(14);
    expect(evaluate('(2+3)×4')).toBe(20);
    expect(evaluate('10−4÷2')).toBe(8);
  });
  it('potência é associativa à direita e unário vem depois dela', () => {
    expect(evaluate('2^3^2')).toBe(512);
    expect(evaluate('−2^2')).toBe(-4);
    expect(evaluate('2^−1')).toBe(0.5);
  });
  it('corrige ponto flutuante', () => {
    expect(evaluate('0.1+0.2')).toBe(0.3);
    expect(evaluate('0.3−0.1−0.2')).toBe(0);
    expect(formatNumber(0.1 + 0.2)).toBe('0.3');
    expect(formatNumber(-0)).toBe('0');
  });
  it('multiplicação implícita e parênteses automáticos', () => {
    expect(evaluate('2(3+1)')).toBe(8);
    expect(evaluate('(1+2)(3+4)')).toBe(21);
    expect(evaluate('2sin(30')).toBe(1);
  });
});

describe('evaluate — porcentagem', () => {
  it('50 + 10% = 55 e 200 × 10% = 20', () => {
    expect(evaluate('50+10%')).toBe(55);
    expect(evaluate('200×10%')).toBe(20);
    expect(evaluate('50−10%')).toBe(45);
    expect(evaluate('10%')).toBe(0.1);
  });
});

describe('evaluate — científicas', () => {
  it('trigonometria em graus', () => {
    expect(evaluate('sin(180)')).toBe(0);
    expect(evaluate('sin(30)')).toBe(0.5);
    expect(evaluate('cos(60)')).toBe(0.5);
    expect(evaluate('tan(45)')).toBe(1);
  });
  it('trigonometria em radianos', () => {
    expect(evaluate('sin(0)', 'RAD')).toBe(0);
    expect(evaluate('cos(0)', 'RAD')).toBe(1);
  });
  it('logaritmos, raízes e potências', () => {
    expect(evaluate('log(1000)')).toBe(3);
    expect(evaluate('ln(1)')).toBe(0);
    expect(evaluate('√(16)')).toBe(4);
    expect(evaluate('3ⁿ√27')).toBe(3);
    expect(evaluate('3ⁿ√(−27)')).toBe(-3);
    expect(evaluate('5^2')).toBe(25);
  });
});

describe('evaluate — erros amigáveis', () => {
  it('divisão por zero', () => expect(err('1÷0')).toThrow('Divisão por zero'));
  it('raiz de negativo', () => {
    expect(err('√(−4)')).toThrow('negativo');
    expect(err('2ⁿ√(−4)')).toThrow('negativo');
  });
  it('log de número ≤ 0', () => {
    expect(err('log(0)')).toThrow('maiores que zero');
    expect(err('ln(−1)')).toThrow('maiores que zero');
  });
  it('tan(90°) indefinida', () => expect(err('tan(90)')).toThrow('Tangente'));
  it('expressões malformadas', () => {
    expect(err('')).toThrow();
    expect(err('2+')).toThrow();
    expect(err('2+*3')).toThrow();
    expect(err(')')).toThrow();
    expect(err('abc')).toThrow();
  });
});

describe('reducer — entrada de teclas', () => {
  const run = (...keys: string[]) =>
    keys.reduce((s, key) => reducer(s, { type: 'key', key }), initialState);

  it('calcula e registra no histórico', () => {
    const s = run('5', '0', '+', '1', '0', '%', '=');
    expect(s.result).toBe('55');
    expect(s.history[0]).toEqual({ expr: '50+10%', result: '55' });
  });
  it('operador após "=" continua do resultado; dígito começa nova conta', () => {
    expect(run('2', '+', '3', '=', '×', '2', '=').result).toBe('10');
    expect(run('2', '+', '3', '=', '7').expr).toBe('7');
  });
  it('impede dois pontos e zeros à esquerda', () => {
    expect(run('1', '.', '.', '5').expr).toBe('1.5');
    expect(run('0', '0', '5').expr).toBe('5');
  });
  it('troca operador repetido', () => expect(run('5', '+', '×').expr).toBe('5×'));
  it('⌫ apaga função inteira', () => expect(run('sin(', '⌫').expr).toBe(''));
  it('x² e ±', () => {
    expect(run('5', '²', '=').result).toBe('25');
    expect(run('5', '±', '=').result).toBe('-5');
  });
  it('mostra erro sem quebrar e C limpa', () => {
    const s = run('1', '÷', '0', '=');
    expect(s.error).toBe('Divisão por zero');
    expect(s.expr).toBe('1÷0');
    expect(run('1', '÷', '0', '=', 'C').error).toBe('');
  });
  it('alterna DEG/RAD', () => expect(run('mode').mode).toBe('RAD'));
});
