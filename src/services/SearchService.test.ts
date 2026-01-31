// src/services/SearchService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { SearchService } from './SearchService';

describe('SearchService', () => {
  let searchService: SearchService;
  const mockProducts = [
    { id: 1, name: 'Apple', category: 'Fruit' },
    { id: 2, name: 'Carrot', category: 'Vegetable' },
  ];
  const mockUiConfig = [
    {
      groupName: 'General',
      properties: [
        { id: 'category', title: 'Category', type: 'categorical' }
      ]
    }
  ];

  beforeEach(() => {
    searchService = new SearchService();
  });

  it('should initialize and perform search', () => {
    searchService.init(mockProducts as any, mockUiConfig as any, 'name');

    const results = searchService.search('Apple', {}, mockUiConfig as any, 2);
    expect(results.items.length).toBe(1);
    expect(results.items[0].name).toBe('Apple');
  });

  it('should filter by categorical values', () => {
    searchService.init(mockProducts as any, mockUiConfig as any, 'name');

    const results = searchService.search('', { category: ['Fruit'] }, mockUiConfig as any, 2);
    expect(results.items.length).toBe(1);
    expect(results.items[0].name).toBe('Apple');
  });
});
