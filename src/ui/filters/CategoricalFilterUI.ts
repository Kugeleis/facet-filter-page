// src/ui/filters/CategoricalFilterUI.ts
import type { UIProperty } from '../../types';
import type { FilterUI } from './FilterUI';
import { $currentFilters, setCurrentFilters } from '../../state';

export class CategoricalFilterUI implements FilterUI {
  constructor(private property: UIProperty) {}

  render(parentElement: HTMLElement): void {
    const propId = this.property.id;
    const listItem = document.createElement('li');

    const titleLink = document.createElement('a');
    titleLink.textContent = this.property.title;
    listItem.appendChild(titleLink);

    const facetContainer = document.createElement('ul');
    facetContainer.id = `facet-container-${propId}`;
    listItem.appendChild(facetContainer);

    facetContainer.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.type === 'checkbox') {
        this.updateFilters(target.value, target.checked);
      }
    });

    parentElement.appendChild(listItem);
  }

  private updateFilters(value: string, isChecked: boolean): void {
    const propId = this.property.id;
    const currentFilters = $currentFilters.get();
    const newFilters = { ...currentFilters };
    let current = (newFilters[propId] || []) as string[];

    if (isChecked) {
      current = [...current, value];
    } else {
      current = current.filter(v => v !== value);
    }

    if (current.length === 0) {
      delete newFilters[propId];
    } else {
      newFilters[propId] = current;
    }

    setCurrentFilters(newFilters);
  }
}
