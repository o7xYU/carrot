const globalScope = typeof globalThis !== 'undefined'
    ? globalThis
    : (typeof window !== 'undefined' ? window : undefined);

const builtinPlacement = globalScope?.regex_placement;

const regex_placement = builtinPlacement ?? {
    MD_DISPLAY: 0,
    USER_INPUT: 1,
    AI_OUTPUT: 2,
    SLASH_COMMAND: 3,
    WORLD_INFO: 5,
    REASONING: 6,
};

function isNumber(value) {
    return typeof value === 'number' && !Number.isNaN(value);
}

function parseRegexFromString(regexInput) {
    if (!regexInput) {
        return null;
    }

    if (regexInput instanceof RegExp) {
        return regexInput;
    }

    if (typeof regexInput !== 'string') {
        return null;
    }

    const trimmed = regexInput.trim();
    if (!trimmed) {
        return null;
    }

    if (trimmed.startsWith('/') && trimmed.lastIndexOf('/') > 0) {
        const lastSlash = trimmed.lastIndexOf('/');
        const pattern = trimmed.slice(1, lastSlash);
        const flags = trimmed.slice(lastSlash + 1);

        try {
            return new RegExp(pattern, flags);
        } catch (error) {
            console.warn('regex engine: failed to parse regex string', regexInput, error);
            return null;
        }
    }

    try {
        return new RegExp(trimmed, 'g');
    } catch (error) {
        console.warn('regex engine: failed to create fallback regex', regexInput, error);
        return null;
    }
}

function filterString(rawString, trimStrings = []) {
    if (!rawString) {
        return '';
    }

    if (!Array.isArray(trimStrings) || !trimStrings.length) {
        return rawString;
    }

    return trimStrings.reduce((result, trimString) => {
        if (!trimString) {
            return result;
        }

        return result.split(trimString).join('');
    }, rawString);
}

function substituteParams(text) {
    return text;
}

function shouldRunOnDepth(script, depth) {
    if (!isNumber(depth)) {
        return true;
    }

    if (isNumber(script?.minDepth) && script.minDepth !== null && script.minDepth >= -1 && depth < script.minDepth) {
        return false;
    }

    if (isNumber(script?.maxDepth) && script.maxDepth !== null && script.maxDepth >= 0 && depth > script.maxDepth) {
        return false;
    }

    return true;
}

function shouldRunScript(script, placement, { isMarkdown, isPrompt, isEdit, depth } = {}) {
    if (!script || script.disabled) {
        return false;
    }

    if (!Array.isArray(script.placement) || !script.placement.includes(placement)) {
        return false;
    }

    if (isEdit && script.runOnEdit === false) {
        return false;
    }

    if (!shouldRunOnDepth(script, depth)) {
        return false;
    }

    const markdownOnly = !!script.markdownOnly;
    const promptOnly = !!script.promptOnly;

    if (markdownOnly && !isMarkdown) {
        return false;
    }

    if (promptOnly && !isPrompt) {
        return false;
    }

    if (!markdownOnly && !promptOnly && (isMarkdown || isPrompt)) {
        return false;
    }

    return true;
}

function runRegexScriptLocal(script, rawString) {
    if (!script || !rawString) {
        return rawString;
    }

    const findRegex = parseRegexFromString(script.findRegex);
    if (!findRegex) {
        return rawString;
    }

    const trimStrings = script.trimStrings ?? [];
    const replaceTemplate = typeof script.replaceString === 'string' ? script.replaceString : '';

    return rawString.replace(findRegex, (...args) => {
        const match = args[0];
        const captureGroups = args.slice(1, -2);
        const namedGroupsCandidate = args[args.length - 1];
        const namedGroups = typeof namedGroupsCandidate === 'object' ? namedGroupsCandidate : undefined;

        let replacement = replaceTemplate.replace(/{{match}}/gi, '$0');

        replacement = replacement.replace(/\$(\d+)|\$<([^>]+)>/g, (fullMatch, index, groupName) => {
            let groupValue;

            if (index) {
                const numericIndex = Number(index);
                groupValue = captureGroups[numericIndex - 1];
            } else if (groupName && namedGroups) {
                groupValue = namedGroups[groupName];
            }

            if (groupValue === undefined || groupValue === null) {
                return '';
            }

            const filtered = filterString(String(groupValue), trimStrings);
            return filtered;
        });

        if (!replacement.includes('$0')) {
            return substituteParams(replacement);
        }

        return substituteParams(
            replacement.replace(/\$0/g, filterString(String(match), trimStrings)),
        );
    });
}

function getRegexedStringLocal(rawString, placement, scripts = [], params = {}) {
    if (typeof rawString !== 'string' || rawString === '') {
        return typeof rawString === 'string' ? rawString : '';
    }

    if (!Array.isArray(scripts) || !scripts.length) {
        return rawString;
    }

    let output = rawString;
    for (const script of scripts) {
        if (!shouldRunScript(script, placement, params)) {
            continue;
        }

        output = runRegexScriptLocal(script, output);
    }

    return output;
}

const builtinRegexFromString = typeof globalScope?.regexFromString === 'function'
    ? globalScope.regexFromString.bind(globalScope)
    : undefined;

const builtinRunRegexScript = typeof globalScope?.runRegexScript === 'function'
    ? globalScope.runRegexScript.bind(globalScope)
    : undefined;

const builtinGetRegexedString = typeof globalScope?.getRegexedString === 'function'
    ? globalScope.getRegexedString.bind(globalScope)
    : undefined;

function regexFromString(regexInput) {
    if (builtinRegexFromString) {
        try {
            return builtinRegexFromString(regexInput);
        } catch (error) {
            console.warn('regex engine: builtin regexFromString failed, falling back', error);
        }
    }

    return parseRegexFromString(regexInput);
}

function runRegexScript(script, rawString) {
    if (builtinRunRegexScript) {
        try {
            return builtinRunRegexScript(script, rawString);
        } catch (error) {
            console.warn('regex engine: builtin runRegexScript failed, using local version', error);
        }
    }

    return runRegexScriptLocal(script, rawString);
}

function getRegexedString(rawString, placement, scripts = [], params = {}) {
    if (builtinGetRegexedString && (!Array.isArray(scripts) || scripts.length === 0)) {
        try {
            return builtinGetRegexedString(rawString, placement, params);
        } catch (error) {
            console.warn('regex engine: builtin getRegexedString failed, using local version', error);
        }
    }

    if (!Array.isArray(scripts) || !scripts.length) {
        return typeof rawString === 'string' ? rawString : '';
    }

    return getRegexedStringLocal(rawString, placement, scripts, params);
}

export {
    regex_placement,
    regexFromString,
    runRegexScript,
    getRegexedString,
};
