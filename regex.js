const STORAGE_KEY = 'cip_regex_enabled_v1';
const DEFAULT_REGEX_ENABLED = true;
const originalContentMap = new WeakMap();

const defaultDocument = typeof document !== 'undefined' ? document : null;
const TEXT_NODE_FILTER =
    typeof NodeFilter !== 'undefined' ? NodeFilter.SHOW_TEXT : 4;

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
        id: 'bhl-bubble-self',
        pattern: /\[(.*?)\\(.*?)\\(.*?)\]/gm,
        createNode({ documentRef, groups }) {
            const [name = '', time = '', message = ''] = groups;
            const doc = documentRef || defaultDocument;
            if (!doc) return null;

            const container = doc.createElement('div');
            container.style.margin = '10px 0';
            container.style.maxWidth = '75%';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'flex-end';
            container.style.marginLeft = 'auto';

            const header = doc.createElement('div');
            header.style.fontSize = '12px';
            header.style.color = '#8a8a8a';
            header.style.marginRight = '5px';
            header.style.marginBottom = '5px';

            const nameSpan = doc.createElement('span');
            nameSpan.textContent = name.trim();

            header.appendChild(nameSpan);

            const bodyWrapper = doc.createElement('div');
            bodyWrapper.style.display = 'flex';
            bodyWrapper.style.alignItems = 'flex-end';
            bodyWrapper.style.width = '100%';
            bodyWrapper.style.justifyContent = 'flex-end';

            const timeSpan = doc.createElement('span');
            timeSpan.style.fontSize = '12px';
            timeSpan.style.color = '#b2b2b2';
            timeSpan.style.marginRight = '8px';
            timeSpan.style.flexShrink = '0';
            timeSpan.textContent = time.trim();

            const bubble = doc.createElement('div');
            bubble.style.backgroundColor = '#8DE041';
            bubble.style.color = '#000000';
            bubble.style.padding = '12px 16px';
            bubble.style.borderRadius = '20px';
            bubble.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.08)';
            bubble.style.position = 'relative';
            bubble.style.maxWidth = '100%';

            const paragraph = doc.createElement('p');
            paragraph.style.margin = '0';
            paragraph.style.whiteSpace = 'pre-wrap';
            paragraph.style.wordWrap = 'break-word';
            paragraph.style.fontSize = '12px';
            paragraph.style.lineHeight = '1.5';
            paragraph.textContent = message.trim();

            bubble.appendChild(paragraph);

            bodyWrapper.appendChild(timeSpan);
            bodyWrapper.appendChild(bubble);

            container.appendChild(header);
            container.appendChild(bodyWrapper);

            return container;
        },
    },
    {
        id: 'bhl-bubble',
        pattern: /\[(.*?)\/(.*?)\/(.*?)\]/gm,
        createNode({ documentRef, groups }) {
            const [name = '', message = '', time = ''] = groups;
            const doc = documentRef || defaultDocument;
            if (!doc) return null;

            const container = doc.createElement('div');
            container.style.margin = '10px 0';
            container.style.maxWidth = '75%';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'flex-start';

            const header = doc.createElement('div');
            header.style.fontSize = '13px';
            header.style.color = '#8a8a8a';
            header.style.marginLeft = '5px';
            header.style.marginBottom = '5px';
            header.style.display = 'flex';
            header.style.alignItems = 'center';

            const nameSpan = doc.createElement('span');
            nameSpan.style.fontWeight = '300';
            nameSpan.textContent = name.trim();

            header.appendChild(nameSpan);

            const bodyWrapper = doc.createElement('div');
            bodyWrapper.style.display = 'flex';
            bodyWrapper.style.alignItems = 'flex-end';
            bodyWrapper.style.width = '100%';

            const bubble = doc.createElement('div');
            bubble.style.backgroundColor = '#ffffff';
            bubble.style.color = '#000000';
            bubble.style.padding = '12px 16px';
            bubble.style.borderRadius = '20px';
            bubble.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.08)';
            bubble.style.position = 'relative';
            bubble.style.maxWidth = '100%';

            const paragraph = doc.createElement('p');
            paragraph.style.margin = '0';
            paragraph.style.whiteSpace = 'pre-wrap';
            paragraph.style.wordWrap = 'break-word';
            paragraph.style.fontSize = '12px';
            paragraph.style.lineHeight = '1.5';
            paragraph.textContent = message.trim();

            bubble.appendChild(paragraph);

            const timeSpan = doc.createElement('span');
            timeSpan.style.fontSize = '12px';
            timeSpan.style.color = '#b2b2b2';
            timeSpan.style.marginLeft = '8px';
            timeSpan.style.flexShrink = '0';
            timeSpan.textContent = time.trim();

            bodyWrapper.appendChild(bubble);
            bodyWrapper.appendChild(timeSpan);

            container.appendChild(header);
            container.appendChild(bodyWrapper);

            return container;
        },
    },
    {
        id: 'bhl-char-voice',
        pattern: /^=(.*?)\|(.*?)=$/gm,
        createNode({ documentRef, groups }) {
            const [title = '', content = ''] = groups;
            const doc = documentRef || defaultDocument;
            if (!doc) return null;

            const outerContainer = doc.createElement('div');
            outerContainer.className = 'char_bubble';

            const wrapper = doc.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.marginBottom = '16px';
            wrapper.style.alignItems = 'flex-start';
            wrapper.style.position = 'relative';
            wrapper.style.animation = 'message-pop 0.3s ease-out';

            const avatar = doc.createElement('div');
            avatar.className = 'B_C_avar custom-B_C_avar';
            avatar.style.width = '40px';
            avatar.style.height = '40px';
            avatar.style.flexShrink = '0';
            avatar.style.borderRadius = '50%';
            avatar.style.padding = '5px 5px';
            avatar.style.overflow = 'hidden';
            avatar.style.marginRight = '10px';
            avatar.style.backgroundImage = "url('{{charAvatarPath}}')";
            avatar.style.backgroundSize = 'cover';
            avatar.style.backgroundPosition = 'center';

            const details = doc.createElement('details');
            details.style.display = 'inline-block';
            details.style.maxWidth = '400px';
            details.style.padding = '10px 14px';
            details.style.setProperty('border-radius', '24px', 'important');
            details.style.fontSize = '14px';
            details.style.lineHeight = '1.4';
            details.style.setProperty(
                'border-bottom-left-radius',
                '24px',
                'important',
            );
            details.style.wordWrap = 'break-word';
            details.style.position = 'relative';
            details.style.transition = 'transform 0.2s';
            details.style.setProperty('background', 'transparent', 'important');
            details.style.color = '#333';
            details.style.setProperty(
                'box-shadow',
                '-4px 4px 8px rgba(0, 0, 0, 0.10), 2px -2px 4px rgba(255, 255, 255, 0.3), inset -6px 6px 8px rgba(0, 0, 0, 0.10), inset 6px -6px 8px rgba(255, 255, 255, 0.5)',
                'important',
            );
            details.style.setProperty(
                'border',
                '1px solid rgba(200, 200, 200, 0.3)',
                'important',
            );

            const summary = doc.createElement('summary');
            summary.style.display = 'flex';
            summary.style.alignItems = 'center';
            summary.style.setProperty('padding', '0', 'important');
            summary.style.cursor = 'pointer';
            summary.style.listStyle = 'none';
            summary.style.webkitTapHighlightColor = 'transparent';
            summary.style.position = 'relative';

            const playIcon = doc.createElement('span');
            playIcon.style.fontSize = '16px';
            playIcon.style.color = '#333';
            playIcon.style.marginRight = '8px';
            playIcon.textContent = '▶';

            const waves = doc.createElement('div');
            waves.style.display = 'flex';
            waves.style.alignItems = 'center';
            waves.style.height = '20px';
            waves.style.gap = '2px';

            const barHeights = ['60%', '80%', '40%', '90%', '50%', '75%'];
            for (const height of barHeights) {
                const bar = doc.createElement('span');
                bar.style.display = 'inline-block';
                bar.style.width = '3px';
                bar.style.height = height;
                bar.style.backgroundColor = '#555';
                bar.style.borderRadius = '2px';
                waves.appendChild(bar);
            }

            const titleSpan = doc.createElement('span');
            titleSpan.style.fontWeight = 'normal';
            titleSpan.style.fontSize = '15px';
            titleSpan.style.marginLeft = '12px';
            titleSpan.style.marginTop = '-2px';
            titleSpan.textContent = title.trim();
            
            summary.appendChild(playIcon);
            summary.appendChild(waves);
            summary.appendChild(titleSpan);

            const detailContent = doc.createElement('div');
            detailContent.style.setProperty('padding', '12px 14px', 'important');
            detailContent.style.borderTop = '1px solid rgba(0, 0, 0, 0.08)';

            const paragraph = doc.createElement('p');
            paragraph.style.margin = '0';
            paragraph.style.fontWeight = 'normal';
            paragraph.style.fontSize = '14px';
            paragraph.style.lineHeight = '1.4';
            paragraph.textContent = content.trim();

            detailContent.appendChild(paragraph);

            details.appendChild(summary);
            details.appendChild(detailContent);

            wrapper.appendChild(avatar);
            wrapper.appendChild(details);

            outerContainer.appendChild(wrapper);

            return outerContainer;
        },
    },
    {
        id: 'bhl-user-voice',
        pattern: /^=(.*?)-(.*?)=$/gm,
        createNode({ documentRef, groups }) {
            const [title = '', content = ''] = groups;
            const doc = documentRef || defaultDocument;
            if (!doc) return null;

            const container = doc.createElement('div');
            container.style.textAlign = 'right';
            container.style.marginBottom = '18px';
            container.style.display = 'flex';
            container.style.justifyContent = 'flex-end';
            container.style.alignItems = 'flex-start';
            container.style.position = 'relative';
            container.style.animation = 'message-pop 0.3s ease-out';

            const details = doc.createElement('details');
            details.style.display = 'inline-block';
            details.style.maxWidth = '400px';
            details.style.textAlign = 'left';
            details.style.padding = '10px 14px';
            details.style.setProperty('border-radius', '24px', 'important');
            details.style.fontSize = '14px';
            details.style.lineHeight = '1.4';
            details.style.setProperty(
                'border-bottom-right-radius',
                '24px',
                'important',
            );
            details.style.wordWrap = 'break-word';
            details.style.position = 'relative';
            details.style.transition = 'transform 0.2s';
            details.style.setProperty('background', 'transparent', 'important');
            details.style.color = '#333';
            details.style.setProperty(
                'box-shadow',
                '-4px 4px 8px rgba(0, 0, 0, 0.10), 2px -2px 4px rgba(255, 255, 255, 0.3), inset -6px 6px 8px rgba(0, 0, 0, 0.10), inset 6px -6px 8px rgba(255, 255, 255, 0.5)',
                'important',
            );
            details.style.setProperty(
                'border',
                '1px solid rgba(200, 200, 200, 0.3)',
                'important',
            );
            details.style.overflow = 'hidden';

            const summary = doc.createElement('summary');
            summary.style.display = 'flex';
            summary.style.alignItems = 'center';
            summary.style.setProperty('padding', '0', 'important');
            summary.style.cursor = 'pointer';
            summary.style.listStyle = 'none';
            summary.style.webkitTapHighlightColor = 'transparent';
            summary.style.position = 'relative';

            const playIcon = doc.createElement('span');
            playIcon.style.fontSize = '16px';
            playIcon.style.color = '#333';
            playIcon.style.marginRight = '8px';
            playIcon.textContent = '▶';

            const waves = doc.createElement('div');
            waves.style.display = 'flex';
            waves.style.alignItems = 'center';
            waves.style.height = '20px';
            waves.style.gap = '2px';

            const barHeights = ['60%', '80%', '40%', '90%', '50%', '75%'];
            for (const height of barHeights) {
                const bar = doc.createElement('span');
                bar.style.display = 'inline-block';
                bar.style.width = '3px';
                bar.style.height = height;
                bar.style.backgroundColor = '#555';
                bar.style.borderRadius = '2px';
                waves.appendChild(bar);
            }

            const titleSpan = doc.createElement('span');
            titleSpan.style.fontWeight = 'normal';
            titleSpan.style.fontSize = '15px';
            titleSpan.style.marginLeft = '12px';
            titleSpan.style.marginTop = '-2px';
            titleSpan.textContent = title.trim();

            summary.appendChild(playIcon);
            summary.appendChild(waves);
            summary.appendChild(titleSpan);

            const detailContent = doc.createElement('div');
            detailContent.style.setProperty('padding', '12px 14px', 'important');
            detailContent.style.borderTop = '1px solid rgba(0, 0, 0, 0.08)';

            const paragraph = doc.createElement('p');
            paragraph.style.margin = '0';
            paragraph.style.fontWeight = 'normal';
            paragraph.style.fontSize = '14px';
            paragraph.style.lineHeight = '1.4';
            paragraph.textContent = content.trim();

            detailContent.appendChild(paragraph);

            details.appendChild(summary);
            details.appendChild(detailContent);

            const avatar = doc.createElement('div');
            avatar.className = 'B_U_avar custom-B_U_avar';
            avatar.style.width = '40px';
            avatar.style.height = '40px';
            avatar.style.flexShrink = '0';
            avatar.style.borderRadius = '50%';
            avatar.style.overflow = 'hidden';
            avatar.style.marginLeft = '10px';
            avatar.style.backgroundImage = "url('{{userAvatarPath}}')";
            avatar.style.backgroundSize = 'cover';
            avatar.style.backgroundPosition = 'center';

            container.appendChild(details);
            container.appendChild(avatar);

            return container;
        },
    },
    {
        id: 'bhl-char-dimension',
        pattern: /\[(.*?)\|(.*?)\|(.*?)\]/g,
        createNode({ documentRef, groups }) {
            const [title = '', value = '', description = ''] = groups;
            const doc = documentRef || defaultDocument;
            if (!doc) return null;

            const container = doc.createElement('div');
            container.style.display = 'flex';
            container.style.marginBottom = '18px';
            container.style.alignItems = 'flex-start';
            container.style.position = 'relative';
            container.style.animation = 'message-pop 0.3s ease-out';

            const avatar = doc.createElement('div');
            avatar.className = 'B_C_avar custom-B_C_avar';
            avatar.style.width = '40px';
            avatar.style.height = '40px';
            avatar.style.flexShrink = '0';
            avatar.style.borderRadius = '50%';
            avatar.style.padding = '5px 5px';
            avatar.style.overflow = 'hidden';
            avatar.style.marginRight = '10px';
            avatar.style.backgroundImage = "url('{{charAvatarPath}}')";
            avatar.style.backgroundSize = 'cover';
            avatar.style.backgroundPosition = 'center';

            const bubble = doc.createElement('div');
            bubble.style.setProperty('padding', '12px 16px', 'important');
            bubble.style.setProperty('border-radius', '16px', 'important');
            bubble.style.lineHeight = '1.4';
            bubble.style.setProperty(
                'border-bottom-left-radius',
                '24px',
                'important',
            );
            bubble.style.wordWrap = 'break-word';
            bubble.style.position = 'relative';
            bubble.style.transition = 'transform 0.2s';
            bubble.style.setProperty(
                'background',
                'linear-gradient(135deg, #C7CB85, #BBCDE0)',
                'important',
            );
            bubble.style.setProperty(
                'box-shadow',
                '-4px 4px 8px rgba(0, 0, 0, 0.10), 2px -2px 4px rgba(255, 255, 255, 0.3), inset -6px 6px 8px rgba(0, 0, 0, 0.10), inset 6px -6px 8px rgba(255, 255, 255, 0.5)',
                'important',
            );
            bubble.style.setProperty(
                'border',
                '1px solid rgba(255, 255, 255, 0.2)',
                'important',
            );
            bubble.style.minWidth = '160px';

            const titleSpan = doc.createElement('span');
            titleSpan.style.fontSize = '14px';
            titleSpan.style.fontWeight = 'bold';
            titleSpan.style.color = '#352B2D';
            titleSpan.style.display = 'block';
            titleSpan.style.marginBottom = '4px';
            titleSpan.textContent = title.trim();

            const valueSpan = doc.createElement('span');
            valueSpan.style.fontSize = '24px';
            valueSpan.style.fontWeight = 'bold';
            valueSpan.style.color = '#615055';
            valueSpan.style.margin = '4px 0 8px 0';
            valueSpan.style.display = 'block';
            valueSpan.textContent = value.trim();

            const descriptionSpan = doc.createElement('span');
            descriptionSpan.style.fontSize = '14px';
            descriptionSpan.style.color = '#817478';
            descriptionSpan.style.opacity = '0.9';
            descriptionSpan.textContent = description.trim();

            const shineLarge = doc.createElement('span');
            shineLarge.style.position = 'absolute';
            shineLarge.style.top = '5px';
            shineLarge.style.left = 'auto';
            shineLarge.style.right = '5px';
            shineLarge.style.width = '12px';
            shineLarge.style.height = '6px';
            shineLarge.style.background = 'white';
            shineLarge.style.borderRadius = '50% 50% 50% 50% / 60% 60% 40% 40%';
            shineLarge.style.opacity = '0.9';
            shineLarge.style.zIndex = '2';
            shineLarge.style.transform = 'rotate(45deg)';

            const shineSmall = doc.createElement('span');
            shineSmall.style.position = 'absolute';
            shineSmall.style.top = '15px';
            shineSmall.style.left = 'auto';
            shineSmall.style.right = '5px';
            shineSmall.style.width = '4px';
            shineSmall.style.height = '4px';
            shineSmall.style.background = 'white';
            shineSmall.style.borderRadius = '50%';
            shineSmall.style.opacity = '0.6';
            shineSmall.style.zIndex = '2';

            bubble.appendChild(titleSpan);
            bubble.appendChild(valueSpan);
            bubble.appendChild(descriptionSpan);
            bubble.appendChild(shineLarge);
            bubble.appendChild(shineSmall);

            container.appendChild(avatar);
            container.appendChild(bubble);

            return container;
        },
    },
    {
        id: 'bhl-user-dimension',
        pattern: /\[(.*?)-(.*?)-(.*?)\]/g,
        createNode({ documentRef, groups }) {
            const [title = '', value = '', description = ''] = groups;
            const doc = documentRef || defaultDocument;
            if (!doc) return null;

            const container = doc.createElement('div');
            container.style.display = 'flex';
            container.style.marginBottom = '18px';
            container.style.alignItems = 'flex-start';
            container.style.position = 'relative';
            container.style.animation = 'message-pop 0.3s ease-out';
            container.style.flexDirection = 'row-reverse';

            const avatar = doc.createElement('div');
            avatar.className = 'B_U_avar custom-B_U_avar';
            avatar.style.width = '40px';
            avatar.style.height = '40px';
            avatar.style.flexShrink = '0';
            avatar.style.borderRadius = '50%';
            avatar.style.padding = '5px 5px';
            avatar.style.overflow = 'hidden';
            avatar.style.marginLeft = '10px';
            avatar.style.backgroundImage = "url('{{userAvatarPath}}')";
            avatar.style.backgroundSize = 'cover';
            avatar.style.backgroundPosition = 'center';

            const bubble = doc.createElement('div');
            bubble.style.setProperty('padding', '12px 16px', 'important');
            bubble.style.setProperty('border-radius', '16px', 'important');
            bubble.style.lineHeight = '1.4';
            bubble.style.setProperty(
                'border-bottom-right-radius',
                '24px',
                'important',
            );
            bubble.style.wordWrap = 'break-word';
            bubble.style.position = 'relative';
            bubble.style.transition = 'transform 0.2s';
            bubble.style.setProperty(
                'background',
                'linear-gradient(135deg, #C7CB85, #FFC0BE)',
                'important',
            );
            bubble.style.setProperty(
                'box-shadow',
                '4px 4px 8px rgba(0, 0, 0, 0.10), -2px -2px 4px rgba(255, 255, 255, 0.3), inset 6px 6px 8px rgba(0, 0, 0, 0.10), inset -6px -6px 8px rgba(255, 255, 255, 0.5)',
                'important',
            );
            bubble.style.setProperty(
                'border',
                '1px solid rgba(255, 255, 255, 0.2)',
                'important',
            );
            bubble.style.minWidth = '160px';

            const titleSpan = doc.createElement('span');
            titleSpan.style.fontSize = '14px';
            titleSpan.style.fontWeight = 'bold';
            titleSpan.style.color = '#352B2D';
            titleSpan.style.display = 'block';
            titleSpan.style.marginBottom = '4px';
            titleSpan.textContent = title.trim();

            const valueSpan = doc.createElement('span');
            valueSpan.style.fontSize = '24px';
            valueSpan.style.fontWeight = 'bold';
            valueSpan.style.color = '#615055';
            valueSpan.style.margin = '4px 0 8px 0';
            valueSpan.style.display = 'block';
            valueSpan.textContent = value.trim();

            const descriptionSpan = doc.createElement('span');
            descriptionSpan.style.fontSize = '14px';
            descriptionSpan.style.color = '#817478';
            descriptionSpan.style.opacity = '0.9';
            descriptionSpan.textContent = description.trim();

            const shineLarge = doc.createElement('span');
            shineLarge.style.position = 'absolute';
            shineLarge.style.top = '5px';
            shineLarge.style.left = '5px';
            shineLarge.style.width = '12px';
            shineLarge.style.height = '6px';
            shineLarge.style.background = 'white';
            shineLarge.style.borderRadius = '50% 50% 50% 50% / 60% 60% 40% 40%';
            shineLarge.style.opacity = '0.9';
            shineLarge.style.zIndex = '2';
            shineLarge.style.transform = 'rotate(-45deg)';

            const shineSmall = doc.createElement('span');
            shineSmall.style.position = 'absolute';
            shineSmall.style.top = '15px';
            shineSmall.style.left = '5px';
            shineSmall.style.width = '4px';
            shineSmall.style.height = '4px';
            shineSmall.style.background = 'white';
            shineSmall.style.borderRadius = '50%';
            shineSmall.style.opacity = '0.6';
            shineSmall.style.zIndex = '2';

            bubble.appendChild(titleSpan);
            bubble.appendChild(valueSpan);
            bubble.appendChild(descriptionSpan);
            bubble.appendChild(shineLarge);
            bubble.appendChild(shineSmall);

            container.appendChild(avatar);
            container.appendChild(bubble);

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
        id: 'bhl-eden',
        pattern:
            /<伊甸园>\s*(.*?)\s*阶段\|(.*?)\s*乳房\|(.*?)\s*小穴\|(.*?)\s*子宫\|(.*?)\s*后庭\|(.*?)\s*特质\|(.*?)\s*精子\|(.*?)\s*卵子\|(.*?)\s*胎数\|(.*?)\s*父亲\|(.*?)\s*健康\|(.*?)\s*<\/伊甸园>/gms,
        createNode({ documentRef, groups }) {
            const [
                stage = '',
                stageDesc = '',
                breast = '',
                vagina = '',
                uterus = '',
                anus = '',
                traits = '',
                sperm = '',
                egg = '',
                fetus = '',
                father = '',
                health = '',
            ] = groups;

            const doc = documentRef || defaultDocument;
            if (!doc) return null;

            const safe = (value) => (value ?? '').toString().trim();

            const template = doc.createElement('template');
            template.innerHTML = `
  <div style="background-image:url('https://i.postimg.cc/138zqs7B/20250912145334-89-154.jpg'); background-size:cover; background-position:center; border-radius:12px; padding:1px; margin:2px auto; border:2px solid #d1d9e6; box-shadow:2px 2px 5px rgba(0,0,0,0.1); max-width:480px; color:#D17B88; position:relative; font-size:16px; contain:paint;">

    <div style="display:flex; justify-content:center; align-items:center; gap:8px; margin-bottom:8px; font-size:20px; font-weight:bold; background-color:rgba(255,255,255,0.8); border-radius:4px; padding:4px;">
      <span>${safe(stage)}</span>
    </div>
    <div style="text-align:center; margin-bottom:4px; font-weight:bold; font-size:20px;">{{user}}</div>
    <div style="margin-bottom:8px; padding:6px; background-color:rgba(187,219,209,0.7); border-radius:4px; text-align:center; font-weight:bold; font-size:16px;">
      <div>${safe(stageDesc)}</div>
    </div>
    <div style="text-align:center; margin-bottom:8px; background-color:rgba(255,255,255,0.7); border-radius:4px; padding:4px 8px; font-size:14px; line-height:1.5;">
      <div>种族 | {{getvar::种族}}</div>
      <div>年龄 | {{getvar::年龄}}</div>
      <div>身高 | {{getvar::身高}}</div>
      <div>体重 | {{getvar::体重}}</div>
      <div>三围 | {{getvar::三围}}</div>
    </div>

    <details style="margin-bottom:8px;">
      <summary style="cursor:pointer; font-weight:bold; text-align:center; padding:6px; border-radius:4px; list-style:none; background-color:rgba(191,225,211,0.7);">
        <span class="float" style="display:inline-block; will-change:transform;">ʚ</span>
        生理信息
        <span class="float" style="display:inline-block; will-change:transform;">ɞ</span>
      </summary>
      <div style="padding:6px; font-size:14px; line-height:1.5; border-radius:4px; margin-top:4px; background-color:rgba(255,255,255,0.5);">
        <div>乳房 | ${safe(breast)}</div>
        <div>小穴 | ${safe(vagina)}</div>
        <div>子宫 | ${safe(uterus)}</div>
        <div>后庭 | ${safe(anus)}</div>
        <div>特质 | ${safe(traits)}</div>
      </div>
    </details>

    <details style="margin-bottom:8px;">
      <summary style="cursor:pointer; font-weight:bold; text-align:center; padding:6px; border-radius:4px; list-style:none; background-color:rgba(191,225,211,0.7);">
        <span class="float" style="display:inline-block; will-change:transform;">ʚ</span>
        生殖信息
        <span class="float" style="display:inline-block; will-change:transform;">ɞ</span>
      </summary>
      <div style="padding:6px; font-size:14px; line-height:1.5; border-radius:4px; margin-top:4px; background-color:rgba(255,255,255,0.5);">
        <div>精子 | ${safe(sperm)}</div>
        <div>卵子 | ${safe(egg)}</div>
        <div>胎数 | ${safe(fetus)}</div>
        <div>父亲 | ${safe(father)}</div>
        <div>健康 | ${safe(health)}</div>
      </div>
    </details>
  </div>
            `.trim();

            const content = template.content.firstElementChild;
            if (!content) return null;
            return content;
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
