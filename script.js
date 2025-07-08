// script.js (v2.0 - 居中面板 & 移动端优化)
(function () {
    if (document.getElementById('cip-carrot-button')) return;

    // --- 动态加载Emoji Picker库 ---
    const pickerScript = document.createElement('script');
    pickerScript.type = 'module';
    pickerScript.src = 'https://cdn.jsdelivr.net/npm/emoji-picker-element@^1/index.js';
    document.head.appendChild(pickerScript);

    // --- 1. 创建所有UI元素 (与之前版本基本一致) ---
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
                <button class="cip-tab-button" data-tab="bunny">BUNNY</button>
                <button class="cip-tab-button" data-tab="stickers">表情包</button>
            </nav>
            <div id="cip-format-display"></div>
            <div id="cip-panel-content">
                <div id="cip-text-content" class="cip-content-section active"><div class="cip-sub-options-container"><button class="cip-sub-option-btn active" data-type="plain">纯文本</button><button class="cip-sub-option-btn" data-type="image">图片</button><button class="cip-sub-option-btn" data-type="video">视频</button><button class="cip-sub-option-btn" data-type="music">音乐</button><button class="cip-sub-option-btn" data-type="post">帖子</button></div><textarea id="cip-main-input" placeholder="在此输入文字..."></textarea></div>
                <div id="cip-voice-content" class="cip-content-section"><input type="number" id="cip-voice-duration" placeholder="输入时长 (秒, 仅数字)"><textarea id="cip-voice-message" placeholder="输入语音识别出的内容..."></textarea></div>
                <div id="cip-bunny-content" class="cip-content-section"><textarea id="cip-bunny-input" placeholder="在此输入想对BUNNY说的话..."></textarea></div>
                <div id="cip-stickers-content" class="cip-content-section"><div id="cip-sticker-categories" class="cip-sub-options-container"><button id="cip-add-category-btn" class="cip-sub-option-btn">+</button></div><div id="cip-sticker-grid"></div></div>
            </div>
            <div id="cip-panel-footer"><div id="cip-emoji-picker-btn">😊</div><div class="cip-footer-actions"><button id="cip-recall-button">撤回</button><button id="cip-insert-button">插 入</button></div></div>
        `);
        
        const emojiPicker = create('emoji-picker', 'cip-emoji-picker', 'cip-frosted-glass');
        const addCategoryModal = create('div', 'cip-add-category-modal', 'cip-modal-backdrop hidden', `<div class="cip-modal-content cip-frosted-glass"><h3>添加新分类</h3><input type="text" id="cip-new-category-name" placeholder="输入分类名称"><div class="cip-modal-actions"><button id="cip-cancel-category-btn">取消</button><button id="cip-save-category-btn">保存</button></div></div>`);
        const addStickersModal = create('div', 'cip-add-stickers-modal', 'cip-modal-backdrop hidden', `<div class="cip-modal-content cip-frosted-glass"><h3 id="cip-add-sticker-title"></h3><p>每行一个，格式为：<br><code>表情包描述:图片链接</code></p><textarea id="cip-new-stickers-input" placeholder="可爱猫猫:https://example.com/cat.png\n狗狗点头:https://example.com/dog.gif"></textarea><div class="cip-modal-actions"><button id="cip-cancel-stickers-btn">取消</button><button id="cip-save-stickers-btn">保存</button></div></div>`);
        return { carrotButton, inputPanel, emojiPicker, addCategoryModal, addStickersModal };
    }

    // --- 2. 注入UI到页面中 ---
    const { carrotButton, inputPanel, emojiPicker, addCategoryModal, addStickersModal } = createUI();
    const anchor = document.querySelector('#chat-buttons-container, #send_form');
    if (anchor) {
        document.body.appendChild(carrotButton);
        document.body.appendChild(inputPanel);
        document.body.appendChild(emojiPicker);
        document.body.appendChild(addCategoryModal);
        document.body.appendChild(addStickersModal);
    } else {
        console.error("胡萝卜输入面板：未能找到SillyTavern的UI挂载点，插件无法加载。");
        return;
    }

    // --- 3. 获取所有元素的引用 ---
    const get = (id) => document.getElementById(id);
    const queryAll = (sel) => document.querySelectorAll(sel);
    const formatDisplay = get('cip-format-display'), insertButton = get('cip-insert-button'), recallButton = get('cip-recall-button');
    const mainInput = get('cip-main-input'), voiceDurationInput = get('cip-voice-duration'), voiceMessageInput = get('cip-voice-message');
    const bunnyInput = get('cip-bunny-input');
    const stickerCategoriesContainer = get('cip-sticker-categories'), addCategoryBtn = get('cip-add-category-btn'), stickerGrid = get('cip-sticker-grid');
    const emojiPickerBtn = get('cip-emoji-picker-btn');
    const saveCategoryBtn = get('cip-save-category-btn'), cancelCategoryBtn = get('cip-cancel-category-btn'), newCategoryNameInput = get('cip-new-category-name');
    const addStickerTitle = get('cip-add-sticker-title'), saveStickersBtn = get('cip-save-stickers-btn'), cancelStickersBtn = get('cip-cancel-stickers-btn'), newStickersInput = get('cip-new-stickers-input');

    // --- 4. 核心逻辑与事件监听 ---
    let currentTab = 'text', currentTextSubType = 'plain', stickerData = {}, currentStickerCategory = '', selectedSticker = null;
    const formatTemplates = {
        text: { plain: '“{content}”', image: '“[{content}.jpg]”', video: '“[{content}.mp4]”', music: '“[{content}.mp3]”', post: '“[{content}.link]”' },
        voice: "={duration}'|{message}=",
        bunny: "({content})",
        stickers: "!{desc}|{url}!",
        recall: '--'
    };

    function updateFormatDisplay(){
        // 清理旧的图标
        queryAll(".cip-category-action-icon").forEach(icon => icon.remove());
        
        switch(currentTab){
            case "text":
                formatDisplay.textContent = `格式: ${formatTemplates.text[currentTextSubType].replace("{content}", "内容")}`;
                break;
            case "voice":
                formatDisplay.textContent = "格式: =数字'|内容=";
                break;
            case "bunny":
                formatDisplay.textContent = "格式: (内容)";
                break;
            case "stickers":
                formatDisplay.textContent = "格式: !描述|链接!";
                const activeCategoryBtn = stickerCategoriesContainer.querySelector(`.cip-sticker-category-btn[data-category="${currentStickerCategory}"]`);
                if (activeCategoryBtn) {
                    const addIcon = document.createElement("i");
                    addIcon.textContent = " ➕";
                    addIcon.className = "cip-category-action-icon";
                    addIcon.title = "向此分类添加表情包";
                    addIcon.onclick = (e) => { e.stopPropagation(); openAddStickersModal(currentStickerCategory); };
                    activeCategoryBtn.firstElementChild.appendChild(addIcon);

                    const deleteIcon = document.createElement("i");
                    deleteIcon.textContent = " 🗑️";
                    deleteIcon.className = "cip-category-action-icon cip-delete-category-btn";
                    deleteIcon.title = "删除此分类";
                    deleteIcon.onclick = (e) => {
                        e.stopPropagation();
                        if (confirm(`确定删除「${currentStickerCategory}」分类及其所有表情包吗?`)) {
                            delete stickerData[currentStickerCategory];
                            saveStickerData();
                            renderCategories();
                            const firstCategory = Object.keys(stickerData)[0] || "";
                            switchStickerCategory(firstCategory);
                        }
                    };
                    activeCategoryBtn.firstElementChild.appendChild(deleteIcon);
                }
                break;
        }
    }
    
    function switchTab(tab) {
        currentTab = tab;
        queryAll(".cip-tab-button").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tab));
        queryAll(".cip-content-section").forEach(sec => sec.classList.toggle("active", sec.id === `cip-${tab}-content`));
        if (tab === 'stickers' && !currentStickerCategory && Object.keys(stickerData).length > 0) {
            switchStickerCategory(Object.keys(stickerData)[0]);
        }
        updateFormatDisplay();
    }

    function switchTextSubType(type) {
        currentTextSubType = type;
        queryAll("#cip-text-content .cip-sub-option-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.type === type));
        updateFormatDisplay();
    }

    function switchStickerCategory(category) {
        currentStickerCategory = category;
        queryAll(".cip-sticker-category-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.category === category));
        renderStickers(category);
        selectedSticker = null;
        updateFormatDisplay();
    }

    function renderStickers(category) {
        stickerGrid.innerHTML = "";
        if (!category || !stickerData[category]) {
            stickerGrid.innerHTML = '<div class="cip-sticker-placeholder">请先选择或添加一个分类...</div>';
            return;
        }
        const stickers = stickerData[category];
        if (stickers.length === 0) {
            stickerGrid.innerHTML = '<div class="cip-sticker-placeholder">这个分类还没有表情包... <br>点击分类名旁边的 ➕ 添加吧！</div>';
            return;
        }
        stickers.forEach((sticker, index) => {
            const wrapper = document.createElement("div");
            wrapper.className = "cip-sticker-wrapper";
            
            const img = document.createElement("img");
            img.src = sticker.url;
            img.title = sticker.desc;
            img.className = "cip-sticker-item";
            img.onclick = () => {
                queryAll(".cip-sticker-item.selected").forEach(el => el.classList.remove("selected"));
                img.classList.add("selected");
                selectedSticker = sticker;
            };

            const delBtn = document.createElement("button");
            delBtn.innerHTML = "&times;";
            delBtn.className = "cip-delete-sticker-btn";
            delBtn.title = "删除这个表情包";
            delBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm(`确定删除表情「${sticker.desc}」?`)) {
                    stickerData[currentStickerCategory].splice(index, 1);
                    saveStickerData();
                    renderStickers(currentStickerCategory); // Re-render to update indices
                }
            };

            wrapper.appendChild(img);
            wrapper.appendChild(delBtn);
            stickerGrid.appendChild(wrapper);
        });
    }

    function renderCategories() {
        // 保存当前激活的分类
        const activeCategory = currentStickerCategory;
        // 清理旧的按钮
        stickerCategoriesContainer.querySelectorAll(".cip-sticker-category-btn").forEach(btn => btn.remove());
        
        Object.keys(stickerData).forEach(name => {
            const btn = document.createElement("button");
            const span = document.createElement("span");
            span.textContent = name;
            btn.appendChild(span);
            btn.className = "cip-sub-option-btn cip-sticker-category-btn";
            btn.dataset.category = name;
            btn.onclick = () => switchStickerCategory(name);
            // 将按钮插入到“添加”按钮之前
            stickerCategoriesContainer.insertBefore(btn, addCategoryBtn);
        });

        // 恢复之前的激活状态
        if (stickerData[activeCategory]) {
             const activeBtn = stickerCategoriesContainer.querySelector(`.cip-sticker-category-btn[data-category="${activeCategory}"]`);
             if (activeBtn) activeBtn.classList.add('active');
        }
    }
    
    function insertIntoSillyTavern(text) {
        const textarea = document.querySelector("#send_textarea");
        if (textarea) {
            const needsNewline = textarea.value.trim().length > 0;
            textarea.value += (needsNewline ? "\n" : "") + text;
            textarea.dispatchEvent(new Event("input", { bubbles: true }));
            textarea.focus();
        } else {
            alert("未能找到SillyTavern的输入框！");
        }
    }

    function saveStickerData() { localStorage.setItem("cip_sticker_data", JSON.stringify(stickerData)); }
    function loadStickerData() {
        const data = localStorage.getItem("cip_sticker_data");
        if (data) { stickerData = JSON.parse(data); }
    }

    function toggleModal(modalId, show) { get(modalId).classList.toggle("hidden", !show); }
    function openAddStickersModal(category) {
        addStickerTitle.textContent = `为「${category}」分类添加表情包`;
        newStickersInput.value = "";
        addStickersModal.dataset.currentCategory = category;
        toggleModal("cip-add-stickers-modal", true);
        newStickersInput.focus();
    }
    
    emojiPicker.addEventListener('emoji-click', event => {
        const emoji = event.detail.unicode;
        let targetInput;
        if (currentTab === 'text') targetInput = mainInput;
        else if (currentTab === 'voice') targetInput = voiceMessageInput;
        else if (currentTab === 'bunny') targetInput = bunnyInput;
        
        if (targetInput) {
            const { selectionStart, selectionEnd, value } = targetInput;
            targetInput.value = value.substring(0, selectionStart) + emoji + value.substring(selectionEnd);
            targetInput.focus();
            targetInput.selectionStart = targetInput.selectionEnd = selectionStart + emoji.length;
        }
        emojiPicker.style.display = 'none';
    });
    
    emojiPickerBtn.addEventListener('click', e => {
        e.stopPropagation();
        const isVisible = emojiPicker.style.display === 'block';
        emojiPicker.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
            const btnRect = emojiPickerBtn.getBoundingClientRect();
            const panelRect = inputPanel.getBoundingClientRect();
            // 尝试在面板上方显示
            let top = panelRect.top - 360; // 350 picker height + 10 margin
            if (top < 10) { // 如果上方空间不足，显示在按钮下方
                top = btnRect.bottom + 10;
            }
            // 尝试在按钮左侧对齐显示
            let left = btnRect.left;
            if (left + 350 > window.innerWidth) { // 如果右侧空间不足
                left = window.innerWidth - 360;
            }
            emojiPicker.style.top = `${top}px`;
            emojiPicker.style.left = `${left}px`;
        }
    });

    queryAll('.cip-tab-button').forEach(button => button.addEventListener('click', (e) => switchTab(e.currentTarget.dataset.tab)));
    queryAll('#cip-text-content .cip-sub-option-btn').forEach(button => button.addEventListener('click', (e) => switchTextSubType(e.currentTarget.dataset.type)));
    recallButton.addEventListener('click', () => insertIntoSillyTavern(formatTemplates.recall));
    
    insertButton.addEventListener('click', () => {
        let formattedText = '';
        let inputToClear = null, secondaryInputToClear = null;

        switch (currentTab) {
            case 'text':
                if (mainInput.value.trim()) {
                    formattedText = formatTemplates.text[currentTextSubType].replace('{content}', mainInput.value);
                    inputToClear = mainInput;
                }
                break;
            case 'voice':
                if (voiceDurationInput.value.trim() && voiceMessageInput.value.trim()) {
                    formattedText = formatTemplates.voice.replace('{duration}', voiceDurationInput.value).replace('{message}', voiceMessageInput.value);
                    inputToClear = voiceMessageInput;
                    secondaryInputToClear = voiceDurationInput;
                }
                break;
            case 'bunny':
                if (bunnyInput.value.trim()) {
                    formattedText = formatTemplates.bunny.replace('{content}', bunnyInput.value);
                    inputToClear = bunnyInput;
                }
                break;
            case 'stickers':
                if (selectedSticker) {
                    formattedText = formatTemplates.stickers.replace('{desc}', selectedSticker.desc).replace('{url}', selectedSticker.url);
                }
                break;
        }
        
        if (formattedText) {
            insertIntoSillyTavern(formattedText);
            if (inputToClear) inputToClear.value = '';
            if (secondaryInputToClear) secondaryInputToClear.value = '';
        }
    });
    
    addCategoryBtn.addEventListener('click', () => { newCategoryNameInput.value = ''; toggleModal('cip-add-category-modal', true); newCategoryNameInput.focus(); });
    cancelCategoryBtn.addEventListener('click', () => toggleModal('cip-add-category-modal', false));
    saveCategoryBtn.addEventListener('click', () => {
        const name = newCategoryNameInput.value.trim();
        if (name && !stickerData[name]) {
            stickerData[name] = [];
            saveStickerData();
            renderCategories();
            switchStickerCategory(name);
            toggleModal('cip-add-category-modal', false);
        } else if (stickerData[name]) {
            alert('该分类已存在！');
        } else {
            alert('请输入有效的分类名称！');
        }
    });
    cancelStickersBtn.addEventListener('click', () => toggleModal('cip-add-stickers-modal', false));
    saveStickersBtn.addEventListener('click', () => {
        const category = addStickersModal.dataset.currentCategory;
        const text = newStickersInput.value.trim();
        if (!category || !text) return;
        let addedCount = 0;
        text.split('\n').forEach(line => {
            const parts = line.split(/:|：/); // 支持中英文冒号
            if (parts.length >= 2) {
                const desc = parts[0].trim();
                const url = parts.slice(1).join(':').trim();
                if (desc && url.startsWith('http')) {
                    stickerData[category].push({ desc, url });
                    addedCount++;
                }
            }
        });
        if (addedCount > 0) {
            saveStickerData();
            if (currentStickerCategory === category) renderStickers(category);
            toggleModal('cip-add-stickers-modal', false);
        } else {
            alert('未能解析任何有效的表情包信息。请检查格式（描述:链接）和链接是否正确。');
        }
    });

    // --- 5. 交互处理逻辑 (已修改) ---
    function showPanel() {
        // CSS负责居中定位, JS只负责切换class
        inputPanel.classList.add('active');
    }
    function hidePanel() {
        inputPanel.classList.remove('active');
    }

    document.addEventListener('click', (e) => {
        if (inputPanel.classList.contains('active') && !inputPanel.contains(e.target) && !carrotButton.contains(e.target)) {
            hidePanel();
        }
        if (emojiPicker.style.display === 'block' && !emojiPicker.contains(e.target) && !emojiPickerBtn.contains(e.target)) {
            emojiPicker.style.display = 'none';
        }
    });

    function dragHandler(e) {
        let isClick = true;
        let clickTimeout;

        const start = (e) => {
            if (e.type === 'touchstart') e.preventDefault();
            const rect = carrotButton.getBoundingClientRect();
            const offsetX = (e.type.includes('mouse') ? e.clientX : e.touches[0].clientX) - rect.left;
            const offsetY = (e.type.includes('mouse') ? e.clientY : e.touches[0].clientY) - rect.top;

            const move = (e) => {
                isClick = false;
                clearTimeout(clickTimeout);
                carrotButton.classList.add('is-dragging');
                let newLeft = (e.type.includes('mouse') ? e.clientX : e.touches[0].clientX) - offsetX;
                let newTop = (e.type.includes('mouse') ? e.clientY : e.touches[0].clientY) - offsetY;
                newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - carrotButton.offsetWidth));
                newTop = Math.max(0, Math.min(newTop, window.innerHeight - carrotButton.offsetHeight));
                carrotButton.style.left = `${newLeft}px`;
                carrotButton.style.top = `${newTop}px`;
            };

            const end = () => {
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', end);
                document.removeEventListener('touchmove', move);
                document.removeEventListener('touchend', end);
                carrotButton.classList.remove('is-dragging');
                
                clickTimeout = setTimeout(() => {
                    if (isClick) {
                        inputPanel.classList.contains('active') ? hidePanel() : showPanel();
                    } else {
                        localStorage.setItem('cip_button_position_v4', JSON.stringify({ top: carrotButton.style.top, left: carrotButton.style.left }));
                    }
                }, 50); // 短暂延迟以区分点击和拖拽
            };

            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', end);
            document.addEventListener('touchmove', move, { passive: false });
            document.addEventListener('touchend', end);
        };
        start(e);
    }
    
    carrotButton.addEventListener('mousedown', dragHandler);
    carrotButton.addEventListener('touchstart', dragHandler, { passive: false });

    function loadButtonPosition() {
        const savedPos = JSON.parse(localStorage.getItem('cip_button_position_v4'));
        if (savedPos?.top && savedPos?.left) {
            // CSS负责默认位置, JS只在有保存位置时覆盖
            carrotButton.style.top = savedPos.top;
            carrotButton.style.left = savedPos.left;
        }
    }

    function init() {
        loadStickerData();
        renderCategories();
        loadButtonPosition();
        switchStickerCategory(Object.keys(stickerData)[0] || '');
        switchTab('text'); // 默认显示文字标签页
    }
    init();
})();
