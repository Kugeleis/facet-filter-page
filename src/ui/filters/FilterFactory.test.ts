// src/ui/filters/FilterFactory.test.ts
import { describe, it, expect, vi } from 'vitest';
import { FilterFactory } from './FilterFactory';
import { CategoricalFilterUI } from './CategoricalFilterUI';
import { ContinuousFilterUI } from './ContinuousFilterUI';
import { BooleanFilterUI } from './BooleanFilterUI';
import { SingleHandleFilterUI } from './SingleHandleFilterUI';

describe('FilterFactory', () => {
  it('should create CategoricalFilterUI for categorical type', () => {
    const property: any = { type: 'categorical', id: 'test' };
    const filter = FilterFactory.createFilter(property);
    expect(filter).toBeInstanceOf(CategoricalFilterUI);
  });

  it('should create ContinuousFilterUI for continuous type', () => {
    const property: any = { type: 'continuous', id: 'test' };
    const filter = FilterFactory.createFilter(property);
    expect(filter).toBeInstanceOf(ContinuousFilterUI);
  });

  it('should create BooleanFilterUI for boolean type', () => {
    const property: any = { type: 'boolean', id: 'test' };
    const filter = FilterFactory.createFilter(property);
    expect(filter).toBeInstanceOf(BooleanFilterUI);
  });

  it('should create SingleHandleFilterUI for continuous-single type', () => {
    const property: any = { type: 'continuous-single', id: 'test' };
    const filter = FilterFactory.createFilter(property);
    expect(filter).toBeInstanceOf(SingleHandleFilterUI);
  });

  it('should throw error for unknown type', () => {
    const property: any = { type: 'unknown', id: 'test' };
    expect(() => FilterFactory.createFilter(property)).toThrow('Unknown filter type: unknown');
  });
});
