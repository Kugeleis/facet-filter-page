// src/types/index.ts

// --- Type Definitions ---
export interface Product extends Record<string, any> {
  // While we allow any property, we can still suggest known ones for better DX
  // when we know the dataset, but for now, a generic record is best.
}

export interface UIProperty {
  id: string;
  title: string;
  type: 'categorical' | 'continuous' | 'stepped-continuous-single' | 'boolean' | 'continuous-single';
  sliderOptions?: {
    direction: 'less' | 'greater';
  };
}

export interface UIGroup {
  groupName: string;
  properties: UIProperty[];
}

export type CategoricalFilter = string[];
export type ContinuousFilter = [number, number];
export type Filters = Record<string, CategoricalFilter | ContinuousFilter>;

export interface TemplateMapping {
  field: string;
  property: string; // Changed from keyof Product
  prefix?: string;
  suffix?: string;
  format?: (value: any) => string;
}