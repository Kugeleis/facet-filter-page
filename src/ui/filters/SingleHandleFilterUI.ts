// src/ui/filters/SingleHandleFilterUI.ts
import noUiSlider from 'nouislider';
import type { UIProperty } from '../../types';
import type { FilterUI } from './FilterUI';
import { $productData, $currentFilters, setCurrentFilters, $sliderInstances } from '../../state';

export class SingleHandleFilterUI implements FilterUI {
  constructor(private property: UIProperty) {}

  render(parentElement: HTMLElement): void {
    const propId = this.property.id;
    const sliderOptions = this.property.sliderOptions;
    const isStepped = this.property.type === 'stepped-continuous-single';
    const listItem = document.createElement('li');

    const titleLink = document.createElement('a');
    titleLink.textContent = this.property.title;
    listItem.appendChild(titleLink);

    const sliderWrapper = document.createElement('div');
    sliderWrapper.style.padding = '0.75em';
    listItem.appendChild(sliderWrapper);

    const sliderDiv = document.createElement('div');
    sliderDiv.id = `slider-${propId}`;
    sliderWrapper.appendChild(sliderDiv);

    let sliderConfig: any;

    if (isStepped) {
      const uniqueValues = [...new Set($productData.get().map(item => item[propId]).filter(v => typeof v === 'number' && v !== null))] as number[];
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
        step: 1,
      };
    } else {
      const values = $productData.get().map(item => item[propId]).filter(v => typeof v === 'number') as number[];
      const minVal = Math.floor(Math.min(...values));
      const maxVal = Math.ceil(Math.max(...values));

      sliderConfig = {
        start: [sliderOptions?.direction === 'less' ? maxVal : minVal],
        range: { 'min': minVal, 'max': maxVal },
        step: 1,
      };
    }

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
      const currentFilters = $currentFilters.get();
      setCurrentFilters({
        ...currentFilters,
        [propId]: newFilter as [number, number],
      });
    });

    const sliderInstances = $sliderInstances.get();
    $sliderInstances.set({ ...sliderInstances, [propId]: slider });

    parentElement.appendChild(listItem);
  }
}
