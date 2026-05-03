import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { BuildingRecord } from "../utils/buildingViz";

interface BuildingComparisonContextValue {
  compareList: BuildingRecord[];
  addToCompare: (building: BuildingRecord) => void;
  removeFromCompare: (buildingCode: string) => void;
  clearCompare: () => void;
  isInCompare: (buildingCode: string) => boolean;
}

const BuildingComparisonContext = createContext<BuildingComparisonContextValue | null>(null);

export function BuildingComparisonProvider({ children }: { children: ReactNode }) {
  const [compareList, setCompareList] = useState<BuildingRecord[]>([]);

  const addToCompare = useCallback((building: BuildingRecord) => {
    setCompareList((prev) => {
      if (prev.some((item) => item.building_code === building.building_code)) {
        return prev.filter((item) => item.building_code !== building.building_code);
      }
      if (prev.length >= 2) {
        return [prev[1], building];
      }
      return [...prev, building];
    });
  }, []);

  const removeFromCompare = useCallback((buildingCode: string) => {
    setCompareList((prev) => prev.filter((item) => item.building_code !== buildingCode));
  }, []);

  const clearCompare = useCallback(() => {
    setCompareList([]);
  }, []);

  const isInCompare = useCallback(
    (buildingCode: string) => compareList.some((item) => item.building_code === buildingCode),
    [compareList],
  );

  return (
    <BuildingComparisonContext.Provider
      value={{ compareList, addToCompare, removeFromCompare, clearCompare, isInCompare }}
    >
      {children}
    </BuildingComparisonContext.Provider>
  );
}

export function useBuildingComparison() {
  const ctx = useContext(BuildingComparisonContext);
  if (!ctx) {
    throw new Error("useBuildingComparison must be used within BuildingComparisonProvider");
  }
  return ctx;
}
