// src/ui/components/ProductListComponent.ts
import { $filteredItems, $cardTemplateMapping, $noProductsMessage, $productData, setSelectedProduct } from '../../state';
import type { Product } from '../../types';

export class ProductListComponent {
  private container: HTMLElement | null;
  private template: HTMLTemplateElement | null;
  private countContainer: HTMLElement | null;

  constructor() {
    this.container = document.getElementById('product-list-container');
    this.template = document.getElementById('product-card-template') as HTMLTemplateElement;
    this.countContainer = document.getElementById('product-count-container');

    // Subscribe to filtered items to re-render
    $filteredItems.subscribe(items => this.render(items));
  }

  render(products: Product[]): void {
    if (!this.container || !this.template) return;

    this.container.innerHTML = '';

    if (products.length === 0) {
      this.container.innerHTML = `<div class="column is-full"><p class="has-text-centered">${$noProductsMessage.get()}</p></div>`;
      this.updateCount(0);
      return;
    }

    const templateMapping = $cardTemplateMapping.get();

    products.forEach(product => {
      const cardClone = this.template!.content.cloneNode(true) as DocumentFragment;
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
          setSelectedProduct(product);
        });
      }

      this.container!.appendChild(cardClone);
    });

    this.updateCount(products.length);
  }

  private updateCount(matched: number): void {
    if (!this.countContainer) return;
    const total = $productData.get().length;
    this.countContainer.innerHTML = `
      <p class="is-size-5">
        Showing <span class="has-text-weight-bold has-text-primary">${matched}</span>
        of <span class="has-text-weight-bold">${total}</span> products
      </p>
    `;
  }
}
