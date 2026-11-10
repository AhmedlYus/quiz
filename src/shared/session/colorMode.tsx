// Light / dark / system preference, remembered in this browser.
import { createContext, useContext, useState, type ReactNode } from 'react';
import { storage } from '../lib/storage';

export type ColorMode = 'system' | 'light' | 'dark';
const KEY = 'qa-color-mode';

const ColorModeContext = createContext<{ mode: ColorMode; setMode: (m: ColorMode) => void }>({
  mode: 'system',
  setMode: () => {},
});

export function ColorModeProvider({ children }: { children: (mode: ColorMode) => ReactNode }) {
  const [mode, setModeState] = useState<ColorMode>(() => storage.get<ColorMode>(KEY, 'system'));
  const setMode = (m: ColorMode) => {
    setModeState(m);
    storage.set(KEY, m);
  };
  return <ColorModeContext.Provider value={{ mode, setMode }}>{children(mode)}</ColorModeContext.Provider>;
}

export const useColorMode = () => useContext(ColorModeContext);
