import { describe, expect, it } from 'vitest';
import { CalcError, evaluate, formatNumber } from './evaluator';
import { initialState, reducer } from './calculator';

describe('avaliador científico', () => {
  it('respeita precedência, parênteses e potência associativa à direita', () => {
    expect(evaluate('2+3×4')).toBe(14);
    expect(evaluate('(2+3)×4')).toBe(20);
    expect(evaluate('2^3^2')).toBe(512);
    expect(evaluate('−2^2')).toBe(-4);
  });
  it('corrige imprecisão e aplica percentual de calculadora', () => {
    expect(evaluate('0.1+0.2')).toBe(0.3);
    expect(evaluate('50+10%')).toBe(55);
    expect(evaluate('200×10%')).toBe(20);
    expect(formatNumber(0.1 + 0.2)).toBe('0.3');
  });
  it('suporta funções trigonométricas, logaritmos, raízes e modos angulares', () => {
    expect(evaluate('sin(180)')).toBe(0);
    expect(evaluate('cos(0)', 'RAD')).toBe(1);
    expect(evaluate('tan(45)')).toBe(1);
    expect(evaluate('log(100)')).toBe(2);
    expect(evaluate('ln(1)')).toBe(0);
    expect(evaluate('√(16)')).toBe(4);
    expect(evaluate('3ⁿ√27')).toBe(3);
  });
  it('apresenta erros amigáveis em domínios inválidos', () => {
    expect(() => evaluate('1÷0')).toThrow('Divisão por zero');
    expect(() => evaluate('√(−4)')).toThrow('Raiz quadrada');
    expect(() => evaluate('log(0)')).toThrow('maiores que zero');
    expect(() => evaluate('tan(90)')).toThrow('Tangente indefinida');
    expect(() => evaluate('2+')).toThrow(CalcError);
  });
});

describe('reducer da calculadora', () => {
  it('registra resultados e permite continuar a partir do resultado', () => {
    const press = (...keys: string[]) => keys.reduce((s, key) => reducer(s, { type: 'key', key }), initialState);
    expect(press('5', '0', '+', '1', '0', '%', '=').history[0]).toEqual({ expr: '50+10%', result: '55' });
    expect(press('2', '+', '3', '=', '×', '2', '=').result).toBe('10');
  });
});
