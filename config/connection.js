const Sequelize = require('sequelize');

const DATABASE_URL = process.env.DATABASE_URL || 'mysql://root:fred1231@localhost:3306/tb_db';

const sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'mysql',
    dialectOptions: {
        ssl: process.env.USE_SSL ? { rejectUnauthorized: false } : null
    }
});

module.exports = sequelize;