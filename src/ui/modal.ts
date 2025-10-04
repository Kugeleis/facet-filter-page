// src/ui/modal.ts
import type { Product } from '../types';

export function showProductModal(product: Product): void {
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

export function hideProductModal(): void {
  const modal = document.getElementById('product-modal');
  if (modal) {
    modal.classList.remove('is-active');
  }
}