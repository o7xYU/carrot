// 在script.js中替换定时器相关的部分

// --- 改进的定时指令核心逻辑 (Service Worker模式) ---
let serviceWorkerReady = false;
let alarmStatusCheckInterval = null;

function formatTime(ms) {
    if (ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600)
        .toString()
        .padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60)
        .toString()
        .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

function updateAlarmStatus(data) {
    if (data && data.remaining > 0 && data.isActive) {
        let statusText = `运行中: 剩余 ${formatTime(data.remaining)}`;
        if (data.repeat > 1) {
            statusText += ` (第 ${data.executed + 1} / ${data.repeat} 次)`;
        }
        alarmStatus.textContent = statusText;
    } else {
        const storedData = JSON.parse(
            localStorage.getItem('cip_alarm_data_v1'),
        );
        if (storedData && storedData.endTime > Date.now()) {
            alarmStatus.textContent = '状态: 等待Service Worker响应...';
        } else {
            alarmStatus.textContent = '状态: 未设置';
        }
    }
}

function executeCommand(command) {
    const wrappedCommand = `<details><summary>⏰ 定时指令已执行</summary>\n<data>\n${command}\n</data>\n</details>`;
    try {
        if (typeof window.triggerSlash === 'function') {
            console.log('Carrot: Using window.triggerSlash');
            window.triggerSlash(`/send ${wrappedCommand} || /trigger`);
        } else if (
            window.parent &&
            typeof window.parent.triggerSlash === 'function'
        ) {
            console.log('Carrot: Using window.parent.triggerSlash');
            window.parent.triggerSlash(
                `/send ${wrappedCommand} || /trigger`,
            );
        } else {
            console.warn(
                'Carrot: triggerSlash function not found. Attempting fallback...',
            );
            if (window.parent && window.parent.document) {
                const textareaElement =
                    window.parent.document.querySelector('#send_textarea');
                const sendButton =
                    window.parent.document.querySelector('#send_but');
                const altTextarea =
                    window.parent.document.querySelector('#prompt-input');
                const altSendButton =
                    window.parent.document.querySelector('#send_button') ||
                    window.parent.document.querySelector(
                        'button[type="submit"]',
                    );

                const targetTextarea = textareaElement || altTextarea;
                const targetSendButton = sendButton || altSendButton;

                if (targetTextarea && targetSendButton) {
                    console.log(
                        'Carrot Fallback: Found textarea and send button in parent.',
                    );
                    targetTextarea.value = wrappedCommand;
                    targetTextarea.dispatchEvent(
                        new Event('input', { bubbles: true }),
                    );
                    targetSendButton.click();
                } else {
                    console.error(
                        `Carrot Fallback failed: Could not find textarea or send button.`,
                    );
                }
            } else {
                console.error(
                    'Carrot Fallback failed: Cannot access parent window document.',
                );
            }
        }
    } catch (error) {
        console.error('Carrot: Error sending command:', error);
    }
}

function startAlarm(isContinuation = false) {
    if (!serviceWorkerReady) {
        alert('错误：Service Worker未就绪，请刷新页面重试。');
        return;
    }

    const hours = parseInt(alarmHoursInput.value, 10) || 0;
    const minutes = parseInt(alarmMinutesInput.value, 10) || 0;
    const seconds = parseInt(alarmSecondsInput.value, 10) || 0;
    const command = alarmCommandInput.value.trim();
    const repeat = parseInt(alarmRepeatInput.value, 10) || 1;
    const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000;

    localStorage.setItem('cip_custom_command_v1', command);

    if (totalMs <= 0) {
        alert('请输入有效的定时时间！');
        return;
    }
    if (!command) {
        alert('请输入要执行的指令！');
        return;
    }

    const endTime = Date.now() + totalMs;
    let alarmData;

    if (isContinuation) {
        alarmData = JSON.parse(localStorage.getItem('cip_alarm_data_v1'));
        alarmData.endTime = endTime;
        alarmData.executed = (alarmData.executed || 0) + 1;
    } else {
        alarmData = {
            endTime: endTime,
            command: command,
            duration: totalMs,
            repeat: repeat,
            executed: 0,
        };
    }

    localStorage.setItem('cip_alarm_data_v1', JSON.stringify(alarmData));
    
    // 发送给Service Worker
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'START_ALARM',
            data: alarmData
        });
    }

    // 开始状态检查
    startAlarmStatusCheck();
}

function stopAlarm() {
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'STOP_ALARM'
        });
    }
    localStorage.removeItem('cip_alarm_data_v1');
    stopAlarmStatusCheck();
    updateAlarmStatus({ remaining: 0, isActive: false });
}

function startAlarmStatusCheck() {
    stopAlarmStatusCheck();
    // 每5秒检查一次状态
    alarmStatusCheckInterval = setInterval(() => {
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'CHECK_ALARM'
            });
        }
    }, 5000);
}

function stopAlarmStatusCheck() {
    if (alarmStatusCheckInterval) {
        clearInterval(alarmStatusCheckInterval);
        alarmStatusCheckInterval = null;
    }
}

function checkAlarmOnLoad() {
    const alarmData = JSON.parse(localStorage.getItem('cip_alarm_data_v1'));
    
    // 恢复界面状态
    if (alarmData) {
        const duration = alarmData.duration || 0;
        alarmHoursInput.value = Math.floor(duration / 3600000);
        alarmMinutesInput.value = Math.floor((duration % 3600000) / 60000);
        alarmSecondsInput.value = Math.floor((duration % 60000) / 1000);
        alarmCommandInput.value = alarmData.command || localStorage.getItem('cip_custom_command_v1') || defaultCommand;
        alarmRepeatInput.value = alarmData.repeat || 1;
        
        // 检查是否还在有效期内
        if (alarmData.endTime && alarmData.endTime > Date.now()) {
            // 启动状态检查
            startAlarmStatusCheck();
            // 立即请求一次状态更新
            setTimeout(() => {
                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        type: 'CHECK_ALARM'
                    });
                }
            }, 1000);
        } else if (alarmData) {
            // 过期的数据，清理
            localStorage.removeItem('cip_alarm_data_v1');
        }
    } else {
        // 设置默认值
        alarmHoursInput.value = '';
        alarmMinutesInput.value = '';
        alarmSecondsInput.value = '';
        alarmCommandInput.value = localStorage.getItem('cip_custom_command_v1') || defaultCommand;
        alarmRepeatInput.value = 1;
    }
    
    updateAlarmStatus({ remaining: 0, isActive: false });
}

function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register(
                '/scripts/extensions/third-party/carrot/service-worker.js',
                { scope: '/' },
            )
            .then((registration) => {
                console.log(
                    'Carrot Service Worker 注册成功，范围:',
                    registration.scope,
                );
                
                // 等待Service Worker就绪
                return navigator.serviceWorker.ready;
            })
            .then((registration) => {
                serviceWorkerReady = true;
                console.log('Carrot Service Worker 已就绪');
                
                // 设置消息监听
                navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
                
                // 如果页面加载时有未完成的定时任务，通知Service Worker检查
                const alarmData = JSON.parse(localStorage.getItem('cip_alarm_data_v1'));
                if (alarmData && alarmData.endTime > Date.now()) {
                    setTimeout(() => {
                        if (navigator.serviceWorker.controller) {
                            navigator.serviceWorker.controller.postMessage({
                                type: 'START_ALARM',
                                data: alarmData
                            });
                        }
                    }, 1000);
                }
            })
            .catch((error) => {
                console.error('Carrot Service Worker 注册失败:', error);
                serviceWorkerReady = false;
            });
    } else {
        console.warn('当前浏览器不支持Service Worker');
        serviceWorkerReady = false;
    }
}

function handleServiceWorkerMessage(event) {
    const { type, ...data } = event.data;
    
    switch (type) {
        case 'ALARM_STATUS':
            updateAlarmStatus(data);
            break;
        case 'EXECUTE_COMMAND':
            console.log('Carrot: 收到Service Worker的执行指令');
            executeCommand(data.command);
            
            // 检查是否需要重复
            const currentAlarmData = JSON.parse(
                localStorage.getItem('cip_alarm_data_v1'),
            );
            if (
                currentAlarmData &&
                data.executed + 1 < data.repeat
            ) {
                // 更新本地存储
                currentAlarmData.executed = data.executed + 1;
                localStorage.setItem('cip_alarm_data_v1', JSON.stringify(currentAlarmData));
            } else {
                // 任务完成，清理
                localStorage.removeItem('cip_alarm_data_v1');
                stopAlarmStatusCheck();
            }
            break;
        case 'ALARM_STOPPED':
            localStorage.removeItem('cip_alarm_data_v1');
            stopAlarmStatusCheck();
            updateAlarmStatus({ remaining: 0, isActive: false });
            break;
    }
}

// 页面可见性检测
function handleVisibilityChange() {
    if (!document.hidden && serviceWorkerReady) {
        // 页面重新可见时，立即检查定时器状态
        const alarmData = JSON.parse(localStorage.getItem('cip_alarm_data_v1'));
        if (alarmData && alarmData.endTime > Date.now()) {
            setTimeout(() => {
                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        type: 'CHECK_ALARM'
                    });
                }
            }, 500);
        }
    }
}

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
                console.log('胡萝卜插件：通知权限已获取。');
            } else {
                console.warn('胡萝卜插件：通知权限被拒绝，定时功能可能受限。');
            }
        });
    }
}

// 移除原有的 initWebWorker 函数，并修改 init 函数
function init() {
    requestNotificationPermission();
    initServiceWorker(); // 使用Service Worker替代Web Worker
    loadStickerData();
    loadThemes();
    renderCategories();
    loadButtonPosition();
    switchStickerCategory(Object.keys(stickerData)[0] || '');
    switchTab('text');
    
    // 添加页面可见性监听
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 延迟加载定时器状态
    setTimeout(checkAlarmOnLoad, 1000);
}
// 在原始 script.js 的最后，添加这个补丁代码
// 不要删除或修改原有代码，只需要在文件末尾添加：

(function() {
    // 移动端定时器补丁
    let originalStartAlarm = window.startAlarm;
    let originalStopAlarm = window.stopAlarm;
    let originalExecuteCommand = window.executeCommand;
    let mobileTimerInterval = null;
    let lastAlarmCheck = 0;

    // 页面可见性变化检测
    function handleVisibilityChange() {
        if (!document.hidden) {
            checkMobileAlarm();
        }
    }

    // 移动端定时器检查
    function checkMobileAlarm() {
        const alarmData = JSON.parse(localStorage.getItem('cip_alarm_data_v1'));
        if (!alarmData || !alarmData.endTime) return;

        const now = Date.now();
        const remaining = alarmData.endTime - now;

        if (remaining <= 0) {
            // 时间到了，执行指令
            console.log('Carrot Mobile: 检测到定时器过期，执行指令');
            
            if (originalExecuteCommand && alarmData.command) {
                originalExecuteCommand(alarmData.command);
            }

            // 检查是否需要重复
            const currentExecuted = (alarmData.executed || 0) + 1;
            if (currentExecuted < (alarmData.repeat || 1)) {
                // 需要重复
                alarmData.executed = currentExecuted;
                alarmData.endTime = now + alarmData.duration;
                localStorage.setItem('cip_alarm_data_v1', JSON.stringify(alarmData));
                startMobileTimer();
            } else {
                // 完成，清理
                localStorage.removeItem('cip_alarm_data_v1');
                stopMobileTimer();
                if (window.updateAlarmStatus) {
                    window.updateAlarmStatus(null);
                }
            }
        }
    }

    // 启动移动端定时器
    function startMobileTimer() {
        stopMobileTimer();
        // 每30秒检查一次（降低电池消耗）
        mobileTimerInterval = setInterval(() => {
            checkMobileAlarm();
            // 更新状态显示
            const alarmData = JSON.parse(localStorage.getItem('cip_alarm_data_v1'));
            if (alarmData && window.updateAlarmStatus) {
                const remaining = Math.max(0, alarmData.endTime - Date.now());
                window.updateAlarmStatus({
                    remaining: remaining,
                    executed: alarmData.executed || 0,
                    repeat: alarmData.repeat || 1,
                    isActive: remaining > 0
                });
            }
        }, 30000);

        // 立即检查一次
        setTimeout(checkMobileAlarm, 1000);
    }

    function stopMobileTimer() {
        if (mobileTimerInterval) {
            clearInterval(mobileTimerInterval);
            mobileTimerInterval = null;
        }
    }

    // 增强原有的启动函数
    if (originalStartAlarm) {
        window.startAlarm = function(isContinuation = false) {
            // 调用原有逻辑
            const result = originalStartAlarm.call(this, isContinuation);
            
            // 添加移动端支持
            setTimeout(() => {
                startMobileTimer();
            }, 1000);
            
            return result;
        };
    }

    // 增强原有的停止函数
    if (originalStopAlarm) {
        window.stopAlarm = function() {
            const result = originalStopAlarm.call(this);
            stopMobileTimer();
            return result;
        };
    }

    // 页面加载时检查
    function initMobileTimer() {
        const alarmData = JSON.parse(localStorage.getItem('cip_alarm_data_v1'));
        if (alarmData && alarmData.endTime > Date.now()) {
            console.log('Carrot Mobile: 发现未完成的定时任务，启动移动端支持');
            startMobileTimer();
        }
    }

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 页面聚焦时也检查
    window.addEventListener('focus', () => {
        setTimeout(checkMobileAlarm, 500);
    });

    // 初始化
    setTimeout(initMobileTimer, 2000);

    console.log('Carrot Mobile Timer Patch 已加载');
})();
