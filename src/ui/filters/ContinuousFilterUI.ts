// src/ui/filters/ContinuousFilterUI.ts
import noUiSlider from 'nouislider';
import type { UIProperty } from '../../types';
import type { FilterUI } from './FilterUI';
import { $productData, $currentFilters, setCurrentFilters, $sliderInstances } from '../../state';

export class ContinuousFilterUI implements FilterUI {
  constructor(private property: UIProperty) {}

  render(parentElement: HTMLElement): void {
    const propId = this.property.id;
    const listItem = document.createElement('li');

    const titleLink = document.createElement('a');
    titleLink.textContent = this.property.title;
    listItem.appendChild(titleLink);

    const sliderWrapper = document.createElement('div');
    sliderWrapper.style.padding = '0.75em';
    listItem.appendChild(sliderWrapper);

    const values = $productData.get().map(item => item[propId]).filter(v => typeof v === 'number') as number[];
    const minVal = Math.floor(Math.min(...values));
    const maxVal = Math.ceil(Math.max(...values));

    const sliderDiv = document.createElement('div');
    sliderDiv.id = `slider-${propId}`;
    sliderWrapper.appendChild(sliderDiv);

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
      const currentFilters = $currentFilters.get();
      setCurrentFilters({
        ...currentFilters,
        [propId]: [parseFloat(values[0] as string), parseFloat(values[1] as string)],
      });
    });

    const sliderInstances = $sliderInstances.get();
    $sliderInstances.set({ ...sliderInstances, [propId]: slider });

    parentElement.appendChild(listItem);
  }
}
