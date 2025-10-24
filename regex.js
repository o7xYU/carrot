const STORAGE_KEY = 'cip_regex_enabled_v1';
const DEFAULT_REGEX_ENABLED = true;
const originalContentMap = new WeakMap();

export const REGEX_PLACEMENT = {
    MD_DISPLAY: 0,
    USER_INPUT: 1,
    AI_OUTPUT: 2,
    SLASH_COMMAND: 3,
    WORLD_INFO: 5,
    REASONING: 6,
};

const DEFAULT_RULE_PLACEMENT = [REGEX_PLACEMENT.AI_OUTPUT];
const DEFAULT_PLACEMENT_VALUE = REGEX_PLACEMENT.AI_OUTPUT;

const defaultDocument = typeof document !== 'undefined' ? document : null;
const TEXT_NODE_FILTER =
    typeof NodeFilter !== 'undefined' ? NodeFilter.SHOW_TEXT : 4;

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
        id: 'bhl-bubble-self',
        pattern: /\[(.*?)\\(.*?)\\(.*?)\]/gm,
        createNode({ documentRef, groups }) {
            const [name = '', time = '', message = ''] = groups;
            const doc = documentRef || defaultDocument;
            if (!doc) return null;

            const container = doc.createElement('div');
            container.style.margin = '10px 0';
            container.style.maxWidth = '75%';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'flex-end';
            container.style.marginLeft = 'auto';

            const header = doc.createElement('div');
            header.style.fontSize = '12px';
            header.style.color = '#8a8a8a';
            header.style.marginRight = '5px';
            header.style.marginBottom = '5px';

            const nameSpan = doc.createElement('span');
            nameSpan.textContent = name.trim();

            header.appendChild(nameSpan);

            const bodyWrapper = doc.createElement('div');
            bodyWrapper.style.display = 'flex';
            bodyWrapper.style.alignItems = 'flex-end';
            bodyWrapper.style.width = '100%';
            bodyWrapper.style.justifyContent = 'flex-end';

            const timeSpan = doc.createElement('span');
            timeSpan.style.fontSize = '12px';
            timeSpan.style.color = '#b2b2b2';
            timeSpan.style.marginRight = '8px';
            timeSpan.style.flexShrink = '0';
            timeSpan.textContent = time.trim();

            const bubble = doc.createElement('div');
            bubble.style.backgroundColor = '#8DE041';
            bubble.style.color = '#000000';
            bubble.style.padding = '12px 16px';
            bubble.style.borderRadius = '20px';
            bubble.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.08)';
            bubble.style.position = 'relative';
            bubble.style.maxWidth = '100%';

            const paragraph = doc.createElement('p');
            paragraph.style.margin = '0';
            paragraph.style.whiteSpace = 'pre-wrap';
            paragraph.style.wordWrap = 'break-word';
            paragraph.style.fontSize = '12px';
            paragraph.style.lineHeight = '1.5';
            paragraph.textContent = message.trim();

            bubble.appendChild(paragraph);

            bodyWrapper.appendChild(timeSpan);
            bodyWrapper.appendChild(bubble);

            container.appendChild(header);
            container.appendChild(bodyWrapper);

            return container;
        },
    },
    {
        id: 'bhl-bubble',
        pattern: /\[(.*?)\/(.*?)\/(.*?)\]/gm,
        createNode({ documentRef, groups }) {
            const [name = '', message = '', time = ''] = groups;
            const doc = documentRef || defaultDocument;
            if (!doc) return null;

            const container = doc.createElement('div');
            container.style.margin = '10px 0';
            container.style.maxWidth = '75%';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'flex-start';

            const header = doc.createElement('div');
            header.style.fontSize = '13px';
            header.style.color = '#8a8a8a';
            header.style.marginLeft = '5px';
            header.style.marginBottom = '5px';
            header.style.display = 'flex';
            header.style.alignItems = 'center';

            const nameSpan = doc.createElement('span');
            nameSpan.style.fontWeight = '300';
            nameSpan.textContent = name.trim();

            header.appendChild(nameSpan);

            const bodyWrapper = doc.createElement('div');
            bodyWrapper.style.display = 'flex';
            bodyWrapper.style.alignItems = 'flex-end';
            bodyWrapper.style.width = '100%';

            const bubble = doc.createElement('div');
            bubble.style.backgroundColor = '#ffffff';
            bubble.style.color = '#000000';
            bubble.style.padding = '12px 16px';
            bubble.style.borderRadius = '20px';
            bubble.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.08)';
            bubble.style.position = 'relative';
            bubble.style.maxWidth = '100%';

            const paragraph = doc.createElement('p');
            paragraph.style.margin = '0';
            paragraph.style.whiteSpace = 'pre-wrap';
            paragraph.style.wordWrap = 'break-word';
            paragraph.style.fontSize = '12px';
            paragraph.style.lineHeight = '1.5';
            paragraph.textContent = message.trim();

            bubble.appendChild(paragraph);

            const timeSpan = doc.createElement('span');
            timeSpan.style.fontSize = '12px';
            timeSpan.style.color = '#b2b2b2';
            timeSpan.style.marginLeft = '8px';
            timeSpan.style.flexShrink = '0';
            timeSpan.textContent = time.trim();

            bodyWrapper.appendChild(bubble);
            bodyWrapper.appendChild(timeSpan);

            container.appendChild(header);
            container.appendChild(bodyWrapper);

            return container;
        },
    },
    {
        id: 'bhl-char-bubble',
        pattern: /^"(.*?)"$/gm,
        placement: [REGEX_PLACEMENT.AI_OUTPUT],
        markdownOnly: true,
        promptOnly: false,
        minDepth: null,
        maxDepth: 2,
        createNode({ documentRef, groups }) {
            const [message = ''] = groups;
            const doc = documentRef || defaultDocument;
            if (!doc) return null;

            const outer = doc.createElement('div');
            outer.className = 'char_bubble custom-char_bubble';

            const wrapper = doc.createElement('div');
            wrapper.style.cssText = 'display: flex; margin-bottom: 18px; align-items: flex-start; position: relative; animation: message-pop 0.3s ease-out;';

            const avatar = doc.createElement('div');
            avatar.className = 'B_C_avar';
            avatar.style.cssText = "width: 40px; height: 40px; flex-shrink: 0; border-radius: 50%; padding: 5px 5px; overflow: hidden; margin-right: 10px; background-image: url('https://i.postimg.cc/nhqSPb2R/640-1.jpg'); background-size: cover; background-position: center;";

            const bubble = doc.createElement('div');
            bubble.style.cssText = 'padding: 10px 14px; border-radius: 24px !important; line-height: 1.4; border-bottom-left-radius: 24px !important; word-wrap: break-word; position: relative; transition: transform 0.2s; background: transparent !important; box-shadow: -4px 4px 8px rgba(0, 0, 0, 0.10), 2px -2px 4px rgba(255, 255, 255, 0.3), inset -6px 6px 8px rgba(0, 0, 0, 0.10), inset 6px -6px 8px rgba(255, 255, 255, 0.5) !important; border: 1px solid rgba(200, 200, 200, 0.3) !important;';

            const topDrop = doc.createElement('span');
            topDrop.style.cssText = 'position: absolute; top: 5px; left: auto; right: 5px; width: 12px; height: 6px; background: white; border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%; opacity: 0.9; z-index: 2; transform: rotate(45deg);';

            const messageSpan = doc.createElement('span');
            messageSpan.style.whiteSpace = 'pre-wrap';
            messageSpan.style.wordBreak = 'break-word';
            messageSpan.textContent = message.trim();

            const bottomDrop = doc.createElement('span');
            bottomDrop.style.cssText = 'position: absolute; top: 15px; left: auto; right: 5px; width: 4px; height: 4px; background: white; border-radius: 50%; opacity: 0.6; z-index: 2;';

            bubble.appendChild(topDrop);
            bubble.appendChild(messageSpan);
            bubble.appendChild(bottomDrop);

            wrapper.appendChild(avatar);
            wrapper.appendChild(bubble);

            outer.appendChild(wrapper);

            return outer;
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

function clonePattern(pattern) {
    if (!(pattern instanceof RegExp)) return null;
    return new RegExp(pattern.source, pattern.flags);
}

function isInsideRegexNode(node) {
    let current = node;
    while (current) {
        if (current.nodeType === 1 && current.dataset?.cipRegexNode === '1') {
            return true;
        }
        current = current.parentNode;
    }
    return false;
}

function collectTextNodes(root, documentRef) {
    const doc = documentRef || defaultDocument;
    if (!root || !doc?.createTreeWalker) return [];

    const nodes = [];
    const walker = doc.createTreeWalker(root, TEXT_NODE_FILTER);
    while (walker.nextNode()) {
        const current = walker.currentNode;
        if (!current || !current.nodeValue) continue;
        if (isInsideRegexNode(current.parentNode)) continue;
        nodes.push(current);
    }
    return nodes;
}

function markRegexNode(node, ruleId) {
    if (!node) return;
    if (node.nodeType === 11) {
        const elements = node.children || [];
        for (const child of elements) {
            markRegexNode(child, ruleId);
        }
        return;
    }

    if (node.nodeType !== 1) return;
    node.dataset.cipRegexNode = '1';
    node.dataset.cipRegexRule = ruleId || '';
}

function replaceMatchesInTextNode({
    textNode,
    rule,
    documentRef,
    ensureOriginalStored,
}) {
    if (!textNode?.parentNode) return false;
    const text = textNode.nodeValue;
    if (!text) return false;

    const doc = documentRef || defaultDocument;
    if (!doc) return false;

    const pattern = clonePattern(rule.pattern);
    if (!pattern) return false;

    let match;
    let lastIndex = 0;
    let replaced = false;
    const fragment = doc.createDocumentFragment();

    pattern.lastIndex = 0;

    while ((match = pattern.exec(text)) !== null) {
        const matchText = match[0];
        if (!matchText) {
            if (pattern.lastIndex === match.index) {
                pattern.lastIndex++;
            }
            continue;
        }

        const startIndex = match.index;
        if (startIndex > lastIndex) {
            fragment.appendChild(
                doc.createTextNode(text.slice(lastIndex, startIndex)),
            );
        }

        const replacementNode = rule.createNode({
            documentRef: doc,
            groups: match.slice(1),
        });

        if (replacementNode) {
            markRegexNode(replacementNode, rule.id);
            fragment.appendChild(replacementNode);
            replaced = true;
        } else {
            fragment.appendChild(doc.createTextNode(matchText));
        }

        lastIndex = startIndex + matchText.length;

        if (pattern.lastIndex === match.index) {
            pattern.lastIndex++;
        }
    }

    if (!replaced) {
        return false;
    }

    if (lastIndex < text.length) {
        fragment.appendChild(doc.createTextNode(text.slice(lastIndex)));
    }

    if (typeof ensureOriginalStored === 'function') {
        ensureOriginalStored();
    }

    textNode.parentNode.replaceChild(fragment, textNode);
    return true;
}

function clearAppliedFlag(element) {
    if (!element?.dataset) return;
    delete element.dataset.cipRegexApplied;
}

function markApplied(element) {
    if (!element?.dataset) return;
    element.dataset.cipRegexApplied = '1';
}

function normalizePlacementValue(value) {
    return typeof value === 'number' && !Number.isNaN(value)
        ? value
        : DEFAULT_PLACEMENT_VALUE;
}

function getRulePlacements(rule) {
    if (!rule) return DEFAULT_RULE_PLACEMENT;
    const placements = rule.placement;
    if (Array.isArray(placements) && placements.length > 0) {
        return placements;
    }
    if (typeof placements === 'number' && !Number.isNaN(placements)) {
        return [placements];
    }
    return DEFAULT_RULE_PLACEMENT;
}

function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}

function shouldApplyRule(rule, context = {}) {
    if (!rule || rule.disabled) {
        return false;
    }

    const placementValue = normalizePlacementValue(context.placement);
    if (!getRulePlacements(rule).includes(placementValue)) {
        return false;
    }

    const isMarkdown = Boolean(context.isMarkdown);
    const isPrompt = Boolean(context.isPrompt);

    if (rule.markdownOnly && !isMarkdown) {
        return false;
    }

    if (rule.promptOnly && !isPrompt) {
        return false;
    }

    const depth = context.depth;
    if (isFiniteNumber(depth)) {
        if (isFiniteNumber(rule.minDepth) && depth < rule.minDepth) {
            return false;
        }

        if (isFiniteNumber(rule.maxDepth) && depth > rule.maxDepth) {
            return false;
        }
    }

    return true;
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
        documentRef = defaultDocument,
        placement = DEFAULT_PLACEMENT_VALUE,
        depth,
        isMarkdown = true,
        isPrompt = false,
    } = options;

    if (!enabled) {
        return restoreOriginal(element);
    }

    if (!documentRef) {
        return false;
    }

    const context = {
        placement,
        depth: isFiniteNumber(depth) ? depth : undefined,
        isMarkdown,
        isPrompt,
    };

    let replacedAny = false;
    let storedOriginal = false;

    const ensureOriginalStored = () => {
        if (storedOriginal) return;
        originalContentMap.set(element, element.innerHTML);
        storedOriginal = true;
    };

    for (const rule of REGEX_RULES) {
        if (!shouldApplyRule(rule, context)) {
            continue;
        }

        const textNodes = collectTextNodes(element, documentRef);
        if (!textNodes.length) break;

        for (const textNode of textNodes) {
            const replaced = replaceMatchesInTextNode({
                textNode,
                rule,
                documentRef,
                ensureOriginalStored,
            });
            if (replaced) {
                replacedAny = true;
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
