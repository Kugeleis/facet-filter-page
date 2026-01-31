// src/ui/components/ModalComponent.ts
import { $selectedProduct, setSelectedProduct } from '../../state';
import type { Product } from '../../types';

export class ModalComponent {
  private modal: HTMLElement | null;
  private modalContent: HTMLElement | null;
  private modalTitle: HTMLElement | null;

  constructor() {
    this.modal = document.getElementById('product-modal');
    this.modalContent = document.getElementById('product-modal-content');
    this.modalTitle = this.modal?.querySelector('.modal-card-title') as HTMLElement;

    const background = this.modal?.querySelector('.modal-background');
    const closeButton = this.modal?.querySelector('.delete');

    background?.addEventListener('click', () => setSelectedProduct(null));
    closeButton?.addEventListener('click', () => setSelectedProduct(null));

    // Subscribe to selected product changes
    $selectedProduct.subscribe(product => {
      if (product) {
        this.show(product);
      } else {
        this.hide();
      }
    });
  }

  show(product: Product): void {
    if (!this.modal || !this.modalContent || !this.modalTitle) return;

    const productName = product.name || product.title || 'Product Details';
    this.modalTitle.textContent = productName;

    let contentHtml = '<div class="content"><ul>';
    for (const key in product) {
      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const value = product[key];

      if (value !== null && value !== undefined && value !== '') {
          contentHtml += `<li><strong>${formattedKey}:</strong> ${value}</li>`;
      }
    }
    contentHtml += '</ul></div>';

    this.modalContent.innerHTML = contentHtml;
    this.modal.classList.add('is-active');
  }

  hide(): void {
    this.modal?.classList.remove('is-active');
  }
}
