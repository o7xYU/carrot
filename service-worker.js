// carrot/service-worker.js

// Service Worker 安装后立即激活
self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// 存储定时器数据
let alarmData = null;
let timerId = null;

// 监听来自客户端的消息
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SET_ALARM') {
        alarmData = event.data.data;
        // 清理旧定时器
        if (timerId) clearTimeout(timerId);

        const remaining = alarmData.endTime - Date.now();
        if (remaining > 0) {
            timerId = setTimeout(() => {
                // 时间到，显示通知并执行指令
                self.registration.showNotification('定时指令', {
                    body: '时间到！正在执行预设指令...',
                    silent: true,
                    tag: 'carrot-timer-notification',
                    renotify: true,
                });

                // 执行指令
                executeCommand(alarmData.command);

                // 检查是否需要重复
                if (alarmData.executed + 1 < alarmData.repeat) {
                    alarmData.executed += 1;
                    alarmData.endTime = Date.now() + alarmData.duration;
                    event.waitUntil(
                        self.clients.matchAll().then((clients) => {
                            clients.forEach((client) =>
                                client.postMessage({
                                    type: 'UPDATE_ALARM',
                                    data: alarmData,
                                }),
                            );
                        }),
                    );
                    // 重新设置定时器
                    timerId = setTimeout(arguments.callee, alarmData.duration);
                } else {
                    // 清理数据
                    alarmData = null;
                    timerId = null;
                    event.waitUntil(
                        self.clients.matchAll().then((clients) => {
                            clients.forEach((client) =>
                                client.postMessage({ type: 'ALARM_STOPPED' }),
                            );
                        }),
                    );
                }
            }, remaining);

            // 通知客户端定时器已启动
            event.waitUntil(
                self.clients.matchAll().then((clients) => {
                    clients.forEach((client) =>
                        client.postMessage({
                            type: 'ALARM_STARTED',
                            data: alarmData,
                        }),
                    );
                }),
            );
        }
    } else if (event.data && event.data.type === 'STOP_ALARM') {
        if (timerId) clearTimeout(timerId);
        alarmData = null;
        timerId = null;
        event.waitUntil(
            self.clients.matchAll().then((clients) => {
                clients.forEach((client) =>
                    client.postMessage({ type: 'ALARM_STOPPED' }),
                );
            }),
        );
    }
});

// 处理通知点击事件
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(
            (clientList) => {
                if (clientList.length > 0) {
                    clientList[0].focus();
                } else {
                    self.clients.openWindow('/');
                }
            },
        ),
    );
});

// 执行指令的函数
function executeCommand(command) {
    // 这里我们无法直接访问SillyTavern的DOM，因此需要发送消息给客户端
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(
        (clients) => {
            clients.forEach((client) =>
                client.postMessage({
                    type: 'EXECUTE_COMMAND',
                    command: command,
                }),
            );
        },
    );
}
