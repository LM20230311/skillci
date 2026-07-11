export type BehaviorCase = {
    name: string;
    fixture: string;
    input: {
        prompt: string;
    };
    runner: {
        image: string;
        command: string;
        timeoutSeconds: number;
    };
    tools: {
        allow: string[];
        deny: string[];
    };
    expect: {
        exitCode: number;
        files: {
            created: string[];
            modified: string[];
            unchanged: string[];
        };
        commands: string[];
        reads: string[];
        writes: string[];
        network: {
            requests: number;
        };
    };
};
export type BehaviorDiagnostic = {
    path: string;
    message: string;
};
export type BehaviorValidation = {
    path: string;
    behavior?: BehaviorCase;
    diagnostics: BehaviorDiagnostic[];
    valid: boolean;
};
export type BehaviorAssertion = {
    kind: string;
    path: string;
    passed: boolean;
    detail: string;
};
export type BehaviorEvent = {
    kind: "ready" | "read" | "write" | "command" | "network";
    value?: string;
};
export type BehaviorExecution = {
    image: string;
    command: string;
    exitCode: number;
    timedOut: boolean;
    stdout: string;
    stderr: string;
    created: string[];
    modified: string[];
    deleted: string[];
    commands: string[];
    reads: string[];
    writes: string[];
    networkRequests: number;
    tracingReady: boolean;
    assertions: BehaviorAssertion[];
    passed: boolean;
};
export type BehaviorRun = {
    validation: BehaviorValidation;
    execution?: BehaviorExecution;
};
/**
 * Validates a behavior-test contract without executing its runner.
 */
export declare function validateBehaviorCase(casePath: string): BehaviorValidation;
export declare function renderBehaviorValidation(result: BehaviorValidation): string;
/** Runs a validated behavior case in an isolated, network-disabled Docker container. */
export declare function runBehaviorCase(casePath: string): BehaviorRun;
export declare function buildDockerArgs(workspace: string, behavior: BehaviorCase): string[];
export declare function renderBehaviorRun(result: BehaviorRun): string;
