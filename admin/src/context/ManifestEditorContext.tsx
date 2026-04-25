import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { WidgetInstance, TabItem, OnboardingStep, ThemeConfig } from '@/types/sdui';

interface EditedScreens {
  home?: { widgets: WidgetInstance[] };
  tabs?: { tabs: TabItem[] };
  onboarding?: { onboarding: OnboardingStep[] };
  theme?: { theme: ThemeConfig };
}

interface ManifestEditorContextValue {
  editedScreens: EditedScreens;
  setHomeWidgets: (widgets: WidgetInstance[]) => void;
  setTabs: (tabs: TabItem[]) => void;
  setOnboarding: (steps: OnboardingStep[]) => void;
  setTheme: (theme: ThemeConfig) => void;
  isDirty: boolean;
  markClean: () => void;
  getManifestContent: () => { screens: EditedScreens };
}

const ManifestEditorContext = createContext<ManifestEditorContextValue | null>(null);

export function ManifestEditorProvider({ children }: { children: ReactNode }) {
  const [editedScreens, setEditedScreens] = useState<EditedScreens>({});
  const [isDirty, setIsDirty] = useState(false);

  const setHomeWidgets = useCallback((widgets: WidgetInstance[]) => {
    setEditedScreens((prev) => ({ ...prev, home: { widgets } }));
    setIsDirty(true);
  }, []);

  const setTabs = useCallback((tabs: TabItem[]) => {
    setEditedScreens((prev) => ({ ...prev, tabs: { tabs } }));
    setIsDirty(true);
  }, []);

  const setOnboarding = useCallback((onboarding: OnboardingStep[]) => {
    setEditedScreens((prev) => ({ ...prev, onboarding: { onboarding } }));
    setIsDirty(true);
  }, []);

  const setTheme = useCallback((theme: ThemeConfig) => {
    setEditedScreens((prev) => ({ ...prev, theme: { theme } }));
    setIsDirty(true);
  }, []);

  const markClean = useCallback(() => setIsDirty(false), []);

  const getManifestContent = useCallback(
    () => ({ screens: editedScreens }),
    [editedScreens],
  );

  return (
    <ManifestEditorContext.Provider
      value={{ editedScreens, setHomeWidgets, setTabs, setOnboarding, setTheme, isDirty, markClean, getManifestContent }}
    >
      {children}
    </ManifestEditorContext.Provider>
  );
}

export function useManifestEditor() {
  const ctx = useContext(ManifestEditorContext);
  if (!ctx) throw new Error('useManifestEditor must be used inside ManifestEditorProvider');
  return ctx;
}
