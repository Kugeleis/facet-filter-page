<script lang="ts">
  import type { Product, TemplateMapping } from '../types';

  export let product: Product;
  export let templateMapping: TemplateMapping[];

  let displayFields: { label: string, value: any }[] = [];

  $: {
    const getDisplayValue = (fieldConfig: any, productData: Product) => {
      const value = productData[fieldConfig.property];
      if (fieldConfig.format && typeof fieldConfig.format === 'function') {
        return fieldConfig.format(value);
      }
      return value;
    };

    displayFields = templateMapping.map(field => {
      if (field.field !== 'name') { // 'name' is handled by the title
        return {
          label: field.label,
          value: getDisplayValue(field, product)
        };
      }
      return null;
    }).filter(f => f !== null);
  }
</script>

<div class="column is-one-third">
  <div class="card">
    <div class="card-content">
      <p class="title is-4">{product.name}</p>
      <div class="content">
        {#each displayFields as field}
          <p><strong>{field.label}:</strong> {field.value}</p>
        {/each}
      </div>
    </div>
  </div>
</div>