import { compare } from "../src/compare";

describe('compare', () => {
  test('when reference is undefined should return true', () => {
    expect(compare('metric', undefined, 0)).toBeTruthy();
  });

  test('given number reference is higher than value should return true', () => {
    expect(compare('something', 100, 40)).toBeTruthy();
  });

  test('given number reference is equal to value should return true', () => {
    expect(compare('something', 100, 100)).toBeTruthy();
  });

  test('given number reference is lower than value should return false', () => {
    expect(compare('something', 40, 100)).toBeFalsy();
  });

  test('given string reference is higher than value should return false', () => {
    expect(compare('something', 'A', 'B')).toBeFalsy();
  });

  test('given string reference is equal to value should return true', () => {
    expect(compare('something', 'A', 'A')).toBeTruthy();
  });

  test('given string reference is lower than value should return true', () => {
    expect(compare('something', 'B', 'A')).toBeTruthy();
  });

  test('given reference is higher than value when metric is structure_score should return false', () => {
    expect(compare('structure_score', 100, 40)).toBeFalsy();
  });

  test('given reference is equal to value when metric is structure_score should return true', () => {
    expect(compare('structure_score', 40, 40)).toBeTruthy();
  });

  test('given reference is lower than value when metric is structure_score should return true', () => {
    expect(compare('structure_score', 40, 100)).toBeTruthy();
  });
});