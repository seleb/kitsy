/**
 * Helper used to replace code in a script tag based on a search regex.
 * To inject code without erasing original string, using capturing groups; e.g.
 * ```js
 * inject(/(some string)/,'injected before $1 injected after');
 * ```
 * @param searcher Regex to search and replace
 * @param replacer Replacer string/fn
 */
declare function inject(searcher: Parameters<string['replace']>[0] & Parameters<string['search']>[0], replacer: Parameters<string['replace']>[1]): void;
/** test */
declare function kitsyInject(searcher: Parameters<typeof inject>[0], replacer: Parameters<typeof inject>[1]): void;
declare function before(targetFuncName: string, beforeFn: () => void): void;
declare function after(targetFuncName: string, afterFn: () => void): void;
declare function applyInjects(): void;
declare function applyHooks(this: unknown, root?: unknown): void;
export interface Kitsy {
    queuedInjectScripts: {
        searcher: Parameters<typeof kitsyInject>[0];
        replacer: Parameters<typeof kitsyInject>[1];
    }[];
    queuedBeforeScripts: Record<string, ((...args: unknown[]) => unknown)[]>;
    queuedAfterScripts: Record<string, ((...args: unknown[]) => unknown)[]>;
    inject: typeof kitsyInject;
    before: typeof before;
    after: typeof after;
    applyInjects: typeof applyInjects;
    applyHooks: typeof applyHooks;
}
/**
@file kitsy-script-toolkit
@summary Monkey-patching toolkit to make it easier and cleaner to run code before and after functions or to inject new code into script tags
@license WTFPL (do WTF you want)
@author Original by mildmojo; modified by Sean S. LeBlanc
*/
export declare var kitsy: Kitsy;
export {};
