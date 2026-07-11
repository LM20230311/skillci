import type { AuditResult } from "./types.js";
export declare function audit(targetPath: string, options?: {
    policyPath?: string;
}): AuditResult;
