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
            allowNull: false
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
        //     type: type.STRING,
        //     allowNull: true
        // },

    });

    Bill.associate = function (models) {
        Bill.hasOne(models.Metadata, { foreignKey: 'bill_id', as:'bill_id' });
    };
    return Bill;
    
};