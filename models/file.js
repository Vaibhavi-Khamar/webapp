module.exports = (sequelize, type) => {
    const File = sequelize.define('File', {
        file_name: {
            type: type.STRING,
            //allowNull: false
        },
        id: {
            type: type.STRING,
            primaryKey: true,
            allowNull: false
        },
        url: {
            type: type.STRING,
            //allowNull: false
        },
        upload_date: {
            type: type.DATE,
        }
    }, {
        timestamps: false,
    });

    File.associate = function (models) {
        File.belongsTo(models.Bill, { onDelete: "CASCADE" });
    };
    return File;
};