import LogService from '../utility/log.service.js';
import database from './database.def.js';
import Logs from './log.model.js';

const log = new LogService('dbinit.service.js');

export async function InitialiseDatabase() {
    let dbVersion = await database.databaseVersion();
    let dbDriver = await database.getDialect();

    await Logs.sync();

    log.debug(`Using ${dbDriver} ${dbVersion} as database`);
}
