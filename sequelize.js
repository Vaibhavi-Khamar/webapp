const Sequelize = require('sequelize')
const UserModel = require('./models/user')
const BillModel = require('./models/bill')
const FileModel = require('./models/file')
const MetadataModel = require('./models/metadata')
const { DATABASE_NAME, USERNAME, PASSWORD, HOST, DIALECT } = require('./constants')

const sequelize = new Sequelize(DATABASE_NAME, USERNAME, PASSWORD, {
  host: HOST,
  dialect: DIALECT,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
})

const User = UserModel(sequelize, Sequelize)
const Bill = BillModel(sequelize, Sequelize)
const File = FileModel(sequelize, Sequelize)
const Metadata = MetadataModel(sequelize, Sequelize)

sequelize.sync({ force: false })
  .then(() => {
    console.log(`Database & tables created here!`)
  }).catch(function (err) {
    console.log(err)
  });

module.exports = {
  User,
  Bill,
  File,
  Metadata
}