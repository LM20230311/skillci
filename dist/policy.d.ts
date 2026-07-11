export type Policy = {
    path: string;
    deniedNetwork: boolean;
    allowedHosts: string[];
    deniedPaths: string[];
    deniedCommands: string[];
    deniedCommandPatterns: string[];
    deniedWorkingDirectories: string[];
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
export type PolicyChangeKind = "permission-added" | "permission-removed" | "restriction-added" | "restriction-removed";
export type PolicyChange = {
    kind: PolicyChangeKind;
    field: string;
    value: string;
};
export type PolicyDiff = {
    before: Policy;
    after: Policy;
    changes: PolicyChange[];
};
/**
 * Validate SkillCI's intentionally small YAML subset. Unknown fields fail
 * closed instead of being silently ignored, which keeps policies reviewable.
 */
export declare function validatePolicy(policyPath: string): PolicyValidation;
export declare function loadPolicy(policyPath: string): Policy;
export declare function renderPolicyValidation(result: PolicyValidation): string;
export declare function diffPolicies(beforePath: string, afterPath: string): PolicyDiff;
export declare function renderPolicyDiff(diff: PolicyDiff): string;
export declare function renderPolicyDiffGitHub(diff: PolicyDiff): string;
export declare function matchesDeniedPath(line: string, pattern: string): boolean;
export declare function matchesPathPattern(candidate: string, pattern: string): boolean;
export declare function matchesCommandPattern(line: string, pattern: string): boolean;
export declare function extractWorkingDirectories(line: string): string[];
export declare function extractNetworkHosts(line: string): string[];
export declare function hostIsAllowed(host: string, allowedHosts: string[]): boolean;
