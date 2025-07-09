// script.js (v2.2 - 颜色联动优化)
(function () {
  if (document.getElementById('cip-carrot-button')) return;

  // --- 动态加载Emoji Picker库 ---
  const pickerScript = document.createElement('script');
  pickerScript.type = 'module';
  pickerScript.src = 'https://cdn.jsdelivr.net/npm/emoji-picker-element@^1/index.js';
  document.head.appendChild(pickerScript);

  // --- 1. 创建所有UI元素 (无变化) ---
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

    const inputPanel = create(
      'div',
      'cip-input-panel',
      'cip-frosted-glass',
      `
            <nav id="cip-panel-tabs">
                <button class="cip-tab-button active" data-tab="text">文字信息</button>
                <button class="cip-tab-button" data-tab="voice">语音</button>
                <button class="cip-tab-button" data-tab="bunny">BUNNY</button>
                <button class="cip-tab-button" data-tab="stickers">表情包</button>
            </nav>
            <div id="cip-format-display"></div>
            <div id="cip-panel-content">
                <div id="cip-text-content" class="cip-content-section"><div class="cip-sub-options-container"><button class="cip-sub-option-btn active" data-type="plain">纯文本</button><button class="cip-sub-option-btn" data-type="image">图片</button><button class="cip-sub-option-btn" data-type="video">视频</button><button class="cip-sub-option-btn" data-type="music">音乐</button><button class="cip-sub-option-btn" data-type="post">帖子</button></div><textarea id="cip-main-input" placeholder="在此输入文字..."></textarea></div>
                <div id="cip-voice-content" class="cip-content-section"><input type="number" id="cip-voice-duration" placeholder="输入时长 (秒, 仅数字)"><textarea id="cip-voice-message" placeholder="输入语音识别出的内容..."></textarea></div>
                <div id="cip-bunny-content" class="cip-content-section"><textarea id="cip-bunny-input" placeholder="在此输入想对BUNNY说的话..."></textarea></div>
                <div id="cip-stickers-content" class="cip-content-section"><div id="cip-sticker-categories" class="cip-sub-options-container"><button id="cip-add-category-btn" class="cip-sub-option-btn">+</button></div><div id="cip-sticker-grid"></div></div>
            </div>
            <div id="cip-panel-footer">
                <div id="cip-footer-controls">
                    <div id="cip-emoji-picker-btn" title="Emoji">😊</div>
                    <div id="cip-theme-button" title="主题设置">👕</div>
                </div>
                <div class="cip-footer-actions">
                    <button id="cip-recall-button">撤回</button>
                    <button id="cip-insert-button">插 入</button>
                </div>
            </div>
        `,
    );

    const emojiPicker = create('emoji-picker', 'cip-emoji-picker', 'cip-frosted-glass');
    const addCategoryModal = create(
      'div',
      'cip-add-category-modal',
      'cip-modal-backdrop hidden',
      `<div class="cip-modal-content cip-frosted-glass"><h3>添加新分类</h3><input type="text" id="cip-new-category-name" placeholder="输入分类名称"><div class="cip-modal-actions"><button id="cip-cancel-category-btn">取消</button><button id="cip-save-category-btn">保存</button></div></div>`,
    );
    const addStickersModal = create(
      'div',
      'cip-add-stickers-modal',
      'cip-modal-backdrop hidden',
      `<div class="cip-modal-content cip-frosted-glass"><h3 id="cip-add-sticker-title"></h3><p>每行一个，格式为：<br><code>表情包描述:图片链接</code></p><textarea id="cip-new-stickers-input" placeholder="可爱猫猫:https://example.com/cat.png\n狗狗点头:https://example.com/dog.gif"></textarea><div class="cip-modal-actions"><button id="cip-cancel-stickers-btn">取消</button><button id="cip-save-stickers-btn">保存</button></div></div>`,
    );
    const themePanel = create(
        'div',
        'cip-theme-settings-panel',
        'cip-frosted-glass hidden', 
        `
            <h3>主题与颜色设置</h3>
            <div class="cip-theme-options-grid">
                <label for="cip-color-accent">主要/高亮颜色:</label>
                <input type="text" id="cip-color-accent" data-var="--cip-accent-color">

                <label for="cip-color-accent-hover">高亮悬浮颜色:</label>
                <input type="text" id="cip-color-accent-hover" data-var="--cip-accent-hover-color">

                <label for="cip-color-insert-text">插入按钮文字:</label>
                <input type="text" id="cip-color-insert-text" data-var="--cip-insert-text-color">

                <label for="cip-color-panel-bg">面板背景:</label>
                <input type="text" id="cip-color-panel-bg" data-var="--cip-panel-bg-color">

                <label for="cip-color-tabs-bg">功能栏背景:</label>
                <input type="text" id="cip-color-tabs-bg" data-var="--cip-tabs-bg-color">

                <label for="cip-color-text">功能栏字体:</label>
                <input type="text" id="cip-color-text" data-var="--cip-text-color">

                <label for="cip-color-input-bg">输入框背景:</label>
                <input type="text" id="cip-color-input-bg" data-var="--cip-input-bg-color">
            </div>
            <div class="cip-theme-manager">
                <div class="cip-theme-actions">
                    <select id="cip-theme-select"></select>
                    <button id="cip-delete-theme-btn" class="cip-delete-btn">删除</button>
                </div>
                <div class="cip-theme-save-new">
                    <input type="text" id="cip-new-theme-name" placeholder="输入新配色方案名称...">
                    <button id="cip-save-theme-btn" class="cip-save-btn">保存</button>
                </div>
            </div>
            <button id="cip-close-theme-panel-btn">完成</button>
        `
    );

    return { carrotButton, inputPanel, emojiPicker, addCategoryModal, addStickersModal, themePanel };
  }

  // --- 2. 注入UI到页面中 (无变化) ---
  const { carrotButton, inputPanel, emojiPicker, addCategoryModal, addStickersModal, themePanel } = createUI();
  const anchor = document.querySelector('#chat-buttons-container, #send_form');
  if (anchor) {
    document.body.appendChild(carrotButton);
    document.body.appendChild(inputPanel);
    document.body.appendChild(emojiPicker);
    document.body.appendChild(addCategoryModal);
    document.body.appendChild(addStickersModal);
    document.body.appendChild(themePanel); 
  } else {
    console.error('胡萝卜输入面板：未能找到SillyTavern的UI挂载点，插件无法加载。');
    return;
  }

  // --- 3. 获取所有元素的引用 (无变化) ---
  const get = id => document.getElementById(id);
  const queryAll = sel => document.querySelectorAll(sel);
  const formatDisplay = get('cip-format-display'),
    insertButton = get('cip-insert-button'),
    recallButton = get('cip-recall-button');
  const mainInput = get('cip-main-input'),
    voiceDurationInput = get('cip-voice-duration'),
    voiceMessageInput = get('cip-voice-message');
  const bunnyInput = get('cip-bunny-input');
  const stickerCategoriesContainer = get('cip-sticker-categories'),
    addCategoryBtn = get('cip-add-category-btn'),
    stickerGrid = get('cip-sticker-grid');
  const emojiPickerBtn = get('cip-emoji-picker-btn');
  const saveCategoryBtn = get('cip-save-category-btn'),
    cancelCategoryBtn = get('cip-cancel-category-btn'),
    newCategoryNameInput = get('cip-new-category-name');
  const addStickerTitle = get('cip-add-sticker-title'),
    saveStickersBtn = get('cip-save-stickers-btn'),
    cancelStickersBtn = get('cip-cancel-stickers-btn'),
    newStickersInput = get('cip-new-stickers-input');
  const themeButton = get('cip-theme-button');
  const closeThemePanelBtn = get('cip-close-theme-panel-btn');
  const colorInputs = queryAll('.cip-theme-options-grid input[type="text"]');
  const themeSelect = get('cip-theme-select');
  const newThemeNameInput = get('cip-new-theme-name');
  const saveThemeBtn = get('cip-save-theme-btn');
  const deleteThemeBtn = get('cip-delete-theme-btn');


  // --- 4. 核心逻辑与事件监听 (已修改) ---
  let currentTab = 'text',
    currentTextSubType = 'plain',
    stickerData = {},
    currentStickerCategory = '',
    selectedSticker = null;
  const formatTemplates = {
    text: {
      plain: '“{content}”',
      image: '“[{content}.jpg]”',
      video: '“[{content}.mp4]”',
      music: '“[{content}.mp3]”',
      post: '“[{content}.link]”',
    },
    voice: "={duration}'|{message}=",
    bunny: '({content})',
    stickers: '!{desc}|{url}!',
    recall: '--',
  };

  // --- 主题管理核心逻辑 (已修改) ---
  let themes = {};
  const defaultTheme = {
    '--cip-accent-color': '#ff7f50',
    '--cip-accent-hover-color': '#e56a40',
    '--cip-insert-text-color': 'white',
    '--cip-panel-bg-color': 'rgba(255, 255, 255, 0.25)',
    '--cip-tabs-bg-color': 'transparent',
    '--cip-text-color': '#333333',
    '--cip-input-bg-color': 'rgba(255, 255, 255, 0.5)',
  };

  /**
   * 新增：将HEX颜色转换为RGBA颜色字符串的辅助函数
   * @param {string} hex - #开头的十六进制颜色.
   * @param {number} alpha - 透明度 (0 to 1).
   * @returns {string|null} - RGBA格式的颜色字符串或null.
   */
  function hexToRgba(hex, alpha = 0.3) {
      if (!hex || !/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) return null; 
      let c = hex.substring(1).split('');
      if (c.length === 3) {
          c = [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c = '0x' + c.join('');
      const r = (c >> 16) & 255;
      const g = (c >> 8) & 255;
      const b = c & 255;
      return `rgba(${r},${g},${b},${alpha})`;
  }

  function applyTheme(theme) {
    const themeToApply = theme || defaultTheme;
    // 1. 应用主题中的所有颜色
    for (const [key, value] of Object.entries(themeToApply)) {
      document.documentElement.style.setProperty(key, value);
    }
    
    // 2. ★ 新增逻辑：根据主题中的高亮色，自动计算并应用激活标签的背景色
    const accentColor = themeToApply['--cip-accent-color'];
    const activeTabBg = hexToRgba(accentColor);
    if (activeTabBg) {
        document.documentElement.style.setProperty('--cip-active-bg-color', activeTabBg);
    } else {
        // 如果颜色格式错误，使用一个默认的半透明色
        document.documentElement.style.setProperty('--cip-active-bg-color', 'rgba(128, 128, 128, 0.3)');
    }

    // 3. 更新输入框中的值为当前主题
    updateColorInputs(themeToApply);
  }

  function updateColorInputs(theme) {
    colorInputs.forEach(input => {
      const varName = input.dataset.var;
      input.value = theme[varName] || '';
    });
  }

  function getColorsFromInputs() {
    const currentColors = {};
    colorInputs.forEach(input => {
      currentColors[input.dataset.var] = input.value;
    });
    return currentColors;
  }

  function populateThemeSelect() {
    const savedSelection = themeSelect.value;
    themeSelect.innerHTML = '<option value="default">默认主题</option>';
    for (const themeName in themes) {
      const option = document.createElement('option');
      option.value = themeName;
      option.textContent = themeName;
      themeSelect.appendChild(option);
    }
    themeSelect.value = themes[savedSelection] ? savedSelection : 'default';
  }

  function saveCurrentTheme() {
    const name = newThemeNameInput.value.trim();
    if (!name) {
      alert('请输入配色方案名称！');
      return;
    }
    if (name === 'default') {
      alert('不能使用 "default" 作为名称。');
      return;
    }
    themes[name] = getColorsFromInputs();
    localStorage.setItem('cip_theme_data_v1', JSON.stringify(themes));
    newThemeNameInput.value = '';
    populateThemeSelect();
    themeSelect.value = name;
    alert('配色方案已保存！');
  }

  function deleteSelectedTheme() {
    const selected = themeSelect.value;
    if (selected === 'default') {
      alert('不能删除默认主题。');
      return;
    }
    if (confirm(`确定要删除 "${selected}" 这个配色方案吗？`)) {
      delete themes[selected];
      localStorage.setItem('cip_theme_data_v1', JSON.stringify(themes));
      populateThemeSelect();
      applyTheme(defaultTheme); 
    }
  }
  
  function loadThemes() {
     const savedThemes = localStorage.getItem('cip_theme_data_v1');
     if (savedThemes) {
         themes = JSON.parse(savedThemes);
     }
     const lastThemeName = localStorage.getItem('cip_last_active_theme_v1') || 'default';
     populateThemeSelect();
     const themeToApply = themes[lastThemeName] || defaultTheme;
     applyTheme(themeToApply);
     themeSelect.value = themes[lastThemeName] ? lastThemeName : 'default';
  }

  // ... [从此处到 "事件监听" 之前的所有函数都保持原样，无需改动] ...
  function updateFormatDisplay() {
    const e = get('cip-input-panel').querySelector(
      `.cip-sticker-category-btn[data-category="${currentStickerCategory}"]`,
    );
    queryAll('.cip-category-action-icon').forEach(e => e.remove());
    switch (currentTab) {
      case 'text':
        formatDisplay.textContent = `格式: ${formatTemplates.text[currentTextSubType].replace('{content}', '内容')}`;
        break;
      case 'voice':
        formatDisplay.textContent = "格式: =数字'|内容=";
        break;
      case 'bunny':
        formatDisplay.textContent = '格式: (内容)';
        break; 
      case 'stickers':
        formatDisplay.textContent = '格式: !描述|链接!';
        if (e) {
          const t = document.createElement('i');
          t.textContent = ' ➕';
          t.className = 'cip-category-action-icon';
          t.title = '向此分类添加表情包';
          t.onclick = t => {
            t.stopPropagation();
            openAddStickersModal(currentStickerCategory);
          };
          e.appendChild(t);
          const o = document.createElement('i');
          o.textContent = ' 🗑️';
          o.className = 'cip-category-action-icon cip-delete-category-btn';
          o.title = '删除此分类';
          o.onclick = t => {
            t.stopPropagation();
            confirm(`确定删除「${currentStickerCategory}」分类?`) &&
              (delete stickerData[currentStickerCategory],
              saveStickerData(),
              renderCategories(),
              switchStickerCategory(Object.keys(stickerData)[0] || ''));
          };
          e.appendChild(o);
        }
    }
  }
  function switchTab(t) {
    (currentTab = t),
      queryAll('.cip-tab-button').forEach(e => e.classList.toggle('active', e.dataset.tab === t)),
      queryAll('.cip-content-section').forEach(e => e.classList.toggle('active', e.id === `cip-${t}-content`));
    const o = Object.keys(stickerData)[0];
    'stickers' === t &&
      (!currentStickerCategory && o ? switchStickerCategory(o) : switchStickerCategory(currentStickerCategory)),
      updateFormatDisplay();
  }
  function switchTextSubType(t) {
    (currentTextSubType = t),
      queryAll('#cip-text-content .cip-sub-option-btn').forEach(e =>
        e.classList.toggle('active', e.dataset.type === t),
      ),
      updateFormatDisplay();
  }
  function switchStickerCategory(t) {
    (currentStickerCategory = t),
      queryAll('.cip-sticker-category-btn').forEach(e => e.classList.toggle('active', e.dataset.category === t)),
      renderStickers(t),
      (selectedSticker = null),
      updateFormatDisplay();
  }
  function renderStickers(t) {
    if (((stickerGrid.innerHTML = ''), !t || !stickerData[t]))
      return void (stickerGrid.innerHTML = '<div class="cip-sticker-placeholder">请先选择或添加一个分类...</div>');
    const o = stickerData[t];
    if (0 === o.length)
      return void (stickerGrid.innerHTML = '<div class="cip-sticker-placeholder">这个分类还没有表情包...</div>');
    o.forEach((t, o) => {
      const e = document.createElement('div');
      e.className = 'cip-sticker-wrapper';
      const i = document.createElement('img');
      (i.src = t.url),
        (i.title = t.desc),
        (i.className = 'cip-sticker-item'),
        (i.onclick = () => {
          queryAll('.cip-sticker-item.selected').forEach(e => e.classList.remove('selected')),
            i.classList.add('selected'),
            (selectedSticker = t);
        });
      const n = document.createElement('button');
      (n.innerHTML = '&times;'),
        (n.className = 'cip-delete-sticker-btn'),
        (n.title = '删除这个表情包'),
        (n.onclick = e => {
          e.stopPropagation(),
            confirm(`确定删除表情「${t.desc}」?`) &&
              (stickerData[currentStickerCategory].splice(o, 1),
              saveStickerData(),
              renderStickers(currentStickerCategory));
        }),
        e.appendChild(i),
        e.appendChild(n),
        stickerGrid.appendChild(e);
    });
  }
  function renderCategories() {
    queryAll('.cip-sticker-category-btn').forEach(e => e.remove()),
      Object.keys(stickerData).forEach(t => {
        const o = document.createElement('button'),
          e = document.createElement('span');
        (e.textContent = t),
          o.appendChild(e),
          (o.className = 'cip-sub-option-btn cip-sticker-category-btn'),
          (o.dataset.category = t),
          (o.onclick = () => switchStickerCategory(t)),
          stickerCategoriesContainer.appendChild(o);
      });
  }
  function insertIntoSillyTavern(t) {
    const o = document.querySelector('#send_textarea');
    o
      ? ((o.value += (o.value.trim() ? '\n' : '') + t), o.dispatchEvent(new Event('input', { bubbles: !0 })), o.focus())
      : alert('未能找到SillyTavern的输入框！');
  }
  function saveStickerData() {
    localStorage.setItem('cip_sticker_data', JSON.stringify(stickerData));
  }
  function loadStickerData() {
    const t = localStorage.getItem('cip_sticker_data');
    t && (stickerData = JSON.parse(t));
  }
  function toggleModal(t, o) {
    get(t).classList.toggle('hidden', !o);
  }
  function openAddStickersModal(t) {
    (addStickerTitle.textContent = `为「${t}」分类添加表情包`),
      (newStickersInput.value = ''),
      (addStickersModal.dataset.currentCategory = t),
      toggleModal('cip-add-stickers-modal', !0),
      newStickersInput.focus();
  }


  // --- 事件监听 (已修改) ---

  emojiPicker.addEventListener('emoji-click', event => {
    const emoji = event.detail.unicode;
    let target;
    if (currentTab === 'text') target = mainInput;
    else if (currentTab === 'voice') target = voiceMessageInput;
    else if (currentTab === 'bunny') target = bunnyInput; 

    if (target) {
      const { selectionStart, selectionEnd, value } = target;
      target.value = value.substring(0, selectionStart) + emoji + value.substring(selectionEnd);
      target.focus();
      target.selectionEnd = selectionStart + emoji.length;
    }
    emojiPicker.style.display = 'none';
  });

  emojiPickerBtn.addEventListener('click', e => {
    e.stopPropagation();
    const isVisible = emojiPicker.style.display === 'block';
    if (isVisible) {
      emojiPicker.style.display = 'none';
    } else {
      const btnRect = emojiPickerBtn.getBoundingClientRect();
      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        const pickerWidth = 300; 
        const pickerHeight = 350;
        const left = Math.max(10, (window.innerWidth - pickerWidth) / 2);
        const top = Math.max(10, (window.innerHeight - pickerHeight) / 2);
        emojiPicker.style.top = `${top}px`;
        emojiPicker.style.left = `${left}px`;
      } else {
        let top = btnRect.top - 350 - 10;
        if (top < 10) top = btnRect.bottom + 10;
        emojiPicker.style.top = `${top}px`;
        emojiPicker.style.left = `${btnRect.left}px`;
      }
      emojiPicker.style.display = 'block';
    }
  });

  queryAll('.cip-tab-button').forEach(button =>
    button.addEventListener('click', e => switchTab(e.currentTarget.dataset.tab)),
  );
  queryAll('#cip-text-content .cip-sub-option-btn').forEach(button =>
    button.addEventListener('click', e => switchTextSubType(e.currentTarget.dataset.type)),
  );
  recallButton.addEventListener('click', () => insertIntoSillyTavern(formatTemplates.recall));

  insertButton.addEventListener('click', () => {
    let formattedText = '';
    let inputToClear = null;

    switch (currentTab) {
      case 'text':
        if (mainInput.value.trim()) {
          formattedText = formatTemplates.text[currentTextSubType].replace('{content}', mainInput.value);
          inputToClear = mainInput;
        }
        break;
      case 'voice':
        if (voiceDurationInput.value.trim() && voiceMessageInput.value.trim()) {
          formattedText = formatTemplates.voice
            .replace('{duration}', voiceDurationInput.value)
            .replace('{message}', voiceMessageInput.value);
          inputToClear = voiceMessageInput; 
          voiceDurationInput.value = ''; 
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
          formattedText = formatTemplates.stickers
            .replace('{desc}', selectedSticker.desc)
            .replace('{url}', selectedSticker.url);
        }
        break;
    }

    if (formattedText) {
      insertIntoSillyTavern(formattedText);
      if (inputToClear) {
        inputToClear.value = '';
      }
    }
  });

  addCategoryBtn.addEventListener('click', () => {
    newCategoryNameInput.value = '';
    toggleModal('cip-add-category-modal', true);
    newCategoryNameInput.focus();
  });
  cancelCategoryBtn.addEventListener('click', () => toggleModal('cip-add-category-modal', false));
  saveCategoryBtn.addEventListener('click', () => {
    const name = newCategoryNameInput.value.trim();
    if (name && !stickerData[name]) {
      stickerData[name] = [];
      saveStickerData();
      renderCategories();
      switchStickerCategory(name);
      toggleModal('cip-add-category-modal', false);
    } else if (stickerData[name]) alert('该分类已存在！');
    else alert('请输入有效的分类名称！');
  });
  cancelStickersBtn.addEventListener('click', () => toggleModal('cip-add-stickers-modal', false));
  saveStickersBtn.addEventListener('click', () => {
    const category = addStickersModal.dataset.currentCategory;
    const text = newStickersInput.value.trim();
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
      toggleModal('cip-add-stickers-modal', false);
    } else alert('未能解析任何有效的表情包信息。');
  });

    // --- 主题设置事件监听 (已修改) ---
    themeButton.addEventListener('click', () => themePanel.classList.remove('hidden'));
    closeThemePanelBtn.addEventListener('click', () => themePanel.classList.add('hidden'));

    colorInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const property = e.target.dataset.var;
            const value = e.target.value.trim();
            document.documentElement.style.setProperty(property, value);

            // ★ 新增逻辑：如果改变的是高亮色，则同步更新激活标签的背景色
            if (property === '--cip-accent-color') {
                const activeTabBg = hexToRgba(value);
                if (activeTabBg) {
                    document.documentElement.style.setProperty('--cip-active-bg-color', activeTabBg);
                }
            }
        });
    });

    themeSelect.addEventListener('change', (e) => {
        const themeName = e.target.value;
        const theme = themeName === 'default' ? defaultTheme : themes[themeName];
        applyTheme(theme);
        localStorage.setItem('cip_last_active_theme_v1', themeName);
    });

    saveThemeBtn.addEventListener('click', saveCurrentTheme);
    deleteThemeBtn.addEventListener('click', deleteSelectedTheme);


  // --- 5. 交互处理逻辑 (无变化) ---
  function showPanel() {
    if (inputPanel.classList.contains('active')) return;
    const btnRect = carrotButton.getBoundingClientRect();
    const panelWidth = inputPanel.offsetWidth || 350;
    const panelHeight = inputPanel.offsetHeight || 380;
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      const left = Math.max(10, (window.innerWidth - panelWidth) / 2);
      const top = Math.max(10, (window.innerHeight - panelHeight) / 2);
      inputPanel.style.top = `${top}px`;
      inputPanel.style.left = `${left}px`;
    } else {
      let top = btnRect.top - panelHeight - 10;
      if (top < 10) {
        top = btnRect.bottom + 10;
      }
      let left = btnRect.left + btnRect.width / 2 - panelWidth / 2;
      left = Math.max(10, Math.min(left, window.innerWidth - panelWidth - 10));
      inputPanel.style.top = `${top}px`;
      inputPanel.style.left = `${left}px`;
    }

    inputPanel.classList.add('active');
  }
  function hidePanel() {
    inputPanel.classList.remove('active');
  }

  document.addEventListener('click', e => {
    if (inputPanel.classList.contains('active') && !inputPanel.contains(e.target) && !carrotButton.contains(e.target))
      hidePanel();
    if (
      emojiPicker.style.display === 'block' &&
      !emojiPicker.contains(e.target) &&
      !emojiPickerBtn.contains(e.target)
    ) {
      emojiPicker.style.display = 'none';
    }
    // 新增：点击主题面板外部时不关闭，因为操作复杂，防止误触
  });

  function dragHandler(e) {
    let isClick = true;
    if (e.type === 'touchstart') e.preventDefault();
    const rect = carrotButton.getBoundingClientRect();
    const offsetX = (e.type.includes('mouse') ? e.clientX : e.touches[0].clientX) - rect.left;
    const offsetY = (e.type.includes('mouse') ? e.clientY : e.touches[0].clientY) - rect.top;
    const move = e => {
      isClick = false;
      carrotButton.classList.add('is-dragging');
      let newLeft = (e.type.includes('mouse') ? e.clientX : e.touches[0].clientX) - offsetX;
      let newTop = (e.type.includes('mouse') ? e.clientY : e.touches[0].clientY) - offsetY;
      newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - carrotButton.offsetWidth));
      newTop = Math.max(0, Math.min(newTop, window.innerHeight - carrotButton.offsetHeight));
      carrotButton.style.position = 'fixed';
      carrotButton.style.left = `${newLeft}px`;
      carrotButton.style.top = `${newTop}px`;
    };
    const end = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', end);
      document.removeEventListener('touchmove', move);
      document.removeEventListener('touchend', end);
      carrotButton.classList.remove('is-dragging');
      if (isClick) {
        inputPanel.classList.contains('active') ? hidePanel() : showPanel();
      } else {
        localStorage.setItem(
          'cip_button_position_v4',
          JSON.stringify({ top: carrotButton.style.top, left: carrotButton.style.left }),
        );
      }
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', end);
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('touchend', end);
  }

  carrotButton.addEventListener('mousedown', dragHandler);
  carrotButton.addEventListener('touchstart', dragHandler, { passive: false });

  function loadButtonPosition() {
    const savedPos = JSON.parse(localStorage.getItem('cip_button_position_v4'));
    if (savedPos?.top && savedPos?.left) {
      carrotButton.style.position = 'fixed';
      carrotButton.style.top = savedPos.top;
      carrotButton.style.left = savedPos.left;
    }
  }

  $(() => {
    $(window).on('resize orientationchange', function () {
      if (inputPanel.classList.contains('active')) {
        setTimeout(() => {
          hidePanel();
          showPanel();
        }, 100);
      }

      if (emojiPicker.style.display === 'block') {
        setTimeout(() => {
          emojiPicker.style.display = 'none';
        }, 100);
      }
    });
  });

  function init() {
    loadStickerData();
    loadThemes(); 
    renderCategories();
    loadButtonPosition();
    switchStickerCategory(Object.keys(stickerData)[0] || '');
    switchTab('text');
  }
  init();
})();
