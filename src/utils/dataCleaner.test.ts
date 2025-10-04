// src/utils/dataCleaner.test.ts
import { describe, it, expect } from 'vitest';
import { cleanData } from './dataCleaner';
import type { Product } from '../types';

describe('Data Cleaning', () => {
  it('should correctly parse and clean product data', () => {
    const rawData: Product[] = [
      {
        "name": "Test Product 1",
        "Aktuelle_Firmware_Version": "6.8",
        "Internet": "DSL",
        "Datum_letztes_Firmware_Update": null,
        "null": []
      },
      {
        "name": "Test Product 2",
        "Aktuelle_Firmware_Version": "Fiber", // Swapped value
        "Internet": 7.1, // Swapped value
        "Datum_letztes_Firmware_Update": "2023-01-01",
        "null": []
      },
      {
        "name": "Test Product 3",
        "Aktuelle_Firmware_Version": null,
        "Internet": null,
        "Datum_letztes_Firmware_Update": null,
        "null": ["LTE", 7.5] // Values in the 'null' array
      }
    ];

    const cleaned = cleanData(rawData);

    // Test Case 1: Standard data
    expect(cleaned[0].Aktuelle_Firmware_Version).toBe(6.8);
    expect(cleaned[0].Internet).toBe('DSL');

    // Test Case 2: Swapped data
    expect(cleaned[1].Aktuelle_Firmware_Version).toBe(7.1);
    expect(cleaned[1].Internet).toBe('Fiber');

    // Test Case 3: Data in 'null' array
    expect(cleaned[2].Aktuelle_Firmware_Version).toBe(7.5);
    expect(cleaned[2].Internet).toBe('LTE');
  });
});