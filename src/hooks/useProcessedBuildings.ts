import { useEffect, useState } from "react";
import { normalizeBuilding, type BuildingRecord } from "../utils/buildingViz";
import { publicPath } from "../utils/publicPath";

let buildingsCache: BuildingRecord[] | null = null;
let buildingsPromise: Promise<BuildingRecord[]> | null = null;
let buildingsError: string | null = null;

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function loadProcessedBuildings() {
  if (buildingsCache) {
    return Promise.resolve(buildingsCache);
  }

  if (buildingsPromise) {
    return buildingsPromise;
  }

  buildingsPromise = fetch(publicPath("data/buildings_processed.json"))
    .then((res) => {
      if (!res.ok) {
        throw new Error("buildings_processed.json 加载失败");
      }
      return res.json();
    })
    .then((rows: BuildingRecord[]) => {
      const normalized = rows.map(normalizeBuilding);
      buildingsCache = normalized;
      buildingsError = null;
      emitChange();
      return normalized;
    })
    .catch((err: Error) => {
      buildingsError = err.message;
      emitChange();
      throw err;
    })
    .finally(() => {
      buildingsPromise = null;
    });

  return buildingsPromise;
}

export function useProcessedBuildings() {
  const [buildings, setBuildings] = useState<BuildingRecord[]>(() => buildingsCache ?? []);
  const [loading, setLoading] = useState(() => !buildingsCache && !buildingsError);
  const [error, setError] = useState<string | null>(() => buildingsError);

  useEffect(() => {
    const sync = () => {
      setBuildings(buildingsCache ?? []);
      setLoading(!buildingsCache && !buildingsError && Boolean(buildingsPromise));
      setError(buildingsError);
    };

    listeners.add(sync);
    sync();

    if (!buildingsCache && !buildingsError) {
      setLoading(true);
      loadProcessedBuildings()
        .then((rows) => {
          setBuildings(rows);
          setError(null);
        })
        .catch((err: Error) => {
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }

    return () => {
      listeners.delete(sync);
    };
  }, []);

  return { buildings, loading, error };
}
