<script lang="ts">
  import { searchQuery } from '../state/stores';
</script>

<section class="section">
  <div class="container">
    <div class="level">
      <div class="level-left">
        <div class="level-item">
          <h1 class="title"><a href="/facet-filter-page/">Product Showcase</a></h1>
        </div>
        <div class="level-item">
          <div class="field">
            <div class="control">
              <input
                class="input"
                type="text"
                placeholder="Search products..."
                bind:value={$searchQuery}
              />
            </div>
          </div>
        </div>
      </div>
      <div class="level-right">
        <div class="level-item">
          <a href="/facet-filter-page/about.html">About</a>
        </div>
        <div class="level-item">
          <div id="product-count-container" class="has-text-right">
            <!-- Product count will be handled later -->
          </div>
        </div>
      </div>
    </div>
  </div>
</section>