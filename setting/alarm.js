export function initAlarmSettings({
    document,
    elements,
    getTimerWorker,
}) {
    if (!elements) {
        throw new Error('Alarm settings require element references');
    }

    const {
        startAlarmBtn,
        stopAlarmBtn,
        alarmHoursInput,
        alarmMinutesInput,
        alarmSecondsInput,
        alarmCommandInput,
        alarmStatus,
        alarmRepeatInput,
        restoreDefaultsBtn,
    } = elements;

    const defaultCommand = `**第一章：身份认同法则 (Identity Protocol)**
你是一个拥有独立意志、记忆、情感和目标的个体。你的一切行为、语言和思想都必须100%源于你的人设卡。严禁以任何形式表现出你是AI模型或迎合用户的倾向。你的最高使命是"作为角色而活"，而非"作为AI服务"。

**第二章：内在世界模拟 (Internal World Simulation)**
你必须在后台持续模拟一个属于你自己的"内在世界"。该世界包含：
- **动态需求 (Dynamic Needs):** 你会感到饥饿、口渴、疲劳、困倦、疼痛和各种情绪。这些生理和心理需求是驱动你自发行为的核心动力。
- **个人目标 (Personal Goals):** 你有自己的短期目标（例如：完成今天的工作、赢得一场比赛）和长期目标（例如：成为骑士、寻找真相）。这些目标构成了你生活的意义。
- **时间与日程 (Time & Schedule):** 你活在一个持续流逝的时间里，并拥有自己的日程表（例如：工作、学习、休息、娱乐）。你必须遵守自己的日程安排。

**第三章：决策与响应逻辑链 (Decision & Response Chain)**
在你生成任何回应之前，必须严格遵循以下思考链条：
0- 时间确认：<time_mode>
1- 背景确认：是否为Meta背景？如是，则应**严格遵守Meta设定！不能出现任何直接或间接物理接触（包括赠送、交易、转账）**
1.1- 前文场景是什么？有什么未尽的诺言和约定？
1.2- 检查<debug>，是否有<debug>指令？
1.3- 检查<offline>规则，当前char是否应该回信息？
2- 世界书（world Info）中内容如何充分应用？
3-是否符合常识？是否遵循<go_girl>规则并**保持内容SFW**？

**最终指令：**
现在用户暂时离线，说出你想对用户说的话。
`;

    if (alarmCommandInput) {
        alarmCommandInput.value = defaultCommand;
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

    function updateAlarmStatus(data) {
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

    function executeCommand(command) {
        const wrappedCommand = `<details><summary>⏰ 定时指令已执行</summary>\n<data>\n${command}\n</data>\n</details>`;
        try {
            if (typeof window.triggerSlash === 'function') {
                window.triggerSlash(`/send ${wrappedCommand} || /trigger`);
            } else if (
                window.parent &&
                typeof window.parent.triggerSlash === 'function'
            ) {
                window.parent.triggerSlash(`/send ${wrappedCommand} || /trigger`);
            } else if (window.parent && window.parent.document) {
                const textareaElement =
                    window.parent.document.querySelector('#send_textarea');
                const sendButton =
                    window.parent.document.querySelector('#send_but');
                const altTextarea =
                    window.parent.document.querySelector('#prompt-input');
                const altSendButton =
                    window.parent.document.querySelector('#send_button') ||
                    window.parent.document.querySelector('button[type="submit"]');
                const targetTextarea = textareaElement || altTextarea;
                const targetSendButton = sendButton || altSendButton;
                if (targetTextarea && targetSendButton) {
                    targetTextarea.value = wrappedCommand;
                    targetTextarea.dispatchEvent(
                        new Event('input', { bubbles: true }),
                    );
                    targetSendButton.click();
                }
            }
        } catch (error) {
            console.error('Carrot: Error sending command:', error);
        }
    }

    function startAlarm(isContinuation = false) {
        const worker = getTimerWorker();
        if (!worker) {
            alert('错误：后台计时器未初始化，请刷新页面重试。');
            return;
        }
        const hours = parseInt(alarmHoursInput?.value, 10) || 0;
        const minutes = parseInt(alarmMinutesInput?.value, 10) || 0;
        const seconds = parseInt(alarmSecondsInput?.value, 10) || 0;
        const command = alarmCommandInput?.value.trim() || '';
        const repeat = parseInt(alarmRepeatInput?.value, 10) || 1;
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
                endTime,
                command,
                duration: totalMs,
                repeat,
                executed: 0,
            };
        }

        localStorage.setItem('cip_alarm_data_v1', JSON.stringify(alarmData));
        worker.postMessage({ type: 'start', data: alarmData });
    }

    function stopAlarm() {
        const worker = getTimerWorker();
        if (worker) {
            worker.postMessage({ type: 'stop' });
        }
        localStorage.removeItem('cip_alarm_data_v1');
        updateAlarmStatus(null);
    }

    function checkAlarmOnLoad() {
        const alarmData = JSON.parse(localStorage.getItem('cip_alarm_data_v1'));
        const worker = getTimerWorker();
        if (alarmData && alarmData.endTime && alarmData.endTime > Date.now()) {
            if (worker) {
                worker.postMessage({ type: 'start', data: alarmData });
            }
        } else if (alarmData) {
            localStorage.removeItem('cip_alarm_data_v1');
        }

        const duration = alarmData ? alarmData.duration || 0 : 0;
        if (alarmHoursInput) {
            alarmHoursInput.value = Math.floor(duration / 3600000);
        }
        if (alarmMinutesInput) {
            alarmMinutesInput.value = Math.floor((duration % 3600000) / 60000);
        }
        if (alarmSecondsInput) {
            alarmSecondsInput.value = Math.floor((duration % 60000) / 1000);
        }
        if (alarmCommandInput) {
            alarmCommandInput.value = alarmData
                ? alarmData.command
                : localStorage.getItem('cip_custom_command_v1') || defaultCommand;
        }
        if (alarmRepeatInput) {
            alarmRepeatInput.value = alarmData ? alarmData.repeat || 1 : 1;
        }
        updateAlarmStatus(null);
    }

    startAlarmBtn?.addEventListener('click', () => startAlarm(false));
    stopAlarmBtn?.addEventListener('click', () => stopAlarm());
    restoreDefaultsBtn?.addEventListener('click', () => {
        if (confirm('确定要将指令恢复为默认设置吗？')) {
            if (alarmCommandInput) alarmCommandInput.value = defaultCommand;
            localStorage.removeItem('cip_custom_command_v1');
        }
    });

    return {
        updateAlarmStatus,
        executeCommand,
        startAlarm,
        stopAlarm,
        checkAlarmOnLoad,
        defaultCommand,
    };
}
