// Types
import { TConfig, TMessages } from '@/models/utils';

export const LANGUAGES: Array<TConfig> = [
  { id: 1, name: 'en' },
  { id: 2, name: 'ru' },
];

// Тут главный размер, относительно которого все по ширине,
// кроме того что должно быть адекватным росту по высоте
const GROUND = 4000;
const size = (size: number): number => {
  return size * GROUND;
};

export const DESIGN: TConfig = {
  V: '1.0.0',
  BREAKPOINTS: {
    desktop: 1025,
  },
  COLORS: {
    white: 0xffffff,
    black: 0x000000,
    blue: 0x88ccff,
    purple: 0xa48ed8,
    purpleDark: 0x8267bf,
    purpleDarken: 0x413460,
  },
  GROUND_SIZE: size(1),
  CAMERA: {
    fov: 80,
    fog: 0xa48ed8,
  },
};

export const OBJECTS: TConfig = {
  WORLD: {
    name: 'world',
  },
  ATMOSPHERE: {
    name: 'atmosphere',
    SAND: {
      radius: size(1),
      positionY: 0,
    },
  },
  TANKS: {
    name: 'tanks',
    size: 5,
    quantity: 10,
  },
};

export const MESSAGES: TMessages = {
  en: {
    name: 'DuneThree',
  },
  ru: {
    name: 'ДюнаThree',
  },
};

