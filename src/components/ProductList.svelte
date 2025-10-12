<script lang="ts">
  import ProductCard from './ProductCard.svelte';
  import type { Product } from '../types/index';

  export let products: Product[] = [];
</script>

<div class="columns is-multiline">
  {#each products as product}
    <ProductCard {product} />
  {/each}
</div>