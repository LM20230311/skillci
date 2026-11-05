import type { AuditResult, Severity } from "./types.js";
/** SARIF intentionally excludes source excerpts and user-authored messages. */
export declare function renderSarif(audit: AuditResult, options?: {
    sourceRoot?: string;
}): {
    $schema: string;
    version: string;
    runs: {
        tool: {
            driver: {
                name: string;
                semanticVersion: string;
                informationUri: string;
                rules: {
                    id: string;
                    shortDescription: {
                        text: string;
                    };
                    fullDescription: {
                        text: string;
                    };
                    help: {
                        text: string;
                    };
                    defaultConfiguration: {
                        level: "error" | "warning" | "note";
                    };
                    properties: {
                        tags: string[];
                        skillciSeverity: Severity;
                    };
                }[];
            };
        };
        results: {
            suppressions?: {
                kind: string;
                status: string;
                justification: string;
            }[] | undefined;
            ruleId: string;
            ruleIndex: number;
            level: "error" | "warning" | "note";
            message: {
                text: string;
            };
            locations: {
                physicalLocation: {
                    artifactLocation: {
                        uri: string;
                    };
                    region: {
                        startLine: number;
                    };
                };
            }[];
            partialFingerprints: {
                primaryLocationLineHash: string;
            };
        }[];
    }[];
};
