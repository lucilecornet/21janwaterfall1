'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  CompanySettings,
  ShareClass,
  Shareholder,
  DEFAULT_COMPANY_SETTINGS,
  WaterfallResult,
  Currency,
} from '@/types';
import { calculateWaterfall } from '@/lib/waterfall';
import { generateId } from '@/lib/format';

export interface WaterfallState {
  settings: CompanySettings;
  classes: ShareClass[];
  shareholders: Shareholder[];
  selectedEv: number;
  showAdvanced: boolean;
  showPerShareholder: boolean;
}

const DEFAULT_COMMON_CLASS: ShareClass = {
  id: 'common',
  name: 'Common',
  isCommon: true,
  preferenceType: 'non-participating',
  preferenceMultiple: 0,
  seniorityGroup: 999,
};

const INITIAL_STATE: WaterfallState = {
  settings: DEFAULT_COMPANY_SETTINGS,
  classes: [DEFAULT_COMMON_CLASS],
  shareholders: [],
  selectedEv: 50_000_000,
  showAdvanced: false,
  showPerShareholder: false,
};

export function useWaterfallState() {
  const [state, setState] = useState<WaterfallState>(INITIAL_STATE);

  // Settings actions
  const updateSettings = useCallback(
    (updates: Partial<CompanySettings>) => {
      setState((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...updates },
      }));
    },
    []
  );

  const setCurrency = useCallback((currency: Currency) => {
    updateSettings({ currency });
  }, [updateSettings]);

  const setCompanyName = useCallback((name: string) => {
    updateSettings({ name });
  }, [updateSettings]);

  // Class actions
  const addClass = useCallback((name: string) => {
    setState((prev) => {
      // Determine seniority (latest round is most senior = lowest number)
      const preferredClasses = prev.classes.filter((c) => !c.isCommon);
      const seniorityGroup = preferredClasses.length; // New class is most senior (0, 1, 2...)

      const newClass: ShareClass = {
        id: generateId(),
        name,
        isCommon: false,
        preferenceType: 'non-participating',
        preferenceMultiple: 1.0,
        seniorityGroup,
      };

      return {
        ...prev,
        classes: [...prev.classes, newClass],
      };
    });
  }, []);

  const updateClass = useCallback(
    (classId: string, updates: Partial<ShareClass>) => {
      setState((prev) => ({
        ...prev,
        classes: prev.classes.map((cls) =>
          cls.id === classId ? { ...cls, ...updates } : cls
        ),
      }));
    },
    []
  );

  const removeClass = useCallback((classId: string) => {
    setState((prev) => {
      // Don't allow removing common class
      if (classId === 'common') return prev;

      // Remove any shareholders in this class first
      const newShareholders = prev.shareholders.filter(
        (s) => s.classId !== classId
      );

      return {
        ...prev,
        classes: prev.classes.filter((c) => c.id !== classId),
        shareholders: newShareholders,
      };
    });
  }, []);

  // Shareholder actions
  const addShareholder = useCallback(
    (name: string, classIdOrName: string, shares: number, amountInvested: number) => {
      setState((prev) => {
        let newClasses = prev.classes;
        let targetClassId = classIdOrName;

        // Check if this is a temp class ID (created when adding a new class + shareholder together)
        if (classIdOrName.startsWith('temp_')) {
          // Extract the class name from temp_series_a -> Series A
          const className = classIdOrName
            .replace('temp_', '')
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          // Look for the most recently created class with a matching name
          const existingClass = prev.classes.find(
            (c) => c.name.toLowerCase() === className.toLowerCase()
          );

          if (existingClass) {
            targetClassId = existingClass.id;
          } else {
            // Create a new class with proper name
            const preferredClasses = prev.classes.filter((c) => !c.isCommon);
            const newClassId = generateId();
            const newClass: ShareClass = {
              id: newClassId,
              name: className,
              isCommon: false,
              preferenceType: 'non-participating',
              preferenceMultiple: 1.0,
              seniorityGroup: preferredClasses.length,
            };
            newClasses = [...prev.classes, newClass];
            targetClassId = newClassId;
          }
        } else if (!prev.classes.find((c) => c.id === classIdOrName)) {
          // Class ID doesn't exist, create it
          const preferredClasses = prev.classes.filter((c) => !c.isCommon);
          const newClass: ShareClass = {
            id: classIdOrName,
            name: classIdOrName,
            isCommon: false,
            preferenceType: 'non-participating',
            preferenceMultiple: 1.0,
            seniorityGroup: preferredClasses.length,
          };
          newClasses = [...prev.classes, newClass];
        }

        const newShareholder: Shareholder = {
          id: generateId(),
          name,
          classId: targetClassId,
          shares,
          amountInvested,
        };

        return {
          ...prev,
          classes: newClasses,
          shareholders: [...prev.shareholders, newShareholder],
        };
      });
    },
    []
  );

  const updateShareholder = useCallback(
    (shareholderId: string, updates: Partial<Shareholder>) => {
      setState((prev) => ({
        ...prev,
        shareholders: prev.shareholders.map((sh) =>
          sh.id === shareholderId ? { ...sh, ...updates } : sh
        ),
      }));
    },
    []
  );

  const removeShareholder = useCallback((shareholderId: string) => {
    setState((prev) => ({
      ...prev,
      shareholders: prev.shareholders.filter((s) => s.id !== shareholderId),
    }));
  }, []);

  // UI state actions
  const setSelectedEv = useCallback((ev: number) => {
    setState((prev) => ({ ...prev, selectedEv: ev }));
  }, []);

  const toggleAdvanced = useCallback(() => {
    setState((prev) => ({ ...prev, showAdvanced: !prev.showAdvanced }));
  }, []);

  const togglePerShareholder = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showPerShareholder: !prev.showPerShareholder,
    }));
  }, []);

  // Calculate waterfall results
  const waterfallResult: WaterfallResult | null = useMemo(() => {
    if (state.shareholders.length === 0) return null;
    return calculateWaterfall(state.settings, state.classes, state.shareholders);
  }, [state.settings, state.classes, state.shareholders]);

  // Get explanation for selected EV
  const selectedExplanation = useMemo(() => {
    if (!waterfallResult) return null;
    const row = waterfallResult.rows.find((r) => r.ev === state.selectedEv);
    return row?.explanation || null;
  }, [waterfallResult, state.selectedEv]);

  // Get class by ID
  const getClass = useCallback(
    (classId: string) => state.classes.find((c) => c.id === classId),
    [state.classes]
  );

  // Get all class names (for dropdown)
  const classOptions = useMemo(
    () => state.classes.map((c) => ({ id: c.id, name: c.name })),
    [state.classes]
  );

  return {
    state,
    settings: state.settings,
    classes: state.classes,
    shareholders: state.shareholders,
    selectedEv: state.selectedEv,
    showAdvanced: state.showAdvanced,
    showPerShareholder: state.showPerShareholder,
    waterfallResult,
    selectedExplanation,
    classOptions,
    // Actions
    updateSettings,
    setCurrency,
    setCompanyName,
    addClass,
    updateClass,
    removeClass,
    addShareholder,
    updateShareholder,
    removeShareholder,
    setSelectedEv,
    toggleAdvanced,
    togglePerShareholder,
    getClass,
  };
}

export type WaterfallStateReturn = ReturnType<typeof useWaterfallState>;
