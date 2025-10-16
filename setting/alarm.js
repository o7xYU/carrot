const state = {
    startAlarmBtn: null,
    stopAlarmBtn: null,
    restoreDefaultsBtn: null,
    alarmHoursInput: null,
    alarmMinutesInput: null,
    alarmSecondsInput: null,
    alarmCommandInput: null,
    alarmStatus: null,
    alarmRepeatInput: null,
};

let timerWorkerRef = null;
let defaultCommand = '';

function parseNumber(value, fallback = 0) {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

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

export function updateAlarmStatus(data) {
    const { alarmStatus } = state;
    if (!alarmStatus) return;
    if (data && data.remaining > 0) {
        let statusText = `运行中: 剩余 ${formatTime(data.remaining)}`;
        if (data.repeat > 1) {
            statusText += ` (第 ${data.executed + 1} / ${data.repeat} 次)`;
        }
        alarmStatus.textContent = statusText;
    } else {
        const storedData = JSON.parse(
            localStorage.getItem('cip_alarm_data_v1'),
        );
        if (storedData) {
            alarmStatus.textContent = '状态: 时间到！';
        } else {
            alarmStatus.textContent = '状态: 未设置';
        }
    }
}

export function setTimerWorker(worker) {
    timerWorkerRef = worker;
}

export function startAlarm(isContinuation = false) {
    if (!timerWorkerRef) {
        alert('错误：后台计时器未初始化，请刷新页面重试。');
        return;
    }

    const hours = parseNumber(state.alarmHoursInput?.value, 0);
    const minutes = parseNumber(state.alarmMinutesInput?.value, 0);
    const seconds = parseNumber(state.alarmSecondsInput?.value, 0);
    const command = state.alarmCommandInput?.value?.trim() || '';
    const repeat = parseNumber(state.alarmRepeatInput?.value, 1) || 1;
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
        if (alarmData) {
            alarmData.endTime = endTime;
            alarmData.executed = (alarmData.executed || 0) + 1;
        }
    } else {
        alarmData = {
            endTime,
            command,
            duration: totalMs,
            repeat,
            executed: 0,
        };
    }

    localStorage.setItem('cip_alarm_data_v1', JSON.stringify(alarmData));
    timerWorkerRef.postMessage({ type: 'start', data: alarmData });
}

export function stopAlarm() {
    if (timerWorkerRef) {
        timerWorkerRef.postMessage({ type: 'stop' });
    }
    localStorage.removeItem('cip_alarm_data_v1');
    updateAlarmStatus(null);
}

export function checkAlarmOnLoad() {
    const alarmData = JSON.parse(localStorage.getItem('cip_alarm_data_v1'));
    if (alarmData && alarmData.endTime && alarmData.endTime > Date.now()) {
        if (timerWorkerRef) {
            timerWorkerRef.postMessage({ type: 'start', data: alarmData });
        }
    } else if (alarmData) {
        localStorage.removeItem('cip_alarm_data_v1');
    }

    const duration = alarmData ? alarmData.duration || 0 : 0;
    if (state.alarmHoursInput) {
        state.alarmHoursInput.value = Math.floor(duration / 3600000);
    }
    if (state.alarmMinutesInput) {
        state.alarmMinutesInput.value = Math.floor(
            (duration % 3600000) / 60000,
        );
    }
    if (state.alarmSecondsInput) {
        state.alarmSecondsInput.value = Math.floor((duration % 60000) / 1000);
    }
    if (state.alarmCommandInput) {
        state.alarmCommandInput.value = alarmData
            ? alarmData.command
            : localStorage.getItem('cip_custom_command_v1') || defaultCommand;
    }
    if (state.alarmRepeatInput) {
        state.alarmRepeatInput.value = alarmData ? alarmData.repeat || 1 : 1;
    }
    updateAlarmStatus(null);
}

export function initAlarmSettings({
    startAlarmBtn,
    stopAlarmBtn,
    restoreDefaultsBtn,
    alarmHoursInput,
    alarmMinutesInput,
    alarmSecondsInput,
    alarmCommandInput,
    alarmStatus,
    alarmRepeatInput,
    defaultCommandText = '',
} = {}) {
    state.startAlarmBtn = startAlarmBtn;
    state.stopAlarmBtn = stopAlarmBtn;
    state.restoreDefaultsBtn = restoreDefaultsBtn;
    state.alarmHoursInput = alarmHoursInput;
    state.alarmMinutesInput = alarmMinutesInput;
    state.alarmSecondsInput = alarmSecondsInput;
    state.alarmCommandInput = alarmCommandInput;
    state.alarmStatus = alarmStatus;
    state.alarmRepeatInput = alarmRepeatInput;
    defaultCommand = defaultCommandText;

    state.startAlarmBtn?.addEventListener('click', () => startAlarm(false));
    state.stopAlarmBtn?.addEventListener('click', () => stopAlarm());
    state.restoreDefaultsBtn?.addEventListener('click', () => {
        if (!state.alarmCommandInput) return;
        if (confirm('确定要将指令恢复为默认设置吗？')) {
            state.alarmCommandInput.value = defaultCommand;
            localStorage.removeItem('cip_custom_command_v1');
        }
    });
}
