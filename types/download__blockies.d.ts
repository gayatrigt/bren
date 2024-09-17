// File: src/types/download__blockies.d.ts

declare module '@download/blockies' {
    export interface BlockiesOptions {
        seed?: string;
        color?: string;
        bgcolor?: string;
        size?: number;
        scale?: number;
    }

    export function createIcon(options: BlockiesOptions): HTMLCanvasElement;
}