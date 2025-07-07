// script.js (v1.0 - 自定义QR插件)
(function () {
    // 防止插件重复加载
    if (document.getElementById('cqr-main-button')) return;

    const CQR_ID_PREFIX = 'cqr-';
    const CQR_FORMATS_KEY = 'cqr_formats_v1';
    const CQR_STICKERS_KEY = 'cqr_stickers_v1';
    const CQR_BUTTON_POS_KEY = 'cqr_button_pos_v1';

    // --- 0. 默认配置 ---
    // 定义默认的插入格式
    const getDefaultFormats = () => ({
        text: '“{content}”',
        voice: "={duration}'|{message}=",
        cheat_mode: "({content})",
        stickers: "!{desc}|{url}!",
        recall: '--'
    });

    // --- 1. 动态加载外部库 ---
    const pickerScript = document.createElement('script');
    pickerScript.type = 'module';
    pickerScript.src = 'https://cdn.jsdelivr.net/npm/emoji-picker-element@^1/index.js';
    document.head.appendChild(pickerScript);

    // --- 2. 创建所有UI元素 ---
    function createUI() {
        const create = (tag, id, className, html) => {
            const el = document.createElement(tag);
            if (id) el.id = CQR_ID_PREFIX + id;
            if (className) el.className = className.split(' ').map(c => CQR_ID_PREFIX + c).join(' ');
            if (html) el.innerHTML = html;
            return el;
        };

        const mainButton = create('div', 'main-button', null, '🥕');
        mainButton.title = '自定义QR插件';

        const inputPanel = create('div', 'input-panel', 'frosted-glass', `
            <nav id="${CQR_ID_PREFIX}panel-tabs">
                <button class="cqr-tab-button active" data-tab="text">文字信息</button>
                <button class="cqr-tab-button" data-tab="voice">语音</button>
                <button class="cqr-tab-button" data-tab="cheat_mode">作弊模式</button>
                <button class="cqr-tab-button" data-tab="stickers">表情包</button>
            </nav>
            <div id="${CQR_ID_PREFIX}panel-content">
                <div id="${CQR_ID_PREFIX}text-content" class="cqr-content-section"><textarea id="${CQR_ID_PREFIX}text-input" placeholder="在此输入文字..."></textarea></div>
                <div id="${CQR_ID_PREFIX}voice-content" class="cqr-content-section"><input type="number" id="${CQR_ID_PREFIX}voice-duration" placeholder="输入时长 (秒, 仅数字)"><textarea id="${CQR_ID_PREFIX}voice-message" placeholder="输入语音识别出的内容..."></textarea></div>
                <div id="${CQR_ID_PREFIX}cheat_mode-content" class="cqr-content-section"><textarea id="${CQR_ID_PREFIX}cheat_mode-input" placeholder="在此输入想对AI说的话..."></textarea></div>
                <div id="${CQR_ID_PREFIX}stickers-content" class="cqr-content-section"><div id="${CQR_ID_PREFIX}sticker-categories" class="cqr-sub-options-container"><button id="${CQR_ID_PREFIX}add-category-btn" class="cqr-sub-option-btn">+</button></div><div id="${CQR_ID_PREFIX}sticker-grid"></div></div>
            </div>
            <div id="${CQR_ID_PREFIX}panel-footer">
                <div id="${CQR_ID_PREFIX}emoji-picker-btn">😊</div>
                <div id="${CQR_ID_PREFIX}settings-btn">⚙️</div>
                <div class="cqr-footer-actions">
                    <button id="${CQR_ID_PREFIX}recall-button">撤回</button>
                    <button id="${CQR_ID_PREFIX}insert-button">插 入</button>
                </div>
            </div>
        `);

        const emojiPicker = create('emoji-picker', 'emoji-picker', 'frosted-glass');

        // 各种模态框
        const addCategoryModal = create('div', 'add-category-modal', 'modal-backdrop hidden', `<div class="cqr-modal-content cqr-frosted-glass"><h3>添加新分类</h3><input type="text" id="${CQR_ID_PREFIX}new-category-name" placeholder="输入分类名称"><div class="cqr-modal-actions"><button id="${CQR_ID_PREFIX}cancel-category-btn">取消</button><button id="${CQR_ID_PREFIX}save-category-btn">保存</button></div></div>`);
        const addStickersModal = create('div', 'add-stickers-modal', 'modal-backdrop hidden', `<div class="cqr-modal-content cqr-frosted-glass"><h3 id="${CQR_ID_PREFIX}add-sticker-title"></h3><p>每行一个，格式为：<code>表情包描述:图片链接</code></p><textarea id="${CQR_ID_PREFIX}new-stickers-input" placeholder="可爱猫猫:https://example.com/cat.png\n狗狗点头:https://example.com/dog.gif"></textarea><div class="cqr-modal-actions"><button id="${CQR_ID_PREFIX}cancel-stickers-btn">取消</button><button id="${CQR_ID_PREFIX}save-stickers-btn">保存</button></div></div>`);
        const settingsModal = create('div', 'settings-modal', 'modal-backdrop hidden', `
            <div class="cqr-modal-content cqr-frosted-glass">
                <h3>⚙️ 格式设置</h3>
                <div id="${CQR_ID_PREFIX}settings-help">
                    使用 <code>{placeholder}</code> 作为占位符。<br>
                    <strong>文字/作弊:</strong> <code>{content}</code><br>
                    <strong>语音:</strong> <code>{duration}</code> 和 <code>{message}</code><br>
                    <strong>表情包:</strong> <code>{desc}</code> 和 <code>{url}</code>
                </div>
                <form id="${CQR_ID_PREFIX}settings-form">
                    <div class="cqr-settings-item"><label for="cqr-format-text">文字信息格式</label><input type="text" id="${CQR_ID_PREFIX}format-text"></div>
                    <div class="cqr-settings-item"><label for="cqr-format-voice">语音格式</label><input type="text" id="${CQR_ID_PREFIX}format-voice"></div>
                    <div class="cqr-settings-item"><label for="cqr-format-cheat_mode">作弊模式格式</label><input type="text" id="${CQR_ID_PREFIX}format-cheat_mode"></div>
                    <div class="cqr-settings-item"><label for="cqr-format-stickers">表情包格式</label><input type="text" id="${CQR_ID_PREFIX}format-stickers"></div>
                    <div class="cqr-settings-item"><label for="cqr-format-recall">撤回格式</label><input type="text" id="${CQR_ID_PREFIX}format-recall"></div>
                </form>
                <div class="cqr-modal-actions">
                    <div class="left-actions"><button id="${CQR_ID_PREFIX}settings-restore-btn">恢复默认</button></div>
                    <div><button id="${CQR_ID_PREFIX}settings-cancel-btn">取消</button><button id="${CQR_ID_PREFIX}settings-save-btn">保存</button></div>
                </div>
            </div>`);

        return { mainButton, inputPanel, emojiPicker, addCategoryModal, addStickersModal, settingsModal };
    }

    // --- 3. 注入UI到页面 ---
    const { mainButton, inputPanel, emojiPicker, addCategoryModal, addStickersModal, settingsModal } = createUI();
    const anchor = document.querySelector('#chat-buttons-container, #send_form');
    if (anchor) {
        document.body.appendChild(mainButton);
        document.body.appendChild(inputPanel);
        document.body.appendChild(emojiPicker);
        document.body.appendChild(addCategoryModal);
        document.body.appendChild(addStickersModal);
        document.body.appendChild(settingsModal);
    } else {
        console.error("自定义QR插件：未能找到SillyTavern的UI挂载点，插件无法加载。");
        return;
    }

    // --- 4. 获取所有元素的引用 ---
    const get = (id) => document.getElementById(CQR_ID_PREFIX + id);
    const queryAll = (sel) => document.querySelectorAll(sel);

    // --- 5. 核心状态与数据 ---
    let currentTab = 'text', currentStickerCategory = '', selectedSticker = null;
    let loadedFormats = {};
    let stickerData = {};

    // --- 6. 核心功能函数 ---
    // 插入文本到SillyTavern输入框
    function insertIntoSillyTavern(text) {
        const textarea = document.querySelector("#send_textarea");
        if (textarea) {
            const currentVal = textarea.value;
            const selectionStart = textarea.selectionStart;
            const selectionEnd = textarea.selectionEnd;
            const newText = currentVal.substring(0, selectionStart) + text + currentVal.substring(selectionEnd);
            textarea.value = newText;
            textarea.dispatchEvent(new Event("input", { bubbles: true }));
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = selectionStart + text.length;
        } else {
            alert("未能找到SillyTavern的输入框！");
        }
    }

    // 加载/保存/恢复 格式配置
    function loadFormats() {
        const savedFormats = localStorage.getItem(CQR_FORMATS_KEY);
        loadedFormats = savedFormats ? JSON.parse(savedFormats) : getDefaultFormats();
    }
    function saveFormats() {
        localStorage.setItem(CQR_FORMATS_KEY, JSON.stringify(loadedFormats));
    }
    function restoreDefaultFormats() {
        if (confirm("确定要将所有格式恢复为默认设置吗？")) {
            loadedFormats = getDefaultFormats();
            saveFormats();
            openSettingsModal(); // 重新打开以显示新值
        }
    }

    // 加载/保存 贴纸数据
    function loadStickerData() {
        const data = localStorage.getItem(CQR_STICKERS_KEY);
        stickerData = data ? JSON.parse(data) : {};
    }
    function saveStickerData() {
        localStorage.setItem(CQR_STICKERS_KEY, JSON.stringify(stickerData));
    }
    
    // UI切换与渲染
    function switchTab(tabId) {
        currentTab = tabId;
        queryAll(".cqr-tab-button").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tabId));
        queryAll(".cqr-content-section").forEach(sec => sec.classList.toggle("active", sec.id === `${CQR_ID_PREFIX}${tabId}-content`));
        if (tabId === 'stickers' && !currentStickerCategory) {
            const firstCategory = Object.keys(stickerData)[0];
            if (firstCategory) switchStickerCategory(firstCategory);
        }
    }

    function renderCategories() {
        const container = get('sticker-categories');
        // 清空旧分类，保留“+”按钮
        container.querySelectorAll('.cqr-sticker-category-btn').forEach(btn => btn.remove());
        
        Object.keys(stickerData).forEach(name => {
            const btn = document.createElement("button");
            btn.className = "cqr-sub-option-btn cqr-sticker-category-btn";
            btn.textContent = name;
            btn.dataset.category = name;
            btn.onclick = () => switchStickerCategory(name);
            container.appendChild(btn);
        });
    }
    
    function switchStickerCategory(categoryName) {
        currentStickerCategory = categoryName;
        selectedSticker = null;
        queryAll(".cqr-sticker-category-btn").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.category === categoryName);
            // 清理旧的图标
            const oldIcons = btn.querySelector('.cqr-category-action-container');
            if(oldIcons) oldIcons.remove();

            // 为激活的分类添加管理图标
            if (btn.dataset.category === categoryName) {
                const actionContainer = document.createElement('span');
                actionContainer.className = 'cqr-category-action-container';

                const addIcon = document.createElement("i");
                addIcon.textContent = "➕";
                addIcon.className = "cqr-category-action-icon";
                addIcon.title = "向此分类添加表情包";
                addIcon.onclick = e => { e.stopPropagation(); openAddStickersModal(categoryName); };
                
                const deleteIcon = document.createElement("i");
                deleteIcon.textContent = "🗑️";
                deleteIcon.className = "cqr-category-action-icon cqr-delete-category-btn";
                deleteIcon.title = "删除此分类";
                deleteIcon.onclick = e => {
                    e.stopPropagation();
                    if (confirm(`确定删除「${categoryName}」分类及其所有表情包?`)) {
                        delete stickerData[categoryName];
                        saveStickerData();
                        renderCategories();
                        // 切换到第一个可用分类或清空
                        switchStickerCategory(Object.keys(stickerData)[0] || "");
                    }
                };
                actionContainer.appendChild(addIcon);
                actionContainer.appendChild(deleteIcon);
                btn.appendChild(actionContainer);
            }
        });
        renderStickers(categoryName);
    }

    function renderStickers(categoryName) {
        const grid = get('sticker-grid');
        grid.innerHTML = "";
        if (!categoryName || !stickerData[categoryName]) {
            grid.innerHTML = '<div class="cqr-sticker-placeholder">请先选择或添加一个分类...</div>';
            return;
        }
        const stickers = stickerData[categoryName];
        if (stickers.length === 0) {
            grid.innerHTML = '<div class="cqr-sticker-placeholder">这个分类还没有表情包...</div>';
            return;
        }
        stickers.forEach((sticker, index) => {
            const wrapper = document.createElement("div");
            wrapper.className = "cqr-sticker-wrapper";
            const img = document.createElement("img");
            img.src = sticker.url;
            img.title = sticker.desc;
            img.className = "cqr-sticker-item";
            img.onclick = () => {
                queryAll(".cqr-sticker-item.selected").forEach(el => el.classList.remove("selected"));
                img.classList.add("selected");
                selectedSticker = sticker;
            };
            const delBtn = document.createElement("button");
            delBtn.innerHTML = "&times;";
            delBtn.className = "cqr-delete-sticker-btn";
            delBtn.title = "删除这个表情包";
            delBtn.onclick = e => {
                e.stopPropagation();
                if (confirm(`确定删除表情「${sticker.desc}」?`)) {
                    stickerData[currentStickerCategory].splice(index, 1);
                    saveStickerData();
                    renderStickers(currentStickerCategory);
                }
            };
            wrapper.appendChild(img);
            wrapper.appendChild(delBtn);
            grid.appendChild(wrapper);
        });
    }

    // 模态框控制
    function toggleModal(modalId, show) {
        get(modalId).classList.toggle("hidden", !show);
    }

    function openAddStickersModal(category) {
        get('add-sticker-title').textContent = `为「${category}」分类添加表情包`;
        get('new-stickers-input').value = "";
        addStickersModal.dataset.currentCategory = category;
        toggleModal("add-stickers-modal", true);
        get('new-stickers-input').focus();
    }
    
    function openSettingsModal() {
        // 将当前加载的格式填充到输入框
        get('format-text').value = loadedFormats.text;
        get('format-voice').value = loadedFormats.voice;
        get('format-cheat_mode').value = loadedFormats.cheat_mode;
        get('format-stickers').value = loadedFormats.stickers;
        get('format-recall').value = loadedFormats.recall;
        toggleModal('settings-modal', true);
    }

    // --- 7. 事件监听器 ---
    function setupEventListeners() {
        // 主面板交互
        queryAll('.cqr-tab-button').forEach(btn => btn.addEventListener('click', e => switchTab(e.currentTarget.dataset.tab)));
        
        get('recall-button').addEventListener('click', () => insertIntoSillyTavern(loadedFormats.recall));

        get('insert-button').addEventListener('click', () => {
            let formattedText = '';
            let inputsToClear = [];

            switch (currentTab) {
                case 'text':
                    const textInput = get('text-input');
                    if (textInput.value.trim()) {
                        formattedText = loadedFormats.text.replace('{content}', textInput.value);
                        inputsToClear.push(textInput);
                    }
                    break;
                case 'voice':
                    const duration = get('voice-duration'), message = get('voice-message');
                    if (duration.value.trim() && message.value.trim()) {
                        formattedText = loadedFormats.voice
                            .replace('{duration}', duration.value)
                            .replace('{message}', message.value);
                        inputsToClear.push(duration, message);
                    }
                    break;
                case 'cheat_mode':
                    const cheatInput = get('cheat-mode-input');
                    if (cheatInput.value.trim()) {
                        formattedText = loadedFormats.cheat_mode.replace('{content}', cheatInput.value);
                        inputsToClear.push(cheatInput);
                    }
                    break;
                case 'stickers':
                    if (selectedSticker) {
                        formattedText = loadedFormats.stickers
                            .replace('{desc}', selectedSticker.desc)
                            .replace('{url}', selectedSticker.url);
                    }
                    break;
            }
            
            if (formattedText) {
                insertIntoSillyTavern(formattedText);
                inputsToClear.forEach(input => input.value = '');
            }
        });

        // 表情包分类与添加
        get('add-category-btn').addEventListener('click', () => { get('new-category-name').value = ''; toggleModal('add-category-modal', true); get('new-category-name').focus(); });
        get('cancel-category-btn').addEventListener('click', () => toggleModal('add-category-modal', false));
        get('save-category-btn').addEventListener('click', () => {
            const name = get('new-category-name').value.trim();
            if (name && !stickerData[name]) {
                stickerData[name] = [];
                saveStickerData();
                renderCategories();
                switchStickerCategory(name);
                toggleModal('add-category-modal', false);
            } else if (stickerData[name]) {
                alert('该分类已存在！');
            } else {
                alert('请输入有效的分类名称！');
            }
        });

        get('cancel-stickers-btn').addEventListener('click', () => toggleModal('add-stickers-modal', false));
        get('save-stickers-btn').addEventListener('click', () => {
            const category = addStickersModal.dataset.currentCategory;
            const text = get('new-stickers-input').value.trim();
            if (!category || !text) return;
            let addedCount = 0;
            text.split('\n').forEach(line => {
                const parts = line.split(':');
                if (parts.length >= 2) {
                    const desc = parts[0].trim();
                    const url = parts.slice(1).join(':').trim();
                    if (desc && url) {
                        stickerData[category].push({ desc, url });
                        addedCount++;
                    }
                }
            });
            if (addedCount > 0) {
                saveStickerData();
                if (currentStickerCategory === category) renderStickers(category);
                toggleModal('add-stickers-modal', false);
            } else {
                alert('未能解析任何有效的表情包信息。');
            }
        });

        // Emoji Picker
        get('emoji-picker-btn').addEventListener('click', e => {
            e.stopPropagation();
            const isVisible = emojiPicker.style.display === 'block';
            if (isVisible) {
                emojiPicker.style.display = 'none';
            } else {
                const btnRect = get('emoji-picker-btn').getBoundingClientRect();
                emojiPicker.style.top = `${btnRect.top - 350 - 10}px`;
                emojiPicker.style.left = `${btnRect.left - 150}px`;
                emojiPicker.style.display = 'block';
            }
        });
        emojiPicker.addEventListener('emoji-click', event => {
            const emoji = event.detail.unicode;
            let target;
            if (currentTab === 'text') target = get('text-input');
            else if (currentTab === 'voice') target = get('voice-message');
            else if (currentTab === 'cheat_mode') target = get('cheat-mode-input');
            
            if (target) {
                const { selectionStart, selectionEnd, value } = target;
                target.value = value.substring(0, selectionStart) + emoji + value.substring(selectionEnd);
                target.focus();
                target.selectionEnd = selectionStart + emoji.length;
            }
            emojiPicker.style.display = 'none';
        });

        // 设置面板
        get('settings-btn').addEventListener('click', openSettingsModal);
        get('settings-cancel-btn').addEventListener('click', () => toggleModal('settings-modal', false));
        get('settings-restore-btn').addEventListener('click', restoreDefaultFormats);
        get('settings-save-btn').addEventListener('click', () => {
            loadedFormats.text = get('format-text').value;
            loadedFormats.voice = get('format-voice').value;
            loadedFormats.cheat_mode = get('format-cheat_mode').value;
            loadedFormats.stickers = get('format-stickers').value;
            loadedFormats.recall = get('format-recall').value;
            saveFormats();
            toggleModal('settings-modal', false);
            alert('设置已保存！');
        });

        // 按钮拖拽与面板显隐
        function dragHandler(e) {
            let isClick = true;
            if (e.type === 'touchstart') e.preventDefault();
            const rect = mainButton.getBoundingClientRect();
            const offsetX = (e.type.includes('mouse') ? e.clientX : e.touches[0].clientX) - rect.left;
            const offsetY = (e.type.includes('mouse') ? e.clientY : e.touches[0].clientY) - rect.top;

            const move = (e) => {
                isClick = false;
                mainButton.classList.add('is-dragging');
                let newLeft = (e.type.includes('mouse') ? e.clientX : e.touches[0].clientX) - offsetX;
                let newTop = (e.type.includes('mouse') ? e.clientY : e.touches[0].clientY) - offsetY;
                newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - mainButton.offsetWidth));
                newTop = Math.max(0, Math.min(newTop, window.innerHeight - mainButton.offsetHeight));
                mainButton.style.position = 'fixed';
                mainButton.style.left = `${newLeft}px`;
                mainButton.style.top = `${newTop}px`;
            };

            const end = () => {
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', end);
                document.removeEventListener('touchmove', move);
                document.removeEventListener('touchend', end);
                mainButton.classList.remove('is-dragging');
                if (isClick) {
                    inputPanel.classList.contains('active') ? hidePanel() : showPanel();
                } else {
                    localStorage.setItem(CQR_BUTTON_POS_KEY, JSON.stringify({ top: mainButton.style.top, left: mainButton.style.left }));
                }
            };
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', end);
            document.addEventListener('touchmove', move, { passive: false });
            document.addEventListener('touchend', end);
        }
        mainButton.addEventListener('mousedown', dragHandler);
        mainButton.addEventListener('touchstart', dragHandler, { passive: false });

        // 点击外部关闭面板
        document.addEventListener('click', (e) => {
            if (inputPanel.classList.contains('active') && !inputPanel.contains(e.target) && !mainButton.contains(e.target)) {
                hidePanel();
            }
            if (emojiPicker.style.display === 'block' && !emojiPicker.contains(e.target) && !get('emoji-picker-btn').contains(e.target)) {
                emojiPicker.style.display = 'none';
            }
        });
    }

    // --- 8. 辅助与初始化 ---
    function showPanel() {
        const btnRect = mainButton.getBoundingClientRect();
        const panelHeight = inputPanel.offsetHeight || 420;
        const panelWidth = inputPanel.offsetWidth || 380;
        let top = btnRect.top - panelHeight - 10;
        if (top < 10) top = btnRect.bottom + 10;
        let left = btnRect.left + (btnRect.width / 2) - (panelWidth / 2);
        left = Math.max(10, Math.min(left, window.innerWidth - panelWidth - 10));
        inputPanel.style.top = `${top}px`;
        inputPanel.style.left = `${left}px`;
        inputPanel.classList.add('active');
    }
    function hidePanel() {
        inputPanel.classList.remove('active');
    }

    function loadButtonPosition() {
        const savedPos = JSON.parse(localStorage.getItem(CQR_BUTTON_POS_KEY));
        if (savedPos?.top && savedPos?.left) {
            mainButton.style.position = 'fixed';
            mainButton.style.top = savedPos.top;
            mainButton.style.left = savedPos.left;
        }
    }

    function init() {
        loadFormats();
        loadStickerData();
        loadButtonPosition();
        setupEventListeners();
        renderCategories();
        // 默认选择第一个分类（如果存在）
        const firstCategory = Object.keys(stickerData)[0];
        if (firstCategory) {
            switchStickerCategory(firstCategory);
        }
        // 默认打开文字标签页
        switchTab('text');
    }

    // 启动插件
    init();
})();
