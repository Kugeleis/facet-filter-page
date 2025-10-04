// src/app.ts
import itemsjs from 'itemsjs';
import {
  itemsjsInstance,
  currentFilters,
  searchQuery,
  productData,
  sliderInstances,
  switchInstances,
  cardTemplateMapping,
  uiConfig,
  allAggregations,
  setItemsjsInstance,
  setCurrentFilters,
  setSearchQuery,
  setProductData,
  setCardTemplateMapping,
  setUiConfig,
  setNoProductsMessage,
  setAllAggregations,
} from './state';
import { cleanData } from './utils/dataCleaner';
import { hideProductModal } from './ui/modal';
import { renderProductCards } from './ui/products';
import { renderFacets } from './ui/facets';
import { generatePropertyFilter } from './ui/filters';
import type { CategoricalFilter } from './types';

export function updateCategoricalFilters(propId: string, value: string, isChecked: boolean): void {
  const newFilters = { ...currentFilters };
  let current = newFilters[propId] as CategoricalFilter | undefined;
  if (!current) {
    current = [];
  }

  if (isChecked) {
    current.push(value);
  } else {
    current = current.filter(v => v !== value);
  }

  if (current.length === 0) {
    delete newFilters[propId];
  } else {
    newFilters[propId] = current;
  }

  setCurrentFilters(newFilters);
  applyFilters();
}

export function resetFilters(): void {
  setCurrentFilters({});
  setSearchQuery('');

  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  if (searchInput) {
    searchInput.value = '';
  }

  // Reset all the noUiSlider instances
  for (const propId in sliderInstances) {
    sliderInstances[propId].reset();
  }

  // Reset all switch instances
  for (const propId in switchInstances) {
    switchInstances[propId].checked = false;
  }

  // Re-apply filters, which will now be empty
  applyFilters();
}

export function applyFilters(): void {
  const categoricalFilters: Record<string, string[]> = {};
  const continuousFilters: Record<string, [number, number]> = {};

  // Separate filters into categorical and continuous based on UI config
  for (const key in currentFilters) {
    const property = uiConfig.flatMap(g => g.properties).find(p => p.id === key);
    if (property && (property.type === 'continuous' || property.type === 'stepped-continuous-single' || property.type === 'boolean' || property.type === 'continuous-single')) {
      continuousFilters[key] = currentFilters[key] as [number, number];
    } else {
      categoricalFilters[key] = currentFilters[key] as string[];
    }
  }

  // Get initial results from itemsjs, including aggregations
  let results = itemsjsInstance.search({
    query: searchQuery,
    per_page: productData.length,
    filters: categoricalFilters,
  });

  // If continuous filters are active, we must manually filter the results
  if (Object.keys(continuousFilters).length > 0) {
    results.data.items = results.data.items.filter(item => {
      return Object.entries(continuousFilters).every(([key, range]) => {
        const value = item[key] as number;
        return value >= range[0] && value <= range[1];
      });
    });
  }

  console.log("Filtered items:", results.data.items);

  renderProductCards(results.data.items, cardTemplateMapping);

  const countContainer = document.getElementById('product-count-container');
  if (countContainer) {
    const total = productData.length;
    const matched = results.data.items.length;
    countContainer.innerHTML = `
      <p class="is-size-5">
        Showing <span class="has-text-weight-bold has-text-primary">${matched}</span>
        of <span class="has-text-weight-bold">${total}</span> products
      </p>
    `;
  }

  // --- Render facets using the aggregations from the full dataset ---
  if (allAggregations) {
    Object.keys(allAggregations).forEach(propId => {
      const aggregation = allAggregations[propId];
      // We only want to render facets for categorical properties
      const property = uiConfig.flatMap(g => g.properties).find(p => p.id === propId);
      if (aggregation && aggregation.buckets && property && property.type === 'categorical') {
        renderFacets(aggregation.buckets, propId);
      }
    });
  }
}

export async function initializeApp(): Promise<void> {
  let searchFieldName = 'name'; // Default search field
  const filterGroupsContainer = document.getElementById('filter-groups-container');
  const productContainer = document.getElementById('product-list-container');
  const mainTitleElement = document.getElementById('main-title');
  const filtersLabelElement = document.getElementById('filters-label');
  const appVersionElement = document.getElementById('app-version');
  const resetButton = document.getElementById('reset-filters-button');
  const searchInput = document.getElementById('search-input') as HTMLInputElement;


  if (appVersionElement) {
    appVersionElement.textContent = __APP_VERSION__;
  }

  const modal = document.getElementById('product-modal');
  const modalBackground = modal?.querySelector('.modal-background');
  const modalCloseButton = modal?.querySelector('.delete');

  if (!filterGroupsContainer || !productContainer || !mainTitleElement || !filtersLabelElement || !resetButton || !modal || !modalBackground || !modalCloseButton || !searchInput) {
    console.error("A required element was not found in the DOM.");
    return;
  }

  searchInput.addEventListener('input', (e) => {
    setSearchQuery((e.target as HTMLInputElement).value);
    applyFilters();
  });
  resetButton.addEventListener('click', resetFilters);
  modalBackground.addEventListener('click', hideProductModal);
  modalCloseButton.addEventListener('click', hideProductModal);

  try {
    // --- 1. Fetch Setup Configuration ---
    const setupResponse = await fetch(`${import.meta.env.BASE_URL}setup.json`);
    if (!setupResponse.ok) {
      throw new Error(`HTTP error! status: ${setupResponse.status}. Failed to load setup.json.`);
    }
    const setupConfig = await setupResponse.json();
    const { dataset, title, theme, ui } = setupConfig;

    if (!dataset) {
      throw new Error("`dataset` key not found in setup.json.");
    }

    // --- Apply UI configurations ---
    document.title = title || 'Vite Facet Filter App';
    const mainTitleLink = mainTitleElement?.querySelector('a');
    if (mainTitleLink) {
      mainTitleLink.textContent = title || 'Product Showcase';
    }
    filtersLabelElement.textContent = ui?.filtersLabel || 'Filters';
    setNoProductsMessage(ui?.noProductsMessage || 'No products match your current filters.');

    // --- Apply Theme ---
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

    // --- 2. Fetch Dataset-specific Files ---
    const [productsResponse, templateResponse, uiConfigResponse] = await Promise.all([
      fetch(`${import.meta.env.BASE_URL}${dataset}.json`),
      fetch(`${import.meta.env.BASE_URL}${dataset}-config.json`),
      fetch(`${import.meta.env.BASE_URL}${dataset}-ui-config.json`),
    ]);

    // --- 3. Validate Responses ---
    if (!productsResponse.ok) {
      throw new Error(`HTTP error! status: ${productsResponse.status}. Failed to load ${dataset}.json. Did you run the data generation script?`);
    }
    if (!templateResponse.ok) {
      throw new Error(`HTTP error! status: ${templateResponse.status}. Failed to load ${dataset}-config.json.`);
    }
    if (!uiConfigResponse.ok) {
      throw new Error(`HTTP error! status: ${uiConfigResponse.status}. Failed to load ${dataset}-ui-config.json.`);
    }

    // --- 4. Process Data ---
    const rawProductData = await productsResponse.json();

    // Data Cleansing Step: Corrects inconsistencies where firmware versions and internet types are swapped.
    setProductData(cleanData(rawProductData));

    setUiConfig(await uiConfigResponse.json());
    const rawTemplateConfig = await templateResponse.json();

    // Determine the searchable field from the template config
    const nameMapping = rawTemplateConfig.find((m: { field:string }) => m.field === 'name');
    if (nameMapping) {
      searchFieldName = nameMapping.property;
    }

    // Parse format strings into functions
    setCardTemplateMapping(rawTemplateConfig.map((mapping: any) => {
      if (mapping.format && typeof mapping.format === 'string') {
        const match = mapping.format.match(/toFixed\((\d+)\)/);
        if (match) {
          const precision = parseInt(match[1], 10);
          // Return a new object with the format property as a function
          return { ...mapping, format: (value: number) => value.toFixed(precision) };
        }
      }
      return mapping;
    }));

    console.log("Unfiltered (all) items:", productData);
  } catch (error: any) {
    console.error("Fatal Error:", error.message);
    productContainer.innerHTML = `<div role="alert">
      <strong>Application Error!</strong>
      <span>${error.message}</span>
    </div>`;
    return;
  }

  const itemsjsConfiguration = {
    searchableFields: [searchFieldName],
    aggregations: uiConfig.flatMap(group => group.properties)
      .reduce((acc, p) => {
        acc[p.id] = { title: p.title, size: 100, type: 'terms' };
        return acc;
      }, {} as any),
  };
  setItemsjsInstance(itemsjs(productData, itemsjsConfiguration));

  // --- Store initial aggregations ---
  const initialSearch = itemsjsInstance.search({ per_page: productData.length });
  setAllAggregations(initialSearch.data.aggregations);
  console.log("Stored all aggregations:", allAggregations);


  uiConfig.forEach(group => {
    const groupLabel = document.createElement('p');
    groupLabel.className = 'menu-label';
    groupLabel.textContent = group.groupName;
    filterGroupsContainer.appendChild(groupLabel);

    const menuList = document.createElement('ul');
    menuList.className = 'menu-list';
    filterGroupsContainer.appendChild(menuList);

    group.properties.forEach(property => {
      generatePropertyFilter(property, menuList);
    });
  });

  applyFilters();
}