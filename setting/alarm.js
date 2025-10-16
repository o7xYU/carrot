const state = {
    elements: {},
    dependencies: {
        localStorageRef: typeof localStorage !== 'undefined' ? localStorage : null,
        alertRef: (message) => alert(message),
        confirmRef: (message) => confirm(message),
        setTimeoutRef: setTimeout,
        windowRef: typeof window !== 'undefined' ? window : null,
        defaultCommand: '',
    },
    timerWorker: null,
};

function getElements() {
    return state.elements;
}

function getDeps() {
    return state.dependencies;
}

export function initAlarmSettings(elements, dependencies = {}) {
    state.elements = elements || {};
    state.dependencies = { ...state.dependencies, ...dependencies };

    const {
        alarmCommandInput,
        startAlarmBtn,
        stopAlarmBtn,
        restoreDefaultsBtn,
        alarmHoursInput,
        alarmMinutesInput,
        alarmSecondsInput,
        alarmRepeatInput,
    } = state.elements;

    if (alarmCommandInput) {
        alarmCommandInput.value =
            getDeps().localStorageRef?.getItem('cip_custom_command_v1') ||
            state.dependencies.defaultCommand ||
            alarmCommandInput.value;
    }

    startAlarmBtn?.addEventListener('click', () => startAlarm(false));
    stopAlarmBtn?.addEventListener('click', () => stopAlarm());
    restoreDefaultsBtn?.addEventListener('click', () => {
        if (getDeps().confirmRef('确定要将指令恢复为默认设置吗？')) {
            if (alarmCommandInput) {
                alarmCommandInput.value = state.dependencies.defaultCommand;
            }
            getDeps().localStorageRef?.removeItem('cip_custom_command_v1');
        }
    });

    [alarmHoursInput, alarmMinutesInput, alarmSecondsInput, alarmRepeatInput]
        .filter(Boolean)
        .forEach((input) => {
            input.addEventListener('input', () => updateAlarmStatus(null));
        });

    return {
        startAlarm,
        stopAlarm,
        updateAlarmStatus,
        checkAlarmOnLoad,
        executeCommand,
        handleExecutionComplete,
        setTimerWorker,
    };
}

export function setTimerWorker(worker) {
    state.timerWorker = worker;
}

function readInputs() {
    const {
        alarmHoursInput,
        alarmMinutesInput,
        alarmSecondsInput,
        alarmCommandInput,
        alarmRepeatInput,
    } = getElements();

    const hours = parseInt(alarmHoursInput?.value, 10) || 0;
    const minutes = parseInt(alarmMinutesInput?.value, 10) || 0;
    const seconds = parseInt(alarmSecondsInput?.value, 10) || 0;
    const repeat = parseInt(alarmRepeatInput?.value, 10) || 1;
    const command = (alarmCommandInput?.value || '').trim();
    return { hours, minutes, seconds, command, repeat };
}

function ensureWorker() {
    if (!state.timerWorker) {
        getDeps().alertRef(
            '错误：后台计时器未初始化，请刷新页面重试。',
        );
        return false;
    }
    return true;
}

export function startAlarm(isContinuation = false) {
    if (!ensureWorker()) return;
    const { hours, minutes, seconds, command, repeat } = readInputs();
    const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
    const ls = getDeps().localStorageRef;

    if (totalMs <= 0) {
        getDeps().alertRef('请输入有效的定时时间！');
        return;
    }
    if (!command) {
        getDeps().alertRef('请输入要执行的指令！');
        return;
    }

    if (ls) {
        ls.setItem('cip_custom_command_v1', command);
    }

    const endTime = Date.now() + totalMs;
    let alarmData;
    if (isContinuation) {
        try {
            alarmData = JSON.parse(ls?.getItem('cip_alarm_data_v1'));
        } catch (error) {
            alarmData = null;
        }
        if (!alarmData) return;
        alarmData.endTime = endTime;
        alarmData.executed = (alarmData.executed || 0) + 1;
    } else {
        alarmData = {
            endTime,
            command,
            duration: totalMs,
            repeat,
            executed: 0,
        };
    }

    ls?.setItem('cip_alarm_data_v1', JSON.stringify(alarmData));
    state.timerWorker?.postMessage({ type: 'start', data: alarmData });
}

export function stopAlarm() {
    state.timerWorker?.postMessage({ type: 'stop' });
    getDeps().localStorageRef?.removeItem('cip_alarm_data_v1');
    updateAlarmStatus(null);
}

export function updateAlarmStatus(data) {
    const { alarmStatus, alarmCommandInput } = getElements();
    const ls = getDeps().localStorageRef;
    if (!alarmStatus) return;
    if (data && typeof data.remaining === 'number') {
        const remainingMs = Math.max(0, data.remaining);
        const totalSeconds = Math.floor(remainingMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const repeat = data.repeat || 1;
        const executed = data.executed || 0;
        const statusText =
            `状态: 运行中 - 剩余 ${hours}小时 ${minutes}分 ${seconds}秒` +
            (repeat > 1
                ? ` (第 ${executed + 1}/${repeat} 次)`
                : '');
        alarmStatus.textContent = statusText;
    } else {
        try {
            const storedData = JSON.parse(ls?.getItem('cip_alarm_data_v1'));
            if (storedData) {
                alarmStatus.textContent = '状态: 时间到！';
                return;
            }
        } catch (error) {
            // ignore
        }
        alarmStatus.textContent = '状态: 未设置';
    }
    if (alarmCommandInput && !alarmCommandInput.value) {
        alarmCommandInput.value =
            ls?.getItem('cip_custom_command_v1') ||
            state.dependencies.defaultCommand ||
            '';
    }
}

export function checkAlarmOnLoad() {
    const ls = getDeps().localStorageRef;
    let alarmData = null;
    try {
        alarmData = JSON.parse(ls?.getItem('cip_alarm_data_v1'));
    } catch (error) {
        alarmData = null;
    }
    const {
        alarmHoursInput,
        alarmMinutesInput,
        alarmSecondsInput,
        alarmCommandInput,
        alarmRepeatInput,
    } = getElements();

    if (alarmData && alarmData.endTime && alarmData.endTime > Date.now()) {
        if (state.timerWorker) {
            state.timerWorker.postMessage({ type: 'start', data: alarmData });
        }
    } else if (alarmData) {
        ls?.removeItem('cip_alarm_data_v1');
        alarmData = null;
    }

    const duration = alarmData ? alarmData.duration || 0 : 0;
    if (alarmHoursInput)
        alarmHoursInput.value = Math.floor(duration / 3600000);
    if (alarmMinutesInput)
        alarmMinutesInput.value = Math.floor((duration % 3600000) / 60000);
    if (alarmSecondsInput)
        alarmSecondsInput.value = Math.floor((duration % 60000) / 1000);
    if (alarmCommandInput)
        alarmCommandInput.value = alarmData
            ? alarmData.command
            : ls?.getItem('cip_custom_command_v1') ||
              state.dependencies.defaultCommand ||
              '';
    if (alarmRepeatInput) alarmRepeatInput.value = alarmData ? alarmData.repeat || 1 : 1;
    updateAlarmStatus(null);
}

export function executeCommand(command) {
    const win = getDeps().windowRef;
    const wrappedCommand = `<details><summary>⏰ 定时指令已执行</summary>\n<data>\n${command}\n</data>\n</details>`;
    try {
        if (win && typeof win.triggerSlash === 'function') {
            win.triggerSlash(`/send ${wrappedCommand} || /trigger`);
            return;
        }
        if (win?.parent && typeof win.parent.triggerSlash === 'function') {
            win.parent.triggerSlash(`/send ${wrappedCommand} || /trigger`);
            return;
        }
        const targetDoc = win?.parent?.document || win?.document;
        if (!targetDoc) throw new Error('无法访问父页面文档');
        const textareaElement = targetDoc.querySelector('#send_textarea');
        const sendButton = targetDoc.querySelector('#send_but');
        const altTextarea = targetDoc.querySelector('#prompt-input');
        const altSendButton =
            targetDoc.querySelector('#send_button') ||
            targetDoc.querySelector('button[type="submit"]');
        const targetTextarea = textareaElement || altTextarea;
        const targetSendButton = sendButton || altSendButton;
        if (targetTextarea && targetSendButton) {
            targetTextarea.value = wrappedCommand;
            targetTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            targetSendButton.click();
        } else {
            throw new Error('未找到发送控件');
        }
    } catch (error) {
        console.error('Carrot: Error sending command:', error);
    }
}

export function handleExecutionComplete() {
    const ls = getDeps().localStorageRef;
    let currentAlarmData = null;
    try {
        currentAlarmData = JSON.parse(ls?.getItem('cip_alarm_data_v1'));
    } catch (error) {
        currentAlarmData = null;
    }
    if (
        currentAlarmData &&
        currentAlarmData.executed + 1 < (currentAlarmData.repeat || 1)
    ) {
        startAlarm(true);
        return true;
    }
    stopAlarm();
    return false;
}