const LogLevels = Object.freeze({
    TRACE: 10,
    DEBUG: 20,
    INFO: 30,
    WARN: 40,
    ERROR: 50,
});

const level = (() => {
    let raw = process.env.LOG_LEVEL;

    if (raw && typeof (raw) === 'string') {
        switch (raw.toLowerCase()) {
            case '1':
            case '10':
            case 'trace':
                return LogLevels.TRACE;

            case '2':
            case '20':
            case 'dbg':
            case 'debug':
                return LogLevels.DEBUG;

            case '3':
            case '30':
            case 'info':
                return LogLevels.INFO;

            case '4':
            case '40':
            case 'warn':
            case 'warning':
                return LogLevels.WARN;

            case '5':
            case '50':
            case 'err':
            case 'error':
                return LogLevels.ERROR;
        }
    }

    return LogLevels.INFO;
})();

let nameWidth;

function _log(use_stderr, name, level, text) {
    name = name.padEnd(nameWidth, ' ');
    
    (use_stderr ? process.stderr : process.stdout).write(`[${name} ${level}] ${text}\n`);
}

export default class LogService {
    constructor(name) {
        this.name = name;

        if (!nameWidth || (typeof (nameWidth) === 'number' && nameWidth.length < name.length)) {
            nameWidth = name.length;
        }
    }

    trace(text) {
        if (level <= LogLevels.TRACE) {
            _log(false, this.name, 'TRACE', text);
        }
    }

    debug(text) {
        if (level <= LogLevels.DEBUG) {
            _log(false, this.name, 'DEBUG', text);
        }
    }

    info(text) {
        if (level <= LogLevels.INFO) {
            _log(false, this.name, 'INFO', text);
        }
    }

    warn(text) {
        if (level <= LogLevels.WARN) {
            _log(false, this.name, 'WARN', text);
        }
    }

    error(text) {
        if (level <= LogLevels.ERROR) {
            _log(true, this.name, 'ERROR', text);
        }
    }

    fatal(text) {
        _log(true, this.name, 'FATAL', text);

        process.exit(1);
    }
}