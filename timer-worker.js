// carrot/timer-worker.js
// 这个脚本在独立的后台线程中运行，以确保定时器不被浏览器暂停。

let timerId = null;
let statusIntervalId = null;
let alarmData = null;

/**
 * 向主线程发送状态更新。
 */
function postStatus() {
    if (alarmData && alarmData.endTime) {
        const remaining = alarmData.endTime - Date.now();
        // 发送一个 'tick' 消息，包含所有需要更新UI的信息
        self.postMessage({
            type: 'tick',
            remaining: remaining,
            executed: alarmData.executed,
            repeat: alarmData.repeat,
        });
    }
}

/**
 * 监听来自主线程的消息。
 */
self.onmessage = function (e) {
    const { type, data } = e.data;

    switch (type) {
        case 'start':
            // 清理掉任何可能存在的旧定时器，确保不会有多个定时器同时运行
            if (timerId) clearTimeout(timerId);
            if (statusIntervalId) clearInterval(statusIntervalId);

            alarmData = data;
            const remaining = alarmData.endTime - Date.now();

            if (remaining > 0) {
                // 这是核心的定时器，它会在倒计时结束后触发
                timerId = setTimeout(() => {
                    // 时间到，通知主线程执行指令
                    self.postMessage({
                        type: 'execute',
                        command: alarmData.command,
                        executed: alarmData.executed,
                        repeat: alarmData.repeat,
                    });
                    // 任务执行后，清理所有定时器
                    if (statusIntervalId) clearInterval(statusIntervalId);
                    statusIntervalId = null;
                    timerId = null;
                    alarmData = null;
                }, remaining);

                // 这个定时器每秒触发一次，仅用于向主线程报告剩余时间，以更新UI
                statusIntervalId = setInterval(postStatus, 1000);
                postStatus(); // 立即发送一次初始状态
            }
            break;

        case 'stop':
            // 收到停止指令，清理所有定时器和数据
            if (timerId) clearTimeout(timerId);
            if (statusIntervalId) clearInterval(statusIntervalId);
            timerId = null;
            statusIntervalId = null;
            alarmData = null;
            // 通知主线程，定时器已停止
            self.postMessage({ type: 'stopped' });
            break;
    }
};
