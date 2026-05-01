/**
 * Converts a relative path (from the 'data' folder) into a URL 
 * that can be used directly in <img> tags.
 */
export async function getAssetUrl(relativePath: string | undefined | null): Promise<string | null> {
  if (!relativePath) return null;
  
  // Normalize relative path
  const normalizedRelative = relativePath.replace(/\\/g, '/');
  
  // Wails serves assets from the same origin. 
  // Our custom handler in main.go catches /celeste-asset/
  return `/celeste-asset/${normalizedRelative}`;
}
