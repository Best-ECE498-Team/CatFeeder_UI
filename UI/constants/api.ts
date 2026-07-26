const configuredUrl = process.env.EXPO_PUBLIC_PI_API_URL;

export const PI_API_BASE_URL = (
  configuredUrl || "http://PawPlate.local:8000"
).replace(/\/+$/, "");

export function getPiAssetUrl(pathOrUrl?: string) {
  if (!pathOrUrl) {
    return undefined;
  }

  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  return `${PI_API_BASE_URL}/${pathOrUrl.replace(/^\/+/, "")}`;
}
