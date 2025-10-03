import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';

// --- Import types from the main module ---
import type { Product, Filters } from './main';

// --- Mocks ---

const mockProductData: Product[] = [
  { id: 1, name: 'Product 1', color: 'Red', material: 'Metal', price: 100, weight_kg: 10 },
  { id: 2, name: 'Product 2', color: 'Blue', material: 'Plastic', price: 200, weight_kg: 20 },
];

const mockSearch = vi.fn((query?: { filters?: Filters }) => {
    let filteredItems = [...mockProductData];
    const filters = query?.filters || {};
    const activeFilterKeys = Object.keys(filters).filter(key => {
        const filterValue = filters[key as keyof Filters];
        return Array.isArray(filterValue) && filterValue.length > 0;
    });

    if (activeFilterKeys.length > 0) {
        filteredItems = mockProductData.filter(p =>
            activeFilterKeys.every(key => {
                const filterValue = filters[key as keyof Filters];
                if ((key === 'color' || key === 'material') && Array.isArray(filterValue)) {
                    return filterValue.includes(p[key as 'color' | 'material']);
                }
                if ((key === 'price' || key === 'weight_kg') && Array.isArray(filterValue)) {
                    const productValue = p[key as 'price' | 'weight_kg'];
                    return productValue >= filterValue[0] && productValue <= filterValue[1];
                }
                return true;
            })
        );
    }

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
                <div id="filter-sidebar">
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
        (fetch as Mock).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([...mockProductData]),
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
            expect(fetch).toHaveBeenCalledWith('/products.json');
            expect(productContainer?.querySelectorAll('.card').length).toBe(2);
            expect(productContainer?.innerHTML).toContain('Product 1');
            expect(productContainer?.innerHTML).toContain('Product 2');
        });

        it('should handle fetch error gracefully', async () => {
            (fetch as Mock).mockRejectedValue(new Error('Network failure'));

            await mainModule.initializeApp();

            const productContainer = document.getElementById('product-list-container');
            expect(productContainer?.innerHTML).toContain('Application Error!');
            expect(productContainer?.innerHTML).toContain('Network failure');
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
    });
});