import ProductCard from './components/ProductCard.svelte';

const mockProduct = {
  id: 1,
  name: 'Test Product',
  color: 'Red',
  material: 'Metal',
  price: 123.45,
  weight_kg: 5,
};

const mockTemplateMapping = [
  { field: 'name', property: 'name', label: 'Name' },
  { field: 'color', property: 'color', label: 'Color' },
  { field: 'price', property: 'price', label: 'Price', format: (value) => `$${value.toFixed(2)}` },
];

new ProductCard({
  target: document.getElementById('test-container'),
  props: {
    product: mockProduct,
    templateMapping: mockTemplateMapping,
  },
});