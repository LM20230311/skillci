import type { AuditResult, Finding } from "./types.js";
export declare function audit(targetPath: string, options?: {
    policyPath?: string;
}): AuditResult;
/** Stable descriptions for machine reports: never interpolate source or policy values. */
export declare function auditRuleMetadata(): Omit<Finding, "file" | "line" | "excerpt">[];
