"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EXPLORATORY_TESTS, EXPLORATORY_TEST_CATEGORIES } from "./exploratory-tests.constants";
import { readProgress, writeProgress, clearProgress } from "./exploratory-tests.storage";
import type { ExploratoryTestsViewProps } from "./exploratory-tests.types";

export function useExploratoryTestsModel(): ExploratoryTestsViewProps {
  const [completedTestIds, setCompletedTestIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    readProgress().then((progress) => {
      if (cancelled) return;
      setCompletedTestIds(new Set(progress.completedTestIds));
      setIsLoaded(true);
    }).catch(() => {
      if (!cancelled) setIsLoaded(true);
    });
    return () => { cancelled = true; };
  }, []);

  const toggleTest = useCallback((testId: string) => {
    setCompletedTestIds((prev) => {
      const next = new Set(prev);
      if (next.has(testId)) {
        next.delete(testId);
      } else {
        next.add(testId);
      }
      const ids = Array.from(next);
      writeProgress(ids).catch(() => {});
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setCompletedTestIds(new Set());
    clearProgress().catch(() => {});
    toast.success("Progresso de testes resetado.");
  }, []);

  const completedPercentage = useMemo(() => {
    const total = EXPLORATORY_TESTS.length;
    if (total === 0) return 0;
    return Math.round((completedTestIds.size / total) * 100);
  }, [completedTestIds.size]);

  const testsByCategory = useMemo(() => {
    const map = new Map<string, typeof EXPLORATORY_TESTS>();
    for (const category of EXPLORATORY_TEST_CATEGORIES) {
      map.set(category.key, EXPLORATORY_TESTS.filter((t) => t.category === category.key));
    }
    return map;
  }, []);

  return {
    tests: isLoaded ? EXPLORATORY_TESTS : [],
    categories: EXPLORATORY_TEST_CATEGORIES,
    completedTestIds,
    completedPercentage,
    testsByCategory,
    toggleTest,
    resetAll,
  };
}
