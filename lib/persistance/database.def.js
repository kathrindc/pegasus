import { Sequelize } from 'sequelize';

const path = process.env.SQLITE_PATH || 'database.sqlite';
const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: path,
});

export default sequelize;