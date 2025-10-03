import { describe, it, expect } from 'vitest';
import itemsjs from 'itemsjs';

// Sample data for testing
const sampleProductData = [
  { id: 1, name: 'Laptop', color: 'Silver', material: 'Aluminum', price: 1200, weight_kg: 1.8 },
  { id: 2, name: 'Mouse', color: 'Black', material: 'Plastic', price: 25, weight_kg: 0.1 },
  { id: 3, name: 'Keyboard', color: 'Black', material: 'Plastic', price: 75, weight_kg: 0.5 },
  { id: 4, name: 'Monitor', color: 'Black', material: 'Plastic', price: 300, weight_kg: 5.0 },
  { id: 5, name: 'Desk Chair', color: 'Black', material: 'Mesh', price: 150, weight_kg: 15.0 },
  { id: 6, name: 'Desk', color: 'Brown', material: 'Wood', price: 250, weight_kg: 25.0 },
];

// Configuration similar to the one in main.js
const itemsjsConfiguration = {
  aggregations: {
    color: { title: 'Color', size: 10 },
    material: { title: 'Material', size: 10 },
  }
};

describe('itemsjs filtering', () => {
  it('should return only black items when filtered by color: Black', () => {
    const itemsjsInstance = itemsjs(sampleProductData, itemsjsConfiguration);
    const results = itemsjsInstance.search({
      filters: {
        color: ['Black']
      }
    });
    expect(results.data.items).toHaveLength(4);
    results.data.items.forEach(item => {
      expect(item.color).toBe('Black');
    });
  });

  it('should return only plastic items when filtered by material: Plastic', () => {
    const itemsjsInstance = itemsjs(sampleProductData, itemsjsConfiguration);
    const results = itemsjsInstance.search({
      filters: {
        material: ['Plastic']
      }
    });
    expect(results.data.items).toHaveLength(3);
    results.data.items.forEach(item => {
      expect(item.material).toBe('Plastic');
    });
  });

  it('should return an empty array when no items match the filter', () => {
    const itemsjsInstance = itemsjs(sampleProductData, itemsjsConfiguration);
    const results = itemsjsInstance.search({
      filters: {
        color: ['Red']
      }
    });
    expect(results.data.items).toHaveLength(0);
  });
});