import { z } from 'zod';

export const projectStatusSchema = z.enum(['live', 'building', 'coming-soon']);

export const coordinateSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100)
});

export const projectSchema = z.object({
  codename: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  url: z.string().url().nullable(),
  signalType: z.string().min(1),
  signalDescription: z.string().min(1),
  signalAsset: z.string().min(1),
  signalStillAsset: z.string().min(1),
  registryLabel: z.string().min(1),
  status: projectStatusSchema,
  coordinates: coordinateSchema,
  accent: z.string().min(1)
});

export const atlasConfigSchema = z.object({
  identity: z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    github: z.string().url()
  }),
  experience: z.object({
    assets: z.object({
      bootSequence: z.string().min(1),
      bootStill: z.string().min(1),
      deepField: z.string().min(1),
      signalTexture: z.string().min(1)
    })
  }),
  projects: z.array(projectSchema).min(1),
  thanks: z.array(z.string().min(1)).default([])
});

export type AtlasConfig = z.infer<typeof atlasConfigSchema>;
export type AtlasProject = z.infer<typeof projectSchema>;
export type AtlasProjectStatus = z.infer<typeof projectStatusSchema>;
