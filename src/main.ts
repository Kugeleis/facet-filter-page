// src/main.ts

// --- Imports ---
import itemsjs from 'itemsjs';
import type { ItemsJs } from 'itemsjs';
import noUiSlider from 'nouislider';
import type { API as NoUiSliderAPI } from 'nouislider';
import 'nouislider/dist/nouislider.css';

// --- Type Definitions ---
export interface Product {
  id: number;
  name: string;
  color: string;
  material: string;
  price: number;
  weight_kg: number;
}

export interface UIProperty {
  id: keyof Product;
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

// --- CONFIGURATION ---
const uiConfig: UIGroup[] = [
  {
    groupName: "Vehicle Details",
    properties: [
      { id: "color", title: "Color", type: "categorical" },
      { id: "material", title: "Material", type: "categorical" },
    ]
  },
  {
    groupName: "Performance & Cost",
    properties: [
      { id: "weight_kg", title: "Weight (kg)", type: "continuous" },
      { id: "price", title: "Price ($)", type: "continuous" }
    ]
  }
];

// --- STATE AND INSTANCES ---
let itemsjsInstance: ItemsJs<Product>;
let currentFilters: Filters = {};
let productData: Product[] = [];
let cardTemplateMapping: TemplateMapping[] = [];

// --- NEW INTERFACES & CONFIG ---
export interface TemplateMapping {
  field: string;
  property: keyof Product;
  prefix?: string;
  suffix?: string;
  format?: (value: any) => string;
}

// --- UI GENERATION & INTEGRATION ---

/**
 * Initializes a dual-thumb noUiSlider and links its events to applyFilters.
 */
function initializeNoUiSlider(propId: keyof Product, minVal: number, maxVal: number, parentElement: HTMLElement): void {
  const sliderDiv = document.createElement('div');
  sliderDiv.id = `slider-${propId}`;
  parentElement.appendChild(sliderDiv);

  currentFilters[propId] = [minVal, maxVal];

  noUiSlider.create(sliderDiv, {
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

  (sliderDiv as any).noUiSlider.on('change', (values: (string | number)[]) => {
    currentFilters[propId] = [parseFloat(values[0] as string), parseFloat(values[1] as string)];
    applyFilters();
  });
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

function updateCategoricalFilters(propId: keyof Product, value: string, isChecked: boolean): void {
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

  let results = itemsjsInstance.search({
    filters: categoricalFilters,
  });

  if (Object.keys(continuousFilters).length > 0) {
    results.data.items = results.data.items.filter(item => {
      return Object.entries(continuousFilters).every(([key, range]) => {
        const value = item[key as keyof Product] as number;
        return value >= range[0] && value <= range[1];
      });
    });
  }

  console.log("Filtered items:", results.data.items);

  const facets = results.data.aggregations;
  console.log("Facets data:", JSON.stringify(facets, null, 2));

  renderProductCards(results.data.items, cardTemplateMapping);

  if (facets && facets['color']) {
    renderFacets(facets['color'].buckets, 'color');
  }
  if (facets && facets['material']) {
    renderFacets(facets['material'].buckets, 'material');
  }
}

function renderFacets(buckets: any[], propId: keyof Product): void {
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
    container.innerHTML = '<div class="column is-full"><p class="has-text-centered">No products match your current filters.</p></div>';
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
  if (!filterGroupsContainer || !productContainer) return;

  try {
    const [productsResponse, templateResponse] = await Promise.all([
      fetch('/products.json'),
      fetch('/products-config.json')
    ]);

    if (!productsResponse.ok) {
      throw new Error(`HTTP error! status: ${productsResponse.status}. Failed to load products.json. Did you run 'npm run data-build'?`);
    }
    if (!templateResponse.ok) {
      throw new Error(`HTTP error! status: ${templateResponse.status}. Failed to load template-config.json.`);
    }

    productData = await productsResponse.json();
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
    searchableFields: ['name', 'color', 'material'],
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
  renderFacets
};