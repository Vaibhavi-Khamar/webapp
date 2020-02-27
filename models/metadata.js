module.exports = (sequelize, type) => {
    const Metadata = sequelize.define('Metadata', {
        file_name: {
            type: type.STRING,
        },
        id: {
            type: type.STRING,
            primaryKey: true,
            allowNull: false
        },
        url: {
            type: type.STRING,
        },
        upload_date: {
            type: type.DATE,
        },
        size: {
            type: type.INTEGER,
        },
        bill_id: {
            type: type.STRING,
        },
    }, {
        timestamps: false,
    });

    Metadata.associate = function (models) {
        //Metadata.belongsTo(models.Bill, { foreignKey: 'bill_id', onDelete: "CASCADE" });
    };
    return Metadata;
};