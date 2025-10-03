import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';

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
    aggregation: (query: { name: string }) => {
        const facetName = query.name as keyof Product;
        const counts: Record<string, number> = {};
        mockProductData.forEach(p => {
            const key = p[facetName] as string;
            counts[key] = (counts[key] || 0) + 1;
        });

        const buckets = Object.keys(counts).map(key => ({
            key: key,
            doc_count: counts[key]
        }));

        return { data: { buckets: buckets } };
    }
  }))
}));

// Mock fetch globally
(global as any).fetch = vi.fn();

vi.mock('nouislider', () => ({
  default: {
    create: vi.fn((element: HTMLElement) => {
      // Attach a mock noUiSlider API to the element, as the library does
      (element as any).noUiSlider = {
        on: vi.fn(),
        // Mock other API methods if your tests need them
      };
    }),
  }
}));

// --- Test Suites ---

describe('Application Logic', () => {
    // Define a type for the module's exports
    let mainModule: typeof import('./main');

    beforeEach(async () => {
        vi.clearAllMocks();
        document.body.innerHTML = `
            <body>
                <h1 id="main-title"></h1>
                <div id="filter-sidebar">
                    <p id="filters-label"></p>
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

        // Mock the fetch call to return our mock data
        (fetch as Mock).mockImplementation((url: string) => {
            if (url === '/setup.json') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ dataset: 'products' }),
                });
            }
            if (url === '/products.json') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([...mockProductData]),
                });
            }
            if (url === '/products-config.json') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([...mockTemplateConfig]),
                });
            }
            if (url === '/products-ui-config.json') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([...mockUiConfig]),
                });
            }
            return Promise.reject(new Error(`Unhandled fetch request: ${url}`));
        });

        // Re-import the module before each test to get a fresh state
        mainModule = await import('./main.ts?t=' + Date.now());
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe('Initialization', () => {
        it('should fetch data and render initial products', async () => {
            await mainModule.initializeApp();

            const productContainer = document.getElementById('product-list-container');
            expect(fetch).toHaveBeenCalledWith('/setup.json');
            expect(fetch).toHaveBeenCalledWith('/products.json');
            expect(fetch).toHaveBeenCalledWith('/products-config.json');
            expect(fetch).toHaveBeenCalledWith('/products-ui-config.json');
            expect(productContainer?.querySelectorAll('.card').length).toBe(2);
            expect(productContainer?.innerHTML).toContain('Product 1');
            expect(productContainer?.innerHTML).toContain('Product 2');
        });

        it('should handle fetch error gracefully if products.json fails', async () => {
            // Mock a failure for only the products.json fetch
            (fetch as Mock).mockImplementation((url: string) => {
                if (url === '/setup.json') {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ dataset: 'products' }),
                    });
                }
                if (url === '/products.json') {
                    return Promise.resolve({ ok: false, status: 404 });
                }
                if (url === '/products-config.json') {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve(mockTemplateConfig),
                    });
                }
                if (url === '/products-ui-config.json') {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve(mockUiConfig),
                    });
                }
                return Promise.reject(new Error(`Unhandled fetch: ${url}`));
            });

            await mainModule.initializeApp();

            const productContainer = document.getElementById('product-list-container');
            expect(productContainer?.innerHTML).toContain('Application Error!');
            expect(productContainer?.innerHTML).toContain('Failed to load products.json');
        });
    });

    describe('Filtering', () => {
        it('should filter by a single category correctly', async () => {
            await mainModule.initializeApp();

            // Simulate user checking a box
            mainModule.updateCategoricalFilters('color', 'Red', true);

            const cards = document.querySelectorAll('#product-list-container .card');
            expect(cards.length).toBe(1);
            expect(cards[0].innerHTML).toContain('Product 1');
        });

        it('should render all products again when a filter is removed', async () => {
            await mainModule.initializeApp();

            // Add a filter
            mainModule.updateCategoricalFilters('color', 'Red', true);
            expect(document.querySelectorAll('#product-list-container .card').length).toBe(1);

            // Remove the filter
            mainModule.updateCategoricalFilters('color', 'Red', false);
            expect(document.querySelectorAll('#product-list-container .card').length).toBe(2);
        });

        it('should update facet counts based on the current filter', async () => {
            await mainModule.initializeApp();

            // Apply a filter for "Red" products
            mainModule.updateCategoricalFilters('color', 'Red', true);

            // Now, check the facets for the 'material' category
            const materialFacetContainer = document.getElementById('facet-container-material');

            // The mock 'Red' product has 'Metal' material.
            const metalFacetCheckbox = materialFacetContainer?.querySelector('input[value="Metal"]');
            const metalFacetCount = metalFacetCheckbox?.parentElement?.querySelector('.tag')?.textContent;

            // The mock 'Blue' product has 'Plastic' material.
            const plasticFacetCheckbox = materialFacetContainer?.querySelector('input[value="Plastic"]');

            // With 'Red' selected, only 'Metal' should be an option.
            expect(metalFacetCheckbox).not.toBeNull();
            expect(metalFacetCount).toBe('1');

            // The 'Plastic' facet should not be rendered, or have a count of 0.
            // Depending on the implementation, it might just be gone.
            expect(plasticFacetCheckbox).toBeNull();
        });

        it('should update categorical facet counts correctly when a continuous filter is applied', async () => {
            await mainModule.initializeApp();

            // To isolate the test, clear all filters first by deleting existing keys, then apply the specific one.
            Object.keys(mainModule.currentFilters).forEach(key => {
                delete mainModule.currentFilters[key as keyof Filters];
            });
            mainModule.currentFilters['price'] = [150, 250]; // This range should only include 'Product 2'
            mainModule.applyFilters();

            // Check rendered product cards
            const cards = document.querySelectorAll('#product-list-container .card');
            expect(cards.length).toBe(1);
            expect(cards[0].innerHTML).toContain('Product 2');

            // Check color facets
            const colorFacetContainer = document.getElementById('facet-container-color');
            const redFacetCheckbox = colorFacetContainer?.querySelector('input[value="Red"]');
            const blueFacetCheckbox = colorFacetContainer?.querySelector('input[value="Blue"]');
            const blueFacetCount = blueFacetCheckbox?.parentElement?.querySelector('.tag')?.textContent;

            expect(redFacetCheckbox).toBeNull(); // 'Red' should be filtered out
            expect(blueFacetCheckbox).not.toBeNull();
            expect(blueFacetCount).toBe('1');

            // Check material facets
            const materialFacetContainer = document.getElementById('facet-container-material');
            const metalFacetCheckbox = materialFacetContainer?.querySelector('input[value="Metal"]');
            const plasticFacetCheckbox = materialFacetContainer?.querySelector('input[value="Plastic"]');
            const plasticFacetCount = plasticFacetCheckbox?.parentElement?.querySelector('.tag')?.textContent;

            expect(metalFacetCheckbox).toBeNull(); // 'Metal' should be filtered out
            expect(plasticFacetCheckbox).not.toBeNull();
            expect(plasticFacetCount).toBe('1');
        });
    });
});