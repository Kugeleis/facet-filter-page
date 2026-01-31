// src/ui/components/SearchBoxComponent.ts
import { setSearchQuery } from '../../state';

export class SearchBoxComponent {
  constructor() {
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        setSearchQuery((e.target as HTMLInputElement).value);
      });
    }
  }
}
