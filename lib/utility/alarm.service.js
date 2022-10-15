import { EventEmitter } from 'node:events';
import Alarms from '../persistance/alarm.model.js';
import { formatISODateString } from './fmt.def.js';
import LogService from './log.service.js';

const CheckWaitDuration = 3600 * 1000; // = 1h
const StartupDelay = 2500; // 2.5s
const log = new LogService('alarm.service.js');

let instance;

class AlarmServiceWorker extends EventEmitter {
    constructor() {
        super({});

        this._activeAlarms = {};
        this._queuedAlarms = [];
        this._checkInterval = setInterval(() => this.check(), CheckWaitDuration);

        setTimeout(() => this.check(), StartupDelay);
    }

    async queueAlarm(time, category, data) {
        let alarm = await Alarms.create({ time, category, data })

        this._queuedAlarms.push(alarm);

        setTimeout(() => this.processQueue(), 1);

        return alarm;
    }

    prepareAlarm(alarm) {
        let ms = Math.max(alarm.time - Date.now(), 1);

        alarm.timeout = setTimeout(() => {
            this.triggerAlarm(alarm);
        }, ms);

        this._activeAlarms[alarm.id] = alarm;
    }

    processQueue() {
        let removeIndices = [];

        for (let i = 0; i < this._queuedAlarms.length; ++i) {
            let alarm = this._queuedAlarms[i];
            let today = formatISODateString(new Date()).split('-').map(part => parseInt(part));
            let alarmDate = formatISODateString(alarm.time).split('-').map(part => parseInt(part));

            if (new Date(today) >= new Date(alarmDate)) {
                removeIndices.push(i);

                this.prepareAlarm(alarm);
            }
        }

        for (let index of removeIndices) {
            this._queuedAlarms.splice(index, 1);
        }
    }

    async check() {
        let alarms = await Alarms.findAll();

        for (let alarm of alarms) {
            if (!this._activeAlarms[alarm.id] && !this._queuedAlarms.some(queued => alarm.id == queued.id)) {
                this._queuedAlarms.push(alarm);
            }
        }

        this.processQueue();
    }

    async triggerAlarm(alarm) {
        await Alarms.destroy({ where: { id: alarm.id } });

        this.emit('alarm', alarm);
    }
}

export default class AlarmService {
    constructor() {
        if (!instance) {
            instance = new AlarmServiceWorker();
        }

        this._listeners = {};

        instance.on('alarm', async alarm => {
            for (let listener of this._listeners[alarm.category]) {
                try {
                    await listener.callback(alarm);
                } catch (e) {
                    log.error(`Error during callback for alarm ${alarm.id}`, e);
                }
            }
        });
    }

    async setAlarm(time, category, data) {
        let alarm = await instance.queueAlarm(time, category, data);

        return alarm.id;
    }

    listen(category, callback) {
        if (!Array.isArray(this._listeners[category])) {
            this._listeners[category] = [];
        }

        this._listeners[category].push({ callback });
    }
}