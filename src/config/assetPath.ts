const externalAssetPattern = /^(https?:|data:|blob:)/;

export function withBasePath(path: string) {
  if (externalAssetPattern.test(path)) {
    return path;
  }

  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  return `${base}${cleanPath}`;
}
