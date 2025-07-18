// 1. 在脚本顶部的变量声明区域添加：
let fallbackTimerId = null;
let isUsingFallback = false;

// 2. 替换原有的 init() 函数中的相关部分：
function init() {
    requestNotificationPermission();
    
    // 改进的 Service Worker 初始化（替换原有的 initServiceWorker() 调用）
    initServiceWorkerAndListeners();

    loadStickerData();
    loadThemes();
    renderCategories();
    loadButtonPosition();
    switchStickerCategory(Object.keys(stickerData)[0] || '');
    switchTab('text');
    
    // ... 其他现有代码保持不变 ...
    
    // 延长检查时间，给 Service Worker 更多初始化时间
    setTimeout(checkAlarmOnLoad, 1000); // 从 500 改为 1000
    setInterval(updateAlarmStatus, 1000);
}

// 3. 添加页面可见性检查（用于移动设备优化）
function addVisibilityChangeListener() {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            // 页面重新可见时，检查定时器状态
            const alarmData = JSON.parse(localStorage.getItem('cip_alarm_data_v1'));
            if (alarmData && alarmData.endTime) {
                const remaining = alarmData.endTime - Date.now();
                if (remaining <= 0) {
                    // 时间已到，执行命令
                    executeCommand(alarmData.command);
                    if ((alarmData.executed + 1) >= alarmData.repeat) {
                        stopAlarm();
                    } else {
                        startAlarm(true);
                    }
                } else if (isUsingFallback) {
                    // 重新启动降级定时器
                    startFallbackTimer(alarmData);
                }
            }
        }
    });
}

// 4. 改进的通知权限请求（移动设备友好）
function requestNotificationPermission() {
    if ('Notification' in window) {
        if (Notification.permission === 'default') {
            // 在用户交互时请求权限
            document.addEventListener('click', function requestOnFirstClick() {
                Notification.requestPermission().then(permission => {
                    console.log('快捷输入插件：通知权限状态:', permission);
                });
                document.removeEventListener('click', requestOnFirstClick);
            }, { once: true });
        }
    } else {
        console.warn('快捷输入插件：当前浏览器不支持通知功能');
    }
}

// 5. 添加触摸事件优化（在 init() 函数中添加）
function addTouchOptimizations() {
    // 防止双击缩放
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // 为按钮添加触摸反馈
    const buttons = document.querySelectorAll('#cip-start-alarm-btn, #cip-stop-alarm-btn');
    buttons.forEach(button => {
        button.addEventListener('touchstart', () => {
            button.style.transform = 'scale(0.95)';
        });
        button.addEventListener('touchend', () => {
            button.style.transform = 'scale(1)';
        });
    });
}

// 6. 在 init() 函数末尾添加：
addVisibilityChangeListener();
addTouchOptimizations();

// 7. 调试辅助函数（可选，用于排查问题）
function debugTimerStatus() {
    console.log('=== 快捷输入插件定时器调试信息 ===');
    console.log('Service Worker 支持:', 'serviceWorker' in navigator);
    console.log('Service Worker 控制器:', !!navigator.serviceWorker?.controller);
    console.log('通知权限:', Notification.permission);
    console.log('当前使用降级方案:', isUsingFallback);
    console.log('降级定时器ID:', fallbackTimerId);
    console.log('存储的定时器数据:', localStorage.getItem('cip_alarm_data_v1'));
    console.log('页面可见性:', document.visibilityState);
    console.log('================================');
}

// 可以在浏览器控制台调用 debugTimerStatus() 来查看调试信息
