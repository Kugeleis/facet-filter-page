import itemsjs from 'itemsjs';
import { get } from 'svelte/store';
import {
  productData,
  itemsjsInstance,
  currentFilters,
  searchQuery,
  uiConfig,
  allAggregations,
} from '../state/stores';
import type { CategoricalFilter, ContinuousFilter } from '../types';

export function initializeItemsjs() {
  const $productData = get(productData);
  const $uiConfig = get(uiConfig);

  const searchFieldName = 'name'; // This should be dynamic later

  const itemsjsConfiguration = {
    searchableFields: [searchFieldName],
    aggregations: $uiConfig.flatMap(group => group.properties)
      .reduce((acc, p) => {
        acc[p.id] = { title: p.title, size: 100, type: 'terms' };
        return acc;
      }, {} as any),
  };

  const instance = itemsjs($productData, itemsjsConfiguration);
  itemsjsInstance.set(instance);

  const initialSearch = instance.search({ per_page: $productData.length });
  allAggregations.set(initialSearch.data.aggregations);
}

export function applyFiltersAndSearch() {
  const $itemsjsInstance = get(itemsjsInstance);
  if (!$itemsjsInstance) return { items: [], aggregations: {} };

  const $searchQuery = get(searchQuery);
  const $currentFilters = get(currentFilters);
  const $productData = get(productData);
  const $uiConfig = get(uiConfig);

  const categoricalFilters: Record<string, string[]> = {};
  const continuousFilters: Record<string, [number, number]> = {};

  for (const key in $currentFilters) {
    const property = $uiConfig.flatMap(g => g.properties).find(p => p.id === key);
    if (property && (property.type === 'continuous' || property.type === 'stepped-continuous-single' || property.type === 'boolean' || property.type === 'continuous-single')) {
      continuousFilters[key] = $currentFilters[key] as [number, number];
    } else {
      categoricalFilters[key] = $currentFilters[key] as string[];
    }
  }

  let results = $itemsjsInstance.search({
    query: $searchQuery,
    per_page: $productData.length,
    filters: categoricalFilters,
  });

  if (Object.keys(continuousFilters).length > 0) {
    results.data.items = results.data.items.filter(item => {
      return Object.entries(continuousFilters).every(([key, range]) => {
        const value = item[key] as number;
        return value >= range[0] && value <= range[1];
      });
    });
  }

  return {
    items: results.data.items,
    aggregations: results.data.aggregations,
  };
}