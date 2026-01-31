// src/ui/components/FilterSidebarComponent.ts
import { $uiConfig, $allAggregations, $currentFilters } from '../../state';
import { FilterFactory } from '../filters/FilterFactory';
import type { CategoricalFilter, UIGroup } from '../../types';

export class FilterSidebarComponent {
  private container: HTMLElement | null;

  constructor() {
    this.container = document.getElementById('filter-groups-container');

    // Subscribe to uiConfig to build the sidebar structure
    $uiConfig.subscribe(config => {
      if (config && config.length > 0) {
        this.build(config);
      }
    });

    // Subscribe to aggregations and current filters to update the facet checkboxes
    $allAggregations.subscribe(() => this.updateFacets());
    $currentFilters.subscribe(() => this.updateFacets());
  }

  private build(uiConfig: UIGroup[]): void {
    if (!this.container) return;
    this.container.innerHTML = '';

    uiConfig.forEach(group => {
      const groupLabel = document.createElement('p');
      groupLabel.className = 'menu-label';
      groupLabel.textContent = group.groupName;
      this.container!.appendChild(groupLabel);

      const menuList = document.createElement('ul');
      menuList.className = 'menu-list';
      this.container!.appendChild(menuList);

      group.properties.forEach(property => {
        const filter = FilterFactory.createFilter(property);
        filter.render(menuList);
      });
    });
  }

  private updateFacets(): void {
    const allAggregations = $allAggregations.get();
    const uiConfig = $uiConfig.get();
    if (!allAggregations) return;

    Object.keys(allAggregations).forEach(propId => {
      const aggregation = allAggregations[propId];
      const property = uiConfig.flatMap(g => g.properties).find(p => p.id === propId);
      if (aggregation && aggregation.buckets && property && property.type === 'categorical') {
        this.renderFacets(aggregation.buckets, propId);
      }
    });
  }

  private renderFacets(buckets: any[], propId: string): void {
    const container = document.getElementById(`facet-container-${propId}`);
    if (!container) return;

    const currentFilters = $currentFilters.get();
    let html = '';
    buckets.forEach(facetValue => {
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
}
