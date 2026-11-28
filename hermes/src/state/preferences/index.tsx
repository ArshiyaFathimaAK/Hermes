import { createContext, use, useState, type PropsWithChildren } from 'react';

import { formatTemperature, type TemperatureUnit } from '@/utils/format';

interface Preferences {
  temperatureUnit: TemperatureUnit;
  setTemperatureUnit: (unit: TemperatureUnit) => void;
}

const PreferencesContext = createContext<Preferences | null>(null);

export function PreferencesProvider({ children }: PropsWithChildren) {
  const [temperatureUnit, setTemperatureUnit] = useState<TemperatureUnit>('F');
  return (
    <PreferencesContext value={{ temperatureUnit, setTemperatureUnit }}>
      {children}
    </PreferencesContext>
  );
}

export function usePreferences() {
  const preferences = use(PreferencesContext);
  if (!preferences) throw new Error('usePreferences must be used inside PreferencesProvider');
  return preferences;
}

/** Formats a Fahrenheit value in the unit the person chose. */
export function useTemperature() {
  const { temperatureUnit } = usePreferences();
  return (fahrenheit: number) => formatTemperature(fahrenheit, temperatureUnit);
}
