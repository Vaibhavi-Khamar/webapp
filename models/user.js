module.exports = (sequelize, type) => {
    var User = sequelize.define('User', {
        id: {
            type: type.STRING,
            primaryKey: true
        },
        first_name: {
            type: type.STRING,
            allowNull: false
        },
        last_name: {
            type: type.STRING,
            allowNull: false
        },
        password: {
            type: type.STRING,
            allowNull: false,
            len: [8, 20]
        },
        email_address: {
            type: type.STRING,
            allowNull: false
        },
    });

    User.associate = function (models) {
        //User.hasMany(models.Bill, { foreignKey: 'owner_id', as: 'bills' });
        User.hasMany(models.Bill, { foreignKey: 'owner_id', as: 'owner_id' });
    };
    return User;
}