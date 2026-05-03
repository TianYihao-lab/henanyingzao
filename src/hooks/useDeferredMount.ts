import { useEffect, useRef, useState } from "react";

interface DeferredMountOptions {
  rootMargin?: string;
  threshold?: number;
}

export function useDeferredMount<T extends HTMLElement>(options?: DeferredMountOptions) {
  const ref = useRef<T | null>(null);
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || shouldMount) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldMount(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: options?.rootMargin ?? "420px 0px",
        threshold: options?.threshold ?? 0.01,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [options?.rootMargin, options?.threshold, shouldMount]);

  return { ref, shouldMount };
}
