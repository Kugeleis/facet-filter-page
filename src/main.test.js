import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --- Mocks ---

const mockProductData = [
  { id: 1, name: 'Product 1', color: 'Red', material: 'Metal', price: 100, weight_kg: 10 },
  { id: 2, name: 'Product 2', color: 'Blue', material: 'Plastic', price: 200, weight_kg: 20 },
];

const mockSearch = vi.fn((query) => {
    let filteredItems = mockProductData;
    const filters = query.filters || {};
    const activeFilterKeys = Object.keys(filters).filter(key => {
        const filterValue = filters[key];
        return Array.isArray(filterValue) && filterValue.length > 0;
    });

    if (activeFilterKeys.length > 0) {
        filteredItems = mockProductData.filter(p =>
            activeFilterKeys.every(key => {
                const filterValue = filters[key];
                if (key === 'color' || key === 'material') {
                    return filterValue.includes(p[key]);
                }
                if (key === 'price' || key === 'weight_kg') {
                    return p[key] >= filterValue[0] && p[key] <= filterValue[1];
                }
                return true;
            })
        );
    }

    const facets = {
        color: { buckets: [] },
        material: { buckets: [] }
    };

    const colorCounts = {};
    const materialCounts = {};

    mockProductData.forEach(p => {
        colorCounts[p.color] = (colorCounts[p.color] || 0) + 1;
        materialCounts[p.material] = (materialCounts[p.material] || 0) + 1;
    });

    for (const color in colorCounts) {
        facets.color.buckets.push({ key: color, doc_count: colorCounts[color] });
    }

    for (const material in materialCounts) {
        facets.material.buckets.push({ key: material, doc_count: materialCounts[material] });
    }

    return {
      data: {
        items: filteredItems,
        aggregations: facets
      }
    };
});

vi.mock('itemsjs', () => ({
  default: vi.fn(() => ({
    search: mockSearch,
    aggregation: (query) => {
        const facetName = query.name;
        const counts = {};
        mockProductData.forEach(p => {
            counts[p[facetName]] = (counts[p[facetName]] || 0) + 1;
        });

        const buckets = [];
        for (const key in counts) {
            buckets.push({ key: key, doc_count: counts[key] });
        }

        return { data: { buckets: buckets } };
    }
  }))
}));

global.fetch = vi.fn();

vi.mock('nouislider', () => ({
  default: {
    // The key fix: `create` doesn't return the slider instance.
    // It attaches it to the DOM element it was called on.
    create: vi.fn((element, options) => {
      element.noUiSlider = {
        on: vi.fn(),
        // Mock other methods if needed
      };
    }),
  }
}));

// --- Test Suites ---

describe('Application Logic', () => {
    let mainModule;

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

        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([...mockProductData]),
        });

        // Use a unique query param to force re-import and get a fresh module
        mainModule = await import('./main.js?t=' + Date.now());
    });

    afterEach(() => {
      // Clean up spies
      vi.restoreAllMocks();
    });

    describe('Initialization', () => {
        it('should fetch data and render initial products', async () => {
            await mainModule.initializeApp();

            const productContainer = document.getElementById('product-list-container');
            expect(fetch).toHaveBeenCalledWith('/products.json');
            expect(productContainer.querySelectorAll('.card').length).toBe(2);
            expect(productContainer.innerHTML).toContain('Product 1');
            expect(productContainer.innerHTML).toContain('Product 2');
        });

        it('should handle fetch error gracefully', async () => {
            fetch.mockRejectedValue(new Error('Network failure'));

            await mainModule.initializeApp();

            const productContainer = document.getElementById('product-list-container');
            expect(productContainer.innerHTML).toContain('Application Error!');
            expect(productContainer.innerHTML).toContain('Network failure');
        });
    });

    describe('Filtering', () => {
        it('should filter by a single category correctly', async () => {
            await mainModule.initializeApp();

            mainModule.updateCategoricalFilters('color', 'Red', true);
            mainModule.applyFilters();

            const cards = document.querySelectorAll('.card');
            expect(cards.length).toBe(1);
            expect(cards[0].innerHTML).toContain('Product 1');
        });

        it('should render all products again when a filter is removed', async () => {
            await mainModule.initializeApp();

            mainModule.updateCategoricalFilters('color', 'Red', true);
            mainModule.applyFilters();
            expect(document.querySelectorAll('.card').length).toBe(1);

            mainModule.updateCategoricalFilters('color', 'Red', false);
            mainModule.applyFilters();
            expect(document.querySelectorAll('.card').length).toBe(2);
        });
    });
});