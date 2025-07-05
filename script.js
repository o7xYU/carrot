// script.js

// 使用立即执行函数表达式 (IIFE) 来封装代码，避免污染全局作用域
(function () {
    // --- 0. 检查插件是否已加载 ---
    if (document.getElementById('carrot-button')) {
        return;
    }

    // --- 1. 创建所有UI元素 ---
    // 这一步模仿了MagiChat插件的模式，所有UI都由JS创建，而不是依赖固定的HTML文件。

    // 创建主HTML结构
    const carrotButton = document.createElement('div');
    carrotButton.id = 'carrot-button';
    carrotButton.innerHTML = '🥕';
    carrotButton.title = '胡萝卜快捷输入';

    const inputPanel = document.createElement('div');
    inputPanel.id = 'input-panel';
    inputPanel.className = 'frosted-glass';
    inputPanel.innerHTML = `
        <nav id="panel-tabs">
            <button class="tab-button active" data-tab="text">文字信息</button>
            <button class="tab-button" data-tab="voice">语音</button>
            <button class="tab-button" data-tab="stickers">表情包</button>
        </nav>
        <div id="format-display">格式: "内容"</div>
        <div id="panel-content">
            <div id="text-content" class="content-section active">
                <div class="sub-options-container">
                    <button class="sub-option-btn active" data-type="plain">纯文本</button>
                    <button class="sub-option-btn" data-type="image">图片</button>
                    <button class="sub-option-btn" data-type="video">视频</button>
                    <button class="sub-option-btn" data-type="music">音乐</button>
                    <button class="sub-option-btn" data-type="post">帖子</button>
                </div>
                <textarea id="main-input" placeholder="在此输入文字..."></textarea>
            </div>
            <div id="voice-content" class="content-section">
                <input type="text" id="voice-duration" placeholder="输入时长 (例如: 3s 或 1'20&quot;)">
                <textarea id="voice-message" placeholder="输入语音识别出的内容..."></textarea>
            </div>
            <div id="stickers-content" class="content-section">
                <div id="sticker-categories" class="sub-options-container">
                    <button id="add-category-btn" class="sub-option-btn">+</button>
                </div>
                <div id="sticker-grid"><div class="sticker-placeholder">请先添加分类和表情包...</div></div>
            </div>
        </div>
        <div id="panel-footer">
            <div id="emoji-picker-btn">
                😊
                <div id="emoji-container" class="frosted-glass"><div id="emoji-grid"></div></div>
            </div>
            <div class="footer-actions">
                <button id="recall-button">撤回</button>
                <button id="insert-button">插 入</button>
            </div>
        </div>
    `;

    const addCategoryModal = document.createElement('div');
    addCategoryModal.id = 'add-category-modal';
    addCategoryModal.className = 'modal-backdrop hidden';
    addCategoryModal.innerHTML = `
        <div class="modal-content frosted-glass">
            <h3>添加新分类</h3>
            <input type="text" id="new-category-name" placeholder="输入分类名称">
            <div class="modal-actions">
                <button id="cancel-category-btn">取消</button>
                <button id="save-category-btn">保存</button>
            </div>
        </div>
    `;

    const addStickersModal = document.createElement('div');
    addStickersModal.id = 'add-stickers-modal';
    addStickersModal.className = 'modal-backdrop hidden';
    addStickersModal.innerHTML = `
        <div class="modal-content frosted-glass">
            <h3 id="add-sticker-title">为「默认」分类添加表情包</h3>
            <p>每行一个，格式为：<br><code>表情包描述:图片链接</code> (冒号为英文冒号)</p>
            <textarea id="new-stickers-input" placeholder="可爱猫猫:https://example.com/cat.png\n狗狗点头:https://example.com/dog.gif"></textarea>
            <div class="modal-actions">
                <button id="cancel-stickers-btn">取消</button>
                <button id="save-stickers-btn">保存</button>
            </div>
        </div>
    `;


    // --- 2. 找到SillyTavern的锚点并注入UI ---
    // 这是将我们的插件挂载到页面上的关键步骤
    const sendForm = document.querySelector('#send_form');
    if (sendForm) {
        // 将所有创建的元素添加到页面中
        document.body.appendChild(carrotButton);
        document.body.appendChild(inputPanel);
        document.body.appendChild(addCategoryModal);
        document.body.appendChild(addStickersModal);
    } else {
        console.error("胡萝卜输入面板：未能找到SillyTavern的#send_form元素，插件无法加载。");
        return;
    }

    // --- 3. 获取所有元素的引用 ---
    // (这部分和你的原代码基本一致, 只是现在我们是从刚创建的元素中获取)
    const tabButtons = inputPanel.querySelectorAll('.tab-button');
    const contentSections = inputPanel.querySelectorAll('.content-section');
    const formatDisplay = inputPanel.querySelector('#format-display');
    const insertButton = inputPanel.querySelector('#insert-button');
    const recallButton = inputPanel.querySelector('#recall-button');
    const textContent = inputPanel.querySelector('#text-content');
    const textSubOptions = textContent.querySelectorAll('.sub-option-btn');
    const mainInput = inputPanel.querySelector('#main-input');
    const voiceDurationInput = inputPanel.querySelector('#voice-duration');
    const voiceMessageInput = inputPanel.querySelector('#voice-message');
    const stickerCategoriesContainer = inputPanel.querySelector('#sticker-categories');
    const addCategoryBtn = inputPanel.querySelector('#add-category-btn');
    const stickerGrid = inputPanel.querySelector('#sticker-grid');
    const emojiPickerBtn = inputPanel.querySelector('#emoji-picker-btn');
    const emojiContainer = inputPanel.querySelector('#emoji-container');
    const emojiGrid = inputPanel.querySelector('#emoji-grid');
    const saveCategoryBtn = addCategoryModal.querySelector('#save-category-btn');
    const cancelCategoryBtn = addCategoryModal.querySelector('#cancel-category-btn');
    const newCategoryNameInput = addCategoryModal.querySelector('#new-category-name');
    const addStickerTitle = addStickersModal.querySelector('#add-sticker-title');
    const saveStickersBtn = addStickersModal.querySelector('#save-stickers-btn');
    const cancelStickersBtn = addStickersModal.querySelector('#cancel-stickers-btn');
    const newStickersInput = addStickersModal.querySelector('#new-stickers-input');
    
    
    // --- 4. 核心逻辑与事件监听（你的原代码）---
    // (这部分基本是你的原代码，我们只需要确保所有引用都正确)
    let currentTab = 'text';
    let currentTextSubType = 'plain';
    let stickerData = {}; 
    let currentStickerCategory = '';
    let selectedSticker = null;

    const formatTemplates = {
        text: {
            plain: '"{content}"',
            image: '"[{content}.jpg]"',
            video: '"[{content}.mp4]"',
            music: '"[{content}.mp3]"',
            post: '"[{content}.link]"',
        },
        voice: '={duration}|{message}=',
        stickers: '!{desc}!',
        recall: '--'
    };

    const commonEmojis = [
        '😊', '😂', '❤️', '👍', '🤔', '😭', '😍', '🎉', '🙏', '🔥', '💯', '✨',
        '😁', '😅', '🤣', '🥰', '🤩', '🥳', '😉', '😋', '😎', '😢', '😱', '😠',
        '😇', '🥺', '🤡', '🤖', '👻', '💀', '🎃', '😺', '😸', '😹', '😻', '😼',
        '👋', '👌', '✌️', '🤞', '🤟', '🤙', '👈', '👉', '👆', '👇', '💪', '👀',
        '🧠', '💧', '💨', '☀️', '🌙', '⭐', '🌸', '🌹', '🍓', '🥕', '🍕', '🍔'
    ];

    // ... (此处省略了所有功能函数，如updateFormatDisplay, switchTab等，因为它们和你之前的代码完全一样) ...
    // ... 为了保持代码可读性，下面只粘贴这些函数，不做修改 ...
    function updateFormatDisplay() {
        let format = '';
        inputPanel.querySelectorAll('.category-action-icon').forEach(icon => icon.remove());
        switch (currentTab) {
            case 'text':
                format = formatTemplates.text[currentTextSubType];
                formatDisplay.textContent = `格式: ${format.replace('{content}', '内容')}`;
                break;
            case 'voice':
                formatDisplay.textContent = `格式: ${formatTemplates.voice.replace('{duration}', `时长'`).replace('{message}', '内容')}`;
                break;
            case 'stickers':
                formatDisplay.textContent = `格式: ${formatTemplates.stickers.replace('{desc}', '表情描述')}`;
                const currentCatBtn = inputPanel.querySelector(`.sticker-category-btn[data-category="${currentStickerCategory}"]`);
                if (currentCatBtn) {
                    const addStickersIcon = document.createElement('i');
                    addStickersIcon.textContent = ' ➕';
                    addStickersIcon.className = 'category-action-icon';
                    addStickersIcon.title = '向此分类添加表情包';
                    addStickersIcon.onclick = (e) => { e.stopPropagation(); openAddStickersModal(currentStickerCategory); };
                    currentCatBtn.appendChild(addStickersIcon);
                    
                    const deleteCategoryIcon = document.createElement('i');
                    deleteCategoryIcon.textContent = ' 🗑️';
                    deleteCategoryIcon.className = 'category-action-icon delete-category-btn';
                    deleteCategoryIcon.title = '删除此分类';
                    deleteCategoryIcon.onclick = (e) => {
                        e.stopPropagation();
                        if (confirm(`你确定要删除「${currentStickerCategory}」这个分类及其所有表情包吗？`)) {
                            delete stickerData[currentStickerCategory];
                            saveStickerData();
                            renderCategories();
                            const remainingCategories = Object.keys(stickerData);
                            switchStickerCategory(remainingCategories[0] || '');
                        }
                    };
                    currentCatBtn.appendChild(deleteCategoryIcon);
                }
                break;
        }
    }
    function switchTab(tabName) {
        currentTab = tabName;
        tabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
        contentSections.forEach(sec => sec.classList.toggle('active', sec.id === `${tabName}-content`));
        if (tabName === 'stickers' && !currentStickerCategory && Object.keys(stickerData).length > 0) {
            switchStickerCategory(Object.keys(stickerData)[0]);
        } else if (tabName === 'stickers') {
            switchStickerCategory(currentStickerCategory);
        }
        updateFormatDisplay();
    }
    function switchTextSubType(typeName) {
        currentTextSubType = typeName;
        textSubOptions.forEach(btn => btn.classList.toggle('active', btn.dataset.type === typeName));
        updateFormatDisplay();
    }
    function switchStickerCategory(categoryName) {
        currentStickerCategory = categoryName;
        inputPanel.querySelectorAll('.sticker-category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === categoryName);
        });
        renderStickers(categoryName);
        selectedSticker = null;
        updateFormatDisplay();
    }
    function renderStickers(categoryName) {
        stickerGrid.innerHTML = '';
        if (!categoryName || !stickerData[categoryName]) {
            stickerGrid.innerHTML = '<div class="sticker-placeholder">请先选择或添加一个分类...</div>';
            return;
        }
        const stickers = stickerData[categoryName];
        if (stickers.length === 0) {
            stickerGrid.innerHTML = '<div class="sticker-placeholder">这个分类还没有表情包...</div>';
            return;
        }
        stickers.forEach((sticker, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'sticker-wrapper';
            const img = document.createElement('img');
            img.src = sticker.url;
            img.title = sticker.desc;
            img.className = 'sticker-item';
            img.onclick = () => {
                inputPanel.querySelectorAll('.sticker-item.selected').forEach(item => item.classList.remove('selected'));
                img.classList.add('selected');
                selectedSticker = sticker;
            };
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '&times;';
            deleteBtn.className = 'delete-sticker-btn';
            deleteBtn.title = '删除这个表情包';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm(`确定要删除表情包「${sticker.desc}」吗？`)) {
                    stickerData[categoryName].splice(index, 1);
                    saveStickerData();
                    renderStickers(categoryName);
                }
            };
            wrapper.appendChild(img);
            wrapper.appendChild(deleteBtn);
            stickerGrid.appendChild(wrapper);
        });
    }
    function renderCategories() {
        const existingCats = stickerCategoriesContainer.querySelectorAll('.sticker-category-btn');
        existingCats.forEach(btn => btn.remove());
        Object.keys(stickerData).forEach(name => {
            const btn = document.createElement('button');
            const textNode = document.createElement('span');
            textNode.textContent = name;
            btn.appendChild(textNode);
            btn.className = 'sub-option-btn sticker-category-btn';
            btn.dataset.category = name;
            btn.onclick = () => switchStickerCategory(name);
            stickerCategoriesContainer.appendChild(btn);
        });
    }
    function insertIntoSillyTavern(text) {
        try {
            const stTextarea = document.querySelector('#send_textarea');
            if (stTextarea) {
                stTextarea.value = text + '\n';
                stTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                stTextarea.focus();
            } else { throw new Error('Textarea not found'); }
        } catch (e) {
            console.error('胡萝卜输入面板：', e);
            alert('未能找到SillyTavern的输入框 (#send_textarea)。\n将插入内容到本页输入框：\n' + text);
            mainInput.value = text;
        }
    }
    function saveStickerData() {
        try { localStorage.setItem('carrot_sticker_data', JSON.stringify(stickerData)); } catch (e) { console.error(e); }
    }
    function loadStickerData() {
        try { const data = localStorage.getItem('carrot_sticker_data'); if (data) { stickerData = JSON.parse(data); } } catch (e) { console.error(e); stickerData = {}; }
    }
    function toggleModal(modal, show) { modal.classList.toggle('hidden', !show); }
    function openAddStickersModal(categoryName) {
        addStickerTitle.textContent = `为「${categoryName}」分类添加表情包`;
        newStickersInput.value = '';
        addStickersModal.dataset.currentCategory = categoryName;
        toggleModal(addStickersModal, true);
        newStickersInput.focus();
    }
    function populateEmojiPicker() {
        emojiGrid.innerHTML = '';
        commonEmojis.forEach(emoji => {
            const emojiSpan = document.createElement('span');
            emojiSpan.textContent = emoji;
            emojiSpan.addEventListener('click', () => {
                let targetTextarea;
                if(currentTab === 'text') targetTextarea = mainInput;
                if(currentTab === 'voice') targetTextarea = voiceMessageInput;
                if (targetTextarea) {
                    const start = targetTextarea.selectionStart;
                    const end = targetTextarea.selectionEnd;
                    const text = targetTextarea.value;
                    targetTextarea.value = text.substring(0, start) + emoji + text.substring(end);
                    targetTextarea.focus();
                    targetTextarea.selectionEnd = start + emoji.length;
                }
                emojiContainer.classList.remove('active');
            });
            emojiGrid.appendChild(emojiSpan);
        });
    }

    // --- 事件监听 ---
    tabButtons.forEach(button => button.addEventListener('click', () => switchTab(button.dataset.tab)));
    textSubOptions.forEach(button => button.addEventListener('click', () => switchTextSubType(button.dataset.type)));
    recallButton.addEventListener('click', () => insertIntoSillyTavern(formatTemplates.recall));
    insertButton.addEventListener('click', () => {
        let formattedText = '';
        switch (currentTab) {
            case 'text':
                const content = mainInput.value;
                if (content.trim()) { formattedText = formatTemplates.text[currentTextSubType].replace('{content}', content); }
                break;
            case 'voice':
                const duration = voiceDurationInput.value;
                const message = voiceMessageInput.value;
                if (duration.trim() && message.trim()) { formattedText = formatTemplates.voice.replace('{duration}', duration).replace('{message}', message); }
                break;
            case 'stickers':
                if (selectedSticker) { formattedText = formatTemplates.stickers.replace('{desc}', selectedSticker.desc); }
                break;
        }
        if (formattedText) { insertIntoSillyTavern(formattedText); } else { alert('请输入内容或选择一个表情包！'); }
    });
    emojiPickerBtn.addEventListener('click', (e) => { e.stopPropagation(); emojiContainer.classList.toggle('active'); });
    addCategoryBtn.addEventListener('click', () => { newCategoryNameInput.value = ''; toggleModal(addCategoryModal, true); newCategoryNameInput.focus(); });
    cancelCategoryBtn.addEventListener('click', () => toggleModal(addCategoryModal, false));
    saveCategoryBtn.addEventListener('click', () => {
        const name = newCategoryNameInput.value.trim();
        if (name && !stickerData[name]) {
            stickerData[name] = [];
            saveStickerData(); renderCategories(); switchStickerCategory(name); toggleModal(addCategoryModal, false);
        } else if (stickerData[name]) { alert('该分类已存在！'); } else { alert('请输入有效的分类名称！'); }
    });
    cancelStickersBtn.addEventListener('click', () => toggleModal(addStickersModal, false));
    saveStickersBtn.addEventListener('click', () => {
        const category = addStickersModal.dataset.currentCategory;
        const text = newStickersInput.value.trim();
        if (!category || !text) { return; }
        const lines = text.split('\n');
        let addedCount = 0;
        lines.forEach(line => {
            const parts = line.split(':');
            if (parts.length >= 2) {
                const desc = parts[0].trim();
                const url = parts.slice(1).join(':').trim();
                if (desc && url) { stickerData[category].push({ desc, url }); addedCount++; }
            }
        });
        if (addedCount > 0) {
            saveStickerData();
            if (currentStickerCategory === category) { renderStickers(category); }
            toggleModal(addStickersModal, false);
        } else { alert('未能解析任何有效的表情包信息，请检查格式是否正确（描述:链接）。'); }
    });


    // --- 5. 新增和修改的逻辑 ---

    // 面板显隐与定位
    carrotButton.addEventListener('click', (event) => {
        event.stopPropagation();
        const isActive = inputPanel.classList.toggle('active');

        if (isActive) {
            // 面板打开时，定位到按钮旁边
            const btnRect = carrotButton.getBoundingClientRect();
            const panelHeight = inputPanel.offsetHeight;
            // 优先显示在按钮上方
            let top = btnRect.top - panelHeight - 10;
            if (top < 10) { // 如果上方空间不够，显示在下方
                top = btnRect.bottom + 10;
            }
            let left = btnRect.left + (btnRect.width / 2) - (inputPanel.offsetWidth / 2);
            // 防止面板超出屏幕边界
            left = Math.max(10, Math.min(left, window.innerWidth - inputPanel.offsetWidth - 10));
            
            inputPanel.style.top = `${top}px`;
            inputPanel.style.left = `${left}px`;
        }
    });

    // 点击页面其他地方关闭面板
    document.addEventListener('click', (event) => {
        if (inputPanel.classList.contains('active') && !inputPanel.contains(event.target) && !carrotButton.contains(event.target)) {
            inputPanel.classList.remove('active');
        }
        if (emojiContainer.classList.contains('active') && !emojiContainer.contains(event.target) && !emojiPickerBtn.contains(event.target)) {
            emojiContainer.classList.remove('active');
        }
    });

    // 拖拽功能实现 (学习自MagiChat)
    function saveButtonPosition(top, left) {
        localStorage.setItem('carrot_button_position', JSON.stringify({ top, left }));
    }

    function loadButtonPosition() {
        const savedPos = JSON.parse(localStorage.getItem('carrot_button_position'));
        if (savedPos && savedPos.top && savedPos.left) {
            carrotButton.style.top = savedPos.top;
            carrotButton.style.left = savedPos.left;
            carrotButton.style.bottom = 'auto'; // 清除默认的bottom/right
            carrotButton.style.right = 'auto';
        }
    }

    carrotButton.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return; // 只响应鼠标左键

        const offsetX = e.clientX - carrotButton.getBoundingClientRect().left;
        const offsetY = e.clientY - carrotButton.getBoundingClientRect().top;
        
        const onMouseMove = (moveEvent) => {
            let newLeft = moveEvent.clientX - offsetX;
            let newTop = moveEvent.clientY - offsetY;

            // 限制按钮在视窗内
            newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - carrotButton.offsetWidth));
            newTop = Math.max(0, Math.min(newTop, window.innerHeight - carrotButton.offsetHeight));
            
            carrotButton.style.left = `${newLeft}px`;
            carrotButton.style.top = `${newTop}px`;
            carrotButton.style.bottom = 'auto';
            carrotButton.style.right = 'auto';
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            // 拖拽结束后保存位置
            saveButtonPosition(carrotButton.style.top, carrotButton.style.left);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    // --- 6. 初始化 ---
    function init() {
        loadStickerData();
        renderCategories();
        populateEmojiPicker();
        loadButtonPosition(); // 加载按钮位置
        
        const firstCategory = Object.keys(stickerData)[0];
        switchStickerCategory(firstCategory || '');
        switchTab('text');
    }

    init();

})(); // IIFE结束