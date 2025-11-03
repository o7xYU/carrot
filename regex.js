import { getRegexedString, regexFromString, regex_placement } from './engine.js';

const STORAGE_KEY = 'cip_regex_enabled_v1';
const DEFAULT_REGEX_ENABLED = true;
const originalContentMap = new WeakMap();

const REGEX_SCRIPTS = [
    {
        id: '1',
        scriptName: 'BHL-撤回',
        disabled: false,
        runOnEdit: true,
        findRegex: '/^-(.*?)-$/gm',
        replaceString: `<div style="text-align: center; margin-bottom: 6px;">
  <details style="display: inline-block;">
    <summary style="color: #999999; font-style: italic; font-size: 13px; cursor: pointer; list-style: none; -webkit-tap-highlight-color: transparent;">
      对方撤回了一条消息
    </summary>

    <div style="padding: 8px 12px; margin-top: 8px; background-color: rgba(0,0,0,0.04); border-radius: 10px; text-align: left;">
      <p style="margin: 0; color: #555; font-style: normal; font-size: 14px; line-height: 1.4;">
        $1
      </p>
    </div>

  </details>

</div>`,
        trimStrings: [],
        placement: [
            regex_placement.USER_INPUT,
            regex_placement.AI_OUTPUT,
        ],
        substituteRegex: 0,
        minDepth: null,
        maxDepth: 2,
        markdownOnly: true,
        promptOnly: false,
    },
    {
        id: '2',
        scriptName: 'BHL-时间戳',
        disabled: false,
        runOnEdit: true,
        findRegex: '/^『(.*?) \\|(.*?)』$/gm',
        replaceString: `<div style="text-align: center; color: #8e8e93; font-family: 'linja waso', sans-serif; font-size: 13px; margin: 9px 0;">
  $1   $2
</div>`,
        trimStrings: [],
        placement: [
            regex_placement.USER_INPUT,
            regex_placement.AI_OUTPUT,
        ],
        substituteRegex: 0,
        minDepth: null,
        maxDepth: 2,
        markdownOnly: true,
        promptOnly: false,
    },
    {
        id: '3',
        scriptName: 'BHL-系统提示',
        disabled: false,
        runOnEdit: true,
        findRegex: '/\\+(.*?)\\+/g',
        replaceString: `<div style="text-align: center; color: #888888; font-size: 14px; margin: 10px 0;">系统提示：$1</div>`,
        trimStrings: [],
        placement: [
            regex_placement.USER_INPUT,
            regex_placement.AI_OUTPUT,
        ],
        substituteRegex: 0,
        minDepth: null,
        maxDepth: 2,
        markdownOnly: true,
        promptOnly: false,
    },
    {
        id: '4',
        scriptName: 'BHL-char气泡（水滴+头像）',
        disabled: false,
        runOnEdit: true,
        findRegex: '/^"(.*?)"$/gm',
        replaceString: `<div class="char_bubble"><div style="display: flex;margin-bottom: 18px;align-items: flex-start;position: relative;animation: message-pop 0.3s ease-out;">   <div class="B_C_avar" style="width: 40px; height: 40px; flex-shrink: 0; border-radius: 50%; padding: 5px 5px; overflow: hidden; margin-right: 10px; background-image: url('https://i.postimg.cc/nhqSPb2R/640-1.jpg'); background-size: cover; background-position: center;">  </div>  <div style="padding: 10px 14px;border-radius: 24px !important;line-height: 1.4;border-bottom-left-radius: 24px !important; word-wrap: break-word;position:relative;transition: transform 0.2s;background: transparent !important;box-shadow:-4px 4px 8px rgba(0, 0, 0, 0.10),2px -2px 4px rgba(255, 255, 255, 0.3),inset -6px 6px 8px rgba(0, 0, 0, 0.10), inset 6px -6px 8px rgba(255, 255, 255, 0.5) !important;;border: 1px solid rgba(200, 200, 200,0.3) !important;"><span style="position: absolute;top: 5px; left: auto;right: 5px; width: 12px;height: 6px;background: white;border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;opacity: 0.9; z-index: 2; transform: rotate(45deg);"></span> $1  <span style="position: absolute;top: 15px; left: auto;right: 5px; width: 4px;height: 4px;background: white;border-radius: 50%;opacity: 0.6; z-index: 2;"> </span></div></div></div>`,
        trimStrings: [],
        placement: [
            regex_placement.USER_INPUT,
            regex_placement.AI_OUTPUT,
        ],
        substituteRegex: 0,
        minDepth: null,
        maxDepth: 2,
        markdownOnly: true,
        promptOnly: false,
    },
];

function markApplied(element) {
    if (!element?.dataset) return;
    element.dataset.cipRegexApplied = '1';
}

function clearApplied(element) {
    if (!element?.dataset) return;
    delete element.dataset.cipRegexApplied;
}

function restoreOriginal(element) {
    if (!element) return false;

    const stored = originalContentMap.get(element);
    if (!stored) {
        clearApplied(element);
        return false;
    }

    if (element.innerHTML !== stored.html) {
        element.innerHTML = stored.html;
    }

    clearApplied(element);
    return true;
}

export function getRegexEnabled() {
    try {
        if (typeof localStorage === 'undefined') {
            return DEFAULT_REGEX_ENABLED;
        }

        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === null) {
            return DEFAULT_REGEX_ENABLED;
        }

        return stored === 'true';
    } catch (error) {
        console.warn('胡萝卜插件：读取正则开关失败', error);
        return DEFAULT_REGEX_ENABLED;
    }
}

export function setRegexEnabled(enabled) {
    try {
        if (typeof localStorage === 'undefined') {
            return;
        }

        localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    } catch (error) {
        console.warn('胡萝卜插件：写入正则开关失败', error);
    }
}

function ensureOriginalStored(element) {
    if (!element) {
        return;
    }

    const hasApplied = element.dataset?.cipRegexApplied === '1';
    const currentHtml = element.innerHTML;
    const currentText = element.textContent ?? '';
    const stored = originalContentMap.get(element);

    if (!stored) {
        originalContentMap.set(element, { html: currentHtml, text: currentText });
        return;
    }

    if (!hasApplied && (stored.html !== currentHtml || stored.text !== currentText)) {
        stored.html = currentHtml;
        stored.text = currentText;
    }
}

function escapeHtml(value) {
    const stringValue = typeof value === 'string' ? value : String(value ?? '');
    return stringValue
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/ {2}/g, ' &nbsp;');
}

function buildSegmentsFromText(text, regexOptions) {
    if (typeof text !== 'string' || text.length === 0) {
        return { html: text ?? '', changed: false };
    }

    const lines = text.split(/\r?\n/);
    const segments = [];
    let changed = false;

    lines.forEach((line) => {
        const processedLine = getRegexedString(
            line,
            regexOptions.placement,
            REGEX_SCRIPTS,
            {
                isMarkdown: regexOptions.isMarkdown,
                isPrompt: regexOptions.isPrompt,
                isEdit: regexOptions.isEdit,
                depth: regexOptions.depth,
            },
        );

        const lineChanged = typeof processedLine === 'string' && processedLine !== line;
        if (lineChanged) {
            changed = true;
            segments.push({ content: processedLine, isHtml: true });
        } else {
            const escaped = escapeHtml(line);
            segments.push({ content: escaped, isHtml: false });
        }
    });

    let html = '';
    segments.forEach((segment, index) => {
        if (index > 0) {
            const prev = segments[index - 1];
            if (!segment.isHtml || !prev.isHtml) {
                html += '<br>';
            }
        }

        html += segment.content;
    });

    const endsWithNewline = /\r?\n$/.test(text);
    const lastLine = lines[lines.length - 1];
    if (endsWithNewline && lastLine !== '') {
        html += '<br>';
    }

    return { html, changed };
}

function buildRegexOptions(options = {}) {
    const {
        placement = regex_placement.AI_OUTPUT,
        isMarkdown = true,
        isPrompt = false,
        isEdit = false,
        depth = 0,
    } = options;

    return {
        placement,
        isMarkdown,
        isPrompt,
        isEdit,
        depth,
    };
}

export function applyRegexReplacements(element, options = {}) {
    if (!element) {
        return false;
    }

    const { enabled = true } = options;

    ensureOriginalStored(element);
    const stored = originalContentMap.get(element);

    if (!enabled) {
        return restoreOriginal(element);
    }

    const regexOptions = buildRegexOptions(options);
    const sourceText = stored?.text ?? element.textContent ?? '';

    try {
        const { html, changed } = buildSegmentsFromText(sourceText, regexOptions);

        if (!changed) {
            if (element.dataset?.cipRegexApplied === '1') {
                restoreOriginal(element);
            }

            return false;
        }

        if (element.innerHTML !== html) {
            element.innerHTML = html;
        }

        markApplied(element);
        return true;
    } catch (error) {
        console.warn('胡萝卜插件：正则替换失败，恢复原始文本', error);
        restoreOriginal(element);
        return false;
    }
}

export function getRegexScripts() {
    return REGEX_SCRIPTS.slice();
}

export function regexTest(value, script) {
    const targetScript = script ?? null;
    const findRegex = regexFromString(targetScript?.findRegex);
    if (!findRegex) {
        return false;
    }

    return findRegex.test(value);
}

export default {
    applyRegexReplacements,
    getRegexEnabled,
    setRegexEnabled,
    getRegexScripts,
};

export { regex_placement };
