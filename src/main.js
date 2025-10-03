// src/main.js

// --- Imports (Vite handles these from node_modules and src/) ---
import itemsjs from 'itemsjs';
import noUiSlider from 'nouislider';
import 'nouislider/dist/nouislider.css'; // Import slider CSS

// --- CONFIGURATION ---
const uiConfig = [
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
let itemsjsInstance;
let currentFilters = {};
let productData = [];

// --- UI GENERATION & INTEGRATION ---

/**
 * Initializes a dual-thumb noUiSlider and links its events to applyFilters.
 */
function initializeNoUiSlider(propId, minVal, maxVal, parentElement) {
  const sliderDiv = document.createElement('div');
  sliderDiv.id = `slider-${propId}`;
  parentElement.appendChild(sliderDiv);

  // Initialize state to full range, using an array format [min, max]
  currentFilters[propId] = [minVal, maxVal];

  noUiSlider.create(sliderDiv, {
    start: [minVal, maxVal],
    connect: true,
    range: { 'min': minVal, 'max': maxVal },
    step: propId === 'price' ? 100 : 1,
    tooltips: true,
    format: { to: (value) => value.toFixed(propId === 'price' ? 0 : 1), from: (value) => Number(value) }
  });

  sliderDiv.noUiSlider.on('change', (values, handle) => {
    // Update the currentFilters object with the new range as an array
    currentFilters[propId] = [parseFloat(values[0]), parseFloat(values[1])];
    applyFilters();
  });
}

/**
 * Dynamically generates the filter UI based on config.
 */
function generatePropertyFilter(property, parentElement) {
  const propId = property.id;
  const filterDiv = document.createElement('div');
  filterDiv.className = 'p-3 border rounded-md mb-3 bg-gray-50';
  filterDiv.innerHTML = `<h4 class="font-semibold text-sm mb-2 text-gray-700">${property.title}</h4>`;

  if (property.type === "categorical") {
    const facetContainer = document.createElement('div');
    facetContainer.id = `facet-container-${propId}`;
    filterDiv.appendChild(facetContainer);
    // Event delegation for checkboxes
    facetContainer.addEventListener('change', (e) => {
      if (e.target.type === 'checkbox') {
        updateCategoricalFilters(propId, e.target.value, e.target.checked);
      }
    });

  } else if (property.type === "continuous") {
    const values = productData.map(item => item[propId]).filter(v => typeof v === 'number');
    const minVal = Math.floor(Math.min(...values));
    const maxVal = Math.ceil(Math.max(...values));
    initializeNoUiSlider(propId, minVal, maxVal, filterDiv);
  }

  parentElement.appendChild(filterDiv);
}

// --- FILTERING & RENDERING LOGIC ---

function updateCategoricalFilters(propId, value, isChecked) {
  if (!currentFilters[propId]) currentFilters[propId] = [];

  if (isChecked) {
    currentFilters[propId].push(value);
  } else {
    currentFilters[propId] = currentFilters[propId].filter(v => v !== value);
  }

  if (currentFilters[propId].length === 0) delete currentFilters[propId];

  applyFilters();
}

function applyFilters() {
  // 1. Run search with current filters
  const results = itemsjsInstance.search({
    filters: currentFilters,
  });

  // 2. Render results
  renderProductCards(results.data.items);
  renderFacets(results.data.facets);
}

function renderFacets(facets) {
  // Renders the categorical checkboxes and updates counts
  for (const propId in facets) {
    const container = document.getElementById(`facet-container-${propId}`);
    if (!container) continue;

    let html = '';
    facets[propId].values.forEach(facetValue => {
      const isChecked = currentFilters[propId] && currentFilters[propId].includes(facetValue.key);

      // Use Tailwind classes for styling
      html += `
                <label class="flex items-center space-x-2 text-sm">
                    <input type="checkbox" 
                           value="${facetValue.key}" 
                           ${isChecked ? 'checked' : ''}
                           class="rounded text-blue-500 border-gray-300 focus:ring-blue-500">
                    <span>${facetValue.key} (${facetValue.doc_count})</span>
                </label>
            `;
    });
    container.innerHTML = html;
  }
}

function renderProductCards(products) {
  const container = document.getElementById('product-list-container');
  container.innerHTML = '';

  if (products.length === 0) {
    container.innerHTML = '<p class="col-span-3 text-center text-gray-500 py-10">No products match your current filters.</p>';
    return;
  }

  products.forEach(product => {
    // Use Tailwind for card styling
    const card = document.createElement('div');
    card.className = 'product-card bg-white p-6 shadow-md rounded-lg hover:shadow-xl transition-shadow';
    card.innerHTML = `
            <h3 class="text-lg font-semibold text-blue-600">${product.name}</h3>
            <div class="mt-2 text-sm text-gray-600">
                <p><strong>Color:</strong> ${product.color}</p>
                <p><strong>Material:</strong> ${product.material}</p>
                <p><strong>Weight:</strong> ${product.weight_kg} kg</p>
            </div>
            <p class="text-xl font-bold text-green-600 mt-3">$${product.price.toFixed(2)}</p>
        `;
    container.appendChild(card);
  });
}

/**
 * Initializes the entire application asynchronously.
 */
async function initializeApp() {
  const sidebar = document.getElementById('filter-sidebar');
  const productContainer = document.getElementById('product-list-container');

  // 1. Initial UI rendering (skeleton loading recommended here)
  uiConfig.forEach(group => {
    const groupHeader = document.createElement('h3');
    groupHeader.className = 'text-base font-semibold mt-4 mb-2 text-gray-800';
    groupHeader.textContent = group.groupName;
    sidebar.appendChild(groupHeader);
  });

  // 2. Load data asynchronously (Vite ensures data is served)
  try {
    const response = await fetch('/products.json');
    if (!response.ok) throw new Error('Failed to load product data');
    productData = await response.json();
  } catch (error) {
    console.error("Data Loading Error:", error);
    productContainer.innerHTML = '<p class="text-red-500 col-span-3">Error loading products.</p>';
    return;
  }

  // 3. Configure ItemsJS
  const itemsjsConfiguration = {
    searchableFields: ['name', 'color', 'material'],
    // Ensure all properties, including continuous ones, are included in aggregations
    aggregations: uiConfig.flatMap(group => group.properties)
      .reduce((acc, p) => {
        acc[p.id] = { title: p.title, size: 100 };
        if (p.type === 'continuous') {
          // This marks the field for range filtering.
          // The search function will expect a [min, max] array for these filters.
        }
        return acc;
      }, {}),
  };
  itemsjsInstance = itemsjs(productData, itemsjsConfiguration);

  // 4. Generate the dynamic filters (continuous properties need data max/min)
  uiConfig.forEach(group => {
    group.properties.forEach(property => {
      generatePropertyFilter(property, sidebar);
    });
  });

  // 5. Initial filter and render
  applyFilters();
}

document.addEventListener('DOMContentLoaded', initializeApp);