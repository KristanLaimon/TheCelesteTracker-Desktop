import { GetAssetAsBase64 } from '../../wailsjs/go/main/App';

export async function getAssetUrl(path: string | null): Promise<string | null> {
    if (!path) return null;
    
    // If it's already a data URL or a web URL, return it
    if (path.startsWith('data:') || path.startsWith('http:') || path.startsWith('https:')) {
        return path;
    }

    try {
        return await GetAssetAsBase64(path);
    } catch (e) {
        console.error('Failed to load asset as base64:', path, e);
        return null;
    }
}
