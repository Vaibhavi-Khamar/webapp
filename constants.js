// const DATABASE_NAME = 'clouddb';
// const USERNAME = 'root';
// const PASSWORD = 'root';
// const HOST = 'localhost';

const DATABASE_NAME = process.env.RDS_DBNAME;
const USERNAME = process.env.RDS_USERNAME;
const PASSWORD = process.env.RDS_PASSWORD;
const HOST = process.env.RDSHOST_NAME;

const DIALECT = 'mysql';
module.exports = {
    DATABASE_NAME: DATABASE_NAME,
    USERNAME: USERNAME,
    PASSWORD: PASSWORD,
    HOST: HOST,
    DIALECT: DIALECT
}