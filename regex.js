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
        id: 'eden-entry',
        pattern: /<伊甸园>([\s\S]*?)(?:<\/伊甸园>|$)/gm,
        createNode({ documentRef, groups }) {
            const doc = documentRef || defaultDocument;
            if (!doc) return null;

            const rawBlock = groups[0] ?? '';

            const stripTags = (value) =>
                (value ?? '').replace(/<\/?[^>]+>/g, '\n');

            const normalize = (value) => (value ?? '').trim();

            const sanitizedLines = stripTags(rawBlock)
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter((line) => line.length > 0);

            const parsed = {
                time: '',
                location: '',
                stage: '',
                day: '',
                name: '',
                race: '',
                age: '',
                smallHole: '',
                uterus: '',
                anus: '',
                rectum: '',
                breast: '',
                trait: '',
                sperm: '',
                egg: '',
                fetus: '',
                father: '',
                health: '',
                support: '',
                reaction: '',
            };

            if (sanitizedLines.length > 0) {
                const timeRegex =
                    /(\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2})(?:\s+(.+))?/;
                const timeIndex = sanitizedLines.findIndex((line) =>
                    timeRegex.test(line),
                );

                if (timeIndex !== -1) {
                    const timeLocationMatch = sanitizedLines[timeIndex].match(
                        timeRegex,
                    );
                    parsed.time = timeLocationMatch?.[1] ?? '';
                    parsed.location = timeLocationMatch?.[2] ?? '';
                }

                let index = timeIndex !== -1 ? timeIndex + 1 : 0;
                let dataStart = sanitizedLines.length;

                for (; index < sanitizedLines.length; index += 1) {
                    const line = sanitizedLines[index];

                    if (!parsed.stage) {
                        const stageMatch = line.match(/阶段[:：]\s*(.*)/);
                        if (stageMatch) {
                            const stageContent = stageMatch[1] ?? '';
                            const dayFromStage = stageContent.match(/(第.+)$/);
                            if (dayFromStage && !parsed.day) {
                                parsed.day = dayFromStage[1];
                            }
                            parsed.stage = stageContent
                                .replace(/\s*第.+$/, '')
                                .trim();
                            continue;
                        }
                    }

                    if (!parsed.day && /^第.+/.test(line)) {
                        parsed.day = line;
                        continue;
                    }

                    if (
                        !parsed.name &&
                        !line.includes('|') &&
                        !/阶段[:：]/.test(line)
                    ) {
                        parsed.name = line;
                        continue;
                    }

                    if (line.includes('|')) {
                        dataStart = index;
                        break;
                    }
                }

                if (dataStart === sanitizedLines.length) {
                    dataStart = index;
                }

                for (let i = dataStart; i < sanitizedLines.length; i += 1) {
                    const line = sanitizedLines[i];
                    const [label, ...rest] = line.split('|');
                    if (!label || rest.length === 0) continue;

                    const value = rest.join('|').trim();
                    const cleanLabel = label.trim();

                    switch (cleanLabel) {
                        case '种族':
                            parsed.race = value;
                            break;
                        case '年龄':
                            parsed.age = value;
                            break;
                        case '小穴':
                            parsed.smallHole = value;
                            break;
                        case '子宫':
                            parsed.uterus = value;
                            break;
                        case '菊穴':
                            parsed.anus = value;
                            break;
                        case '直肠':
                        case '直腸':
                            parsed.rectum = value;
                            break;
                        case '乳房':
                            parsed.breast = value;
                            break;
                        case '特质':
                            parsed.trait = value;
                            break;
                        case '精子':
                            parsed.sperm = value;
                            break;
                        case '卵子':
                            parsed.egg = value;
                            break;
                        case '胎数':
                            parsed.fetus = value;
                            break;
                        case '父亲':
                            parsed.father = value;
                            break;
                        case '健康':
                            parsed.health = value;
                            break;
                        case '供养':
                            parsed.support = value;
                            break;
                        case '反应':
                            parsed.reaction = value;
                            break;
                        default:
                            break;
                    }
                }
            }

            const fragment = doc.createDocumentFragment();

            const styleEl = doc.createElement('style');
            styleEl.textContent =
                '@keyframes float-vertical {\n  0%, 100% { transform: translateY(0); }\n  50%      { transform: translateY(-3px); }\n}\ndetails[open] summary .float {\n  animation: float-vertical 2.5s ease-in-out infinite;\n}';

            const details = doc.createElement('details');
            details.setAttribute('close', '');

            const summary = doc.createElement('summary');
            summary.textContent = 'ʚ 伊甸园 ɞ';

            const card = doc.createElement('div');
            card.style.cssText =
                "background-image:url('https://i.postimg.cc/138zqs7B/20250912145334-89-154.jpg'); background-size:cover; background-position:center; border-radius:12px; padding:1px; margin:2px auto; border:2px solid #d1d9e6; box-shadow:2px 2px 5px rgba(0,0,0,0.1); max-width:480px; color:#D17B88; position:relative; font-size:16px; contain:paint;";

            const header = doc.createElement('div');
            header.style.cssText =
                'display:flex; justify-content:center; align-items:center; gap:8px; margin-bottom:8px; font-size:20px; font-weight:bold; background-color:rgba(255,255,255,0.8); border-radius:4px; padding:4px;';

            const timeSpan = doc.createElement('span');
            timeSpan.textContent = normalize(parsed.time);

            const bunnySpan = doc.createElement('span');
            bunnySpan.className = 'float';
            bunnySpan.textContent = '🐰';
            bunnySpan.style.cssText =
                'cursor:pointer; font-size:20px; will-change:transform;';

            const locationSpan = doc.createElement('span');
            locationSpan.textContent = normalize(parsed.location);

            header.appendChild(timeSpan);
            header.appendChild(bunnySpan);
            header.appendChild(locationSpan);

            const nameDiv = doc.createElement('div');
            nameDiv.style.cssText =
                'text-align:center; margin-bottom:4px; font-weight:bold; font-size:20px;';
            nameDiv.textContent = normalize(parsed.name);

            const stageDiv = doc.createElement('div');
            stageDiv.style.cssText =
                'margin-bottom:8px; padding:6px; background-color:rgba(187,219,209,0.7); border-radius:4px; text-align:center; font-weight:bold; font-size:16px;';

            const stageLine = doc.createElement('div');
            const normalizedStage = normalize(parsed.stage);
            stageLine.textContent = normalizedStage
                ? `阶段：${normalizedStage}`
                : '';
            if (!normalizedStage) {
                stageLine.style.display = 'none';
            }

            const dayLine = doc.createElement('div');
            const rawDay = normalize(parsed.day);
            const dayDisplay = rawDay
                ? /^第.+/.test(rawDay)
                    ? rawDay
                    : `第 ${rawDay} 天`
                : '';
            dayLine.textContent = dayDisplay;
            if (!dayDisplay) {
                dayLine.style.display = 'none';
            }

            stageDiv.appendChild(stageLine);
            stageDiv.appendChild(dayLine);
            if (!normalizedStage && !dayDisplay) {
                stageDiv.style.display = 'none';
            }

            const statsDiv = doc.createElement('div');
            statsDiv.style.cssText =
                'text-align:center; margin-bottom:8px; background-color:rgba(255,255,255,0.7); border-radius:4px; padding:4px 8px; font-size:14px; line-height:1.5;';

            const statsLines = [
                parsed.race && `种族 | ${normalize(parsed.race)}`,
                parsed.age && `年龄 | ${normalize(parsed.age)}`,
                '身高 | 165cm',
                '体重 | 75kg',
                '三围 | 95E / 110 / 90',
            ].filter(Boolean);

            for (const text of statsLines) {
                const line = doc.createElement('div');
                line.textContent = text;
                statsDiv.appendChild(line);
            }

            const createFloatSpan = (content) => {
                const span = doc.createElement('span');
                span.className = 'float';
                span.textContent = content;
                span.style.display = 'inline-block';
                span.style.willChange = 'transform';
                return span;
            };

            const createInfoDetails = (title, entries) => {
                const detailsEl = doc.createElement('details');
                detailsEl.style.marginBottom = '8px';

                const summaryEl = doc.createElement('summary');
                summaryEl.style.cursor = 'pointer';
                summaryEl.style.fontWeight = 'bold';
                summaryEl.style.textAlign = 'center';
                summaryEl.style.padding = '6px';
                summaryEl.style.borderRadius = '4px';
                summaryEl.style.listStyle = 'none';
                summaryEl.style.backgroundColor =
                    'rgba(191,225,211,0.7)';

                const leftSpan = createFloatSpan('ʚ');
                const rightSpan = createFloatSpan('ɞ');

                summaryEl.appendChild(leftSpan);
                summaryEl.appendChild(doc.createTextNode(` ${title} `));
                summaryEl.appendChild(rightSpan);

                const contentEl = doc.createElement('div');
                contentEl.style.padding = '6px';
                contentEl.style.fontSize = '14px';
                contentEl.style.lineHeight = '1.5';
                contentEl.style.borderRadius = '4px';
                contentEl.style.marginTop = '4px';
                contentEl.style.backgroundColor =
                    'rgba(255,255,255,0.5)';

                let hasContent = false;
                for (const [label, value] of entries) {
                    const normalizedValue = normalize(value);
                    if (!normalizedValue) continue;
                    hasContent = true;
                    const entryDiv = doc.createElement('div');
                    entryDiv.textContent = `${label} | ${normalizedValue}`;
                    contentEl.appendChild(entryDiv);
                }

                if (!hasContent) {
                    return null;
                }

                detailsEl.appendChild(summaryEl);
                detailsEl.appendChild(contentEl);

                return detailsEl;
            };

            const biologyDetails = createInfoDetails('生理信息', [
                ['小穴', parsed.smallHole],
                ['子宫', parsed.uterus],
                ['菊穴', parsed.anus],
                ['直腸', parsed.rectum],
                ['乳房', parsed.breast],
                ['特质', parsed.trait],
            ]);

            const reproductionDetails = createInfoDetails('生殖信息', [
                ['精子', parsed.sperm],
                ['卵子', parsed.egg],
                ['胎数', parsed.fetus],
                ['父亲', parsed.father],
                ['健康', parsed.health],
                ['供养', parsed.support],
                ['反应', parsed.reaction],
            ]);

            card.appendChild(header);
            card.appendChild(nameDiv);
            card.appendChild(stageDiv);
            card.appendChild(statsDiv);
            if (biologyDetails) {
                card.appendChild(biologyDetails);
            }
            if (reproductionDetails) {
                card.appendChild(reproductionDetails);
            }

            details.appendChild(summary);
            details.appendChild(card);

            fragment.appendChild(styleEl);
            fragment.appendChild(details);

            return fragment;
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