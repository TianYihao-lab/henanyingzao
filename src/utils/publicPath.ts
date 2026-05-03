export function publicPath(path: string): string {
  const clean = path.replace(/^\/+/, "");
  const base = import.meta.env.BASE_URL;
  const resolvedBase = /^https?:\/\//i.test(base)
    ? base
    : base.startsWith("/")
      ? `${window.location.origin}${base}`
      : new URL(base, window.location.href).toString();

  return new URL(clean, resolvedBase).toString();
}
