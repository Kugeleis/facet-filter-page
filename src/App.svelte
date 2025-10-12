<script lang="ts">
  import { onMount, derived } from 'svelte';
  import Header from './components/Header.svelte';
  import ProductList from './components/ProductList.svelte';
  import FilterSidebar from './components/FilterSidebar.svelte';
  import Footer from './components/Footer.svelte';
  import { productData, searchQuery, currentFilters, uiConfig, itemsjsInstance } from './state/stores';
  import { initializeItemsjs, applyFiltersAndSearch } from './lib/itemsjs';
  import { cleanData } from './utils/dataCleaner';

  const derivedProducts = derived(
    [searchQuery, currentFilters, itemsjsInstance],
    () => {
      const result = applyFiltersAndSearch();
      return result.items;
    }
  );

  onMount(async () => {
    try {
      const setupResponse = await fetch(`${import.meta.env.BASE_URL}setup.json`);
      const setupConfig = await setupResponse.json();
      const { dataset } = setupConfig;

      const [productsResponse, uiConfigResponse] = await Promise.all([
        fetch(`${import.meta.env.BASE_URL}${dataset}.json`),
        fetch(`${import.meta.env.BASE_URL}${dataset}-ui-config.json`),
      ]);

      const rawProductData = await productsResponse.json();
      productData.set(cleanData(rawProductData));
      uiConfig.set(await uiConfigResponse.json());

      initializeItemsjs();
    } catch (error) {
      console.error("Failed to initialize the application:", error);
    }
  });
</script>

<Header />

<section class="section">
  <div class="container">
    <div class="columns">
      <div class="column is-one-quarter">
        <FilterSidebar />
      </div>
      <div class="column">
        <ProductList products={$derivedProducts} />
      </div>
    </div>
  </div>
</section>

<Footer />

<div id="product-modal" class="modal">
  <div class="modal-background"></div>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">Product Details</p>
      <button class="delete" aria-label="close"></button>
    </header>
    <section id="product-modal-content" class="modal-card-body">
      <!-- Product details will be injected here -->
    </section>
  </div>
</div>