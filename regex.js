const STORAGE_KEY = 'cip_regex_enabled_v1';
const DEFAULT_REGEX_ENABLED = true;
const originalContentMap = new WeakMap();

const defaultDocument = typeof document !== 'undefined' ? document : null;
const TEXT_NODE_FILTER =
    typeof NodeFilter !== 'undefined' ? NodeFilter.SHOW_TEXT : 4;

function createIframeWrapper(doc, html, { className = '', minHeight = 400 } = {}) {
    if (!doc) return null;
    const wrapper = doc.createElement('div');
    if (className) {
        wrapper.className = className;
    }
    wrapper.style.width = '100%';
    wrapper.style.maxWidth = '100%';
    wrapper.style.display = 'block';

    const iframe = doc.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('referrerpolicy', 'no-referrer');
    iframe.style.width = '100%';
    iframe.style.border = '0';
    iframe.style.display = 'block';
    iframe.style.backgroundColor = 'transparent';
    iframe.style.minHeight = `${minHeight}px`;
    iframe.srcdoc = html;

    iframe.addEventListener('load', () => {
        try {
            const innerDoc = iframe.contentDocument;
            if (!innerDoc) return;
            const height =
                innerDoc.body?.scrollHeight || innerDoc.documentElement?.scrollHeight;
            if (height) {
                iframe.style.height = `${height}px`;
            }
        } catch (error) {
            console.warn('胡萝卜插件：iframe 高度调整失败', error);
        }
    });

    wrapper.appendChild(iframe);
    return wrapper;
}

function serializeForScript(data) {
    return JSON.stringify(data).replace(/[<>\u2028\u2029]/g, (char) => {
        switch (char) {
            case '<':
                return '\\u003C';
            case '>':
                return '\\u003E';
            case ' ':
                return '\\u2028';
            case ' ':
                return '\\u2029';
            default:
                return char;
        }
    });
}

function buildBunnyStatusBarHtml(data) {
    const payload = {
        avatar: data.avatar || '',
        bubble: data.bubble || '',
        crystal: data.crystal || '',
        time: data.time || '',
        dayNight: data.dayNight || '',
    };
    const dataScript = serializeForScript(payload);

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
        /* 引入谷歌字体 */
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Roboto:wght@400;500&display=swap');

        /* 定义颜色和样式的变量 */
        :root {
            --text-color: #333;
            --text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
            --bubble-bg: rgba(255, 255, 255, 0.15);
            --bubble-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
            --bubble-text-color: #333;
            --glass-bg: rgba(255, 255, 255, 0.15);
            --glass-border: 1px solid rgba(255, 255, 255, 0.3);
        }

        body {
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            background-image: url('https://source.unsplash.com/random/800x600?nature,sky');
            background-size: cover;
            font-family: 'Roboto', sans-serif;
            overflow-x: hidden;
        }

        .status-bar-container {
            width: 100%;
            max-width: 500px;
            position: relative;
            padding-top: 60px;
            padding-bottom: 50px;
        }

        .glass-oval {
            width: 100%;
            height: 40px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 30px;
            box-sizing: border-box;
            background: var(--glass-bg);
            border-radius: 25px;
            border: var(--glass-border);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        @keyframes floatAnimation {
            0%, 100% { transform: translate(-50%, 0); }
            50% { transform: translate(-50%, -6px); }
        }

        @keyframes slideLeft {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(calc(-50% - 50px)); }
        }

        @keyframes wingFloatAnimation {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }

        .avatar-container {
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            cursor: pointer;
            z-index: 30;
            display: flex;
            justify-content: center;
            align-items: center;
            animation: floatAnimation 4s ease-in-out infinite;
        }

        .avatar-container.clicked {
            animation: slideLeft 0.3s ease forwards;
        }

        .avatar-image {
            width: 70px;
            height: 70px;
            object-fit: cover;
        }

        .wing-container {
            position: absolute;
            top: 70px;
            height: 33px;
            z-index: -1;
            animation: wingFloatAnimation 3.5s ease-in-out infinite;
        }

        .wing-container img { height: 100%; width: auto; }
        .left-wing { left: -35px; }
        .right-wing { right: -35px; }
        .right-wing img { transform: scaleX(-1); }

        .time-info {
            color: var(--text-color);
            text-shadow: var(--text-shadow);
            font-family: 'Playfair Display', serif;
            font-size: 14px;
            font-weight: 500;
            text-align: center;
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            white-space: nowrap;
        }

        .icon-wrapper {
            position: relative;
            cursor: pointer;
        }

        .day-night-icon, .crystal-ball-icon {
            font-size: 20px;
            filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));
        }

        .thinking-bubble-container {
            position: absolute;
            top: 0;
            left: calc(0% + 70px);
            width: max-content;
            visibility: hidden;
            pointer-events: none;
        }

        .thinking-bubble-container .bubble-main {
            position: absolute;
            background: var(--bubble-bg);
            box-shadow: var(--bubble-shadow);
            border-radius: 16px;
            padding: 8px 12px;
            font-size: 12px;
            top: 5px;
            left: 10px;
            width: max-content;
            white-space: normal;
            word-break: break-all;
            word-wrap: break-word;
            max-width: 300px;
            max-width: calc(600px / 2);
            overflow-wrap: break-word;
            opacity: 0;
            transform: scale(0.5);
            transition: opacity 0.3s ease, transform 0.3s ease;
            backdrop-filter: blur(10px);
        }

        .thinking-bubble-container.show {
            visibility: visible;
        }

        .thinking-bubble-container.show .bubble-main {
            opacity: 1;
            transform: scale(1);
        }

        .glass-bubble {
            position: absolute;
            top: 35px;
            width: 120px;
            padding: 8px 12px;
            background: var(--glass-bg);
            border-radius: 14px;
            border: var(--glass-border);
            box-shadow: var(--bubble-shadow);
            font-size: 12px;
            color: var(--bubble-text-color);
            text-align: center;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: opacity 0.3s ease, transform 0.3s ease;
            pointer-events: none;
            backdrop-filter: blur(12px);
        }

        .glass-bubble.show {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }

        .glass-bubble::after {
            content: '';
            position: absolute;
            top: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 12px;
            height: 12px;
            background: var(--glass-bg);
            border-left: var(--glass-border);
            border-top: var(--glass-border);
            transform: translateX(-50%) rotate(45deg);
        }

        #bubble-day-night {
            left: -25px;
        }

        #bubble-crystal {
            right: -25px;
        }

        .glass-bubble.show {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }

        @media (max-width: 600px) {
            .status-bar-container {
                padding-bottom: 60px;
            }

            .time-info {
                font-size: 11px;
            }

            .wing-container {
                height: 28px;
                top: 75px;
            }

            .left-wing { left: -20px; }
            .right-wing { right: -20px; }

            .thinking-bubble-container .bubble-main {
                max-width: 90px;
            }
        }
    </style>
</head>
<body>
    <div class="status-bar-container">
        <div class="avatar-container" id="avatarContainer">
            <img src="" alt="Avatar" class="avatar-image" id="avatarImage" />
            <div class="thinking-bubble-container" id="bubble1">
                <div class="bubble-main" id="bubbleMain"></div>
            </div>
        </div>
        <div class="wing-container left-wing">
            <img src="https://i.postimg.cc/bJwDKb36/aigei-com.png" alt="Left Wing" />
        </div>
        <div class="wing-container right-wing">
            <img src="https://i.postimg.cc/bJwDKb36/aigei-com.png" alt="Right Wing" />
        </div>
        <div class="glass-oval">
            <div class="icon-wrapper" id="dayNightWrapper">
                <div class="day-night-icon" id="dayNightIcon">☀️</div>
                <div class="glass-bubble" id="bubble-day-night"></div>
            </div>
            <div class="time-info" id="timeDisplay"></div>
            <div class="icon-wrapper" id="crystalWrapper">
                <div class="crystal-ball-icon">🔮</div>
                <div class="glass-bubble" id="bubble-crystal"></div>
            </div>
        </div>
    </div>
    <script>
        const INITIAL_DATA = ${dataScript};

        document.addEventListener('DOMContentLoaded', function() {
            applyInitialData();
            attachEvents();
            setInitialState();
        });

        function applyInitialData() {
            const avatarImage = document.getElementById('avatarImage');
            const bubbleMain = document.getElementById('bubbleMain');
            const bubbleCrystal = document.getElementById('bubble-crystal');
            const bubbleDayNight = document.getElementById('bubble-day-night');
            const timeDisplay = document.getElementById('timeDisplay');

            if (avatarImage) {
                const src = INITIAL_DATA.avatar && INITIAL_DATA.avatar.trim();
                avatarImage.src = src || 'https://i.postimg.cc/XYkXz7GZ/placeholder-avatar.png';
            }
            if (bubbleMain) {
                bubbleMain.textContent = INITIAL_DATA.bubble || '';
            }
            if (bubbleCrystal) {
                bubbleCrystal.textContent = INITIAL_DATA.crystal || '';
            }
            if (bubbleDayNight) {
                bubbleDayNight.textContent = INITIAL_DATA.dayNight || '';
            }
            if (timeDisplay) {
                timeDisplay.textContent = INITIAL_DATA.time || '';
            }
        }

        function attachEvents() {
            const avatar = document.getElementById('avatarContainer');
            const dayNightWrapper = document.getElementById('dayNightWrapper');
            const crystalWrapper = document.getElementById('crystalWrapper');

            if (avatar) {
                avatar.addEventListener('click', function(event) {
                    event.stopPropagation();
                    toggleBubble('bubble1');
                });
            }

            if (dayNightWrapper) {
                dayNightWrapper.addEventListener('click', function(event) {
                    event.stopPropagation();
                    toggleBubble('bubble-day-night');
                });
            }

            if (crystalWrapper) {
                crystalWrapper.addEventListener('click', function(event) {
                    event.stopPropagation();
                    toggleBubble('bubble-crystal');
                });
            }

            document.addEventListener('click', function(event) {
                if (!event.target.closest('.avatar-container') && !event.target.closest('.icon-wrapper')) {
                    hideAllBubbles();
                    resetAvatar();
                }
            });
        }

        function setInitialState() {
            const timeDisplay = document.getElementById('timeDisplay');
            const timeString = timeDisplay ? timeDisplay.textContent : '';
            const dayNightIcon = document.getElementById('dayNightIcon');
            const match = timeString && timeString.match(/(\d{1,2}):\d{2}\s(AM|PM)/);

            if (match && dayNightIcon) {
                let hour = parseInt(match[1], 10);
                const ampm = match[2];
                if (ampm === 'PM' && hour !== 12) hour += 12;
                if (ampm === 'AM' && hour === 12) hour = 0;
                dayNightIcon.textContent = hour >= 7 && hour < 18 ? '☀️' : '🌙';
            }
        }

        function hideAllBubbles() {
            document.querySelectorAll('.thinking-bubble-container.show, .glass-bubble.show').forEach(function(b) {
                b.classList.remove('show');
            });
        }

        function resetAvatar() {
            const avatar = document.querySelector('.avatar-container');
            if (avatar) {
                avatar.classList.remove('clicked');
            }
        }

        function toggleBubble(bubbleId) {
            const bubble = document.getElementById(bubbleId);
            const avatar = document.querySelector('.avatar-container');
            const isShowing = bubble && bubble.classList.contains('show');

            hideAllBubbles();

            if (!bubble) return;

            if (!isShowing) {
                if (bubbleId === 'bubble1') {
                    if (avatar) {
                        avatar.classList.add('clicked');
                    }
                    setTimeout(function() {
                        bubble.classList.add('show');
                    }, 300);
                } else {
                    bubble.classList.add('show');
                }
            } else {
                resetAvatar();
            }
        }
    </script>
</body>
</html>`;
}

function buildLoveStatusHtml(data) {
    const payload = {
        pose: data.pose || '',
        penis: data.penis || '',
        speed: data.speed || '',
        depthText: data.depthText || '',
        suck: data.suck || '',
        knead: data.knead || '',
        hands: data.hands || '',
    };
    const dataScript = serializeForScript(payload);

    return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>BunnY'sLOVE二改抄袭禁止</title>
    <style>
      @import url('https://fontsapi.zeoseven.com/128/main/result.css');

      body {
        margin: 0;
        background: transparent;
        color: #F96E9A;
        font-family: 'Hachi Maru Pop';
        font-weight: normal;
      }
      :root {
        --card-border: rgba(0, 0, 0, 0.15);
        --accent: #f472b6;
        --accent-2: #facc15;
        --accent-3: #22d3ee;
      }
      * {
        box-sizing: border-box;
      }

      .qq-wrap {
        max-width: 920px;
        margin: 12px auto;
        padding: 0;
        background: transparent;
        border: none;
        box-shadow: none;
      }
      .panel {
        position: relative;
        border-radius: 14px;
        overflow: hidden;
      }
      .panel::before {
        content: '';
        position: absolute;
        inset: 0;
        background: url('https://i.postimg.cc/qBGd6QJr/20250923000612-36-309.jpg') center/cover no-repeat;
      }
      .panel-inner {
        position: relative;
        padding: 16px;
      }

      .qq-row {
        display: grid;
        grid-template-columns: 240px 1fr;
        gap: 16px;
        align-items: stretch;
      }

      .pose-card {
        position: relative;
        border: 1px solid var(--card-border);
        border-radius: 12px;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.5);
        min-height: 240px;
      }
      .pose-card img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .pose-name {
        position: absolute;
        left: 8px;
        bottom: 8px;
        padding: 4px 8px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.6);
        font-weight: 600;
        color: #F96E9A;
        border: 1px solid rgba(244, 114, 182, 0.55);
        box-shadow: 0 0 6px rgba(244, 114, 182, 0.75), 0 0 14px rgba(244, 114, 182, 0.45),
          0 0 22px rgba(244, 114, 182, 0.35);
      }

      .top-panel {
        border: 1px solid var(--card-border);
        border-radius: 12px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.6);
      }
      .meter {
        position: relative;
        height: 18px;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.08);
        overflow: hidden;
        border: 1px solid rgba(0, 0, 0, 0.1);
      }
      .meter-fill {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, var(--accent), var(--accent-2));
      }
      .meter-target {
        position: absolute;
        top: -6px;
        width: 2px;
        height: 30px;
        background: var(--accent-3);
      }
      .meter-labels {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #F96E9A;
        margin-top: 8px;
      }

      .pulses {
        margin-top: 12px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .pulse-card {
        border: 1px solid var(--card-border);
        border-radius: 12px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.6);
        display: flex;
        align-items: center;
        gap: 12px;
        color: #F96E9A;
      }
      .pulse-dot {
        width: 46px;
        height: 46px;
        border-radius: 50%;
        flex: 0 0 46px;
        background-position: center;
        background-size: cover;
        background-repeat: no-repeat;
        border: 1px solid rgba(0, 0, 0, 0.1);
        will-change: transform;
      }
      .pulse-left {
        background-image: url('https://i.postimg.cc/j5MkRNjP/63d9143b64a35gpi.gif');
      }
      .pulse-right {
        background-image: url('https://i.postimg.cc/Hk0zp5Zn/680fb6555429d-Huw.gif');
      }

      .pulse-meta {
        display: flex;
        flex-direction: column;
      }
      .pulse-title {
        font-weight: 600;
        color: #F96E9A;
      }
      .pulse-sub {
        font-size: 12px;
        color: #F96E9A;
      }

      .infos {
        margin-top: 12px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .info-card {
        position: relative;
        background-color: rgba(255, 255, 255, 0.6);
        border-radius: 6px;
        padding: 10px;
        color: #F96E9A;
        border: 1px solid rgba(0, 0, 0, 0.1);
      }
      .info-card .title {
        font-size: 0.85em;
        font-weight: 700;
        color: #F96E9A;
      }
      .info-card .text {
        font-size: 0.9em;
        color: #F96E9A;
        display: block;
        margin-top: 1px;
        padding: 0 5px;
        white-space: pre-wrap;
      }

      details summary {
        cursor: pointer;
        list-style: none;
      }

      details summary::-webkit-details-marker {
        display: none;
      }

      details[open] summary .toggle-icon {
        transform: rotate(180deg);
      }

      .toggle-icon {
        display: inline-block;
        transition: transform 0.3s ease;
      }
    </style>
  </head>
  <body>
    <div class="qq-wrap">
      <details open>
        <summary>
          <span class="toggle-icon">▼</span>
          <span style="margin-left: 8px; font-weight: 600; color: #F96E9A;">爱的抱抱状态面板</span>
        </summary>
        <div class="panel">
          <div class="panel-inner">
            <div class="qq-row">
              <div class="pose-card">
                <img src="" alt="pose" id="poseImg" />
                <div class="pose-name" id="poseName"></div>
              </div>
              <div>
                <div class="top-panel">
                  <div style="font-weight: 700; font-size: 1.1em;">爱的抱抱强度表</div>
                  <div class="meter">
                    <div class="meter-fill" id="meterFill"></div>
                    <div class="meter-target" id="meterTarget"></div>
                  </div>
                  <div class="meter-labels">
                    <span>浅浅研磨</span>
                    <span>渐入佳境</span>
                    <span>桃园深处</span>
                  </div>
                </div>
                <div class="pulses">
                  <div class="pulse-card">
                    <div class="pulse-dot pulse-left" id="pulse5"></div>
                    <div class="pulse-meta">
                      <div class="pulse-title">吮吸力度</div>
                      <div class="pulse-sub" id="detail5"></div>
                    </div>
                  </div>
                  <div class="pulse-card">
                    <div class="pulse-dot pulse-right" id="pulse6"></div>
                    <div class="pulse-meta">
                      <div class="pulse-title">揉捏力度</div>
                      <div class="pulse-sub" id="detail6"></div>
                    </div>
                  </div>
                </div>
                <div class="infos">
                  <div class="info-card">
                    <span class="title">鸡鸡状态</span>
                    <span class="text" id="detail2"></span>
                  </div>
                  <div class="info-card">
                    <span class="title">抽插速度</span>
                    <span class="text" id="detail3"></span>
                  </div>
                  <div class="info-card">
                    <span class="title">位置描述</span>
                    <span class="text" id="detail4"></span>
                  </div>
                  <div class="info-card">
                    <span class="title">抓握位置</span>
                    <span class="text" id="detail7"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </details>
    </div>

    <script>
      const INITIAL_DATA = ${dataScript};
      const DEFAULT_POSE_IMG = 'https://i.postimg.cc/dQ7zJH80/680fb656626de-Ry-D.gif';

      const POSE_IMAGES = {
        default: DEFAULT_POSE_IMG,
        Missionary: 'https://i.postimg.cc/Wbpn8tXJ/period-sex-postions-missionary.gif',
        'Doggy Style': 'https://i.postimg.cc/HkqXqL4z/period-sex-postions-stand-up-doogie.gif',
        'Standing Doggy': 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=800&auto=format&fit=crop',
        'Reverse Cowgirl': 'https://i.postimg.cc/28zDxdsF/reverse-cowgirl.jpg',
        Spooning: 'https://i.postimg.cc/pd0ZgvrL/spooning-best-sex-position-men-like-most.jpg',
        Standing: 'https://i.postimg.cc/j2nJ30wm/standing-best-sex-position-men-like-most.jpg',
        Lotus: 'https://i.postimg.cc/VLGkrHJb/woman-on-top-best-sex-position-men-like-most.jpg',
        Nelson: 'https://i.postimg.cc/m2x0dYK6/25050861.webp',
        'Prone Bone': 'https://i.postimg.cc/4y8H34CY/OIP-b2p-XNqd-Kx-Gpy-I99md-CNO3-AAAAA-w-228-h-154-c-7-r-0-o-5-dpr-1-3-pid-1.jpg',
        Wheelbarrow: 'https://i.postimg.cc/2yvjszkp/wheelbarrow.jpg',
        'face down': 'https://i.postimg.cc/8CWyf9zp/the-eveyrgirl-sex-position-lazy-churner-1024x853.jpg',
        'The Pogo Stick': 'https://i.postimg.cc/mDK2pcGN/Pogo-stick.jpg',
        Flatiron: 'https://i.postimg.cc/PxP4H7vz/flatiron-best-sex-position-men-like-most.jpg',
        'hold breast fuck': 'https://i.postimg.cc/Hxh67m1h/giphy.gif',
        'The Butter Churner': 'https://i.postimg.cc/G2CXFK4k/Satin-Minions-266079-Face-Down-Animation-3.gif',
        'The overpass': 'https://i.postimg.cc/d1hV92gV/The-overpass.jpg'
      };

      const DEPTH_MAP = { '即将插入': 0, '浅浅研磨': 20, '渐入佳境': 70, '冲刺加速': 90, '桃园深处': 100 };

      const state = {
        pose: INITIAL_DATA.pose,
        penis: INITIAL_DATA.penis,
        speed: INITIAL_DATA.speed,
        depthText: INITIAL_DATA.depthText,
        suck: INITIAL_DATA.suck,
        knead: INITIAL_DATA.knead,
        hands: INITIAL_DATA.hands
      };

      const el = {
        poseImg: document.getElementById('poseImg'),
        poseName: document.getElementById('poseName'),
        meterFill: document.getElementById('meterFill'),
        meterTarget: document.getElementById('meterTarget'),
        pulse5: document.getElementById('pulse5'),
        pulse6: document.getElementById('pulse6'),
        detail2: document.getElementById('detail2'),
        detail3: document.getElementById('detail3'),
        detail4: document.getElementById('detail4'),
        detail5: document.getElementById('detail5'),
        detail6: document.getElementById('detail6'),
        detail7: document.getElementById('detail7')
      };

      document.addEventListener('DOMContentLoaded', () => {
        syncUI();
        rafId = requestAnimationFrame(animate);
      });

      function resolvePoseImg(name) {
        if (!name) return DEFAULT_POSE_IMG;
        const key = Object.keys(POSE_IMAGES).find(k => k.toLowerCase() === String(name).toLowerCase());
        return key && POSE_IMAGES[key] ? POSE_IMAGES[key] : DEFAULT_POSE_IMG;
      }

      function num(v) {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      }
      function tgtPct() {
        const x = DEPTH_MAP[state.depthText];
        return typeof x === 'number' ? x : 0;
      }

      function syncUI() {
        if (el.poseImg) el.poseImg.src = resolvePoseImg(state.pose);
        if (el.poseName) el.poseName.textContent = state.pose || '';
        if (el.detail2) el.detail2.textContent = state.penis || '';
        if (el.detail3) el.detail3.textContent = state.speed || '';
        if (el.detail4) el.detail4.textContent = state.depthText || '';
        if (el.detail5) el.detail5.textContent = state.suck || '';
        if (el.detail6) el.detail6.textContent = state.knead || '';
        if (el.detail7) el.detail7.textContent = state.hands || '';
      }

      let rafId = null, t = 0;
      function animate(now) {
        if (!animate.last) animate.last = now;
        const dt = (now - animate.last) / 1000;
        animate.last = now;

        const speed = num(state.speed);
        const v = Math.max(0, Math.min(100, speed)) * 0.1;
        const target = tgtPct();

        t += dt * v;
        const tri = 1 - Math.abs((t % 2) - 1);
        const cur = tri * Math.max(0, target);
        if (el.meterFill) el.meterFill.style.width = cur + '%';
        if (el.meterTarget) el.meterTarget.style.left = target + '%';

        const w = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI);
        const baseScale = 0.9 + 0.2 * w;
        const s5 = 0.85 + 0.003 * Math.max(0, Math.min(100, num(state.suck)));
        const s6 = 0.85 + 0.003 * Math.max(0, Math.min(100, num(state.knead)));
        const scale5 = baseScale * s5;
        const scale6 = baseScale * s6;
        if (el.pulse5) el.pulse5.style.transform = 'scale(' + scale5 + ')';
        if (el.pulse6) el.pulse6.style.transform = 'scale(' + scale6 + ')';

        rafId = requestAnimationFrame(animate);
      }

      window.updateQQStatus = function ({ pose, penis, speed, depthText, suck, knead, hands }) {
        if (pose !== undefined) state.pose = pose;
        if (penis !== undefined) state.penis = penis;
        if (speed !== undefined) state.speed = speed;
        if (depthText !== undefined) state.depthText = depthText;
        if (suck !== undefined) state.suck = suck;
        if (knead !== undefined) state.knead = knead;
        if (hands !== undefined) state.hands = hands;
        syncUI();
      };

      window.addEventListener('beforeunload', () => {
        if (rafId) cancelAnimationFrame(rafId);
      });
    </script>
  </body>
</html>`;
}

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
        id: 'bhl-bunny-status',
        pattern: /<bunny>\s*(.*?)\s*(.*?)\s*(.*?)\s*(.*?)\s*(.*?)\s*<\/bunny>/gis,
        createNode({ documentRef, groups }) {
            const doc = documentRef || defaultDocument;
            if (!doc) return null;
            const normalized = Array.from(groups || [], (value) =>
                typeof value === 'string' ? value.trim() : '',
            );
            const [avatar = '', bubble = '', crystal = '', time = '', dayNight = ''] = normalized;
            const html = buildBunnyStatusBarHtml({
                avatar,
                bubble,
                crystal,
                time,
                dayNight,
            });
            return createIframeWrapper(doc, html, {
                className: 'cip-bhl-iframe cip-bhl-bunny-status',
                minHeight: 360,
            });
        },
    },
    {
        id: 'bhl-love-hug',
        pattern:
            /<QQ_LOVE>\s*体位:(.*?)\s*鸡鸡状态:(.*?)\s*抽插速度:(.*?)\s*位置描述:(.*?)\s*吮吸力度:(.*?)\s*揉捏力度:(.*?)\s*抓握位置:(.*?)\s*<\/QQ_LOVE>/gis,
        createNode({ documentRef, groups }) {
            const doc = documentRef || defaultDocument;
            if (!doc) return null;
            const normalized = Array.from(groups || [], (value) =>
                typeof value === 'string' ? value.trim() : '',
            );
            const [
                pose = '',
                penis = '',
                speed = '',
                depthText = '',
                suck = '',
                knead = '',
                hands = '',
            ] = normalized;
            const html = buildLoveStatusHtml({
                pose,
                penis,
                speed,
                depthText,
                suck,
                knead,
                hands,
            });
            return createIframeWrapper(doc, html, {
                className: 'cip-bhl-iframe cip-bhl-love-status',
                minHeight: 520,
            });
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
