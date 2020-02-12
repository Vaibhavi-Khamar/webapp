module.exports = (sequelize, type) => {
    const Bill = sequelize.define('Bill', {
        id: {
            type: type.STRING,
            primaryKey: true,
            allowNull: false
        },
        vendor: {
            type: type.STRING,
            allowNull: false
        },
        owner_id: {
            type: type.STRING,
            references: { model: 'users', key: 'id', as: 'owner_id' },
        },
        categories: {
            type: type.JSON,
            allowNull: false
        },
        bill_date: {
            type: type.DATE,
            allowNull: false
        },
        due_date: {
            type: type.DATE,
            allowNull: false
        },
        amount_due: {
            type: type.DOUBLE,
            allowNull: false
        },
        payment_status: {
            type: type.ENUM,
            values: ['paid', 'due', 'past_due', 'no_payment_required'],
            allowNull: false
        },
        // attachment: {
        //     file_id:{type:type.STRING,references: { model: 'files', key: 'id', as: 'file_id' },},
        //     file_name:{type: type.STRING,},
        //     url:{type: type.STRING},
        //     upload_date:{type: type.DATE,},
        // },

    });

    Bill.associate = function (models) {
        Bill.belongsTo(models.User, { foreignKey: 'owner_id', onDelete: "CASCADE" });
        Bill.hasOne(models.File, { foreignKey: 'id', as: 'file_id' });
        //Bill.hasOne(models.Metadata, { foreignKey: '_id' })
        // Bill.hasOne(models.Metadata, { foreignKey: 'bill_id', as: 'metadata' })
    };
    return Bill;
};