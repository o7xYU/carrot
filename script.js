// script.js (v1.5)
(function () {
    if (document.getElementById('cip-carrot-button')) return;

    // --- 动态加载Emoji Picker库 ---
    const pickerScript = document.createElement('script');
    pickerScript.type = 'module';
    pickerScript.src = 'https://cdn.jsdelivr.net/npm/emoji-picker-element@^1/index.js';
    document.head.appendChild(pickerScript);

    function createUI() {
        const create = (tag, id, className, html) => {
            const el = document.createElement(tag);
            if (id) el.id = id;
            if (className) el.className = className;
            if (html) el.innerHTML = html;
            return el;
        };
        const carrotButton = create('div', 'cip-carrot-button', null, '🥕');
        carrotButton.title = '胡萝卜快捷输入';

        const inputPanel = create('div', 'cip-input-panel', 'cip-frosted-glass', `
            <nav id="cip-panel-tabs">
                <button class="cip-tab-button active" data-tab="text">文字信息</button>
                <button class="cip-tab-button" data-tab="voice">语音</button>
                <button class="cip-tab-button" data-tab="stickers">表情包</button>
            </nav>
            <div id="cip-format-display"></div>
            <div id="cip-panel-content">
                <div id="cip-text-content" class="cip-content-section">
                    <div class="cip-sub-options-container">
                        <button class="cip-sub-option-btn active" data-type="plain">纯文本</button>
                        <button class="cip-sub-option-btn" data-type="image">图片</button>
                        <button class="cip-sub-option-btn" data-type="video">视频</button>
                        <button class="cip-sub-option-btn" data-type="music">音乐</button>
                        <button class="cip-sub-option-btn" data-type="post">帖子</button>
                    </div>
                    <textarea id="cip-main-input" placeholder="在此输入文字..."></textarea>
                </div>
                <div id="cip-voice-content" class="cip-content-section">
                    <input type="number" id="cip-voice-duration" placeholder="输入时长 (秒, 仅数字)">
                    <textarea id="cip-voice-message" placeholder="输入语音识别出的内容..."></textarea>
                </div>
                <div id="cip-stickers-content" class="cip-content-section">
                    <div id="cip-sticker-categories" class="cip-sub-options-container">
                        <button id="cip-add-category-btn" class="cip-sub-option-btn">+</button>
                    </div>
                    <div id="cip-sticker-grid"></div>
                </div>
            </div>
            <div id="cip-panel-footer">
                <div id="cip-emoji-picker-btn">😊</div>
                <div class="cip-footer-actions">
                    <button id="cip-recall-button">撤回</button>
                    <button id="cip-insert-button">插 入</button>
                </div>
            </div>
        `);

        const emojiPicker = create('emoji-picker', 'cip-emoji-picker', 'cip-frosted-glass');

        const addCategoryModal = create('div', 'cip-add-category-modal', 'cip-modal-backdrop hidden', `...`);
        const addStickersModal = create('div', 'cip-add-stickers-modal', 'cip-modal-backdrop hidden', `...`);
        
        addCategoryModal.innerHTML = `<div class="cip-modal-content cip-frosted-glass"><h3>添加新分类</h3><input type="text" id="cip-new-category-name" placeholder="输入分类名称"><div class="cip-modal-actions"><button id="cip-cancel-category-btn">取消</button><button id="cip-save-category-btn">保存</button></div></div>`;
        addStickersModal.innerHTML = `<div class="cip-modal-content cip-frosted-glass"><h3 id="cip-add-sticker-title"></h3><p>每行一个，格式为：<br><code>表情包描述:图片链接</code></p><textarea id="cip-new-stickers-input" placeholder="可爱猫猫:https://example.com/cat.png\n狗狗点头:https://example.com/dog.gif"></textarea><div class="cip-modal-actions"><button id="cip-cancel-stickers-btn">取消</button><button id="cip-save-stickers-btn">保存</button></div></div>`;

        return { carrotButton, inputPanel, emojiPicker, addCategoryModal, addStickersModal };
    }

    const { carrotButton, inputPanel, emojiPicker, addCategoryModal, addStickersModal } = createUI();
    document.body.appendChild(carrotButton); document.body.appendChild(inputPanel);
    document.body.appendChild(emojiPicker); document.body.appendChild(addCategoryModal);
    document.body.appendChild(addStickersModal);

    const get = (id) => document.getElementById(id);
    const queryAll = (sel) => document.querySelectorAll(sel);

    const formatDisplay = get('cip-format-display'), insertButton = get('cip-insert-button'), recallButton = get('cip-recall-button');
    const mainInput = get('cip-main-input'), voiceDurationInput = get('cip-voice-duration'), voiceMessageInput = get('cip-voice-message');
    const stickerCategoriesContainer = get('cip-sticker-categories'), addCategoryBtn = get('cip-add-category-btn'), stickerGrid = get('cip-sticker-grid');
    const emojiPickerBtn = get('cip-emoji-picker-btn');
    const saveCategoryBtn = get('cip-save-category-btn'), cancelCategoryBtn = get('cip-cancel-category-btn'), newCategoryNameInput = get('cip-new-category-name');
    const addStickerTitle = get('cip-add-sticker-title'), saveStickersBtn = get('cip-save-stickers-btn'), cancelStickersBtn = get('cip-cancel-stickers-btn'), newStickersInput = get('cip-new-stickers-input');

    let currentTab = 'text', currentTextSubType = 'plain', stickerData = {}, currentStickerCategory = '', selectedSticker = null;

    const formatTemplates = {
        text: { plain: '“{content}”', image: '“[{content}.jpg]”', video: '“[{content}.mp4]”', music: '“[{content}.mp3]”', post: '“[{content}.link]”' },
        voice: "={duration}'|{message}=",
        stickers: "!{desc}|{url}!",
        recall: '--'
    };

    function updateFormatDisplay() {
        queryAll('.cip-category-action-icon').forEach(icon => icon.remove());
        switch (currentTab) {
            case 'text': formatDisplay.textContent = `格式: ${formatTemplates.text[currentTextSubType].replace('{content}', '内容')}`; break;
            case 'voice': formatDisplay.textContent = `格式: =数字'|内容=`; break;
            case 'stickers':
                formatDisplay.textContent = `格式: !描述|链接!`;
                const currentCatBtn = get('cip-input-panel').querySelector(`.cip-sticker-category-btn[data-category="${currentStickerCategory}"]`);
                if (currentCatBtn) {
                    const addIcon = document.createElement('i'); addIcon.textContent = ' ➕'; addIcon.className = 'cip-category-action-icon'; addIcon.title = '向此分类添加表情包';
                    addIcon.onclick = (e) => { e.stopPropagation(); openAddStickersModal(currentStickerCategory); };
                    currentCatBtn.appendChild(addIcon);
                    const delIcon = document.createElement('i'); delIcon.textContent = ' 🗑️'; delIcon.className = 'cip-category-action-icon cip-delete-category-btn'; delIcon.title = '删除此分类';
                    delIcon.onclick = (e) => { e.stopPropagation(); if (confirm(`确定删除「${currentStickerCategory}」分类?`)) { delete stickerData[currentStickerCategory]; saveStickerData(); renderCategories(); const rem = Object.keys(stickerData); switchStickerCategory(rem[0] || ''); } };
                    currentCatBtn.appendChild(delIcon);
                }
                break;
        }
    }
    function switchTab(tabName) {
        currentTab = tabName;
        queryAll('.cip-tab-button').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
        queryAll('.cip-content-section').forEach(sec => sec.classList.toggle('active', sec.id === `cip-${tabName}-content`));
        if (tabName === 'stickers') { const first = Object.keys(stickerData)[0]; if (!currentStickerCategory && first) switchStickerCategory(first); else switchStickerCategory(currentStickerCategory); }
        updateFormatDisplay();
    }
    function switchTextSubType(typeName) { currentTextSubType = typeName; queryAll('#cip-text-content .cip-sub-option-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.type === typeName)); updateFormatDisplay(); }
    function switchStickerCategory(categoryName) {
        currentStickerCategory = categoryName;
        queryAll('.cip-sticker-category-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.category === categoryName));
        renderStickers(categoryName); selectedSticker = null; updateFormatDisplay();
    }
    function renderStickers(categoryName) {
        stickerGrid.innerHTML = '';
        if (!categoryName || !stickerData[categoryName]) { stickerGrid.innerHTML = '<div class="cip-sticker-placeholder">请先选择或添加一个分类...</div>'; return; }
        const stickers = stickerData[categoryName];
        if (stickers.length === 0) { stickerGrid.innerHTML = '<div class="cip-sticker-placeholder">这个分类还没有表情包...</div>'; return; }
        stickers.forEach((sticker, index) => {
            const wrapper = document.createElement('div'); wrapper.className = 'cip-sticker-wrapper';
            const img = document.createElement('img'); img.src = sticker.url; img.title = sticker.desc; img.className = 'cip-sticker-item';
            img.onclick = () => { queryAll('.cip-sticker-item.selected').forEach(item => item.classList.remove('selected')); img.classList.add('selected'); selectedSticker = sticker; };
            const deleteBtn = document.createElement('button'); deleteBtn.innerHTML = '&times;'; deleteBtn.className = 'cip-delete-sticker-btn'; deleteBtn.title = '删除这个表情包';
            deleteBtn.onclick = (e) => { e.stopPropagation(); if (confirm(`确定删除表情「${sticker.desc}」?`)) { stickerData[categoryName].splice(index, 1); saveStickerData(); renderStickers(categoryName); } };
            wrapper.appendChild(img); wrapper.appendChild(deleteBtn); stickerGrid.appendChild(wrapper);
        });
    }
    function renderCategories() {
        queryAll('.cip-sticker-category-btn').forEach(btn => btn.remove());
        Object.keys(stickerData).forEach(name => {
            const btn = document.createElement('button'); const textNode = document.createElement('span'); textNode.textContent = name; btn.appendChild(textNode);
            btn.className = 'cip-sub-option-btn cip-sticker-category-btn'; btn.dataset.category = name; btn.onclick = () => switchStickerCategory(name);
            stickerCategoriesContainer.appendChild(btn);
        });
    }
    function insertIntoSillyTavern(text) {
        const stTextarea = document.querySelector('#send_textarea');
        if (stTextarea) { stTextarea.value += (stTextarea.value.trim() ? '\n' : '') + text; stTextarea.dispatchEvent(new Event('input', { bubbles: true })); stTextarea.focus(); }
        else { alert('未能找到SillyTavern的输入框！'); }
    }
    function saveStickerData() { localStorage.setItem('cip_sticker_data', JSON.stringify(stickerData)); }
    function loadStickerData() { const data = localStorage.getItem('cip_sticker_data'); if (data) stickerData = JSON.parse(data); }
    function toggleModal(modalId, show) { get(modalId).classList.toggle('hidden', !show); }
    function openAddStickersModal(categoryName) {
        addStickerTitle.textContent = `为「${categoryName}」分类添加表情包`;
        newStickersInput.value = ''; addStickersModal.dataset.currentCategory = categoryName; toggleModal('cip-add-stickers-modal', true); newStickersInput.focus();
    }
    
    // --- Emoji Picker库的事件处理 ---
    emojiPicker.addEventListener('emoji-click', event => {
        const emoji = event.detail.unicode;
        const target = (currentTab === 'text') ? mainInput : voiceMessageInput;
        if (target) {
            const { selectionStart, selectionEnd, value } = target;
            target.value = value.substring(0, selectionStart) + emoji + value.substring(selectionEnd);
            target.focus(); target.selectionEnd = selectionStart + emoji.length;
        }
        emojiPicker.style.display = 'none';
    });
    
    emojiPickerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = emojiPicker.style.display === 'block';
        if (isVisible) {
            emojiPicker.style.display = 'none';
        } else {
            const btnRect = emojiPickerBtn.getBoundingClientRect();
            emojiPicker.style.top = `${btnRect.top - 350 - 10}px`; // 350是picker大约高度
            emojiPicker.style.left = `${btnRect.left}px`;
            emojiPicker.style.display = 'block';
        }
    });

    queryAll('.cip-tab-button').forEach(button => button.addEventListener('click', (e) => switchTab(e.currentTarget.dataset.tab)));
    queryAll('#cip-text-content .cip-sub-option-btn').forEach(button => button.addEventListener('click', (e) => switchTextSubType(e.currentTarget.dataset.type)));
    recallButton.addEventListener('click', () => insertIntoSillyTavern(formatTemplates.recall));
    insertButton.addEventListener('click', () => {
        let formattedText = '';
        switch (currentTab) {
            case 'text': if (mainInput.value.trim()) formattedText = formatTemplates.text[currentTextSubType].replace('{content}', mainInput.value); break;
            case 'voice': if (voiceDurationInput.value.trim() && voiceMessageInput.value.trim()) formattedText = formatTemplates.voice.replace('{duration}', voiceDurationInput.value).replace('{message}', voiceMessageInput.value); break;
            case 'stickers': if (selectedSticker) { formattedText = formatTemplates.stickers.replace('{desc}', selectedSticker.desc).replace('{url}', selectedSticker.url); } break;
        }
        if (formattedText) insertIntoSillyTavern(formattedText); else alert('请输入内容或选择一个表情包！');
    });

    addCategoryBtn.addEventListener('click', () => { newCategoryNameInput.value = ''; toggleModal('cip-add-category-modal', true); newCategoryNameInput.focus(); });
    cancelCategoryBtn.addEventListener('click', () => toggleModal('cip-add-category-modal', false));
    saveCategoryBtn.addEventListener('click', () => {
        const name = newCategoryNameInput.value.trim();
        if (name && !stickerData[name]) { stickerData[name] = []; saveStickerData(); renderCategories(); switchStickerCategory(name); toggleModal('cip-add-category-modal', false); }
        else if (stickerData[name]) alert('该分类已存在！'); else alert('请输入有效的分类名称！');
    });
    cancelStickersBtn.addEventListener('click', () => toggleModal('cip-add-stickers-modal', false));
    saveStickersBtn.addEventListener('click', () => {
        const category = addStickersModal.dataset.currentCategory; const text = newStickersInput.value.trim();
        if (!category || !text) return; let addedCount = 0;
        text.split('\n').forEach(line => {
            const parts = line.split(':');
            if (parts.length >= 2) { const desc = parts[0].trim(); const url = parts.slice(1).join(':').trim(); if (desc && url) { stickerData[category].push({ desc, url }); addedCount++; } }
        });
        if (addedCount > 0) { saveStickerData(); if (currentStickerCategory === category) renderStickers(category); toggleModal('cip-add-stickers-modal', false); }
        else alert('未能解析任何有效的表情包信息。');
    });

    function showPanel() {
        const btnRect = carrotButton.getBoundingClientRect(); const panelHeight = inputPanel.offsetHeight || 380;
        let top = btnRect.top - panelHeight - 10;
        if (top < 10) top = btnRect.bottom + 10;
        let left = btnRect.left + (btnRect.width / 2) - (inputPanel.offsetWidth / 2);
        left = Math.max(10, Math.min(left, window.innerWidth - inputPanel.offsetWidth - 10));
        inputPanel.style.top = `${top}px`; inputPanel.style.left = `${left}px`;
        inputPanel.classList.add('active');
    }
    function hidePanel() { inputPanel.classList.remove('active'); }
    carrotButton.addEventListener('click', (e) => { e.stopPropagation(); inputPanel.classList.contains('active') ? hidePanel() : showPanel(); });
    document.addEventListener('click', (e) => {
        if (!inputPanel.contains(e.target) && !carrotButton.contains(e.target)) hidePanel();
        if (emojiPicker.style.display === 'block' && !emojiPicker.contains(e.target) && !emojiPickerBtn.contains(e.target)) {
            emojiPicker.style.display = 'none';
        }
    });

    function saveButtonPosition(top, left) { localStorage.setItem('cip_button_position', JSON.stringify({ top, left })); }
    function loadButtonPosition() {
        const savedPos = JSON.parse(localStorage.getItem('cip_button_position'));
        if (savedPos?.top && savedPos?.left) { carrotButton.style.top = savedPos.top; carrotButton.style.left = savedPos.left; carrotButton.style.bottom = 'auto'; carrotButton.style.right = 'auto'; }
    }
    carrotButton.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        const offsetX = e.clientX - carrotButton.getBoundingClientRect().left, offsetY = e.clientY - carrotButton.getBoundingClientRect().top;
        const onMouseMove = (moveEvent) => {
            let newLeft = moveEvent.clientX - offsetX, newTop = moveEvent.clientY - offsetY;
            newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - carrotButton.offsetWidth));
            newTop = Math.max(0, Math.min(newTop, window.innerHeight - carrotButton.offsetHeight));
            carrotButton.style.left = `${newLeft}px`; carrotButton.style.top = `${newTop}px`;
        };
        const onMouseUp = () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); saveButtonPosition(carrotButton.style.top, carrotButton.style.left); };
        document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp);
    });

    function init() {
        loadStickerData(); renderCategories(); loadButtonPosition();
        const firstCategory = Object.keys(stickerData)[0];
        switchStickerCategory(firstCategory || '');
        switchTab('text');
    }
    init();
})();
