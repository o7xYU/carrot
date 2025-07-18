// service-worker.js (最终修正版)

let timerId = null;

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

function execute(data) {
    const { command, executed, repeat } = data;

    postToClients({ type: 'execute', command: command, executed: executed, repeat: repeat });

    self.registration.showNotification('SillyTavern 定时指令', {
        body: `时间到！指令已发送。(第 ${executed + 1} / ${repeat} 次)`,
        tag: 'carrot-timer-notification',
        renotify: true,
    });

    if (timerId) clearTimeout(timerId);
    timerId = null;
}

self.addEventListener('message', (event) => {
    if (!event.data) return;
    const { type, data } = event.data;

    switch (type) {
        case 'start':
            if (timerId) clearTimeout(timerId);

            const remaining = data.endTime - Date.now();

            if (remaining > 0) {
                timerId = setTimeout(() => {
                    execute(data);
                }, remaining);
                postToClients({ type: 'started' });
            } else {
                execute(data);
            }
            break;

        case 'stop':
            if (timerId) {
                clearTimeout(timerId);
                timerId = null;
            }
            postToClients({ type: 'stopped' });
            break;
    }
});
