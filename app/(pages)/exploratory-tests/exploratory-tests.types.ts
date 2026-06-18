export interface ExploratoryTestProgress {
  completedTestIds: string[];
  updatedAt: string;
}

export interface ExploratoryTestsViewProps {
  tests: import("./exploratory-tests.constants").ExploratoryTest[];
  categories: import("./exploratory-tests.constants").ExploratoryTestCategory[];
  completedTestIds: Set<string>;
  completedPercentage: number;
  testsByCategory: Map<string, import("./exploratory-tests.constants").ExploratoryTest[]>;
  toggleTest: (testId: string) => void;
  resetAll: () => void;
}
