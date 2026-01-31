// src/ui/filters/FilterFactory.ts
import type { UIProperty } from '../../types';
import type { FilterUI } from './FilterUI';
import { CategoricalFilterUI } from './CategoricalFilterUI';
import { ContinuousFilterUI } from './ContinuousFilterUI';
import { BooleanFilterUI } from './BooleanFilterUI';
import { SingleHandleFilterUI } from './SingleHandleFilterUI';

export class FilterFactory {
  static createFilter(property: UIProperty): FilterUI {
    switch (property.type) {
      case 'categorical':
        return new CategoricalFilterUI(property);
      case 'continuous':
        return new ContinuousFilterUI(property);
      case 'boolean':
        return new BooleanFilterUI(property);
      case 'continuous-single':
      case 'stepped-continuous-single':
        return new SingleHandleFilterUI(property);
      default:
        throw new Error(`Unknown filter type: ${property.type}`);
    }
  }
}
