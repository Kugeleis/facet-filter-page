// src/services/ConfigService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigService } from './ConfigService';

describe('ConfigService', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService();
    (global as any).fetch = vi.fn();
  });

  it('fetchSetup should return setup config', async () => {
    const mockSetup = { dataset: 'test-dataset', title: 'Test Title' };
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSetup),
    });

    const result = await configService.fetchSetup();
    expect(result).toEqual(mockSetup);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('setup.json'));
  });

  it('fetchDataset should return dataset data', async () => {
    (fetch as any).mockImplementation((url: string) => {
      if (url.endsWith('test.json')) return Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 1, name: 'P1' }]) });
      if (url.endsWith('test-config.json')) return Promise.resolve({ ok: true, json: () => Promise.resolve([{ field: 'name', property: 'name' }]) });
      if (url.endsWith('test-ui-config.json')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      return Promise.reject(new Error('Unknown url'));
    });

    const result = await configService.fetchDataset('test');
    expect(result.products).toEqual([{ id: 1, name: 'P1', Aktuelle_Firmware_Version: null, Internet: 'none' }]);
    expect(result.searchFieldName).toBe('name');
  });
});
