import { writable } from 'svelte/store';
import type { Product, UIConfig, CategoricalFilter, ContinuousFilter, SteppedContinuousSingleFilter, BooleanFilter, ContinuousSingleFilter } from '../types/index';
import type ItemsJS from 'itemsjs';
import type { NoUiSlider } from 'nouislider';

// The main product data
export const productData = writable<Product[]>([]);

// The itemsjs instance
export const itemsjsInstance = writable<ItemsJS | null>(null);

// The current search query
export const searchQuery = writable<string>('');

// The current filter state
export const currentFilters = writable<Record<string, CategoricalFilter | ContinuousFilter | SteppedContinuousSingleFilter | BooleanFilter | ContinuousSingleFilter>>({});

// UI configuration
export const uiConfig = writable<UIConfig[]>([]);

// No products message
export const noProductsMessage = writable<string>('No products match your current filters.');

// All aggregations (for facets)
export const allAggregations = writable<any>(null);

// Slider instances (will likely be managed within components later)
export const sliderInstances = writable<Record<string, NoUiSlider>>({});

// Switch instances (will likely be managed within components later)
export const switchInstances = writable<Record<string, HTMLInputElement>>({});

// Card template mapping
export const cardTemplateMapping = writable<any[]>([]);