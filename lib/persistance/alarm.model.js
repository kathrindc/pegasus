import Sequelize from 'sequelize';
import database from './database.def.js';

const Alarms = database.define('alarms', {
    time: Sequelize.DATE,
    category: Sequelize.STRING,
    data: Sequelize.TEXT,
});

export default Alarms;
