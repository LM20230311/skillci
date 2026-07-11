export type BehaviorCase = {
    name: string;
    fixture: string;
    input: {
        prompt: string;
    };
    runner: {
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
/**
 * Validates a behavior-test contract without executing its runner. Executing
 * an Agent belongs to a later, explicitly isolated runner implementation.
 */
export declare function validateBehaviorCase(casePath: string): BehaviorValidation;
export declare function renderBehaviorValidation(result: BehaviorValidation): string;
