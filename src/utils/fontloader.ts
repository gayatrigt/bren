// src/utils/fontLoader.ts

export async function loadFonts(): Promise<{ [key: string]: ArrayBuffer }> {

    const fontUrls = {
        spaceGroteskBold: new URL("/public/fonts/SpaceGrotesk-Bold.ttf", import.meta.url),
        spaceGroteskLight: new URL("/public/fonts/SpaceGrotesk-Light.ttf", import.meta.url),
        spaceGroteskMedium: new URL("/public/fonts/SpaceGrotesk-Medium.ttf", import.meta.url),
        spaceGroteskRegular: new URL("/public/fonts/SpaceGrotesk-Regular.ttf", import.meta.url),
        spaceGroteskSemiBold: new URL("/public/fonts/SpaceGrotesk-SemiBold.ttf", import.meta.url),
    };

    const loadedFonts: { [key: string]: ArrayBuffer } = {};

    for (const [name, url] of Object.entries(fontUrls)) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to load font: ${name}`);
            loadedFonts[name] = await response.arrayBuffer();
        } catch (error) {
            console.error(`Error loading font ${name}:`, error);
            // Provide a fallback empty ArrayBuffer if loading fails
            loadedFonts[name] = new ArrayBuffer(0);
        }
    }

    return loadedFonts;
}