// src/ui/filters/BooleanFilterUI.ts
import type { UIProperty } from '../../types';
import type { FilterUI } from './FilterUI';
import { $currentFilters, setCurrentFilters, $switchInstances } from '../../state';

export class BooleanFilterUI implements FilterUI {
  constructor(private property: UIProperty) {}

  render(parentElement: HTMLElement): void {
    const propId = this.property.id;
    const listItem = document.createElement('li');

    const switchContainer = document.createElement('div');
    switchContainer.className = 'is-flex is-justify-content-space-between is-align-items-center';

    const title = document.createElement('span');
    title.textContent = this.property.title;
    switchContainer.appendChild(title);

    const switchInput = document.createElement('input');
    switchInput.id = `switch-${propId}`;
    switchInput.type = 'checkbox';
    switchInput.className = 'switch is-rounded';
    switchInput.checked = false;

    const switchLabel = document.createElement('label');
    switchLabel.htmlFor = switchInput.id;
    switchContainer.appendChild(switchInput);
    switchContainer.appendChild(switchLabel);

    // Store the instance for reset
    const switchInstances = $switchInstances.get();
    $switchInstances.set({ ...switchInstances, [propId]: switchInput });

    switchInput.addEventListener('change', () => {
      const currentFilters = $currentFilters.get();
      const newFilters = { ...currentFilters };
      if (switchInput.checked) {
        newFilters[propId] = [1, 1];
      } else {
        delete newFilters[propId];
      }
      setCurrentFilters(newFilters);
    });

    listItem.appendChild(switchContainer);
    parentElement.appendChild(listItem);
  }
}
