// src/services/ConfigService.ts
import { cleanData } from '../utils/dataCleaner';
import type { Product, UIGroup, TemplateMapping } from '../types';

export interface SetupConfig {
  dataset: string;
  title?: string;
  theme?: {
    primary?: string;
    link?: string;
  };
  ui?: {
    filtersLabel?: string;
    noProductsMessage?: string;
  };
}

export interface DatasetData {
  products: Product[];
  uiConfig: UIGroup[];
  templateConfig: TemplateMapping[];
  searchFieldName: string;
}

export class ConfigService {
  async fetchSetup(): Promise<SetupConfig> {
    const response = await fetch(`${import.meta.env.BASE_URL}setup.json`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}. Failed to load setup.json.`);
    }
    return await response.json();
  }

  async fetchDataset(dataset: string): Promise<DatasetData> {
    const [productsResponse, templateResponse, uiConfigResponse] = await Promise.all([
      fetch(`${import.meta.env.BASE_URL}${dataset}.json`),
      fetch(`${import.meta.env.BASE_URL}${dataset}-config.json`),
      fetch(`${import.meta.env.BASE_URL}${dataset}-ui-config.json`),
    ]);

    if (!productsResponse.ok) throw new Error(`Failed to load ${dataset}.json`);
    if (!templateResponse.ok) throw new Error(`Failed to load ${dataset}-config.json`);
    if (!uiConfigResponse.ok) throw new Error(`Failed to load ${dataset}-ui-config.json`);

    const rawProductData = await productsResponse.json();
    const uiConfig = await uiConfigResponse.json();
    const rawTemplateConfig = await templateResponse.json();

    let searchFieldName = 'name';
    const nameMapping = rawTemplateConfig.find((m: { field: string }) => m.field === 'name');
    if (nameMapping) {
      searchFieldName = nameMapping.property;
    }

    const templateConfig = rawTemplateConfig.map((mapping: any) => {
      if (mapping.format && typeof mapping.format === 'string') {
        const match = mapping.format.match(/toFixed\((\d+)\)/);
        if (match) {
          const precision = parseInt(match[1], 10);
          return { ...mapping, format: (value: number) => value.toFixed(precision) };
        }
      }
      return mapping;
    });

    return {
      products: cleanData(rawProductData),
      uiConfig,
      templateConfig,
      searchFieldName
    };
  }
}
