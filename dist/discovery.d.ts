export type DiscoveryHost = "codex" | "claude" | "cursor" | "copilot";
export type DiscoveryItem = {
    path: string;
    kind: "skill" | "instruction";
    hosts: DiscoveryHost[];
    evidence: string[];
    policyCoverage: "unknown";
};
export type DiscoveryDiagnostic = {
    path: string;
    code: "invalid-root" | "unreadable" | "symlink-skipped" | "depth-limit";
    severity: "info" | "error";
    message: string;
};
export type DiscoveryResult = {
    schemaVersion: 1;
    toolVersion: string;
    root: ".";
    complete: boolean;
    ignoredDirectories: string[];
    symlinks: "skip";
    items: DiscoveryItem[];
    diagnostics: DiscoveryDiagnostic[];
};
/** Inventory of project files, not an emulation of any host's active context. */
export declare function discover(rootPath?: string): DiscoveryResult;
export declare function renderDiscovery(result: DiscoveryResult): string;
