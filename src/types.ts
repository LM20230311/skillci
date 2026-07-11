export type Severity = "critical" | "high" | "medium" | "low";

export type Finding = {
  ruleId: string;
  severity: Severity;
  title: string;
  detail: string;
  remediation: string;
  file: string;
  line: number;
  excerpt: string;
};

export type AuditResult = {
  target: string;
  scannedFiles: number;
  findings: Finding[];
  score: "critical" | "high" | "medium" | "low" | "none";
  policy?: {
    path: string;
    deniedNetwork: boolean;
    deniedPaths: string[];
    deniedCommands: string[];
  };
};

export type ReportFormat = "markdown" | "json" | "github";

export type TestCaseResult = {
  name: string;
  caseFile: string;
  passed: boolean;
  expectedMaxRisk: AuditResult["score"];
  actualRisk: AuditResult["score"];
  unexpectedRules: string[];
  error?: string;
};

export type TestRunResult = {
  casesPath: string;
  results: TestCaseResult[];
};
