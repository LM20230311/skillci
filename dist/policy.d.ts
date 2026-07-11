export type Policy = {
    path: string;
    deniedNetwork: boolean;
    deniedPaths: string[];
    deniedCommands: string[];
};
/** Parses the deliberately small SkillCI policy format without a runtime dependency. */
export declare function loadPolicy(policyPath: string): Policy;
