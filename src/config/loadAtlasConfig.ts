import { atlasConfigSchema, type AtlasConfig } from './atlas.schema';
import { fallbackAtlasConfig } from '../data/fallbackAtlasConfig';
import { withBasePath } from './assetPath';

export type AtlasConfigResult = {
  config: AtlasConfig;
  source: 'remote' | 'fallback';
  error?: string;
};

export async function loadAtlasConfig(): Promise<AtlasConfigResult> {
  try {
    const response = await fetch(withBasePath('atlas.config.json'), {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Config request failed with ${response.status}`);
    }

    const raw = await response.json();
    const parsed = atlasConfigSchema.safeParse(raw);

    if (!parsed.success) {
      throw new Error(parsed.error.issues.map((issue) => issue.message).join('; '));
    }

    return {
      config: parsed.data,
      source: 'remote'
    };
  } catch (error) {
    return {
      config: fallbackAtlasConfig,
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown config error'
    };
  }
}
