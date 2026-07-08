import type { AtlasConfig } from '../config/atlas.schema';

export const fallbackAtlasConfig: AtlasConfig = {
  identity: {
    name: 'Scra Atlas',
    description: 'Deep field observatory for project signals, experiments, and quiet future coordinates.',
    github: 'https://github.com/Lscrapider'
  },
  experience: {
    assets: {
      bootSequence: '/assets/generated/boot-calibration-loop.webp',
      bootStill: '/assets/generated/boot-calibration-still.png',
      deepField: '/assets/generated/deep-field-observatory-2k.png',
      signalTexture: '/assets/generated/signal-acquisition-texture.png'
    }
  },
  projects: [
    {
      codename: 'MINT-01',
      title: '理财投资AI知识库',
      summary: '一个整理理财投资相关内容的 AI 知识库入口。',
      url: 'http://152.136.174.90/finance/',
      signalType: 'Knowledge Signal',
      signalDescription: 'A compact finance-learning entry point indexed as a stable signal source.',
      signalAsset: '/assets/generated/mint-signal-loop.webp',
      signalStillAsset: '/assets/generated/mint-signal-still.png',
      registryLabel: 'Finance AI knowledge base',
      status: 'live',
      coordinates: { x: 63, y: 48 },
      accent: 'oklch(0.82 0.12 172)'
    },
    {
      codename: 'DARK NODE',
      title: '开发中项目',
      summary: '还在构建中，暂时只保留一个轨道位置。',
      url: null,
      signalType: 'Dormant Coordinate',
      signalDescription: 'A reserved atlas position for a project still being assembled.',
      signalAsset: '/assets/generated/dark-node-loop.webp',
      signalStillAsset: '/assets/generated/dark-node-still.png',
      registryLabel: 'In-progress project slot',
      status: 'coming-soon',
      coordinates: { x: 76, y: 62 },
      accent: 'oklch(0.74 0.12 42)'
    },
    {
      codename: 'FUTURE SIGNAL',
      title: '期待未来坐标',
      summary: '保留给下一个具体项目的位置。现在先作为一片未命名星云，等待新的信号进入星图。',
      url: null,
      signalType: 'Reserved Nebula',
      signalDescription: 'A future coordinate held open inside the atlas.',
      signalAsset: '/assets/generated/dark-node-loop.webp',
      signalStillAsset: '/assets/generated/dark-node-still.png',
      registryLabel: 'Future project placeholder',
      status: 'coming-soon',
      coordinates: { x: 48, y: 66 },
      accent: 'oklch(0.78 0.12 286)'
    }
  ],
  thanks: ['Codex', 'Claude']
};
