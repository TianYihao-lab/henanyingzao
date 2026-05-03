import { useEffect, useState } from "react";
import type { AppCopy } from "../types/copy";
import { publicPath } from "../utils/publicPath";

export function useCopy() {
  const [copy, setCopy] = useState<AppCopy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(publicPath("data/yingzao_zhongyuan_copy.json"))
      .then((res) => {
        if (!res.ok) {
          throw new Error("文案文件加载失败");
        }
        return res.json();
      })
      .then((data: AppCopy) => {
        setCopy(data);
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { copy, loading, error };
}
