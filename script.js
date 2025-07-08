// script.js (v2.5 - 基于官方文档优化 & 修复交互)
(function () {
    if (document.getElementById('cip-carrot-button')) return;

    // --- 动态加载Emoji Picker库 ---
    const pickerScript = document.createElement('script');
    pickerScript.type = 'module';
    pickerScript.src = 'https://cdn.jsdelivr.net/npm/emoji-picker-element@^1/index.js';
    document.head.appendChild(pickerScript);

    // --- 1. 创建所有UI元素 (新增"模仿"和"场景"选项) ---
    function createUI() {
        const create = (tag, id, className, html) => { const el = document.createElement(tag); if (id) el.id = id; if (className) el.className = className; if (html) el.innerHTML = html; return el; };
        const carrotButton = create('div', 'cip-carrot-button', null, '🥕');
        carrotButton.title = '胡萝卜快捷输入';

        const inputPanel = create('div', 'cip-input-panel', 'cip-frosted-glass', `
            <nav id="cip-panel-tabs">
                <button class="cip-tab-button active" data-tab="text">文字信息</button>
                <button class="cip-tab-button" data-tab="voice">语音</button>
                <button class="cip-tab-button" data-tab="bunny">BUNNY</button>
                <button class="cip-tab-button" data-tab="stickers">表情包</button>
            </nav>
            <div id="cip-format-display"></div>
            <div id="cip-panel-content">
                <div id="cip-text-content" class="cip-content-section active">
                    <div class="cip-sub-options-container">
                        <button class="cip-sub-option-btn active" data-type="say">说话</button>
                        <button class="cip-sub-option-btn" data-type="impersonate">模仿</button>
                        <button class="cip-sub-option-btn" data-type="scenario">场景</button>
                        <button class="cip-sub-option-btn" data-type="image">图片</button>
                    </div>
                    <textarea id="cip-main-input" placeholder="在此输入文字..."></textarea>
                </div>
                <div id="cip-voice-content" class="cip-content-section"><input type="number" id="cip-voice-duration" placeholder="输入时长 (秒, 仅数字)"><textarea id="cip-voice-message" placeholder="输入语音识别出的内容..."></textarea></div>
                <div id="cip-bunny-content" class="cip-content-section"><textarea id="cip-bunny-input" placeholder="输入想对BUNNY说的话..."></textarea></div>
                <div id="cip-stickers-content" class="cip-content-section"><div id="cip-sticker-categories" class="cip-sub-options-container"><button id="cip-add-category-btn" class="cip-sub-option-btn">+</button></div><div id="cip-sticker-grid"></div></div>
            </div>
            <div id="cip-panel-footer"><div id="cip-emoji-picker-btn">😊</div><div class="cip-footer-actions"><button id="cip-recall-button">撤回</button><button id="cip-insert-button">插 入</button></div></div>
        `);
        const emojiPicker = create('emoji-picker', 'cip-emoji-picker', 'cip-frosted-glass');
        const addCategoryModal = create('div', 'cip-add-category-modal', 'cip-modal-backdrop hidden', `<div class="cip-modal-content cip-frosted-glass"><h3>添加新分类</h3><input type="text" id="cip-new-category-name" placeholder="输入分类名称"><div class="cip-modal-actions"><button id="cip-cancel-category-btn">取消</button><button id="cip-save-category-btn">保存</button></div></div>`);
        const addStickersModal = create('div', 'cip-add-stickers-modal', 'cip-modal-backdrop hidden', `<div class="cip-modal-content cip-frosted-glass"><h3 id="cip-add-sticker-title"></h3><p>每行一个，格式为：<br><code>表情包描述:图片链接</code></p><textarea id="cip-new-stickers-input" placeholder="可爱猫猫:https://example.com/cat.png"></textarea><div class="cip-modal-actions"><button id="cip-cancel-stickers-btn">取消</button><button id="cip-save-stickers-btn">保存</button></div></div>`);
        return { carrotButton, inputPanel, emojiPicker, addCategoryModal, addStickersModal };
    }

    // --- 2. 注入UI和获取引用 (无变化) ---
    const { carrotButton, inputPanel, emojiPicker, addCategoryModal, addStickersModal } = createUI();
    document.body.appendChild(carrotButton); document.body.appendChild(inputPanel); document.body.appendChild(emojiPicker); document.body.appendChild(addCategoryModal); document.body.appendChild(addStickersModal);
    const get = (id) => document.getElementById(id); const queryAll = (sel) => document.querySelectorAll(sel);
    const formatDisplay = get('cip-format-display'), insertButton = get('cip-insert-button'), recallButton = get('cip-recall-button'), mainInput = get('cip-main-input'), voiceDurationInput = get('cip-voice-duration'), voiceMessageInput = get('cip-voice-message'), bunnyInput = get('cip-bunny-input'), stickerCategoriesContainer = get('cip-sticker-categories'), addCategoryBtn = get('cip-add-category-btn'), stickerGrid = get('cip-sticker-grid'), emojiPickerBtn = get('cip-emoji-picker-btn');

    // --- 3. 核心逻辑 (格式更新) ---
    let currentTab = 'text', currentTextSubType = 'say', stickerData = {}, currentStickerCategory = '', selectedSticker = null;
    // 参照官方文档更新指令格式
    const formatTemplates = {
        text: {
            say: '/say {content}',
            impersonate: '/impersonate {content}',
            scenario: '/scenario {content}',
            image: '[img={content}]'
        },
        voice: "（语音时长：{duration}秒）“{message}”",
        bunny: "({content})",
        stickers: "![{desc}]({url})", // 改为标准的Markdown图片格式
        recall: '/undo' // 使用官方撤回指令
    };

    function updateFormatDisplay(){
        queryAll(".cip-category-action-icon").forEach(icon => icon.remove());
        switch(currentTab){
            case "text": formatDisplay.textContent = `格式: ${formatTemplates.text[currentTextSubType].replace("{content}", "内容")}`; break;
            case "voice": formatDisplay.textContent = "格式:（语音时长：数字秒）“内容”"; break;
            case "bunny": formatDisplay.textContent = "格式: (内容)"; break;
            case "stickers": formatDisplay.textContent = "格式: ![描述](链接)"; break;
        }
    }
    
    function insertIntoSillyTavern(text){ const textarea = document.querySelector("#send_textarea"); if(textarea) { textarea.value += (textarea.value.trim() ? "\n" : "") + text; textarea.dispatchEvent(new Event("input", { bubbles: true })); textarea.focus(); } }

    // --- 4. 事件监听 (逻辑简化和修复) ---
    queryAll('.cip-tab-button').forEach(button => button.addEventListener('click', (e) => switchTab(e.currentTarget.dataset.tab)));
    queryAll('#cip-text-content .cip-sub-option-btn').forEach(button => button.addEventListener('click', (e) => switchTextSubType(e.currentTarget.dataset.type)));
    recallButton.addEventListener('click', () => insertIntoSillyTavern(formatTemplates.recall));
    
    insertButton.addEventListener('click', () => {
        let formattedText = '', inputToClear = null, secondaryInputToClear = null;
        switch (currentTab) {
            case 'text': if (mainInput.value.trim()) { formattedText = formatTemplates.text[currentTextSubType].replace('{content}', mainInput.value); inputToClear = mainInput; } break;
            case 'voice': if (voiceDurationInput.value.trim() && voiceMessageInput.value.trim()) { formattedText = formatTemplates.voice.replace('{duration}', voiceDurationInput.value).replace('{message}', voiceMessageInput.value); inputToClear = voiceMessageInput; secondaryInputToClear = voiceDurationInput; } break;
            case 'bunny': if (bunnyInput.value.trim()) { formattedText = formatTemplates.bunny.replace('{content}', bunnyInput.value); inputToClear = bunnyInput; } break;
            case 'stickers': if (selectedSticker) { formattedText = formatTemplates.stickers.replace('{desc}', selectedSticker.desc).replace('{url}', selectedSticker.url); } break;
        }
        if (formattedText) { insertIntoSillyTavern(formattedText); if (inputToClear) inputToClear.value = ''; if (secondaryInputToClear) secondaryInputToClear.value = ''; }
    });
    
    // --- 5. 【关键修复】稳定可靠的交互处理逻辑 ---
    function showPanel() {
        if (!inputPanel.style.top && !inputPanel.style.left) { // 首次打开
            const btnRect = carrotButton.getBoundingClientRect();
            let top = btnRect.top - (inputPanel.offsetHeight || 400) - 10;
            if (top < 10) top = btnRect.bottom + 10;
            let left = btnRect.left + (btnRect.width / 2) - (inputPanel.offsetWidth || 380) / 2;
            inputPanel.style.top = `${Math.max(10, top)}px`;
            inputPanel.style.left = `${Math.max(10, left)}px`;
        }
        inputPanel.classList.add('active');
    }
    function hidePanel() { inputPanel.classList.remove('active'); }

    document.addEventListener('click', (e) => {
        if (inputPanel.classList.contains('active') && !inputPanel.contains(e.target) && !carrotButton.contains(e.target)) hidePanel();
        if (emojiPicker.style.display === 'block' && !emojiPicker.contains(e.target) && !emojiPickerBtn.contains(e.target)) emojiPicker.style.display = 'none';
    });

    emojiPickerBtn.addEventListener('click', e => { e.stopPropagation(); emojiPicker.style.display = emojiPicker.style.display === 'block' ? 'none' : 'block'; });

    function dragHandler(e) {
        let isClick = true;
        if (e.type === 'touchstart') e.preventDefault();
        const rect = carrotButton.getBoundingClientRect();
        const offsetX = (e.type.includes('mouse') ? e.clientX : e.touches[0].clientX) - rect.left;
        const offsetY = (e.type.includes('mouse') ? e.clientY : e.touches[0].clientY) - rect.top;
        
        const move = (e) => {
            isClick = false; // 只要移动了就不是点击
            carrotButton.classList.add('is-dragging');
            let newLeft = (e.type.includes('mouse') ? e.clientX : e.touches[0].clientX) - offsetX;
            let newTop = (e.type.includes('mouse') ? e.clientY : e.touches[0].clientY) - offsetY;
            newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - carrotButton.offsetWidth));
            newTop = Math.max(0, Math.min(newTop, window.innerHeight - carrotButton.offsetHeight));
            carrotButton.style.position = 'fixed'; carrotButton.style.left = `${newLeft}px`; carrotButton.style.top = `${newTop}px`;
        };
        const end = () => {
            document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', end);
            document.removeEventListener('touchmove', move); document.removeEventListener('touchend', end);
            carrotButton.classList.remove('is-dragging');
            if (isClick) { inputPanel.classList.contains('active') ? hidePanel() : showPanel(); }
            else { localStorage.setItem('cip_button_position_v4', JSON.stringify({ top: carrotButton.style.top, left: carrotButton.style.left })); }
        };
        document.addEventListener('mousemove', move); document.addEventListener('mouseup', end);
        document.addEventListener('touchmove', move, { passive: false }); document.addEventListener('touchend', end);
    }
    carrotButton.addEventListener('mousedown', dragHandler);
    carrotButton.addEventListener('touchstart', dragHandler, { passive: false });

    // --- 6. 初始化 (无变化) ---
    function loadButtonPosition() { const pos = JSON.parse(localStorage.getItem('cip_button_position_v4')); if (pos?.top && pos?.left) { carrotButton.style.top = pos.top; carrotButton.style.left = pos.left; } }
    function init() { /* ... */ switchTab('text'); updateFormatDisplay(); loadButtonPosition(); }
    init();

    // 此处省略了大量未修改的函数（如表情包分类、添加、删除等），以保持代码清晰。实际使用时请确保这些函数存在。
    function switchTab(t){currentTab=t,queryAll(".cip-tab-button").forEach(e=>e.classList.toggle("active",e.dataset.tab===t)),queryAll(".cip-content-section").forEach(e=>e.classList.toggle("active",e.id===`cip-${t}-content`)); "stickers"===t&&!currentStickerCategory&&Object.keys(stickerData).length>0&&switchStickerCategory(Object.keys(stickerData)[0]),updateFormatDisplay()}
    function switchTextSubType(t){currentTextSubType=t,queryAll("#cip-text-content .cip-sub-option-btn").forEach(e=>e.classList.toggle("active",e.dataset.type===t)),updateFormatDisplay()}
})();
