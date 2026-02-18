export type SignalKind =
    | "function"
    | "class"
    | "component"
    | "hook"
    | "route"
    | "middleware"
    | "auth"
    | "validation"
    | "error-handling"
    | "async"
    | "database"
    | "config"
    | "dependency"
    | "test"
    | "logging"
    | "performance"
    | "type"
    | "generic";

export type ChangeVerb =
    | "implement"
    | "add"
    | "remove"
    | "refactor"
    | "update"
    | "rename"
    | "optimize"
    | "create";

export type SignalDetector = (ctx: DiffContext) => Signal[];

export interface DiffContext {
    raw: string;
    lower: string;
    addedLines: string[];
    removedLines: string[];
    addedContent: string;
    removedContent: string;
    fileNames: string[];
    /** Net line delta: positive = more added, negative = more removed */
    lineDelta: number;
}

export interface Signal {
    /** The kind of change detected — used for grouping and dedup */
    kind: SignalKind;
    /** Specific named subjects (function names, class names, route paths…) */
    subjects: string[];
    /** Primary verb intent: did we add, remove, update, or refactor this? */
    verb: ChangeVerb;
    /** Confidence weight — higher wins dedup within same kind */
    score: number;
}
