export type Policy = {
    path: string;
    deniedNetwork: boolean;
    allowedHosts: string[];
    deniedPaths: string[];
    deniedCommands: string[];
};
export type PolicyDiagnostic = {
    line: number;
    severity: "error" | "warning";
    message: string;
};
export type PolicyValidation = {
    path: string;
    policy?: Policy;
    diagnostics: PolicyDiagnostic[];
    valid: boolean;
};
/**
 * Validate SkillCI's intentionally small YAML subset. Unknown fields fail
 * closed instead of being silently ignored, which keeps policies reviewable.
 */
export declare function validatePolicy(policyPath: string): PolicyValidation;
export declare function loadPolicy(policyPath: string): Policy;
export declare function renderPolicyValidation(result: PolicyValidation): string;
export declare function matchesDeniedPath(line: string, pattern: string): boolean;
export declare function extractNetworkHosts(line: string): string[];
export declare function hostIsAllowed(host: string, allowedHosts: string[]): boolean;
