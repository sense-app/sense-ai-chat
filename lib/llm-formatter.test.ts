import { describe, test, expect } from 'vitest';
import { jsonToLLMFormat } from '@/lib/llm-formatter';

describe('jsonToLLMFormat', () => {
  test('formats primitive values correctly', () => {
    expect(jsonToLLMFormat('hello')).toBe('hello');
    expect(jsonToLLMFormat(42)).toBe('42');
    expect(jsonToLLMFormat(true)).toBe('true');
    expect(jsonToLLMFormat(null)).toBe('null');
  });

  test('formats empty array and object correctly', () => {
    expect(jsonToLLMFormat([])).toBe('[]');
    expect(jsonToLLMFormat({})).toBe('');
  });

  test('formats simple array with primitives', () => {
    const input = [1, 'two', true];
    const expected = '#1:\n  1\n\n#2:\n  two\n\n#3:\n  true';
    expect(jsonToLLMFormat(input)).toBe(expected);
  });

  test('formats simple object with primitives', () => {
    const input = { name: 'John', age: 30, active: true };
    const expected = 'Name:\n  John\nAge:\n  30\nActive:\n  true';
    expect(jsonToLLMFormat(input)).toBe(expected);
  });

  test('formats nested objects', () => {
    const input = {
      user: {
        personal: {
          name: 'John',
          age: 30
        },
        settings: {
          theme: 'dark'
        }
      }
    };
    const expected = 'User:\n  Personal:\n    Name:\n      John\n    Age:\n      30\n  Settings:\n    Theme:\n      dark';
    expect(jsonToLLMFormat(input)).toBe(expected);
  });

  test('formats array of single-key objects as flattened list', () => {
    const input = [
      { item: 'apple' },
      { item: 'banana' },
      { item: 'orange' }
    ];
    const expected = 'apple\nbanana\norange';
    expect(jsonToLLMFormat(input)).toBe(expected);
  });

  test('respects maxDepth option', () => {
    const deepObject = {
      level1: {
        level2: {
          level3: {
            value: 'deep'
          }
        }
      }
    };
    const expected = 'Level1:\n  Level2:\n    Level3:\n      [Max depth exceeded]';
    expect(jsonToLLMFormat(deepObject, { maxDepth: 2 })).toBe(expected);
  });

  test('throws error when maxDepth exceeded with throwOnMaxDepth option', () => {
    const deepObject = {
      level1: {
        level2: {
          level3: 'deep'
        }
      }
    };
    expect(() => {
      jsonToLLMFormat(deepObject, { maxDepth: 2, throwOnMaxDepth: true });
    }).toThrow('Maximum depth of 2 exceeded');
  });

  test('handles circular references', () => {
    const circular: any = { prop: 'value' };
    circular.self = circular;
    expect(jsonToLLMFormat(circular)).toContain('[Circular reference detected]');
  });

  test('formats keys with camelCase properly', () => {
    const input = {
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '123'
    };
    const expected = 'First Name:\n  John\nLast Name:\n  Doe\nPhone Number:\n  123';
    expect(jsonToLLMFormat(input)).toBe(expected);
  });

  test('respects indent option', () => {
    const input = { name: 'John' };
    const expected = '    Name:\n      John';
    expect(jsonToLLMFormat(input, { indent: 2 })).toBe(expected);
  });

  test('handles mixed nested structures', () => {
    const input = {
      user: 'John',
      scores: [90, 85, 88],
      details: {
        age: 30,
        hobbies: ['reading', 'gaming']
      }
    };
    const expected = 'User:\n  John\nScores:\n  #1:\n    90\n\n  #2:\n    85\n\n  #3:\n    88\nDetails:\n  Age:\n    30\n  Hobbies:\n    #1:\n      reading\n\n    #2:\n      gaming';
    expect(jsonToLLMFormat(input)).toBe(expected);
  });
});
