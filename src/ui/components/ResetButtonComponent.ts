// src/ui/components/ResetButtonComponent.ts
import { setCurrentFilters, setSearchQuery, $sliderInstances, $switchInstances } from '../../state';

export class ResetButtonComponent {
  constructor() {
    const resetButton = document.getElementById('reset-filters-button');
    if (resetButton) {
      resetButton.addEventListener('click', () => this.reset());
    }
  }

  reset(): void {
    setCurrentFilters({});
    setSearchQuery('');

    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = '';
    }

    const sliderInstances = $sliderInstances.get();
    for (const propId in sliderInstances) {
      sliderInstances[propId].reset();
    }

    const switchInstances = $switchInstances.get();
    for (const propId in switchInstances) {
      switchInstances[propId].checked = false;
    }
  }
}
