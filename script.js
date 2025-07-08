// script.js (v2.1 - 修复移动端定位 & 优化交互)
(function () {
    if (document.getElementById('cip-carrot-button')) return;

    // 动态加载Emoji Picker库
    const pickerScript = document.createElement('script');
    pickerScript.type = 'module';
    pickerScript.src = 'https://cdn.jsdelivr.net/npm/emoji-picker-element@^1/index.js';
    document.head.appendChild(pickerScript);

    // 1. 创建UI (无变化)
    function createUI() {
        const create = (tag, id, className, html) => { const el = document.createElement(tag); if (id) el.id = id; if (className) el.className = className; if (html) el.innerHTML = html; return el; };
        const carrotButton = create('div', 'cip-carrot-button', null, '🥕');
        carrotButton.title = '胡萝卜快捷输入';
        const inputPanel = create('div', 'cip-input-panel', 'cip-frosted-glass', `
            <nav id="cip-panel-tabs"><button class="cip-tab-button active" data-tab="text">文字信息</button><button class="cip-tab-button" data-tab="voice">语音</button><button class="cip-tab-button" data-tab="bunny">BUNNY</button><button class="cip-tab-button" data-tab="stickers">表情包</button></nav>
            <div id="cip-format-display"></div>
            <div id="cip-panel-content">
                <div id="cip-text-content" class="cip-content-section active"><div class="cip-sub-options-container"><button class="cip-sub-option-btn active" data-type="plain">纯文本</button><button class="cip-sub-option-btn" data-type="image">图片</button><button class="cip-sub-option-btn" data-type="video">视频</button><button class="cip-sub-option-btn" data-type="music">音乐</button><button class="cip-sub-option-btn" data-type="post">帖子</button></div><textarea id="cip-main-input" placeholder="在此输入文字..."></textarea></div>
                <div id="cip-voice-content" class="cip-content-section"><input type="number" id="cip-voice-duration" placeholder="输入时长 (秒, 仅数字)"><textarea id="cip-voice-message" placeholder="输入语音识别出的内容..."></textarea></div>
                <div id="cip-bunny-content" class="cip-content-section"><textarea id="cip-bunny-input" placeholder="在此输入想对BUNNY说的话..."></textarea></div>
                <div id="cip-stickers-content" class="cip-content-section"><div id="cip-sticker-categories" class="cip-sub-options-container"><button id="cip-add-category-btn" class="cip-sub-option-btn">+</button></div><div id="cip-sticker-grid"></div></div>
            </div>
            <div id="cip-panel-footer"><div id="cip-emoji-picker-btn">😊</div><div class="cip-footer-actions"><button id="cip-recall-button">撤回</button><button id="cip-insert-button">插 入</button></div></div>`);
        const emojiPicker = create('emoji-picker', 'cip-emoji-picker', 'cip-frosted-glass');
        const addCategoryModal = create('div', 'cip-add-category-modal', 'cip-modal-backdrop hidden', `<div class="cip-modal-content cip-frosted-glass"><h3>添加新分类</h3><input type="text" id="cip-new-category-name" placeholder="输入分类名称"><div class="cip-modal-actions"><button id="cip-cancel-category-btn">取消</button><button id="cip-save-category-btn">保存</button></div></div>`);
        const addStickersModal = create('div', 'cip-add-stickers-modal', 'cip-modal-backdrop hidden', `<div class="cip-modal-content cip-frosted-glass"><h3 id="cip-add-sticker-title"></h3><p>每行一个，格式为：<br><code>表情包描述:图片链接</code></p><textarea id="cip-new-stickers-input" placeholder="可爱猫猫:https://example.com/cat.png\n狗狗点头:https://example.com/dog.gif"></textarea><div class="cip-modal-actions"><button id="cip-cancel-stickers-btn">取消</button><button id="cip-save-stickers-btn">保存</button></div></div>`);
        return { carrotButton, inputPanel, emojiPicker, addCategoryModal, addStickersModal };
    }

    // 2. 注入UI
    const { carrotButton, inputPanel, emojiPicker, addCategoryModal, addStickersModal } = createUI();
    document.body.appendChild(carrotButton); document.body.appendChild(inputPanel); document.body.appendChild(emojiPicker); document.body.appendChild(addCategoryModal); document.body.appendChild(addStickersModal);

    // 3. 获取元素引用
    const get = (id) => document.getElementById(id);
    const queryAll = (sel) => document.querySelectorAll(sel);
    const formatDisplay = get('cip-format-display'), insertButton = get('cip-insert-button'), recallButton = get('cip-recall-button'), mainInput = get('cip-main-input'), voiceDurationInput = get('cip-voice-duration'), voiceMessageInput = get('cip-voice-message'), bunnyInput = get('cip-bunny-input'), stickerCategoriesContainer = get('cip-sticker-categories'), addCategoryBtn = get('cip-add-category-btn'), stickerGrid = get('cip-sticker-grid'), emojiPickerBtn = get('cip-emoji-picker-btn'), saveCategoryBtn = get('cip-save-category-btn'), cancelCategoryBtn = get('cip-cancel-category-btn'), newCategoryNameInput = get('cip-new-category-name'), addStickerTitle = get('cip-add-sticker-title'), saveStickersBtn = get('cip-save-stickers-btn'), cancelStickersBtn = get('cip-cancel-stickers-btn'), newStickersInput = get('cip-new-stickers-input');

    // 4. 核心逻辑
    let currentTab = 'text', currentTextSubType = 'plain', stickerData = {}, currentStickerCategory = '', selectedSticker = null;
    const formatTemplates = { text: { plain: '“{content}”', image: '“[{content}.jpg]”', video: '“[{content}.mp4]”', music: '“[{content}.mp3]”', post: '“[{content}.link]”' }, voice: "={duration}'|{message}=", bunny: "({content})", stickers: "!{desc}|{url}!", recall: '--' };
    
    // (此处省略了大部分未修改的函数以保持简洁，实际使用时请完整替换)
    function updateFormatDisplay(){ queryAll(".cip-category-action-icon").forEach(e=>e.remove()); switch(currentTab){ case "text":formatDisplay.textContent=`格式: ${formatTemplates.text[currentTextSubType].replace("{content}","内容")}`;break; case "voice":formatDisplay.textContent="格式: =数字'|内容=";break; case "bunny":formatDisplay.textContent="格式: (内容)";break; case "stickers":formatDisplay.textContent="格式: !描述|链接!";const t=stickerCategoriesContainer.querySelector(`.cip-sticker-category-btn[data-category="${currentStickerCategory}"]`);if(t){const e=document.createElement("i");e.textContent=" ➕",e.className="cip-category-action-icon",e.title="向此分类添加表情包",e.onclick=t=>{t.stopPropagation(),openAddStickersModal(currentStickerCategory)},t.firstElementChild.appendChild(e);const o=document.createElement("i");o.textContent=" 🗑️",o.className="cip-category-action-icon cip-delete-category-btn",o.title="删除此分类",o.onclick=t=>{t.stopPropagation(),confirm(`确定删除「${currentStickerCategory}」分类及其所有表情包吗?`)&&(delete stickerData[currentStickerCategory],saveStickerData(),renderCategories(),switchStickerCategory(Object.keys(stickerData)[0]||""))},t.firstElementChild.appendChild(o)}break } }
    function switchTab(t){currentTab=t,queryAll(".cip-tab-button").forEach(e=>e.classList.toggle("active",e.dataset.tab===t)),queryAll(".cip-content-section").forEach(e=>e.classList.toggle("active",e.id===`cip-${t}-content`)),"stickers"===t&&!currentStickerCategory&&Object.keys(stickerData).length>0&&switchStickerCategory(Object.keys(stickerData)[0]),updateFormatDisplay()}
    function switchTextSubType(t){currentTextSubType=t,queryAll("#cip-text-content .cip-sub-option-btn").forEach(e=>e.classList.toggle("active",e.dataset.type===t)),updateFormatDisplay()}
    function switchStickerCategory(t){currentStickerCategory=t,queryAll(".cip-sticker-category-btn").forEach(e=>e.classList.toggle("active",e.dataset.category===t)),renderStickers(t),selectedSticker=null,updateFormatDisplay()}
    function renderStickers(t){stickerGrid.innerHTML="",t&&stickerData[t]?0===stickerData[t].length?stickerGrid.innerHTML='<div class="cip-sticker-placeholder">这个分类还没有表情包... <br>点击分类名旁边的 ➕ 添加吧！</div>':stickerData[t].forEach((e,o)=>{const t=document.createElement("div");t.className="cip-sticker-wrapper";const c=document.createElement("img");c.src=e.url,c.title=e.desc,c.className="cip-sticker-item",c.onclick=()=>{queryAll(".cip-sticker-item.selected").forEach(t=>t.classList.remove("selected")),c.classList.add("selected"),selectedSticker=e};const n=document.createElement("button");n.innerHTML="&times;",n.className="cip-delete-sticker-btn",n.title="删除这个表情包",n.onclick=t=>{t.stopPropagation(),confirm(`确定删除表情「${e.desc}」?`)&&(stickerData[currentStickerCategory].splice(o,1),saveStickerData(),renderStickers(currentStickerCategory))},t.appendChild(c),t.appendChild(n),stickerGrid.appendChild(t)}):stickerGrid.innerHTML='<div class="cip-sticker-placeholder">请先选择或添加一个分类...</div>'}
    function renderCategories(){const t=currentStickerCategory;stickerCategoriesContainer.querySelectorAll(".cip-sticker-category-btn").forEach(t=>t.remove()),Object.keys(stickerData).forEach(e=>{const t=document.createElement("button"),o=document.createElement("span");o.textContent=e,t.appendChild(o),t.className="cip-sub-option-btn cip-sticker-category-btn",t.dataset.category=e,t.onclick=()=>switchStickerCategory(e),stickerCategoriesContainer.insertBefore(t,addCategoryBtn)}),stickerData[t]&&stickerCategoriesContainer.querySelector(`.cip-sticker-category-btn[data-category="${t}"]`)?.classList.add("active")}
    function insertIntoSillyTavern(t){const e=document.querySelector("#send_textarea");e&&(e.value+=(e.value.trim()?"\n":"")+t,e.dispatchEvent(new Event("input",{bubbles:!0})),e.focus())}
    function saveStickerData(){localStorage.setItem("cip_sticker_data",JSON.stringify(stickerData))}
    function loadStickerData(){const t=localStorage.getItem("cip_sticker_data");t&&(stickerData=JSON.parse(t))}
    function toggleModal(t,e){get(t).classList.toggle("hidden",!e)}
    function openAddStickersModal(t){addStickerTitle.textContent=`为「${t}」分类添加表情包`,newStickersInput.value="",addStickersModal.dataset.currentCategory=t,toggleModal("cip-add-stickers-modal",!0),newStickersInput.focus()}
    
    emojiPicker.addEventListener('emoji-click',e=>{const o=e.detail.unicode;let t;currentTab==="text"?t=mainInput:currentTab==="voice"?t=voiceMessageInput:currentTab==="bunny"&&(t=bunnyInput),t&&(t.value=t.value.substring(0,t.selectionStart)+o+t.value.substring(t.selectionEnd),t.focus(),t.selectionStart=t.selectionEnd=t.selectionStart+o.length),emojiPicker.style.display="none"});
    
    // --- 关键修改点: 表情选择器定位逻辑 ---
    emojiPickerBtn.addEventListener('click', e => {
        e.stopPropagation();
        const isVisible = emojiPicker.style.display === 'block';
        if (isVisible) {
            emojiPicker.style.display = 'none';
        } else {
            // 判断是否为移动设备
            if (window.innerWidth <= 768) {
                // 移动端：强制居中显示
                emojiPicker.style.top = '50%';
                emojiPicker.style.left = '50%';
                emojiPicker.style.transform = 'translate(-50%, -50%)';
            } else {
                // 桌面端：在按钮附近显示
                const btnRect = emojiPickerBtn.getBoundingClientRect();
                const panelRect = inputPanel.getBoundingClientRect();
                let top = panelRect.top - (emojiPicker.offsetHeight || 400) - 10;
                if (top < 10) top = panelRect.bottom + 10;
                
                let left = btnRect.left;
                if (left + (emojiPicker.offsetWidth || 350) > window.innerWidth) {
                    left = window.innerWidth - (emojiPicker.offsetWidth || 350) - 10;
                }
                emojiPicker.style.top = `${top}px`;
                emojiPicker.style.left = `${left}px`;
                emojiPicker.style.transform = 'none'; // 清除transform以防干扰
            }
            emojiPicker.style.display = 'block';
        }
    });

    queryAll('.cip-tab-button').forEach(e=>e.addEventListener('click',t=>switchTab(t.currentTarget.dataset.tab)));
    queryAll('#cip-text-content .cip-sub-option-btn').forEach(e=>e.addEventListener('click',t=>switchTextSubType(t.currentTarget.dataset.type)));
    recallButton.addEventListener('click',()=>insertIntoSillyTavern(formatTemplates.recall));
    
    insertButton.addEventListener('click',()=>{let t,e,o="";switch(currentTab){case"text":mainInput.value.trim()&&(o=formatTemplates.text[currentTextSubType].replace("{content}",mainInput.value),t=mainInput);break;case"voice":voiceDurationInput.value.trim()&&voiceMessageInput.value.trim()&&(o=formatTemplates.voice.replace("{duration}",voiceDurationInput.value).replace("{message}",voiceMessageInput.value),t=voiceMessageInput,e=voiceDurationInput);break;case"bunny":bunnyInput.value.trim()&&(o=formatTemplates.bunny.replace("{content}",bunnyInput.value),t=bunnyInput);break;case"stickers":selectedSticker&&(o=formatTemplates.stickers.replace("{desc}",selectedSticker.desc).replace("{url}",selectedSticker.url))}o&&(insertIntoSillyTavern(o),t&&(t.value=""),e&&(e.value=""))});
    addCategoryBtn.addEventListener('click',()=>{newCategoryNameInput.value="",toggleModal("cip-add-category-modal",!0),newCategoryNameInput.focus()});
    cancelCategoryBtn.addEventListener('click',()=>toggleModal("cip-add-category-modal",!1));
    saveCategoryBtn.addEventListener('click',()=>{const t=newCategoryNameInput.value.trim();t&&!stickerData[t]?(stickerData[t]=[],saveStickerData(),renderCategories(),switchStickerCategory(t),toggleModal("cip-add-category-modal",!1)):stickerData[t]?alert("该分类已存在！"):alert("请输入有效的分类名称！")});
    cancelStickersBtn.addEventListener('click',()=>toggleModal("cip-add-stickers-modal",!1));
    saveStickersBtn.addEventListener('click',()=>{const t=addStickersModal.dataset.currentCategory,e=newStickersInput.value.trim();if(t&&e){let o=0;e.split("\n").forEach(t=>{const e=t.split(/:|：/);if(2<=e.length){const n=e[0].trim(),c=e.slice(1).join(":").trim();n&&c.startsWith("http")&&(stickerData[t].push({desc:n,url:c}),o++)}}),0<o?(saveStickerData(),currentStickerCategory===t&&renderStickers(t),toggleModal("cip-add-stickers-modal",!1)):alert("未能解析任何有效的表情包信息。请检查格式（描述:链接）和链接是否正确。")}});

    // 5. 交互处理逻辑 (无变化)
    function showPanel() { inputPanel.classList.add('active'); }
    function hidePanel() { inputPanel.classList.remove('active'); }

    document.addEventListener('click',e=>{inputPanel.classList.contains("active")&&!inputPanel.contains(e.target)&&!carrotButton.contains(e.target)&&hidePanel(),"block"===emojiPicker.style.display&&!emojiPicker.contains(e.target)&&!emojiPickerBtn.contains(e.target)&&(emojiPicker.style.display="none")});
    
    function dragHandler(e){let o=!0,t;const c=n=>{n.type.includes("touch")&&n.preventDefault();const c=carrotButton.getBoundingClientRect(),i=n.clientX||n.touches[0].clientX,s=n.clientY||n.touches[0].clientY,d=i-c.left,l=s-c.top,a=n=>{o=!1,clearTimeout(t),carrotButton.classList.add("is-dragging");let e=n.clientX||n.touches[0].clientX,c=n.clientY||n.touches[0].clientY;e-=d,c-=l,e=Math.max(0,Math.min(e,window.innerWidth-carrotButton.offsetWidth)),c=Math.max(0,Math.min(c,window.innerHeight-carrotButton.offsetHeight)),carrotButton.style.left=`${e}px`,carrotButton.style.top=`${c}px`},r=()=>{document.removeEventListener("mousemove",a),document.removeEventListener("mouseup",r),document.removeEventListener("touchmove",a),document.removeEventListener("touchend",r),carrotButton.classList.remove("is-dragging"),t=setTimeout(()=>{o?inputPanel.classList.contains("active")?hidePanel():showPanel():localStorage.setItem("cip_button_position_v4",JSON.stringify({top:carrotButton.style.top,left:carrotButton.style.left}))},50)};document.addEventListener("mousemove",a),document.addEventListener("mouseup",r),document.addEventListener("touchmove",a,{passive:!1}),document.addEventListener("touchend",r)};c(e)}
    carrotButton.addEventListener('mousedown', dragHandler);
    carrotButton.addEventListener('touchstart', dragHandler, { passive: false });

    function loadButtonPosition() { const t = JSON.parse(localStorage.getItem('cip_button_position_v4')); if (t?.top && t?.left) { carrotButton.style.left = t.left; carrotButton.style.top = t.top; } }
    function init() { loadStickerData(); renderCategories(); loadButtonPosition(); switchStickerCategory(Object.keys(stickerData)[0] || ''); switchTab('text'); }
    init();
})();
