// carrot/service-worker.js

// Service Worker 安装后立即激活
self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// 监听来自客户端（主脚本）的消息
self.addEventListener('message', (event) => {
    // Service Worker 的唯一工作就是显示通知以唤醒主标签页
    if (event.data && event.data.type === 'WAKE_UP') {
        const showNotification = self.registration.showNotification('定时指令', {
            body: '时间到！正在执行预设指令...',
            silent: true,
            tag: 'carrot-timer-notification',
            renotify: true,
        });
        // 保持 Service Worker 存活直到通知显示完毕
        event.waitUntil(showNotification);
    }
});
