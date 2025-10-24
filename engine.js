const regex_placement = {
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

function runRegexScript(script, rawString) {
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

function getRegexedString(rawString, placement, scripts = [], params = {}) {
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

        output = runRegexScript(script, output);
    }

    return output;
}

export {
    regex_placement,
    parseRegexFromString as regexFromString,
    runRegexScript,
    getRegexedString,
};
