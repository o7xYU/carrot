const STORAGE_KEY = 'cip_regex_enabled_v1';
const DEFAULT_REGEX_ENABLED = true;
const originalContentMap = new WeakMap();

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
    {
        id: 'eden-details',
        pattern:
            /<伊甸园>\s*<time>(.*?)<\/time>\s*<location>(.*?)<\/location>\s*<character>\s*<AAA>\s*阶段：(.*?)\s*第(.*?)天\s*<\/AAA>\s*<namestr>(.*?)<\/namestr>\s*<appearance>\s*种族\|(.*?)\s*年龄\|(.*?)\s*<\/appearance>\s*<SSS>\s*小穴\|(.*?)\s*子宫\|(.*?)\s*菊穴\|(.*?)\s*直肠\|(.*?)\s*乳房\|(.*?)\s*特质\|(.*?)\s*<\/SSS>\s*<reproduction>\s*精子\|(.*?)\s*卵子\|(.*?)\s*胎数\|(.*?)\s*父亲\|(.*?)\s*健康\|(.*?)\s*供养\|(.*?)\s*反应\|(.*?)\s*<\/reproduction>\s*<\/character>\s*<\/伊甸园>/gs,
        createNode({ documentRef, groups }) {
            const doc = documentRef || defaultDocument;
            if (!doc) return null;

            const safeGroups = groups.map((value) => (value ?? '').trim());

            const fragment = doc.createDocumentFragment();
            const details = doc.createElement('details');
            details.setAttribute('close', '');

            const summary = doc.createElement('summary');
            summary.textContent = 'ʚ 伊甸园 ɞ';
            details.appendChild(summary);

            const container = doc.createElement('div');
            container.setAttribute(
                'style',
                "background-image:url('https://i.postimg.cc/138zqs7B/20250912145334-89-154.jpg'); background-size:cover; background-position:center; border-radius:12px; padding:1px; margin:2px auto; border:2px solid #d1d9e6; box-shadow:2px 2px 5px rgba(0,0,0,0.1); max-width:480px; color:#D17B88; position:relative; font-size:16px; contain:paint;",
            );

            const titleRow = doc.createElement('div');
            titleRow.setAttribute(
                'style',
                'display:flex; justify-content:center; align-items:center; gap:8px; margin-bottom:8px; font-size:20px; font-weight:bold; background-color:rgba(255,255,255,0.8); border-radius:4px; padding:4px;',
            );

            const timeSpan = doc.createElement('span');
            timeSpan.textContent = safeGroups[0];
            titleRow.appendChild(timeSpan);

            const bunnySpan = doc.createElement('span');
            bunnySpan.className = 'float';
            bunnySpan.setAttribute(
                'style',
                'cursor:pointer; font-size:20px; will-change:transform;',
            );
            bunnySpan.textContent = '🐰';
            titleRow.appendChild(bunnySpan);

            const locationSpan = doc.createElement('span');
            locationSpan.textContent = safeGroups[1];
            titleRow.appendChild(locationSpan);

            container.appendChild(titleRow);

            const nameDiv = doc.createElement('div');
            nameDiv.setAttribute(
                'style',
                'text-align:center; margin-bottom:4px; font-weight:bold; font-size:20px;',
            );
            nameDiv.textContent = safeGroups[4];
            container.appendChild(nameDiv);

            const stageWrapper = doc.createElement('div');
            stageWrapper.setAttribute(
                'style',
                'margin-bottom:8px; padding:6px; background-color:rgba(187,219,209,0.7); border-radius:4px; text-align:center; font-weight:bold; font-size:16px;',
            );

            const stageDiv = doc.createElement('div');
            stageDiv.textContent = `阶段：${safeGroups[2]}`;
            stageWrapper.appendChild(stageDiv);

            const dayDiv = doc.createElement('div');
            dayDiv.textContent = `第 ${safeGroups[3]} 天`;
            stageWrapper.appendChild(dayDiv);

            container.appendChild(stageWrapper);

            const appearanceDiv = doc.createElement('div');
            appearanceDiv.setAttribute(
                'style',
                'text-align:center; margin-bottom:8px; background-color:rgba(255,255,255,0.7); border-radius:4px; padding:4px 8px; font-size:14px; line-height:1.5;',
            );

            const appearanceFields = [
                `种族 | ${safeGroups[5]}`,
                `年龄 | ${safeGroups[6]}`,
                '身高 | 165cm',
                '体重 | 75kg',
                '三围 | 95E / 110 / 90',
            ];
            for (const text of appearanceFields) {
                const div = doc.createElement('div');
                div.textContent = text;
                appearanceDiv.appendChild(div);
            }

            container.appendChild(appearanceDiv);

            const physiologyDetails = doc.createElement('details');
            physiologyDetails.setAttribute('style', 'margin-bottom:8px;');
            physiologyDetails.appendChild(
                createEdenSectionSummary(doc, '生理信息'),
            );

            const physiologyBody = doc.createElement('div');
            physiologyBody.setAttribute(
                'style',
                'padding:6px; font-size:14px; line-height:1.5; border-radius:4px; margin-top:4px; background-color:rgba(255,255,255,0.5);',
            );

            const physiologyFields = [
                `小穴 | ${safeGroups[7]}`,
                `子宫 | ${safeGroups[8]}`,
                `菊穴 | ${safeGroups[9]}`,
                `直腸 | ${safeGroups[10]}`,
                `乳房 | ${safeGroups[11]}`,
                `特质 | ${safeGroups[12]}`,
            ];
            for (const text of physiologyFields) {
                const div = doc.createElement('div');
                div.textContent = text;
                physiologyBody.appendChild(div);
            }

            physiologyDetails.appendChild(physiologyBody);
            container.appendChild(physiologyDetails);

            const reproductionDetails = doc.createElement('details');
            reproductionDetails.setAttribute('style', 'margin-bottom:8px;');
            reproductionDetails.appendChild(
                createEdenSectionSummary(doc, '生殖信息'),
            );

            const reproductionBody = doc.createElement('div');
            reproductionBody.setAttribute(
                'style',
                'padding:6px; font-size:14px; line-height:1.5; border-radius:4px; margin-top:4px; background-color:rgba(255,255,255,0.5);',
            );

            const reproductionFields = [
                `精子 | ${safeGroups[13]}`,
                `卵子 | ${safeGroups[14]}`,
                `胎数 | ${safeGroups[15]}`,
                `父亲 | ${safeGroups[16]}`,
                `健康 | ${safeGroups[17]}`,
                `供养 | ${safeGroups[18]}`,
                `反应 | ${safeGroups[19]}`,
            ];
            for (const text of reproductionFields) {
                const div = doc.createElement('div');
                div.textContent = text;
                reproductionBody.appendChild(div);
            }

            reproductionDetails.appendChild(reproductionBody);
            container.appendChild(reproductionDetails);

            details.appendChild(container);
            fragment.appendChild(details);

            markRegexNode(fragment, 'eden-details');
            return fragment;
        },
    },
];

function createEdenSectionSummary(doc, label) {
    const summary = doc.createElement('summary');
    summary.setAttribute(
        'style',
        'cursor:pointer; font-weight:bold; text-align:center; padding:6px; border-radius:4px; list-style:none; background-color:rgba(191,225,211,0.7);',
    );

    const leftSpan = doc.createElement('span');
    leftSpan.className = 'float';
    leftSpan.setAttribute('style', 'display:inline-block; will-change:transform;');
    leftSpan.textContent = 'ʚ';
    summary.appendChild(leftSpan);

    summary.appendChild(doc.createTextNode(` ${label} `));

    const rightSpan = doc.createElement('span');
    rightSpan.className = 'float';
    rightSpan.setAttribute('style', 'display:inline-block; will-change:transform;');
    rightSpan.textContent = 'ɞ';
    summary.appendChild(rightSpan);

    return summary;
}

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
    } = options;

    if (!enabled) {
        return restoreOriginal(element);
    }

    if (!documentRef) {
        return false;
    }

    let replacedAny = false;
    let storedOriginal = false;

    const ensureOriginalStored = () => {
        if (storedOriginal) return;
        originalContentMap.set(element, element.innerHTML);
        storedOriginal = true;
    };

    for (const rule of REGEX_RULES) {
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