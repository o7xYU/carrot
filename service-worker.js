// service-worker.js (最终完美版 - 心脏 + 信使)

let timerId = null;
let statusIntervalId = null;
let alarmData = null;

self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

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

function postStatus() {
    if (alarmData && alarmData.endTime) {
        const remaining = alarmData.endTime - Date.now();
        postToClients({
            type: 'tick',
            remaining: remaining,
            executed: alarmData.executed,
            repeat: alarmData.repeat,
        });
    }
}

function execute() {
    // 1. 通知主线程执行指令
    postToClients({
        type: 'execute',
        command: alarmData.command,
        executed: alarmData.executed,
        repeat: alarmData.repeat,
    });
    
    // 2. 显示系统通知
    self.registration.showNotification('SillyTavern 定时指令', {
        body: `时间到！指令已发送。(第 ${alarmData.executed + 1} / ${alarmData.repeat} 次)`,
        tag: 'carrot-timer-notification',
        renotify: true,
    });

    // 3. 清理工作
    if (statusIntervalId) clearInterval(statusIntervalId);
    if (timerId) clearTimeout(timerId);
    statusIntervalId = null;
    timerId = null;
    // 保留alarmData直到主脚本确认下一个动作
}

self.addEventListener('message', (event) => {
    if (!event.data) return;
    const { type, data } = event.data;

    switch (type) {
        case 'start':
            if (timerId) clearTimeout(timerId);
            if (statusIntervalId) clearInterval(statusIntervalId);

            alarmData = data;
            const remaining = alarmData.endTime - Date.now();

            if (remaining > 0) {
                timerId = setTimeout(execute, remaining);
                statusIntervalId = setInterval(postStatus, 1000);
                postStatus();
            } else {
                execute();
            }
            break;

        case 'stop':
            if (timerId) clearTimeout(timerId);
            if (statusIntervalId) clearInterval(statusIntervalId);
            timerId = null;
            statusIntervalId = null;
            alarmData = null;
            postToClients({ type: 'stopped' });
            break;
    }
});
