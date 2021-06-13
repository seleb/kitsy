/**
 * Helper used to replace code in a script tag based on a search regex.
 * To inject code without erasing original string, using capturing groups; e.g.
 * ```js
 * inject(/(some string)/,'injected before $1 injected after');
 * ```
 * @param searcher Regex to search and replace
 * @param replacer Replacer string/fn
 */
 function inject(searcher: Parameters<string['replace']>[0] & Parameters<string['search']>[0], replacer: Parameters<string['replace']>[1]) {
	// find the relevant script tag
	var scriptTags = document.getElementsByTagName('script');
	var scriptTag: HTMLScriptElement | undefined;
	var code = '';
	for (var i = 0; i < scriptTags.length; ++i) {
		scriptTag = scriptTags[i];
		if (!scriptTag.textContent) continue;
		var matchesSearch = scriptTag.textContent.search(searcher) !== -1;
		var isCurrentScript = scriptTag === document.currentScript;
		if (matchesSearch && !isCurrentScript) {
			code = scriptTag.textContent;
			break;
		}
	}

	// error-handling
	if (!code || !scriptTag) {
		throw new Error('Couldn\'t find "' + searcher + '" in script tags');
	}

	// modify the content
	code = code.replace(searcher, replacer);

	// replace the old script tag with a new one using our modified code
	var newScriptTag = document.createElement('script');
	newScriptTag.textContent = code;
	scriptTag.insertAdjacentElement('afterend', newScriptTag);
	scriptTag.remove();
}
/**
 * Helper for getting an array with unique elements
 * @param  {Array} array Original array
 * @return {Array}       Copy of array, excluding duplicates
 */
function unique<T>(array: T[]) {
	return array.filter(function (item, idx) {
		return array.indexOf(item) === idx;
	});
}


// Ex: inject(/(names.sprite.set\( name, id \);)/, '$1console.dir(names)');
/** test */
function kitsyInject(searcher: Parameters<typeof inject>[0], replacer: Parameters<typeof inject>[1]) {
	if (
		!kitsy.queuedInjectScripts.some(function (script) {
			return searcher.toString() === script.searcher.toString() && replacer === script.replacer;
		})
	) {
		kitsy.queuedInjectScripts.push({
			searcher: searcher,
			replacer: replacer,
		});
	} else {
		console.warn('Ignored duplicate inject');
	}
}

// Ex: before('load_game', function run() { alert('Loading!'); });
//     before('show_text', function run(text) { return text.toUpperCase(); });
//     before('show_text', function run(text, done) { done(text.toUpperCase()); });
function before(targetFuncName: string, beforeFn: () => void) {
	kitsy.queuedBeforeScripts[targetFuncName] = kitsy.queuedBeforeScripts[targetFuncName] || [];
	kitsy.queuedBeforeScripts[targetFuncName].push(beforeFn);
}

// Ex: after('load_game', function run() { alert('Loaded!'); });
function after(targetFuncName: string, afterFn: () => void) {
	kitsy.queuedAfterScripts[targetFuncName] = kitsy.queuedAfterScripts[targetFuncName] || [];
	kitsy.queuedAfterScripts[targetFuncName].push(afterFn);
}

function applyInjects() {
	kitsy.queuedInjectScripts.forEach(function (injectScript) {
		inject(injectScript.searcher, injectScript.replacer);
	});
}

function applyHooks() {
	var allHooks = unique(Object.keys(kitsy.queuedBeforeScripts).concat(Object.keys(kitsy.queuedAfterScripts)));
	allHooks.forEach(applyHook);
}

function applyHook(functionName: string) {
	var functionNameSegments = functionName.split('.');
	var obj: any = window;
	while (functionNameSegments.length > 1) {
		obj = obj[functionNameSegments.shift() as string];
	}
	var lastSegment = functionNameSegments[0];
	var superFn = obj[lastSegment];
	var superFnLength = superFn ? superFn.length : 0;
	var functions: typeof kitsy['queuedBeforeScripts'][''] = [];
	// start with befores
	functions = functions.concat(kitsy.queuedBeforeScripts[functionName] || []);
	// then original
	if (superFn) {
		functions.push(superFn);
	}
	// then afters
	functions = functions.concat(kitsy.queuedAfterScripts[functionName] || []);

	// overwrite original with one which will call each in order
	obj[lastSegment] = function () {
		var returnVal: never | never[];
		var args = [].slice.call(arguments);
		var i = 0;

		function runBefore(this: any): unknown {
			// All outta functions? Finish
			if (i === functions.length) {
				return returnVal;
			}

			// Update args if provided.
			if (arguments.length > 0) {
				args = [].slice.call(arguments);
			}

			if (functions[i].length > superFnLength) {
				// Assume funcs that accept more args than the original are
				// async and accept a callback as an additional argument.
				return functions[i++].apply(this, args.concat(runBefore.bind(this) as never));
			}
			// run synchronously
			returnVal = functions[i++].apply(this, args) as never | never[];
			if (returnVal && returnVal.length) {
				args = returnVal;
			}
			return runBefore.apply(this, args as []);
		}

		return runBefore.apply(this, arguments as unknown as []);
	};
}

interface Kitsy {
	queuedInjectScripts: { searcher: Parameters<typeof kitsyInject>[0]; replacer: Parameters<typeof kitsyInject>[1] }[];
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
export var kitsy: Kitsy = ((window as { kitsy?: Kitsy }).kitsy = (window as { kitsy?: Kitsy }).kitsy || {
	queuedInjectScripts: [],
	queuedBeforeScripts: {},
	queuedAfterScripts: {},
	inject: kitsyInject,
	before,
	after,
	/**
	 * Applies all queued `inject` calls.
	 *
	 * An object that instantiates an class modified via injection will still refer to the original class,
	 * so make sure to reinitialize globals that refer to injected scripts before calling `applyHooks`.
	 */
	applyInjects,
	/** Apples all queued `before`/`after` calls. */
	applyHooks,
});
