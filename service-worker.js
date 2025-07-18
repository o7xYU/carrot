// service-worker.js (最终修正版 - 仅负责计时和通知)

let timerId = null;

// Service Worker 安装后立即激活
self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// 监听来自主脚本的消息
self.addEventListener('message', (event) => {
    if (!event.data) return;
    const { type, data } = event.data;

    switch (type) {
        case 'start':
            // 清理任何可能存在的旧计时器
            if (timerId) clearTimeout(timerId);

            const remaining = data.endTime - Date.now();

            if (remaining > 0) {
                // 设置核心计时器
                timerId = setTimeout(() => {
                    // 时间到，向所有客户端发送执行指令
                    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
                        .then(clients => {
                            clients.forEach(client => {
                                client.postMessage({ type: 'execute', command: data.command });
                            });
                        });
                    
                    // 同时，显示系统通知
                    self.registration.showNotification('SillyTavern 定时指令', {
                        body: `时间到！指令已发送。(第 ${data.executed + 1} / ${data.repeat} 次)`,
                        tag: 'carrot-timer-notification',
                        renotify: true,
                    });

                    // 执行完毕后清理自身
                    if (timerId) clearTimeout(timerId);
                    timerId = null;
                }, remaining);
            }
            break;

        case 'stop':
            // 收到停止指令，清理计时器
            if (timerId) {
                clearTimeout(timerId);
                timerId = null;
            }
            break;
    }
});
