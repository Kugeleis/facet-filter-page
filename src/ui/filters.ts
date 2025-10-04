// src/ui/filters.ts
import noUiSlider from 'nouislider';
import type { API as NoUiSliderAPI } from 'nouislider';
import type { UIProperty } from '../types';
import { productData, sliderInstances, switchInstances, currentFilters, setCurrentFilters } from '../state';
import { applyFilters, updateCategoricalFilters } from '../app';

/**
 * Initializes a dual-thumb noUiSlider and links its events to applyFilters.
 */
export function initializeNoUiSlider(propId: string, minVal: number, maxVal: number, parentElement: HTMLElement): void {
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
    setCurrentFilters({
      ...currentFilters,
      [propId]: [parseFloat(values[0] as string), parseFloat(values[1] as string)],
    });
    applyFilters();
  });

  sliderInstances[propId] = slider; // Store the instance
}

/**
 * Initializes a single-thumb noUiSlider for continuous or stepped values.
 * The behavior (less than/greater than) is determined by the property's sliderOptions.
 */
export function initializeSingleHandleSlider(property: UIProperty, parentElement: HTMLElement): void {
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
    const newFilter = sliderOptions?.direction === 'less' ? [-Infinity, value] : [value, Infinity];
    setCurrentFilters({
      ...currentFilters,
      [propId]: newFilter,
    });
    applyFilters();
  });

  sliderInstances[propId] = slider;
}

/**
 * Dynamically generates the filter UI based on config.
 */
export function generatePropertyFilter(property: UIProperty, parentElement: HTMLElement): void {
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
      const newFilters = { ...currentFilters };
      if (switchInput.checked) {
        // When checked, we filter for items where the value is 1
        newFilters[propId] = [1, 1];
      } else {
        // When unchecked, remove the filter
        delete newFilters[propId];
      }
      setCurrentFilters(newFilters);
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