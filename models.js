const sequelize = require('./db');
const {DataTypes} = require('sequelize')

const user = sequelize.define('user',{
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    chat_id: {type: DataTypes.INTEGER, unique: true},
    name:{type: DataTypes.STRING},
    email: {type: DataTypes.STRING, unique: true},
    username:{type: DataTypes.STRING},
    role: { type: DataTypes.STRING}
})

const order = sequelize.define('order',{
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING},
    status:{type: DataTypes.STRING, default:"Не оплачено"},
    phone:{type: DataTypes.INTEGER},
    problem:{type: DataTypes.STRING}
})

const product = sequelize.define('product',{
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name:{type: DataTypes.STRING},
    description:{type: DataTypes.STRING},
    price:{type: DataTypes.INTEGER},
    rating:{type: DataTypes.INTEGER, defaultValue: 0},
    img:{type: DataTypes.STRING, allowNull: false }
})

const post = sequelize.define('post',{
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    title:{type: DataTypes.STRING},
    description:{type: DataTypes.STRING},
    body:{type: DataTypes.STRING, allowNull: false},
    rating:{type: DataTypes.INTEGER, defaultValue: 0},
    img:{type: DataTypes.STRING, allowNull: false }
})

const coment = sequelize.define('post',{
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    description:{type: DataTypes.STRING},
    rating:{type: DataTypes.INTEGER, defaultValue: 0}
})


user.hasMany(order)
order.belongsTo(user)

product.hasMany(post)
post.belongsTo(product)

order.hasMany(coment)
coment.belongsTo(order)

module.exports = {
    user,
    order,
    product,
    post,
    coment
}