// src/main.ts

// --- Imports ---
import itemsjs from 'itemsjs';
import type { ItemsJs } from 'itemsjs';
import noUiSlider from 'nouislider';
import type { API as NoUiSliderAPI } from 'nouislider';
import 'nouislider/dist/nouislider.css';

// --- Type Definitions ---
export interface Product extends Record<string, any> {
  // While we allow any property, we can still suggest known ones for better DX
  // when we know the dataset, but for now, a generic record is best.
}

export interface UIProperty {
  id: string; // Changed from keyof Product to be generic
  title: string;
  type: 'categorical' | 'continuous';
}

export interface UIGroup {
  groupName: string;
  properties: UIProperty[];
}

type CategoricalFilter = string[];
type ContinuousFilter = [number, number];
export type Filters = Record<string, CategoricalFilter | ContinuousFilter>;

// --- STATE AND INSTANCES ---
let itemsjsInstance: ItemsJs<Product>;
let currentFilters: Filters = {};
let productData: Product[] = [];
let sliderInstances: Record<string, NoUiSliderAPI> = {}; // To hold slider instances
let cardTemplateMapping: TemplateMapping[] = [];
let uiConfig: UIGroup[] = [];
let noProductsMessage: string = "No products match your current filters."; // Add default

// --- NEW INTERFACES & CONFIG ---
export interface TemplateMapping {
  field: string;
  property: string; // Changed from keyof Product
  prefix?: string;
  suffix?: string;
  format?: (value: any) => string;
}

// --- UI GENERATION & INTEGRATION ---

/**
 * Initializes a dual-thumb noUiSlider and links its events to applyFilters.
 */
function initializeNoUiSlider(propId: string, minVal: number, maxVal: number, parentElement: HTMLElement): void {
  const sliderDiv = document.createElement('div');
  sliderDiv.id = `slider-${propId}`;
  parentElement.appendChild(sliderDiv);

  const slider = noUiSlider.create(sliderDiv, {
    start: [minVal, maxVal],
    connect: true,
    range: { 'min': minVal, 'max': maxVal },
    step: propId === 'price' ? 100 : 1,
    tooltips: true,
    format: {
      to: (value: number): string => value.toFixed(propId === 'price' ? 0 : 1),
      from: (value: string): number => Number(value)
    }
  });

  slider.on('change', (values: (string | number)[]) => {
    currentFilters[propId] = [parseFloat(values[0] as string), parseFloat(values[1] as string)];
    applyFilters();
  });

  sliderInstances[propId] = slider; // Store the instance
}

/**
 * Dynamically generates the filter UI based on config.
 */
function generatePropertyFilter(property: UIProperty, parentElement: HTMLElement): void {
  const propId = property.id;
  const listItem = document.createElement('li');
  const titleLink = document.createElement('a');
  titleLink.textContent = property.title;
  listItem.appendChild(titleLink);

  if (property.type === "categorical") {
    const facetContainer = document.createElement('ul');
    facetContainer.id = `facet-container-${propId}`;
    listItem.appendChild(facetContainer);

    facetContainer.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.type === 'checkbox') {
        updateCategoricalFilters(propId, target.value, target.checked);
      }
    });

  } else if (property.type === "continuous") {
    const sliderWrapper = document.createElement('div');
    sliderWrapper.style.padding = '0.75em';
    const values = productData.map(item => item[propId]).filter(v => typeof v === 'number') as number[];
    const minVal = Math.floor(Math.min(...values));
    const maxVal = Math.ceil(Math.max(...values));
    initializeNoUiSlider(propId, minVal, maxVal, sliderWrapper);
    listItem.appendChild(sliderWrapper);
  }

  parentElement.appendChild(listItem);
}

// --- FILTERING & RENDERING LOGIC ---

function updateCategoricalFilters(propId: string, value: string, isChecked: boolean): void {
  let current = currentFilters[propId] as CategoricalFilter | undefined;
  if (!current) {
    current = [];
  }

  if (isChecked) {
    current.push(value);
  } else {
    current = current.filter(v => v !== value);
  }

  if (current.length === 0) {
    delete currentFilters[propId];
  } else {
    currentFilters[propId] = current;
  }

  applyFilters();
}

function resetFilters(): void {
  currentFilters = {};

  // Reset all the noUiSlider instances
  for (const propId in sliderInstances) {
    sliderInstances[propId].reset();
  }

  // Re-apply filters, which will now be empty
  applyFilters();
}

function applyFilters(): void {
  const categoricalFilters: Record<string, string[]> = {};
  const continuousFilters: Record<string, [number, number]> = {};

  for (const key in currentFilters) {
    const isContinuous = uiConfig.some(group => group.properties.some(p => p.id === key && p.type === 'continuous'));
    if (isContinuous) {
      continuousFilters[key] = currentFilters[key] as [number, number];
    } else {
      categoricalFilters[key] = currentFilters[key] as string[];
    }
  }

  // Get initial results from itemsjs, including aggregations
  let results = itemsjsInstance.search({
    per_page: productData.length,
    filters: categoricalFilters,
  });

  // This will hold the final aggregations we want to render
  let finalAggregations = results.data.aggregations;

  // If continuous filters are active, we must manually filter items AND recalculate aggregations
  if (Object.keys(continuousFilters).length > 0) {
    results.data.items = results.data.items.filter(item => {
      return Object.entries(continuousFilters).every(([key, range]) => {
        const value = item[key] as number;
        return value >= range[0] && value <= range[1];
      });
    });

    // --- Manual Aggregation Recalculation ---
    const recalculateAggregations = (items: Product[]) => {
      const newAggregations: Record<string, { buckets: { key: string; doc_count: number }[] }> = {};
      const categoricalProps = uiConfig.flatMap(g => g.properties).filter(p => p.type === 'categorical');

      categoricalProps.forEach(prop => {
        const counts: Record<string, number> = {};
        items.forEach(item => {
          const value = item[prop.id] as string;
          if (value) {
            counts[value] = (counts[value] || 0) + 1;
          }
        });
        newAggregations[prop.id] = {
          buckets: Object.entries(counts).map(([key, count]) => ({ key, doc_count: count }))
        };
      });
      return newAggregations;
    };

    // Overwrite the aggregations with our recalculated ones
    finalAggregations = recalculateAggregations(results.data.items);
  }

  console.log("Filtered items:", results.data.items);
  console.log("Final Aggregations data:", JSON.stringify(finalAggregations, null, 2));

  renderProductCards(results.data.items, cardTemplateMapping);

  // --- Render facets using the final aggregations ---
  if (finalAggregations) {
    Object.keys(finalAggregations).forEach(propId => {
      const aggregation = finalAggregations[propId];
      if (aggregation && aggregation.buckets) {
        renderFacets(aggregation.buckets, propId);
      }
    });
  }
}

function renderFacets(buckets: any[], propId: string): void {
  const container = document.getElementById(`facet-container-${propId}`);
  if (!container) return;

  let html = '';
  buckets.forEach(facetValue => {
    // Only render the facet if it has a count greater than 0
    if (facetValue.doc_count > 0) {
      const isChecked = currentFilters[propId] && (currentFilters[propId] as CategoricalFilter).includes(facetValue.key);
      html += `
        <li>
          <label class="checkbox">
            <input type="checkbox"
                   value="${facetValue.key}"
                   ${isChecked ? 'checked' : ''}>
            ${facetValue.key}
            <span class="tag is-light is-rounded ml-2">${facetValue.doc_count}</span>
          </label>
        </li>
      `;
    }
  });
  container.innerHTML = html;
}

function renderProductCards(products: Product[], templateMapping: TemplateMapping[]): void {
  const container = document.getElementById('product-list-container');
  const template = document.getElementById('product-card-template') as HTMLTemplateElement;
  if (!container || !template) return;

  container.innerHTML = '';

  if (products.length === 0) {
    container.innerHTML = `<div class="column is-full"><p class="has-text-centered">${noProductsMessage}</p></div>`;
    return;
  }

  products.forEach(product => {
    const cardClone = template.content.cloneNode(true) as DocumentFragment;

    templateMapping.forEach(mapping => {
      const element = cardClone.querySelector(`[data-template-field="${mapping.field}"]`) as HTMLElement;
      if (element) {
        const rawValue = product[mapping.property];
        let displayValue = rawValue;

        if (mapping.format) {
          displayValue = mapping.format(rawValue);
        }

        element.textContent = `${mapping.prefix || ''}${displayValue}${mapping.suffix || ''}`;
      }
    });

    container.appendChild(cardClone);
  });
}

/**
 * Initializes the entire application asynchronously.
 */
async function initializeApp(): Promise<void> {
  const filterGroupsContainer = document.getElementById('filter-groups-container');
  const productContainer = document.getElementById('product-list-container');
  const mainTitleElement = document.getElementById('main-title');
  const filtersLabelElement = document.getElementById('filters-label');
  const appVersionElement = document.getElementById('app-version');
  const resetButton = document.getElementById('reset-filters-button'); // Get the reset button


  if (appVersionElement) {
    appVersionElement.textContent = __APP_VERSION__;
  }

  if (!filterGroupsContainer || !productContainer || !mainTitleElement || !filtersLabelElement || !resetButton) {
    console.error("A required element was not found in the DOM.");
    return;
  }

  resetButton.addEventListener('click', resetFilters);

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
    mainTitleElement.textContent = title || 'Product Showcase';
    filtersLabelElement.textContent = ui?.filtersLabel || 'Filters';
    noProductsMessage = ui?.noProductsMessage || 'No products match your current filters.';

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
    productData = await productsResponse.json();
    uiConfig = await uiConfigResponse.json();
    const rawTemplateConfig = await templateResponse.json();

    // Parse format strings into functions
    cardTemplateMapping = rawTemplateConfig.map((mapping: any) => {
      if (mapping.format && typeof mapping.format === 'string') {
        const match = mapping.format.match(/toFixed\((\d+)\)/);
        if (match) {
          const precision = parseInt(match[1], 10);
          // Return a new object with the format property as a function
          return { ...mapping, format: (value: number) => value.toFixed(precision) };
        }
      }
      return mapping;
    });

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
    searchableFields: Object.keys(productData[0] || {}),
    aggregations: uiConfig.flatMap(group => group.properties)
      .reduce((acc, p) => {
        acc[p.id] = { title: p.title, size: 100, type: 'terms' };
        return acc;
      }, {} as any),
  };
  itemsjsInstance = itemsjs(productData, itemsjsConfiguration);

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

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

// Export for testing
export {
  initializeApp,
  applyFilters,
  updateCategoricalFilters,
  initializeNoUiSlider,
  productData,
  itemsjsInstance,
  currentFilters,
  uiConfig,
  renderProductCards,
  renderFacets,
  resetFilters
};