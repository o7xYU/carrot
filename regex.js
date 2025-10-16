const STORAGE_KEY = 'cip_regex_enabled_v1';
const DEFAULT_REGEX_ENABLED = true;
const originalContentMap = new WeakMap();

const defaultDocument = typeof document !== 'undefined' ? document : null;
const TEXT_NODE_FILTER =
    typeof NodeFilter !== 'undefined' ? NodeFilter.SHOW_TEXT : 4;

function createIframeWrapper(doc, html, { className = '', minHeight = 400 } = {}) {
    if (!doc) return null;
    const wrapper = doc.createElement('div');
    if (className) {
        wrapper.className = className;
    }
    wrapper.style.width = '100%';
    wrapper.style.maxWidth = '100%';
    wrapper.style.display = 'block';

    const iframe = doc.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('referrerpolicy', 'no-referrer');
    iframe.style.width = '100%';
    iframe.style.border = '0';
    iframe.style.display = 'block';
    iframe.style.backgroundColor = 'transparent';
    iframe.style.minHeight = `${minHeight}px`;
    iframe.srcdoc = html;

    iframe.addEventListener('load', () => {
        try {
            const innerDoc = iframe.contentDocument;
            if (!innerDoc) return;
            const height =
                innerDoc.body?.scrollHeight || innerDoc.documentElement?.scrollHeight;
            if (height) {
                iframe.style.height = `${height}px`;
            }
        } catch (error) {
            console.warn('胡萝卜插件：iframe 高度调整失败', error);
        }
    });

    wrapper.appendChild(iframe);
    return wrapper;
}

function serializeForScript(data) {
    return JSON.stringify(data).replace(/[<>\u2028\u2029]/g, (char) => {
        switch (char) {
            case '<':
                return '\\u003C';
            case '>':
                return '\\u003E';
function cleanTemplateContent(raw) {
    if (typeof raw !== 'string') {
        return '';
    }
    let content = raw.replace(/^\uFEFF/, '');
    content = content.replace(/^```[\r\n]*/, '').replace(/```[\r\n]*$/, '');
    return content.trim();
}
function resolveTemplateUrl(path) {
    if (
        typeof chrome !== 'undefined' &&
        chrome &&
        chrome.runtime &&
        typeof chrome.runtime.getURL === 'function'
    ) {
        return chrome.runtime.getURL(path);
    }
    return path;
}
function loadHtmlTemplate(path) {
    const url = resolveTemplateUrl(path);
    if (typeof XMLHttpRequest !== 'undefined') {
        try {
            const request = new XMLHttpRequest();
            request.open('GET', url, false);
            if (typeof request.overrideMimeType === 'function') {
                request.overrideMimeType('text/html');
            }
            request.send(null);
            const status = request.status;
            if ((status >= 200 && status < 300) || status === 0) {
                return cleanTemplateContent(request.responseText || '');
            }
        } catch (error) {
            console.warn(`胡萝卜插件：XHR 加载模板失败 ${path}`, error);
    }
    if (typeof require === 'function' && typeof __dirname !== 'undefined') {
        try {
            const fs = require('fs');
            const pathModule = require('path');
            const resolvedPath = pathModule.resolve(__dirname, path);
            if (fs.existsSync(resolvedPath)) {
                const content = fs.readFileSync(resolvedPath, 'utf8');
                return cleanTemplateContent(content);
            }
        } catch (error) {
            console.warn(`胡萝卜插件：读取本地模板失败 ${path}`, error);
    }
    return '';
}
function injectScriptIntoTemplate(template, script) {
    if (!template) {
        return '';
    }
    if (!script) {
        return template;
    }
    const closingBodyIndex = template.lastIndexOf('</body>');
    if (closingBodyIndex === -1) {
        return `${template}${script}`;
    }
    return (
        template.slice(0, closingBodyIndex) +
        script +
        template.slice(closingBodyIndex)
    );
}

let BUNNY_TEMPLATE = '';
let LOVE_TEMPLATE = '';
try {
    BUNNY_TEMPLATE = loadHtmlTemplate('bunny状态栏.html');
} catch (error) {
    console.warn('胡萝卜插件：初始化 bunny 模板失败', error);
}
try {
    LOVE_TEMPLATE = loadHtmlTemplate('爱的抱抱.html');
} catch (error) {
    console.warn('胡萝卜插件：初始化爱的抱抱模板失败', error);
}
function buildBunnyStatusBarHtml(data) {
    const payload = {
        avatar: data?.avatar || '',
        bubble: data?.bubble || '',
        crystal: data?.crystal || '',
        time: data?.time || '',
        dayNight: data?.dayNight || '',
    };
    if (BUNNY_TEMPLATE) {
        const script = `<script>
window.__BHL_BUNNY_INITIAL__ = ${serializeForScript(payload)};
(function() {
    function apply() {
        const data = window.__BHL_BUNNY_INITIAL__ || {};
        const doc = document;
        const avatarImage = doc.querySelector('.avatar-image');
        if (avatarImage) {
            avatarImage.src = data.avatar || '';

        const bubbleMain = doc.querySelector('#bubble1 .bubble-main');
        if (bubbleMain) {
            bubbleMain.textContent = data.bubble || '';
        const bubbleCrystal = doc.getElementById('bubble-crystal');
        if (bubbleCrystal) {
            bubbleCrystal.textContent = data.crystal || '';
        const timeDisplay = doc.getElementById('timeDisplay');
        if (timeDisplay) {
            timeDisplay.textContent = data.time || '';
        const bubbleDayNight = doc.getElementById('bubble-day-night');
        if (bubbleDayNight) {
            bubbleDayNight.textContent = data.dayNight || '';
        if (typeof setInitialState === 'function') {
            try {
                setInitialState();
            } catch (error) {
                console.warn('胡萝卜插件：初始化 bunny 状态栏失败', error);
            }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', apply, { once: true });
    } else {
        apply();
    }
})();
</script>`;
        return injectScriptIntoTemplate(BUNNY_TEMPLATE, script);
    }
    return `<div class="bhl-bunny-fallback">
        <div>Avatar: ${payload.avatar}</div>
        <div>Bubble: ${payload.bubble}</div>
        <div>Crystal: ${payload.crystal}</div>
        <div>Time: ${payload.time}</div>
        <div>Day/Night: ${payload.dayNight}</div>
    </div>`;
}

function buildLoveStatusHtml(data) {
    const payload = {
        pose: data?.pose || '',
        penis: data?.penis || '',
        speed: data?.speed || '',
        depthText: data?.depthText || '',
        suck: data?.suck || '',
        knead: data?.knead || '',
        hands: data?.hands || '',
    };
    if (LOVE_TEMPLATE) {
        const script = `<script>
window.__BHL_LOVE_INITIAL__ = ${serializeForScript(payload)};
(function() {
    function apply() {
        const data = window.__BHL_LOVE_INITIAL__ || {};

        if (typeof updateQQStatus === 'function') {
            try {
                updateQQStatus(data);
            } catch (error) {
                console.warn('胡萝卜插件：应用爱的抱抱数据失败', error);
        const doc = document;
        const suckSub = doc.querySelector('.pulses .pulse-card:first-child .pulse-sub');
        if (suckSub) {
            suckSub.textContent = String(data.suck || 0) + '/100';
        const kneadSub = doc.querySelector('.pulses .pulse-card:last-child .pulse-sub');
        if (kneadSub) {
            kneadSub.textContent = String(data.knead || 0) + '/100';
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', apply, { once: true });
    } else {
        apply();
    }
})();
</script>`;
        return injectScriptIntoTemplate(LOVE_TEMPLATE, script);
    }
    return `<div class="bhl-love-fallback">
        <div>体位: ${payload.pose}</div>
        <div>鸡鸡状态: ${payload.penis}</div>
        <div>抽插速度: ${payload.speed}</div>
        <div>位置描述: ${payload.depthText}</div>
        <div>吮吸力度: ${payload.suck}</div>
        <div>揉捏力度: ${payload.knead}</div>
        <div>抓握位置: ${payload.hands}</div>
    </div>`;


      function syncUI() {
        if (el.poseImg) el.poseImg.src = resolvePoseImg(state.pose);
        if (el.poseName) el.poseName.textContent = state.pose || '';
        if (el.detail2) el.detail2.textContent = state.penis || '';
        if (el.detail3) el.detail3.textContent = state.speed || '';
        if (el.detail4) el.detail4.textContent = state.depthText || '';
        if (el.detail5) el.detail5.textContent = state.suck || '';
        if (el.detail6) el.detail6.textContent = state.knead || '';
        if (el.detail7) el.detail7.textContent = state.hands || '';
      }

      let rafId = null, t = 0;
      function animate(now) {
        if (!animate.last) animate.last = now;
        const dt = (now - animate.last) / 1000;
        animate.last = now;

        const speed = num(state.speed);
        const v = Math.max(0, Math.min(100, speed)) * 0.1;
        const target = tgtPct();

        t += dt * v;
        const tri = 1 - Math.abs((t % 2) - 1);
        const cur = tri * Math.max(0, target);
        if (el.meterFill) el.meterFill.style.width = cur + '%';
        if (el.meterTarget) el.meterTarget.style.left = target + '%';

        const w = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI);
        const baseScale = 0.9 + 0.2 * w;
        const s5 = 0.85 + 0.003 * Math.max(0, Math.min(100, num(state.suck)));
        const s6 = 0.85 + 0.003 * Math.max(0, Math.min(100, num(state.knead)));
        const scale5 = baseScale * s5;
        const scale6 = baseScale * s6;
        if (el.pulse5) el.pulse5.style.transform = 'scale(' + scale5 + ')';
        if (el.pulse6) el.pulse6.style.transform = 'scale(' + scale6 + ')';

        rafId = requestAnimationFrame(animate);
      }

      window.updateQQStatus = function ({ pose, penis, speed, depthText, suck, knead, hands }) {
        if (pose !== undefined) state.pose = pose;
        if (penis !== undefined) state.penis = penis;
        if (speed !== undefined) state.speed = speed;
        if (depthText !== undefined) state.depthText = depthText;
        if (suck !== undefined) state.suck = suck;
        if (knead !== undefined) state.knead = knead;
        if (hands !== undefined) state.hands = hands;
        syncUI();
      };

      window.addEventListener('beforeunload', () => {
        if (rafId) cancelAnimationFrame(rafId);
      });
    </script>
  </body>
</html>`;
}

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
    {
        id: 'bhl-bunny-status',
        pattern: /<bunny>\s*(.*?)\s*(.*?)\s*(.*?)\s*(.*?)\s*(.*?)\s*<\/bunny>/gis,
        createNode({ documentRef, groups }) {
            const doc = documentRef || defaultDocument;
            if (!doc) return null;
            const normalized = Array.from(groups || [], (value) =>
                typeof value === 'string' ? value.trim() : '',
            );
            const [avatar = '', bubble = '', crystal = '', time = '', dayNight = ''] = normalized;
            const html = buildBunnyStatusBarHtml({
                avatar,
                bubble,
                crystal,
                time,
                dayNight,
            });
            return createIframeWrapper(doc, html, {
                className: 'cip-bhl-iframe cip-bhl-bunny-status',
                minHeight: 360,
            });
        },
    },
    {
        id: 'bhl-love-hug',
        pattern:
            /<QQ_LOVE>\s*体位:(.*?)\s*鸡鸡状态:(.*?)\s*抽插速度:(.*?)\s*位置描述:(.*?)\s*吮吸力度:(.*?)\s*揉捏力度:(.*?)\s*抓握位置:(.*?)\s*<\/QQ_LOVE>/gis,
        createNode({ documentRef, groups }) {
            const doc = documentRef || defaultDocument;
            if (!doc) return null;
            const normalized = Array.from(groups || [], (value) =>
                typeof value === 'string' ? value.trim() : '',
            );
            const [
                pose = '',
                penis = '',
                speed = '',
                depthText = '',
                suck = '',
                knead = '',
                hands = '',
            ] = normalized;
            const html = buildLoveStatusHtml({
                pose,
                penis,
                speed,
                depthText,
                suck,
                knead,
                hands,
            });
            return createIframeWrapper(doc, html, {
                className: 'cip-bhl-iframe cip-bhl-love-status',
                minHeight: 520,
            });
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
