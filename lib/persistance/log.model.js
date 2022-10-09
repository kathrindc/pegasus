import Sequelize from 'sequelize';
import database from './database.def.js';

const Logs = database.define('logs', {
    userId: {
        field: 'user_id',
        type: Sequelize.STRING,
    },
    interactionId: {
        field: 'interaction_id',
        type: Sequelize.STRING,
    },
    commandName: {
        field: 'command_name',
        type: Sequelize.STRING
    },
    success: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
    },
    matched: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
    },
});

export default Logs;
