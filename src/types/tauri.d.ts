declare module '@tauri-apps/api/tauri' {
    export function invoke<T>(cmd: string, args?: unknown): Promise<T>;
}
