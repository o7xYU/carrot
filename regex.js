const STORAGE_KEY = 'cip_regex_enabled_v1';
const DEFAULT_REGEX_ENABLED = true;
const originalContentMap = new WeakMap();

const defaultDocument = typeof document !== 'undefined' ? document : null;

const REGEX_RULES = [
    {
        id: 'bhl-timestamp',
        pattern: /^『(.*?) \|(.*?)』$/gm,
        createNode({ documentRef, groups }) {
            const [time = '', text = ''] = groups;
            const doc = documentRef || defaultDocument;
            if (!doc) return null;
            const container = doc.createElement('div');
            container.style.textAlign = 'center';
            container.style.color = '#8e8e93';
            container.style.fontFamily = "'linja waso', sans-serif";
            container.style.fontSize = '13px';
            container.style.margin = '12px 0';
            const safeTime = time.trim();
            const safeText = text.trim();
            container.textContent = `${safeTime}\u00A0\u00A0\u00A0${safeText}`;
            return container;
        },
    },
    {
        id: 'bhl-system',
        pattern: /\+(.*?)\+/g,
        createNode({ documentRef, groups }) {
            const [message = ''] = groups;
            const doc = documentRef || defaultDocument;
            if (!doc) return null;
            const container = doc.createElement('div');
            container.style.textAlign = 'center';
            container.style.color = '#888888';
            container.style.fontSize = '14px';
            container.style.margin = '10px 0';
            container.textContent = `系统提示：${message.trim()}`;
            return container;
        },
    },
    {
        id: 'bhl-recall',
        pattern: /^-(.*?)-$/gm,
        createNode({ documentRef, groups }) {
            const [message = ''] = groups;
            const doc = documentRef || defaultDocument;
            if (!doc) return null;
            const outer = doc.createElement('div');
            outer.style.textAlign = 'center';
            outer.style.marginBottom = '6px';

            const details = doc.createElement('details');
            details.style.display = 'inline-block';

            const summary = doc.createElement('summary');
            summary.style.color = '#999999';
            summary.style.fontStyle = 'italic';
            summary.style.fontSize = '13px';
            summary.style.cursor = 'pointer';
            summary.style.listStyle = 'none';
            summary.style.webkitTapHighlightColor = 'transparent';
            summary.textContent = '对方撤回了一条消息';

            const content = doc.createElement('div');
            content.style.padding = '8px 12px';
            content.style.marginTop = '8px';
            content.style.backgroundColor = 'rgba(0,0,0,0.04)';
            content.style.borderRadius = '10px';
            content.style.textAlign = 'left';

            const paragraph = doc.createElement('p');
            paragraph.style.margin = '0';
            paragraph.style.color = '#555';
            paragraph.style.fontStyle = 'normal';
            paragraph.style.fontSize = '14px';
            paragraph.style.lineHeight = '1.4';
            paragraph.textContent = message.trim();

            content.appendChild(paragraph);
            details.appendChild(summary);
            details.appendChild(content);
            outer.appendChild(details);

            return outer;
        },
    },
];

function clearAppliedFlag(element) {
    if (!element?.dataset) return;
    delete element.dataset.cipRegexApplied;
}

function markApplied(element) {
    if (!element?.dataset) return;
    element.dataset.cipRegexApplied = '1';
}

function restoreOriginal(element) {
    if (!element) return false;
    const original = originalContentMap.get(element);
    if (typeof original !== 'string') return false;
    element.innerHTML = original;
    originalContentMap.delete(element);
    clearAppliedFlag(element);
    return true;
}

export function getRegexEnabled() {
    try {
        if (typeof localStorage === 'undefined') {
            return DEFAULT_REGEX_ENABLED;
        }
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === null) return DEFAULT_REGEX_ENABLED;
        return stored === 'true';
    } catch (error) {
        console.warn('胡萝卜插件：读取正则开关失败', error);
        return DEFAULT_REGEX_ENABLED;
    }
}

export function setRegexEnabled(enabled) {
    try {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    } catch (error) {
        console.warn('胡萝卜插件：写入正则开关失败', error);
    }
}

export function applyRegexReplacements(element, options = {}) {
    if (!element) return false;

    const {
        enabled = true,
        replacePlaceholderWithNode,
        documentRef = defaultDocument,
    } = options;

    if (!enabled) {
        return restoreOriginal(element);
    }

    if (typeof replacePlaceholderWithNode !== 'function' || !documentRef) {
        return false;
    }

    const rawText = element.textContent || element.innerText || '';
    if (!rawText) {
        return element?.dataset?.cipRegexApplied
            ? originalContentMap.has(element)
            : false;
    }

    let replacedAny = false;
    let storedOriginal = false;

    for (const rule of REGEX_RULES) {
        const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
        let match;
        while ((match = pattern.exec(rawText)) !== null) {
            if (!storedOriginal) {
                originalContentMap.set(element, element.innerHTML);
                storedOriginal = true;
            }

            const node = rule.createNode({
                documentRef,
                groups: match.slice(1),
            });
            if (!node) continue;

            const replaced = replacePlaceholderWithNode(
                element,
                match[0],
                node,
            );
            if (replaced) {
                replacedAny = true;
            }

            if (pattern.lastIndex === match.index) {
                pattern.lastIndex++;
            }
        }
    }

    if (replacedAny) {
        markApplied(element);
        return true;
    }

    if (element?.dataset?.cipRegexApplied) {
        if (!originalContentMap.has(element)) {
            clearAppliedFlag(element);
            return false;
        }
        return true;
    }

    return false;
}

export default {
    applyRegexReplacements,
    getRegexEnabled,
    setRegexEnabled,
};

export function restoreRegexOriginal(element) {
    return restoreOriginal(element);
}

export function clearRegexState(element) {
    clearAppliedFlag(element);
    restoreOriginal(element);
}

export function getRegexRules() {
    return REGEX_RULES.slice();
}
