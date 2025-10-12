<script lang="ts">
  import type { Product } from '../types/index';

  export let product: Product;
</script>

<div class="column is-one-third">
  <div class="card">
    <div class="card-content">
      <p class="title is-4">{product.name}</p>
      <div class="content">
        <p><strong>Color:</strong> {product.color}</p>
        <p><strong>Material:</strong> {product.material}</p>
        <p><strong>Weight:</strong> {product.weight} kg</p>
        <p class="subtitle is-5 has-text-weight-bold mt-4">{product.price}</p>
      </div>
    </div>
  </div>
</div>