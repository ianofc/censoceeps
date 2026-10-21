import { describe, it, expect } from 'vitest';
import { nameKey, isSimilarName } from './supabaseClient';

describe('nameKey', () => {
  it('ignora caixa, acentos, espaços e conectores', () => {
    expect(nameKey('LAIS HELENA ANJOS OLIVEIRA')).toBe(nameKey('Laís  Helena Anjos de Oliveira'));
    expect(nameKey('MARCOS DAVI LEAL DA ANUCIAÇÃO')).toBe('marcos davi leal anuciacao');
  });

  it('diferencia nomes realmente diferentes', () => {
    expect(nameKey('FELIPE SANTOS')).not.toBe(nameKey('FELIPE SANTOS MARTINS'));
  });
});

describe('isSimilarName', () => {
  it('detecta nome abreviado da mesma pessoa', () => {
    expect(isSimilarName('MARCOS DAVI LEAL', 'MARCOS DAVI LEAL DA ANUCIAÇÃO')).toBe(true);
    expect(isSimilarName('SAVIO CAVALCANTE', 'SAVIO CAVALCANTE SOUZA')).toBe(true);
  });

  it('não marca nomes idênticos, só o primeiro nome ou primeiro nome diferente', () => {
    expect(isSimilarName('MARCOS DAVI LEAL', 'Marcos Davi Leal')).toBe(false);
    expect(isSimilarName('MARCOS', 'MARCOS DAVI LEAL')).toBe(false);
    expect(isSimilarName('DAVI LEAL', 'MARCOS DAVI LEAL')).toBe(false);
    expect(isSimilarName('MARCOS DAVID', 'MARCOS DAVI LEAL')).toBe(false);
  });
});
