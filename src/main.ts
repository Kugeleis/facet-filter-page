// src/main.ts

// --- Imports ---
import itemsjs from 'itemsjs';
import type { ItemsJs } from 'itemsjs';
import noUiSlider from 'nouislider';
import type { API as NoUiSliderAPI } from 'nouislider';
import 'nouislider/dist/nouislider.css';
import 'bulma-switch-control/css/main.css';


// --- Type Definitions ---
export interface Product extends Record<string, any> {
  // While we allow any property, we can still suggest known ones for better DX
  // when we know the dataset, but for now, a generic record is best.
}

export interface UIProperty {
  id: string;
  title: string;
  type: 'categorical' | 'continuous' | 'stepped-continuous-single' | 'boolean' | 'continuous-single';
  sliderOptions?: {
    direction: 'less' | 'greater';
  };
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
let switchInstances: Record<string, HTMLInputElement> = {}; // To hold switch instances
let cardTemplateMapping: TemplateMapping[] = [];
let uiConfig: UIGroup[] = [];
let noProductsMessage: string = "No products match your current filters."; // Add default
let allAggregations: any; // Will hold the aggregations for the whole dataset

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
function cleanData(data: Product[]): Product[] {
    const internetKeywords = ["WAN", "DSL", "Fiber", "Cable", "LTE", "5G"];

    return data.map(p => {
        const product = { ...p };
        let version: number | null = null;
        let internet: string | null = null;

        const candidates = [
            product.Aktuelle_Firmware_Version,
            product.Internet,
            product.Datum_letztes_Firmware_Update,
            ...(Array.isArray(product.null) ? product.null : [])
        ];

        for (const candidate of candidates) {
            if (typeof candidate === 'number' || (typeof candidate === 'string' && !isNaN(parseFloat(candidate)))) {
                const num = parseFloat(candidate as string);
                if (num > 0 && num < 100) { // Assuming firmware versions are between 0 and 100
                    version = version ?? num;
                }
            } else if (typeof candidate === 'string' && internetKeywords.some(kw => candidate.includes(kw))) {
                internet = internet ?? candidate;
            }
        }

        product.Aktuelle_Firmware_Version = version;
        product.Internet = internet || 'none';

        return product;
    });
}

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
 * Initializes a single-thumb noUiSlider for continuous or stepped values.
 * The behavior (less than/greater than) is determined by the property's sliderOptions.
 */
function initializeSingleHandleSlider(property: UIProperty, parentElement: HTMLElement): void {
  const propId = property.id;
  const sliderOptions = property.sliderOptions;
  const isStepped = property.type === 'stepped-continuous-single';

  const sliderDiv = document.createElement('div');
  sliderDiv.id = `slider-${propId}`;
  parentElement.appendChild(sliderDiv);

  let sliderConfig: any;

  if (isStepped) {
    const uniqueValues = [...new Set(productData.map(item => item[propId]).filter(v => typeof v === 'number' && v !== null))] as number[];
    uniqueValues.sort((a, b) => a - b);

    if (uniqueValues.length < 2) {
      console.warn(`Not enough data points to create a stepped slider for ${propId}.`);
      return;
    }

    const rangeMapping: { [key: string]: number } = {};
    uniqueValues.forEach((value, index) => {
      if (index === 0) rangeMapping['min'] = value;
      else if (index === uniqueValues.length - 1) rangeMapping['max'] = value;
      else {
        const percentage = (index / (uniqueValues.length - 1)) * 100;
        rangeMapping[`${percentage.toFixed(2)}%`] = value;
      }
    });

    sliderConfig = {
      start: [sliderOptions?.direction === 'less' ? uniqueValues[uniqueValues.length - 1] : uniqueValues[0]],
      range: rangeMapping,
      snap: true,
      step: 1, // Nominal, snap is what matters
    };
  } else { // 'continuous-single'
    const values = productData.map(item => item[propId]).filter(v => typeof v === 'number') as number[];
    const minVal = Math.floor(Math.min(...values));
    const maxVal = Math.ceil(Math.max(...values));

    sliderConfig = {
      start: [sliderOptions?.direction === 'less' ? maxVal : minVal],
      range: { 'min': minVal, 'max': maxVal },
      step: 1,
    };
  }

  // Common configuration. For 'greater', fill handle-to-right. For 'less', fill left-to-handle.
  sliderConfig.connect = sliderOptions?.direction === 'less' ? 'lower' : 'upper';
  sliderConfig.tooltips = true;
  sliderConfig.format = {
    to: (value: number): string => value.toFixed(isStepped ? 2 : 1),
    from: (value: string): number => Number(value)
  };

  const slider = noUiSlider.create(sliderDiv, sliderConfig);

  slider.on('change', (values: (string | number)[]) => {
    const value = parseFloat(values[0] as string);
    if (sliderOptions?.direction === 'less') {
      currentFilters[propId] = [-Infinity, value];
    } else { // 'greater' or undefined defaults to greater
      currentFilters[propId] = [value, Infinity];
    }
    applyFilters();
  });

  sliderInstances[propId] = slider;
}

/**
 * Dynamically generates the filter UI based on config.
 */
function generatePropertyFilter(property: UIProperty, parentElement: HTMLElement): void {
  const propId = property.id;
  const listItem = document.createElement('li');

  if (property.type === "boolean") {
    // For boolean, we create a flex container to align title and switch
    const switchContainer = document.createElement('div');
    switchContainer.className = 'is-flex is-justify-content-space-between is-align-items-center';

    const title = document.createElement('span');
    title.textContent = property.title;
    switchContainer.appendChild(title);

    const switchInput = document.createElement('input');
    switchInput.id = `switch-${propId}`;
    switchInput.type = 'checkbox';
    switchInput.className = 'switch is-rounded';
    switchInput.checked = false; // Start unchecked

    const switchLabel = document.createElement('label');
    switchLabel.htmlFor = switchInput.id;
    switchContainer.appendChild(switchInput);
    switchContainer.appendChild(switchLabel);

    // Store the instance for reset functionality
    switchInstances[propId] = switchInput;

    switchInput.addEventListener('change', () => {
      if (switchInput.checked) {
        // When checked, we filter for items where the value is 1
        currentFilters[propId] = [1, 1];
      } else {
        // When unchecked, remove the filter
        delete currentFilters[propId];
      }
      applyFilters();
    });

    listItem.appendChild(switchContainer);
  } else {
    // For all other types, keep the existing structure
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
    } else if (property.type === "stepped-continuous-single" || property.type === "continuous-single") {
      const sliderWrapper = document.createElement('div');
      sliderWrapper.style.padding = '0.75em';
      initializeSingleHandleSlider(property, sliderWrapper);
      listItem.appendChild(sliderWrapper);
    }
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

  // Reset all switch instances
  for (const propId in switchInstances) {
    switchInstances[propId].checked = false;
  }

  // Re-apply filters, which will now be empty
  applyFilters();
}

function applyFilters(): void {
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
            <span class="tag is-outlined is-rounded ml-2">${facetValue.doc_count}</span>
          </label>
        </li>
      `;
    }
  });
  container.innerHTML = html;
}

function showProductModal(product: Product): void {
  const modal = document.getElementById('product-modal');
  const modalContent = document.getElementById('product-modal-content');
  const modalTitle = modal?.querySelector('.modal-card-title');

  if (!modal || !modalContent || !modalTitle) return;

  const productName = product.name || product.title || 'Product Details';
  modalTitle.textContent = productName;

  let contentHtml = '<div class="content"><ul>';
  for (const key in product) {
    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const value = product[key];

    if (value !== null && value !== undefined && value !== '') {
        contentHtml += `<li><strong>${formattedKey}:</strong> ${value}</li>`;
    }
  }
  contentHtml += '</ul></div>';

  modalContent.innerHTML = contentHtml;
  modal.classList.add('is-active');
}

function hideProductModal(): void {
  const modal = document.getElementById('product-modal');
  if (modal) {
    modal.classList.remove('is-active');
  }
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
    const cardElement = cardClone.querySelector('.card');

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

    if (cardElement) {
      cardElement.addEventListener('click', () => {
        showProductModal(product);
      });
    }

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

  const modal = document.getElementById('product-modal');
  const modalBackground = modal?.querySelector('.modal-background');
  const modalCloseButton = modal?.querySelector('.delete');

  if (!filterGroupsContainer || !productContainer || !mainTitleElement || !filtersLabelElement || !resetButton || !modal || !modalBackground || !modalCloseButton) {
    console.error("A required element was not found in the DOM.");
    return;
  }

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
    const rawProductData = await productsResponse.json();

    // Data Cleansing Step: Corrects inconsistencies where firmware versions and internet types are swapped.
    productData = cleanData(rawProductData);

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

  // --- Store initial aggregations ---
  const initialSearch = itemsjsInstance.search({ per_page: productData.length });
  allAggregations = initialSearch.data.aggregations;
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

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

// Export for testing
export {
  initializeApp,
  applyFilters,
  updateCategoricalFilters,
  initializeNoUiSlider,
  initializeSingleHandleSlider,
  productData,
  itemsjsInstance,
  currentFilters,
  uiConfig,
  renderProductCards,
  renderFacets,
  resetFilters
};