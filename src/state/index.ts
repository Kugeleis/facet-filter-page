// src/state/index.ts
import { atom } from 'nanostores';
import type { ItemsJs } from 'itemsjs';
import type { API as NoUiSliderAPI } from 'nouislider';
import type { Product, Filters, TemplateMapping, UIGroup } from '../types';

export const $itemsjsInstance = atom<ItemsJs<Product> | null>(null);
export const $currentFilters = atom<Filters>({});
export const $searchQuery = atom<string>('');
export const $productData = atom<Product[]>([]);
export const $sliderInstances = atom<Record<string, NoUiSliderAPI>>({});
export const $switchInstances = atom<Record<string, HTMLInputElement>>({});
export const $cardTemplateMapping = atom<TemplateMapping[]>([]);
export const $uiConfig = atom<UIGroup[]>([]);
export const $noProductsMessage = atom<string>("No products match your current filters.");
export const $allAggregations = atom<any>(null);
export const $filteredItems = atom<Product[]>([]);
export const $selectedProduct = atom<Product | null>(null);

// --- Update functions (Actions) ---
export function setItemsjsInstance(instance: ItemsJs<Product>) {
  $itemsjsInstance.set(instance);
}

export function setCurrentFilters(filters: Filters) {
  $currentFilters.set(filters);
}

export function setSearchQuery(query: string) {
  $searchQuery.set(query);
}

export function setProductData(data: Product[]) {
  $productData.set(data);
}

export function setCardTemplateMapping(mapping: TemplateMapping[]) {
  $cardTemplateMapping.set(mapping);
}

export function setUiConfig(config: UIGroup[]) {
  $uiConfig.set(config);
}

export function setNoProductsMessage(message: string) {
  $noProductsMessage.set(message);
}

export function setAllAggregations(aggregations: any) {
  $allAggregations.set(aggregations);
}

export function setFilteredItems(items: Product[]) {
  $filteredItems.set(items);
}

export function setSelectedProduct(product: Product | null) {
  $selectedProduct.set(product);
}
