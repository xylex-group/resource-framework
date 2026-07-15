const BLOCKED_DOWNLOAD_EXTENSIONS = new Set([".htm", ".html"]);

const trimQueryAndFragment = (value: string): string => {
  return value.split(/[?#]/, 1)[0];
};

const getExtensionForValue = (value?: string): string => {
  if (!value) return "";
  const cleaned = trimQueryAndFragment(value).toLowerCase().trim();
  const segments = cleaned.split(".");
  if (segments.length <= 1) return "";
  return `.${segments.pop() ?? ""}`;
};

export interface DownloadableFile {
  name?: string;
  url?: string;
}

const hasBlockedDownloadExtension = (file: DownloadableFile): boolean => {
  const nameExt = getExtensionForValue(file.name);
  if (BLOCKED_DOWNLOAD_EXTENSIONS.has(nameExt)) {
    return true;
  }
  const urlExt = getExtensionForValue(file.url);
  return BLOCKED_DOWNLOAD_EXTENSIONS.has(urlExt);
};

export const isDownloadAllowed = (file: DownloadableFile): boolean => {
  return !hasBlockedDownloadExtension(file);
};
