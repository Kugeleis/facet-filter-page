// src/app.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import noUiSlider from 'nouislider';

// --- Mocks ---
// Mock product data and configurations
const mockProductData = [
  { id: 1, name: 'Product 1', color: 'Red', material: 'Metal', price: 100, weight_kg: 10 },
  { id: 2, name: 'Product 2', color: 'Blue', material: 'Plastic', price: 200, weight_kg: 20 },
];

const mockTemplateConfig = [
  { field: "name", property: "name" },
  { field: "color", property: "color" },
];

const mockUiConfig = [
    {
        "groupName": "Details",
        "properties": [
            { "id": "color", "title": "Color", "type": "categorical" },
            { "id": "price", "title": "Price ($)", "type": "continuous" }
        ]
    }
];

// No longer mocking itemsjs to allow for better integration testing.

// Mock fetch
(global as any).fetch = vi.fn();

// Mock noUiSlider
vi.mock('nouislider', () => ({
  default: {
    create: vi.fn(() => ({
      on: vi.fn(),
      reset: vi.fn(),
    })),
  }
}));

// --- Test Suites ---
describe('Core Application Logic', () => {
    let appModule: typeof import('./app');

    beforeEach(async () => {
        vi.clearAllMocks();
        // Set up the DOM before each test
        document.body.innerHTML = `
            <h1 id="main-title"></h1>
            <p id="filters-label"></p>
            <span id="app-version"></span>
            <div id="filter-groups-container"></div>
            <div id="product-list-container"></div>
            <div id="product-count-container"></div>
            <input id="search-input" type="text">
            <button id="reset-filters-button"></button>
            <div id="product-modal">
                <div class="modal-background"></div>
                <div class="delete"></div>
                <div class="modal-card-title"></div>
                <div id="product-modal-content"></div>
            </div>
            <template id="product-card-template">
              <div>
                <div class="card">
                  <p data-template-field="name"></p>
                  <span data-template-field="color"></span>
                </div>
              </div>
            </template>
            <div id="facet-container-color"></div>
        `;

        // Mock fetch responses
        (fetch as Mock).mockImplementation((url: string) => {
            const baseUrl = import.meta.env.BASE_URL;
            if (url === `${baseUrl}setup.json`) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ dataset: 'products' }) });
            }
            if (url === `${baseUrl}products.json`) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve([...mockProductData]) });
            }
            if (url === `${baseUrl}products-config.json`) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve([...mockTemplateConfig]) });
            }
            if (url === `${baseUrl}products-ui-config.json`) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve([...mockUiConfig]) });
            }
            return Promise.reject(new Error(`Unhandled fetch: ${url}`));
        });

        // Import the module dynamically to use the mocks
        appModule = await import('./app?t=' + Date.now());
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe('Initialization', () => {
        it('should fetch data and render initial UI correctly', async () => {
            await appModule.initializeApp();

            // Check if fetch was called for all configs
            expect(fetch).toHaveBeenCalledWith(expect.stringContaining('setup.json'));
            expect(fetch).toHaveBeenCalledWith(expect.stringContaining('products.json'));

            // The test now relies on a real itemsjs instance.
            // We verify the outcome by checking the rendered DOM.

            // Check if products are rendered
            const productContainer = document.getElementById('product-list-container');
            expect(productContainer?.querySelectorAll('.card').length).toBe(2);

            // Check if facets are rendered
            const facetContainer = document.getElementById('facet-container-color');
            expect(facetContainer?.innerHTML).toContain('Red');
            expect(facetContainer?.innerHTML).toContain('Blue');
        });
    });

    describe('Filtering', () => {
        it('should filter by a category and update the UI', async () => {
            await appModule.initializeApp(); // Initial load

            // Apply a filter
            appModule.updateCategoricalFilters('color', 'Red', true);

            // Check that the product list is updated
            const productContainer = document.getElementById('product-list-container');
            expect(productContainer?.querySelectorAll('.card').length).toBe(1);
            expect(productContainer?.textContent).toContain('Product 1');
            expect(productContainer?.textContent).not.toContain('Product 2');
        });
    });

    describe('Resetting Filters', () => {
        it('should clear filters and reset the UI', async () => {
            await appModule.initializeApp();

            // Apply a filter first
            appModule.updateCategoricalFilters('color', 'Red', true);
            expect(document.querySelectorAll('#product-list-container .card').length).toBe(1);

            // Reset filters
            appModule.resetFilters();

            // Check that the product list is reset
            expect(document.querySelectorAll('#product-list-container .card').length).toBe(2);

            // Check that slider reset was called
            const sliderMocks = (noUiSlider.create as Mock).mock.results;
            sliderMocks.forEach(mock => {
                expect(mock.value.reset).toHaveBeenCalled();
            });
        });
    });

    describe('Search', () => {
        it('should filter by search query and update the UI', async () => {
            await appModule.initializeApp();

            // Simulate search input
            const searchInput = document.getElementById('search-input') as HTMLInputElement;
            searchInput.value = 'Product 1';
            searchInput.dispatchEvent(new Event('input'));

            // Check that the product list is updated
            const productContainer = document.getElementById('product-list-container');
            expect(productContainer?.querySelectorAll('.card').length).toBe(1);
            expect(productContainer?.textContent).toContain('Product 1');
            expect(productContainer?.textContent).not.toContain('Product 2');
        });
    });
});