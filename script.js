// script.js (v2.4 - 完全采用范例插件的交互模式)
(function () {
    if (document.getElementById('cip-carrot-button')) return;

    // --- 动态加载Emoji Picker库 ---
    const pickerScript = document.createElement('script');
    pickerScript.type = 'module';
    pickerScript.src = 'https://cdn.jsdelivr.net/npm/emoji-picker-element@^1/index.js';
    document.head.appendChild(pickerScript);

    // --- 1. 创建UI元素 ---
    // (代码与之前相同，此处为完整性保留)
    function createUI() {
        const create = (tag, id, className, html) => { const el = document.createElement(tag); if (id) el.id = id; if (className) el.className = className; if (html) el.innerHTML = html; return el; };
        const carrotButton = create('div', 'cip-carrot-button', null, '🥕'); carrotButton.title = '快捷输入';
        const inputPanel = create('div', 'cip-input-panel', 'cip-frosted-glass', `<nav id="cip-panel-tabs"><button class="cip-tab-button active" data-tab="text">文字信息</button><button class="cip-tab-button" data-tab="voice">语音</button><button class="cip-tab-button" data-tab="bunny">BUNNY</button><button class="cip-tab-button" data-tab="stickers">表情包</button></nav><div id="cip-format-display"></div><div id="cip-panel-content"><div id="cip-text-content" class="cip-content-section active"><div class="cip-sub-options-container"><button class="cip-sub-option-btn active" data-type="plain">纯文本</button><button class="cip-sub-option-btn" data-type="image">图片</button><button class="cip-sub-option-btn" data-type="video">视频</button><button class="cip-sub-option-btn" data-type="music">音乐</button><button class="cip-sub-option-btn" data-type="post">帖子</button></div><textarea id="cip-main-input" placeholder="在此输入文字..."></textarea></div><div id="cip-voice-content" class="cip-content-section"><input type="number" id="cip-voice-duration" placeholder="输入时长 (秒, 仅数字)"><textarea id="cip-voice-message" placeholder="输入语音识别出的内容..."></textarea></div><div id="cip-bunny-content" class="cip-content-section"><textarea id="cip-bunny-input" placeholder="在此输入想对BUNNY说的话..."></textarea></div><div id="cip-stickers-content" class="cip-content-section"><div id="cip-sticker-categories" class="cip-sub-options-container"><button id="cip-add-category-btn" class="cip-sub-option-btn">+</button></div><div id="cip-sticker-grid"></div></div></div><div id="cip-panel-footer"><div id="cip-emoji-picker-btn">😊</div><div class="cip-footer-actions"><button id="cip-recall-button">撤回</button><button id="cip-insert-button">插 入</button></div></div>`);
        const emojiPicker = create('emoji-picker', 'cip-emoji-picker', 'cip-frosted-glass');
        const addCategoryModal = create('div', 'cip-add-category-modal', 'cip-modal-backdrop hidden', `<div class="cip-modal-content cip-frosted-glass"><h3>添加新分类</h3><input type="text" id="cip-new-category-name" placeholder="输入分类名称"><div class="cip-modal-actions"><button id="cip-cancel-category-btn">取消</button><button id="cip-save-category-btn">保存</button></div></div>`);
        const addStickersModal = create('div', 'cip-add-stickers-modal', 'cip-modal-backdrop hidden', `<div class="cip-modal-content cip-frosted-glass"><h3 id="cip-add-sticker-title"></h3><p>每行一个，格式为：<br><code>表情包描述:图片链接</code></p><textarea id="cip-new-stickers-input" placeholder="可爱猫猫:https://example.com/cat.png\n狗狗点头:https://example.com/dog.gif"></textarea><div class="cip-modal-actions"><button id="cip-cancel-stickers-btn">取消</button><button id="cip-save-stickers-btn">保存</button></div></div>`);
        return { carrotButton, inputPanel, emojiPicker, addCategoryModal, addStickersModal };
    }
    const { carrotButton, inputPanel, emojiPicker, addCategoryModal, addStickersModal } = createUI();
    document.body.appendChild(carrotButton); document.body.appendChild(inputPanel); document.body.appendChild(emojiPicker); document.body.appendChild(addCategoryModal); document.body.appendChild(addStickersModal);

    // --- 3. 获取所有元素的引用 ---
    const get = (id) => document.getElementById(id); const queryAll = (sel) => document.querySelectorAll(sel);
    // (此处省略所有get和queryAll的赋值语句，与之前无异)
    const formatDisplay = get('cip-format-display'), insertButton = get('cip-insert-button'), recallButton = get('cip-recall-button'), mainInput = get('cip-main-input'), voiceDurationInput = get('cip-voice-duration'), voiceMessageInput = get('cip-voice-message'), bunnyInput = get('cip-bunny-input'), stickerCategoriesContainer = get('cip-sticker-categories'), addCategoryBtn = get('cip-add-category-btn'), stickerGrid = get('cip-sticker-grid'), emojiPickerBtn = get('cip-emoji-picker-btn'), saveCategoryBtn = get('cip-save-category-btn'), cancelCategoryBtn = get('cip-cancel-category-btn'), newCategoryNameInput = get('cip-new-category-name'), addStickerTitle = get('cip-add-sticker-title'), saveStickersBtn = get('cip-save-stickers-btn'), cancelStickersBtn = get('cip-cancel-stickers-btn'), newStickersInput = get('cip-new-stickers-input'), panelDragHandle = get('cip-panel-tabs');

    // --- 4. 核心逻辑 (与之前版本相同，未修改) ---
    let currentTab = 'text', currentTextSubType = 'plain', stickerData = {}, currentStickerCategory = '', selectedSticker = null;
    const formatTemplates = { text: { plain: '“{content}”', image: '“[{content}.jpg]”', video: '“[{content}.mp4]”', music: '“[{content}.mp3]”', post: '“[{content}.link]”' }, voice: "={duration}'|{message}=", bunny: "({content})", stickers: "!{desc}|{url}!", recall: '--' };
    function updateFormatDisplay(){ /* ... */ } function switchTab(t){ /* ... */ } function switchTextSubType(t){ /* ... */ } function switchStickerCategory(t){ /* ... */ } function renderStickers(t){ /* ... */ } function renderCategories(){ /* ... */ } function insertIntoSillyTavern(t){ /* ... */ } function saveStickerData(){ /* ... */ } function loadStickerData(){ /* ... */ } function toggleModal(t,e){ /* ... */ } function openAddStickersModal(t){ /* ... */ }
    // (以上函数为示意，实际使用你原有的完整函数即可)

    // --- 5. 【全新】交互逻辑 ---
    
    // 按钮功能：简单切换面板显示，不再处理拖拽
    carrotButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = inputPanel.classList.toggle('active');

        // 如果是首次打开且没有保存的位置，则进行一次居中
        const savedPos = localStorage.getItem('cip_panel_position');
        if (isActive && !savedPos) {
            inputPanel.style.top = '50%';
            inputPanel.style.left = '50%';
            inputPanel.style.transform = 'translate(-50%, -50%) scale(1)';
        }
    });
    
    // 点击外部关闭
    document.addEventListener('click', (e) => {
        if (inputPanel.classList.contains('active') && !inputPanel.contains(e.target) && !carrotButton.contains(e.target)) {
            inputPanel.classList.remove('active');
        }
        if (emojiPicker.style.display === 'block' && !emojiPicker.contains(e.target) && !emojiPickerBtn.contains(e.target)) {
            emojiPicker.style.display = 'none';
        }
    });

    // 表情选择器交互
    emojiPickerBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (window.innerWidth <= 768) { // 移动端
            emojiPicker.style.display = 'block';
        } else { // 桌面端
            const isVisible = emojiPicker.style.display === 'block';
            if(isVisible) {
                emojiPicker.style.display = 'none';
            } else {
                const panelRect = inputPanel.getBoundingClientRect();
                emojiPicker.style.top = `${panelRect.top - 360}px`;
                emojiPicker.style.left = `${panelRect.left}px`;
                emojiPicker.style.display = 'block';
            }
        }
    });

    // 面板拖拽 (仅桌面端)
    panelDragHandle.addEventListener('mousedown', (e) => {
        if (e.button !== 0 || window.innerWidth <= 768) return;

        // 拖拽开始时，清除transform，使用top/left定位
        inputPanel.style.transform = 'none';
        const rect = inputPanel.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        const onMouseMove = (moveEvent) => {
            const newLeft = moveEvent.clientX - offsetX;
            const newTop = moveEvent.clientY - offsetY;
            inputPanel.style.left = `${newLeft}px`;
            inputPanel.style.top = `${newTop}px`;
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            localStorage.setItem('cip_panel_position', JSON.stringify({ top: inputPanel.style.top, left: inputPanel.style.left }));
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    function loadPanelPosition() {
        const savedPos = JSON.parse(localStorage.getItem('cip_panel_position'));
        if (savedPos?.top && savedPos?.left) {
            inputPanel.style.transform = 'none'; // 清除transform
            inputPanel.style.top = savedPos.top;
            inputPanel.style.left = savedPos.left;
        }
    }
    
    // --- 6. 初始化 ---
    function init() {
        // (此处应包含你所有的初始化函数)
        // loadStickerData(); 
        // renderCategories();
        loadPanelPosition();
        // switchTab('text');
    }
    init();

    // 为了防止你复制时丢失函数，这里提供之前版本完整的核心函数
    emojiPicker.addEventListener('emoji-click',e=>{const o=e.detail.unicode;let t;currentTab==="text"?t=mainInput:currentTab==="voice"?t=voiceMessageInput:currentTab==="bunny"&&(t=bunnyInput),t&&(t.value=t.value.substring(0,t.selectionStart)+o+t.value.substring(t.selectionEnd),t.focus(),t.selectionStart=t.selectionEnd=t.selectionStart+o.length),emojiPicker.style.display="none"});
    queryAll('.cip-tab-button').forEach(e=>e.addEventListener('click',t=>switchTab(t.currentTarget.dataset.tab)));
    queryAll('#cip-text-content .cip-sub-option-btn').forEach(e=>e.addEventListener('click',t=>switchTextSubType(t.currentTarget.dataset.type)));
    recallButton.addEventListener('click',()=>insertIntoSillyTavern(formatTemplates.recall));
    insertButton.addEventListener('click',()=>{let t,e,o="";switch(currentTab){case"text":mainInput.value.trim()&&(o=formatTemplates.text[currentTextSubType].replace("{content}",mainInput.value),t=mainInput);break;case"voice":voiceDurationInput.value.trim()&&voiceMessageInput.value.trim()&&(o=formatTemplates.voice.replace("{duration}",voiceDurationInput.value).replace("{message}",voiceMessageInput.value),t=voiceMessageInput,e=voiceDurationInput);break;case"bunny":bunnyInput.value.trim()&&(o=formatTemplates.bunny.replace("{content}",bunnyInput.value),t=bunnyInput);break;case"stickers":selectedSticker&&(o=formatTemplates.stickers.replace("{desc}",selectedSticker.desc).replace("{url}",selectedSticker.url))}o&&(insertIntoSillyTavern(o),t&&(t.value=""),e&&(e.value=""))});
    addCategoryBtn.addEventListener('click',()=>{newCategoryNameInput.value="",toggleModal("cip-add-category-modal",!0),newCategoryNameInput.focus()});
    cancelCategoryBtn.addEventListener('click',()=>toggleModal("cip-add-category-modal",!1));
    saveCategoryBtn.addEventListener('click',()=>{const t=newCategoryNameInput.value.trim();t&&!stickerData[t]?(stickerData[t]=[],saveStickerData(),renderCategories(),switchStickerCategory(t),toggleModal("cip-add-category-modal",!1)):stickerData[t]?alert("该分类已存在！"):alert("请输入有效的分类名称！")});
    cancelStickersBtn.addEventListener('click',()=>toggleModal("cip-add-stickers-modal",!1));
    saveStickersBtn.addEventListener('click',()=>{const t=addStickersModal.dataset.currentCategory,e=newStickersInput.value.trim();if(t&&e){let o=0;e.split("\n").forEach(t=>{const e=t.split(/:|：/);if(2<=e.length){const n=e[0].trim(),c=e.slice(1).join(":").trim();n&&c.startsWith("http")&&(stickerData[t].push({desc:n,url:c}),o++)}}),0<o?(saveStickerData(),currentStickerCategory===t&&renderStickers(t),toggleModal("cip-add-stickers-modal",!1)):alert("未能解析任何有效的表情包信息。请检查格式（描述:链接）和链接是否正确。")}});
})();
