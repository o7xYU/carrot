// carrot/service-worker.js (v2.0 - 核心计时逻辑)

let timerId = null;

// Service Worker 安装后立即激活
self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

/**
 * 向所有活跃的客户端（SillyTavern标签页）发送消息。
 * @param {object} message - 要发送的消息对象。
 */
function postToClients(message) {
    self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then(clients => {
        if (clients && clients.length) {
            clients.forEach(client => {
                client.postMessage(message);
            });
        }
    });
}

/**
 * 执行最终指令的函数。
 * @param {object} data - 包含指令和重复次数等信息的对象。
 */
function execute(data) {
    const { command, executed, repeat } = data;

    // 1. 向所有客户端广播执行命令
    postToClients({ type: 'execute', command: command });

    // 2. 显示一个通知，这是后台唤醒的关键
    self.registration.showNotification('定时指令已执行', {
        body: `时间到！指令已发送。\n(第 ${executed + 1} / ${repeat} 次)`,
        tag: 'carrot-timer-notification',
        renotify: true, // 允许重复通知
    });

    // 3. 通知客户端任务已完成，以便它们可以决定是否开始下一次
    postToClients({ type: 'execution_finished', data: data });

    // 清理计时器
    if (timerId) clearTimeout(timerId);
    timerId = null;
}


// 监听来自客户端（主脚本）的消息
self.addEventListener('message', (event) => {
    if (!event.data) return;
    const { type, data } = event.data;

    switch (type) {
        case 'start':
            // 清理任何可能存在的旧计时器
            if (timerId) clearTimeout(timerId);

            const remaining = data.endTime - Date.now();

            if (remaining > 0) {
                timerId = setTimeout(() => {
                    execute(data);
                }, remaining);
                // 可以在这里向客户端发送一个确认消息
                postToClients({ type: 'started' });
            } else {
                // 如果时间已过，立即执行
                execute(data);
            }
            break;

        case 'stop':
            if (timerId) {
                clearTimeout(timerId);
                timerId = null;
            }
            // 通知客户端已停止
            postToClients({ type: 'stopped' });
            break;
        
        // WAKE_UP 消息不再需要，但保留以防万一
        case 'WAKE_UP':
             self.registration.showNotification('定时指令', {
                body: '时间到！正在执行预设指令...',
                silent: true,
                tag: 'carrot-timer-notification',
                renotify: true,
            });
            break;
    }
});
