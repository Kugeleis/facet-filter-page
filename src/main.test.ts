import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import noUiSlider from 'nouislider';

// --- Import types from the main module ---
import type { Product, Filters } from './main';

// --- Mocks ---

const mockProductData: Product[] = [
  { id: 1, name: 'Product 1', color: 'Red', material: 'Metal', price: 100, weight_kg: 10 },
  { id: 2, name: 'Product 2', color: 'Blue', material: 'Plastic', price: 200, weight_kg: 20 },
];

const mockTemplateConfig = [
  { field: "name", property: "name" },
  { field: "color", property: "color" },
  { field: "material", property: "material" },
  { field: "weight", property: "weight_kg", suffix: " kg" },
  { field: "price", property: "price", prefix: "$", format: "toFixed(2)" },
];

const mockUiConfig = [
    {
        "groupName": "Vehicle Details",
        "properties": [
            { "id": "color", "title": "Color", "type": "categorical" },
            { "id": "material", "title": "Material", "type": "categorical" }
        ]
    },
    {
        "groupName": "Performance & Cost",
        "properties": [
            { "id": "weight_kg", "title": "Weight (kg)", "type": "continuous" },
            { "id": "price", "title": "Price ($)", "type": "continuous" }
        ]
    }
];

const mockSearch = vi.fn((query?: { filters?: Filters }) => {
    const filters = query?.filters || {};

    let filteredItems = mockProductData.filter(product => {
        if (filters.color && Array.isArray(filters.color) && filters.color.length > 0) {
            if (!filters.color.includes(product.color)) {
                return false;
            }
        }
        if (filters.material && Array.isArray(filters.material) && filters.material.length > 0) {
            if (!filters.material.includes(product.material)) {
                return false;
            }
        }
        return true;
    });

    // Dynamically generate facets from the filtered items
    const generateFacets = (items: Product[]) => {
      const colorCounts: Record<string, number> = {};
      const materialCounts: Record<string, number> = {};

      items.forEach(p => {
        colorCounts[p.color] = (colorCounts[p.color] || 0) + 1;
        materialCounts[p.material] = (materialCounts[p.material] || 0) + 1;
      });

      return {
        color: { buckets: Object.keys(colorCounts).map(key => ({ key, doc_count: colorCounts[key] })) },
        material: { buckets: Object.keys(materialCounts).map(key => ({ key, doc_count: materialCounts[key] })) },
      };
    };

    return {
      data: {
        items: filteredItems,
        aggregations: generateFacets(filteredItems)
      }
    };
});

vi.mock('itemsjs', () => ({
  default: vi.fn(() => ({
    search: mockSearch,
  }))
}));

// Mock fetch globally
(global as any).fetch = vi.fn();

vi.mock('nouislider', () => ({
  default: {
    create: vi.fn(() => ({
      on: vi.fn(),
      reset: vi.fn(),
    })),
  }
}));

// --- Test Suites ---

describe('Application Logic', () => {
    let mainModule: typeof import('./main');

    beforeEach(async () => {
        vi.clearAllMocks();
        document.body.innerHTML = `
            <body>
                <h1 id="main-title"></h1>
                <div id="filter-sidebar">
                    <p id="filters-label"></p>
                    <button id="reset-filters-button"></button>
                    <div id="filter-groups-container"></div>
                    <div id="facet-container-color"></div>
                    <div id="facet-container-material"></div>
                </div>
                <div id="product-list-container" class="columns is-multiline"></div>
                <template id="product-card-template">
                  <div class="column is-one-third">
                    <div class="card">
                      <div class="card-content">
                        <p class="title is-4" data-template-field="name"></p>
                        <div class="content">
                          <p><strong>Color:</strong> <span data-template-field="color"></span></p>
                          <p><strong>Material:</strong> <span data-template-field="material"></span></p>
                          <p><strong>Weight:</strong> <span data-template-field="weight"></span> kg</p>
                          <p class="subtitle is-5 has-text-weight-bold mt-4" data-template-field="price"></p>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
            </body>`;

        (fetch as Mock).mockImplementation((url: string) => {
            const baseUrl = '/facet-filter-page/';
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

        mainModule = await import('./main.ts?t=' + Date.now());
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe('Initialization', () => {
        it('should fetch data and render initial products', async () => {
            await mainModule.initializeApp();
            const productContainer = document.getElementById('product-list-container');
            expect(productContainer?.querySelectorAll('.card').length).toBe(2);
        });
    });

    describe('Filtering', () => {
        it('should filter by a single category correctly', async () => {
            await mainModule.initializeApp();
            mainModule.updateCategoricalFilters('color', 'Red', true);
            const cards = document.querySelectorAll('#product-list-container .card');
            expect(cards.length).toBe(1);
            expect(cards[0].innerHTML).toContain('Product 1');
        });
    });

    describe('Resetting Filters', () => {
        it('should clear all filters when the reset function is called', async () => {
            await mainModule.initializeApp();

            // Apply a filter
            mainModule.updateCategoricalFilters('color', 'Red', true);
            expect(document.querySelectorAll('#product-list-container .card').length).toBe(1);

            // Call reset
            mainModule.resetFilters();

            // Assert that filters are cleared and products are reset
            expect(mainModule.currentFilters).toEqual({});
            expect(document.querySelectorAll('#product-list-container .card').length).toBe(2);

            // Assert that the slider reset method was called
            const sliderMocks = (noUiSlider.create as Mock).mock.results;
            sliderMocks.forEach(mock => {
                expect(mock.value.reset).toHaveBeenCalled();
            });
        });
    });
});