// src/ui/products.ts
import type { Product, TemplateMapping } from '../types';
import { showProductModal } from './modal';
import { noProductsMessage } from '../state';

export function renderProductCards(products: Product[], templateMapping: TemplateMapping[]): void {
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