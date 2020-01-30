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
            type: type.STRING,
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
        
        // created_ts: {
        //     type: type.DATE,
        //     allowNull: false
        // },
        // updated_ts: {
        //     type: type.DATE,
        //     allowNull: false
        // }
//         // I don't want createdAt
//   createdAt: false,
 
//   // I want updatedAt to actually be called updateTimestamp
//   updatedAt: 'updateTimestamp'

    });

    Bill.associate = function (models) {
        Bill.belongsTo(models.User, { foreignKey: 'owner_id', onDelete: "CASCADE" });
    };
    return Bill;
};