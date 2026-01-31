// src/services/SearchService.ts
import itemsjs from 'itemsjs';
import type { ItemsJs } from 'itemsjs';
import type { Product, Filters, UIGroup } from '../types';

export class SearchService {
  private itemsjsInstance: ItemsJs<Product> | null = null;

  init(products: Product[], uiConfig: UIGroup[], searchFieldName: string) {
    const itemsjsConfiguration = {
      searchableFields: [searchFieldName],
      aggregations: uiConfig.flatMap(group => group.properties)
        .reduce((acc, p) => {
          acc[p.id] = { title: p.title, size: 100, type: 'terms' };
          return acc;
        }, {} as any),
    };
    this.itemsjsInstance = itemsjs(products, itemsjsConfiguration);
    return this.itemsjsInstance;
  }

  getInitialAggregations(productsCount: number) {
    if (!this.itemsjsInstance) return null;
    const initialSearch = this.itemsjsInstance.search({ per_page: productsCount });
    return initialSearch.data.aggregations;
  }

  search(query: string, filters: Filters, uiConfig: UIGroup[], allProductsCount: number) {
    if (!this.itemsjsInstance) return { items: [], aggregations: {} };

    const categoricalFilters: Record<string, string[]> = {};
    const continuousFilters: Record<string, [number, number]> = {};

    for (const key in filters) {
      const property = uiConfig.flatMap(g => g.properties).find(p => p.id === key);
      if (property && (property.type === 'continuous' || property.type === 'stepped-continuous-single' || property.type === 'boolean' || property.type === 'continuous-single')) {
        continuousFilters[key] = filters[key] as [number, number];
      } else {
        categoricalFilters[key] = filters[key] as string[];
      }
    }

    let results = this.itemsjsInstance.search({
      query: query,
      per_page: allProductsCount,
      filters: categoricalFilters,
    });

    if (Object.keys(continuousFilters).length > 0) {
      results.data.items = results.data.items.filter(item => {
        return Object.entries(continuousFilters).every(([key, range]) => {
          const value = item[key] as number;
          // value could be null/undefined if data is missing
          if (value === null || value === undefined) return false;
          return value >= range[0] && value <= range[1];
        });
      });
    }

    return results.data;
  }
}
