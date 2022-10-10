import LogService from '../utility/log.service.js';
import Alarms from './alarm.model.js';
import database from './database.def.js';
import Events from './event.model.js';
import EventResponses from './eventresponse.model.js';
import Logs from './log.model.js';

const log = new LogService('dbinit.service.js');

export async function InitialiseDatabase() {
    let dbVersion = await database.databaseVersion();
    let dbDriver = await database.getDialect();

    await Logs.sync();
    await Events.sync();
    await EventResponses.sync();
    await Alarms.sync();

    log.debug(`Using ${dbDriver} ${dbVersion} as database`);
}
