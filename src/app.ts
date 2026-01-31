// src/app.ts
import { ConfigService } from './services/ConfigService';
import { SearchService } from './services/SearchService';
import { ProductListComponent } from './ui/components/ProductListComponent';
import { FilterSidebarComponent } from './ui/components/FilterSidebarComponent';
import { SearchBoxComponent } from './ui/components/SearchBoxComponent';
import { ResetButtonComponent } from './ui/components/ResetButtonComponent';
import { ModalComponent } from './ui/components/ModalComponent';
import {
  $searchQuery, $currentFilters, $productData, $uiConfig,
  setProductData, setUiConfig, setCardTemplateMapping, setNoProductsMessage,
  setAllAggregations, setItemsjsInstance, setFilteredItems
} from './state';

const configService = new ConfigService();
const searchService = new SearchService();

export async function initializeApp(): Promise<void> {
  // 1. Initialize Components (they will attach to DOM elements and subscribe to stores)
  new ProductListComponent();
  new FilterSidebarComponent();
  new SearchBoxComponent();
  new ResetButtonComponent();
  new ModalComponent();

  const mainTitleElement = document.getElementById('main-title');
  const filtersLabelElement = document.getElementById('filters-label');
  const appVersionElement = document.getElementById('app-version');

  if (appVersionElement) {
    appVersionElement.textContent = __APP_VERSION__;
  }

  try {
    // 2. Load Setup Configuration
    const setupConfig = await configService.fetchSetup();
    const { dataset, title, theme, ui } = setupConfig;

    if (!dataset) {
      throw new Error("`dataset` key not found in setup.json.");
    }

    // Apply UI configurations
    document.title = title || 'Vite Facet Filter App';
    const mainTitleLink = mainTitleElement?.querySelector('a');
    if (mainTitleLink) {
      mainTitleLink.textContent = title || 'Product Showcase';
    }
    if (filtersLabelElement) {
      filtersLabelElement.textContent = ui?.filtersLabel || 'Filters';
    }
    setNoProductsMessage(ui?.noProductsMessage || 'No products match your current filters.');

    // Apply Theme colors
    if (theme) {
      const style = document.createElement('style');
      style.textContent = `
        :root {
          --primary-color: ${theme.primary || '#00d1b2'};
          --link-color: ${theme.link || '#3273dc'};
        }
      `;
      document.head.appendChild(style);
    }

    // 3. Fetch Dataset-specific Files
    const datasetData = await configService.fetchDataset(dataset);

    // Update state with dataset data
    setProductData(datasetData.products);
    setUiConfig(datasetData.uiConfig);
    setCardTemplateMapping(datasetData.templateConfig);

    // 4. Initialize Search Service
    const instance = searchService.init(datasetData.products, datasetData.uiConfig, datasetData.searchFieldName);
    setItemsjsInstance(instance);

    // Store initial aggregations
    const initialAggregations = searchService.getInitialAggregations(datasetData.products.length);
    setAllAggregations(initialAggregations);

    // 5. Setup Reactive Filtering logic
    const performSearch = () => {
      const query = $searchQuery.get();
      const filters = $currentFilters.get();
      const uiConfig = $uiConfig.get();
      const productsCount = $productData.get().length;

      const results = searchService.search(query, filters, uiConfig, productsCount);
      setFilteredItems(results.items);
    };

    // Listen for state changes to re-run search
    $searchQuery.listen(performSearch);
    $currentFilters.listen(performSearch);
    // Also listen to uiConfig or productData if they might change dynamically (less likely here but good for SOLID)
    $productData.listen(performSearch);

    // Initial search execution
    performSearch();

  } catch (error: any) {
    console.error("Fatal Error:", error.message);
    const productContainer = document.getElementById('product-list-container');
    if (productContainer) {
      productContainer.innerHTML = `<div role="alert">
        <strong>Application Error!</strong>
        <span>${error.message}</span>
      </div>`;
    }
  }
}
