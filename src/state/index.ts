// src/state/index.ts
import type { ItemsJs } from 'itemsjs';
import type { API as NoUiSliderAPI } from 'nouislider';
import type { Product, Filters, TemplateMapping, UIGroup } from '../types';

export let itemsjsInstance: ItemsJs<Product>;
export let currentFilters: Filters = {};
export let searchQuery: string = '';
export let productData: Product[] = [];
export let sliderInstances: Record<string, NoUiSliderAPI> = {};
export let switchInstances: Record<string, HTMLInputElement> = {};
export let cardTemplateMapping: TemplateMapping[] = [];
export let uiConfig: UIGroup[] = [];
export let noProductsMessage: string = "No products match your current filters.";
export let allAggregations: any;

// --- Update functions ---
export function setItemsjsInstance(instance: ItemsJs<Product>) {
  itemsjsInstance = instance;
}

export function setCurrentFilters(filters: Filters) {
  currentFilters = filters;
}

export function setSearchQuery(query: string) {
  searchQuery = query;
}

export function setProductData(data: Product[]) {
  productData = data;
}

export function setCardTemplateMapping(mapping: TemplateMapping[]) {
  cardTemplateMapping = mapping;
}

export function setUiConfig(config: UIGroup[]) {
  uiConfig = config;
}

export function setNoProductsMessage(message: string) {
  noProductsMessage = message;
}

export function setAllAggregations(aggregations: any) {
  allAggregations = aggregations;
}