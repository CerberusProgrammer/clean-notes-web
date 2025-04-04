export const getNoteTitle = (content: string): string => {
  const headerMatch = content.match(/^#+ (.+)$/m);
  if (headerMatch) return headerMatch[1];

  const firstLine = content.split("\n")[0];
  if (firstLine.length < 30) return firstLine;
  return firstLine.substring(0, 30) + "...";
};

export const formatDateRelative = (t: any, timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return t.notes.today;
  } else if (diffDays === 1) {
    return t.notes.yesterday;
  } else if (diffDays < 7) {
    return `${diffDays} ${t.notes.daysAgo}`;
  } else {
    return date.toLocaleDateString();
  }
};

export const getExcerpt = (content: string): string => {
  const contentWithoutHeaders = content.replace(/^#+ .+$/gm, "").trim();
  if (contentWithoutHeaders) {
    return contentWithoutHeaders;
  }
  return content;
};

export function getLocalStorageValue<T>(key: string, defaultValue: T): T {
  const value = localStorage.getItem(key);
  if (value === null) return defaultValue;
  try {
    // Intentamos hacer una conversión segura
    return value as unknown as T;
  } catch (e) {
    return defaultValue;
  }
}
