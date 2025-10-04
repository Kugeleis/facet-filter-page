// src/ui/facets.ts
import { currentFilters } from '../state';
import type { CategoricalFilter } from '../types';

export function renderFacets(buckets: any[], propId: string): void {
  const container = document.getElementById(`facet-container-${propId}`);
  if (!container) return;

  let html = '';
  buckets.forEach(facetValue => {
    // Only render the facet if it has a count greater than 0
    if (facetValue.doc_count > 0) {
      const isChecked = currentFilters[propId] && (currentFilters[propId] as CategoricalFilter).includes(facetValue.key);
      html += `
        <li>
          <label class="checkbox">
            <input type="checkbox"
                   value="${facetValue.key}"
                   ${isChecked ? 'checked' : ''}>
            ${facetValue.key}
            <span class="tag is-outlined is-rounded ml-2">${facetValue.doc_count}</span>
          </label>
        </li>
      `;
    }
  });
  container.innerHTML = html;
}