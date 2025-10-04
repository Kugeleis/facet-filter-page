// src/utils/dataCleaner.ts
import type { Product } from '../types';

/**
 * Corrects inconsistencies in product data, such as swapped firmware versions and internet types.
 * @param data - The raw product data array.
 * @returns The cleaned product data array.
 */
export function cleanData(data: Product[]): Product[] {
  const internetKeywords = ["WAN", "DSL", "Fiber", "Cable", "LTE", "5G"];

  return data.map(p => {
      const product = { ...p };
      let version: number | null = null;
      let internet: string | null = null;

      const candidates = [
          product.Aktuelle_Firmware_Version,
          product.Internet,
          product.Datum_letztes_Firmware_Update,
          ...(Array.isArray(product.null) ? product.null : [])
      ];

      for (const candidate of candidates) {
          if (typeof candidate === 'number' || (typeof candidate === 'string' && !isNaN(parseFloat(candidate)))) {
              const num = parseFloat(candidate as string);
              if (num > 0 && num < 100) { // Assuming firmware versions are between 0 and 100
                  version = version ?? num;
              }
          } else if (typeof candidate === 'string' && internetKeywords.some(kw => candidate.includes(kw))) {
              internet = internet ?? candidate;
          }
      }

      product.Aktuelle_Firmware_Version = version;
      product.Internet = internet || 'none';

      return product;
  });
}