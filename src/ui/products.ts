// src/ui/products.ts
import type { Product, TemplateMapping } from '../types';
import { showProductModal } from './modal';
import { noProductsMessage, cardTemplateMapping } from '../state';
import ProductCard from '../components/ProductCard.svelte';

export function renderProductCards(products: Product[]): void {
  const container = document.getElementById('product-list-container');
  if (!container) return;

  container.innerHTML = '';

  if (products.length === 0) {
    container.innerHTML = `<div class="column is-full"><p class="has-text-centered">${noProductsMessage}</p></div>`;
    return;
  }

  products.forEach(product => {
    const cardContainer = document.createElement('div');
    container.appendChild(cardContainer);

    const card = new ProductCard({
      target: cardContainer,
      props: {
        product,
        templateMapping,
      },
    });

    // Attach the click listener to the container, since the Svelte component is now in charge of the DOM
    cardContainer.addEventListener('click', () => {
      showProductModal(product);
    });
  });
}