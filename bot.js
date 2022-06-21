const conf = require('./config') //
const MD5 = require("md5")
const {user} = require("./models")

const {Telegraf, Markup} = require('telegraf')
const bot = new Telegraf(conf.authToken)
const knex = require('knex')(conf.MySQL);
knex.debug(true);
const Axios = require('axios')
const bjs = require('bitcoinjs-lib');
const { response } = require('express')
const XPubGenerator = require('xpub-generator').XPubGenerator;


const TenMinutes = 10 * 60 * 1000 //Интервал с которым мы будем проверять коши на оплату
var Status = 'Sleep' //Текущее действие в админке
var checkorder = [] //Массив в котором будут храниться id чатов для проверки ордеров, дальше поймете
var Product = {
    Name: '',
    Description: '',
    Price: 0
}


bot.start(ctx => { //Собственно привественное сообщение, при старте бота
    const { id, username, first_name, last_name } = ctx.from;
   async ()=>{
       const ifuser = await user.create({username: username, name: first_name, chat_id: id})
   console.log(ifuser)}

return ctx.replyWithHTML(`Привет, ${first_name}! 
   
💊💊💊💊💊💊💊💊💊💊💊💊💊💊💊💊💊💊💊💊💊💊💊💊💊💊💊💊💊💊💊💊💊💊💊💊
ALFA-PVP от производителя!

Так же скоро розничные клады по вкусным ценам во всех городах страны!!!


Пока что только СПБ! 
Всем добра!

`, Markup.keyboard([
  ['Что у нас есть?'],['Проверить статус заказа'],
  ['Кто мы']

]))


})
bot.help( ctx => ctx.reply('/showproducs - Просмотр всех продуктов \n/checkorder - Проверить статус заказа'))

 /* Команды для покупателей*/

async function calcPrice(price){ //Эта функия будет пересчитывать $ в BTC по текущему курсу
    try{
        let response = await Axios.get(`https://web-api.coinmarketcap.com/v1/tools/price-conversion?amount=${price}&convert_id=1&id=2781`)
        return Number(response.data.data.quote['1'].price.toFixed(8))  
    } catch(err){
        return 'Error'
    }     
}

async function getBalance(address){ //Функция проверки баланса
    try{
        let response = await Axios.get(`https://chain.api.btc.com/v3/address/${address}`)        
        return {recei1ed: Number((response.data.data.received * 0.00000001).toFixed(8)), unconfirmed: Number((response.data.data.unconfirmed_received * 0.00000001).toFixed(8))}
    } catch(err){
        console.log(err)
        return {received: 'Error', unconfirmed: 'Error'}
    }
}

bot.on('callback_query', async ctx =>{//Событие которое срабатывает при нажатии на кнопку купить
    try{
        let t = ctx.update.callback_query.data.split('$') //тут мы сплитаем дату которая вложена в кнопку которую нажали
        let summa = await calcPrice(t[1]) //считаем цену
        if (summa === 'Error') throw new Error('Во время просчета цены произошла ошибка')         
        let didi = -1
        let addresses = []
        for (let addr of await knex('my_orders').select('address')) addresses.push(addr.address) //вытаскиваем из бд btc-адресса заказов       
        
        do {
            didi++
            t_address = new XPubGenerator(conf.xPub, bjs.networks.bitcoin).nthReceiving(didi)    
        } while (addresses.includes(t_address)) //По xPub генерируем адреса до тех пор пока не попадется тот которого нет в бд
        
        let Arra = {
            order_id: MD5(Date.now().toString+ctx.update.callback_query.id), //Уникальный ID заказа по которому в итоге клиент будет находить заказ
            address: t_address,
            status: 'В ожидании оплаты',            
            price: summa,                    
            product_id: t[0],
            product_data: 'Будет доступно после оплаты'        
        } 
        await knex('my_orders').insert(Arra) //Создаем ордер 
        ctx.reply(`Ваш заказ находится в обработке, в случае не оплаты в течении полутора часа, заказ будет ликвидирован. \nID заказа: ${Arra.order_id}\nРеквизиты для оплаты: ${Arra.address}\nСумма к оплате: ${Arra.price}\nВы можете проверить статус вашего заказа отправив отправив команду /checkorder`)
    } catch(err){
        console.log(err)
        ctx.reply('Произошла ошибка попробуйте позднее')
    }
})

bot.hears('Что у нас есть?', ctx =>{ //ответ на команду показать продукты
    knex.select().from('my_productsinfo')
    .then( resp =>{
        for (let product of resp){
            knex('my_products').where({product_id: product.product_id}).count({count: '*'})
            .then( resp => ctx.reply(`ID: ${product.product_id}\nName: ${product.name}\nDescription: ${product.description}\nPrice: ${product.price}$\nCount: ${resp[0].count}`,
                Markup.inlineKeyboard([Markup.button.callback('Купить', `${product.product_id}$${product.price}`)]) )) //Дата в кнопке это ID$Price продукта
            .catch( err => ctx.reply('Произошла ошибка при получении товаров'))            
        }
    })
    .catch(err => ctx.reply('Ошибка при получении списка продуктов'))
})
bot.hears('Кто мы', ctx =>{ ctx.replyWithHTML ('Наша команда опытных химиков и профессионалов своего дела!Предлагает свой высококачественный товар « Альфа -А ПВП» Кристаллы всех цветов под заказ и в наличие ( синие, красные, зелёные, белые прозрачные, а так же любой цвет и вкус ) по самым низким оптовым ценам!Отправим курьерской службой в любой город Росии! Так же доставка в ваш город от 2хкг!')
})
bot.hears('Проверить статус заказа', ctx =>{ //Переводим пользователя в режим проверки ордера
    checkorder.push(ctx.message.chat.id)
    ctx.reply('Введите ID заказа')
}) 

bot.on('text', async (ctx, next) =>{ //Это событие срабатывает на все текстовые сообщения
    if (checkorder.includes(ctx.message.chat.id)){ //Собственно если чат в режиме проверки заказа выполняется следующий код       
        const STF = await knex('my_orders').where({order_id: ctx.message.text})
        if (STF[0] == undefined){            
            ctx.reply('Ордер не найден')
        } else {                             
            ctx.reply(`ID заказа: ${STF[0].order_id}\nID продукта: ${STF[0].product_id}\nРеквизиты: ${STF[0].address}\nСумма к оплате: ${STF[0].price}\nСтатус: ${STF[0].status}\nТовар: ${STF[0].product_data}`)
        }                    
    checkorder.splice(checkorder.indexOf(ctx.message.chat.id), 1) //Удаляем из массива, соответственно статус проверки заказа убирается                           
    }
    next()
})

bot.command('/echo', ctx =>{ //Эта команда нужна что бы узнать id чата с нами, после того как укажите нужный id в конфиге можете удалять эту команду
  ctx.reply(ctx.message.chat.id)  
})

/* Команды для администратора*/

bot.use((ctx, next) =>{ //Интересная вещь, middleware, те кто юзал фреймворк Express, точно знают что это за штучка 
    if (ctx.message.chat.id === conf.adminChatId) next() // Если мы из чата администратора то едем дальше и выполнятся следующие функции
})

bot.command('/cancel', ctx =>{ 
    Status = 'Sleep' //Отменяем текущие операции
    ctx.reply('Все текущие операции были отменены')
})

bot.command('/addproduct', ctx =>{
    Status = 'AddProduct_N' //перехоим в режим добавления продукта
    ctx.reply('Укажите название товара')     
})

bot.command('/addproductdata', ctx =>{
    Status = 'AddProductData' //добавляем сами продукты
    ctx.reply('Отправьте Данные для добавления в формате ID$ProductData\nНапример 3$email:password')     
})

bot.command('/showproductdata', ctx =>{
    knex('my_products').select() //Показывает все товары которые есть на продажу
    .then( resp => ctx.reply(resp))
    .catch( err => ctx.reply('Произошла ошибка')) 
})

bot.command('/delproductdata', ctx =>{
    Status = 'DelProductData' //Переходим в режим удаления какой-то определенного продукта из таблицы my_products
    ctx.reply('Отправьте данные о продукте который хотите удалить в следующем формате ID$ProductData')         
})

bot.command('/delproduct', ctx =>{
    Status = 'DelProduct' //Удаляем продукты которые видит клиент
    ctx.reply('Отправьте ID продукта который хотите удалить')  
})

bot.on('text', ctx =>{ //Обрабатывает то что мы вводим, то что вводит админ
    switch(Status){ //То что находится в этом свиче я описал выше
        case 'DelProduct':
            Status = 'Sleep'
            knex('my_productsinfo').where({product_id: ctx.message.text}).del()
            .then( resp => ctx.reply('Товар Успешно удален'))
            .catch( _err => ctx.reply('Во время удаления произошла ошибка'))
            break
        case 'AddProduct_N':
            Status = 'AddProduct_D'
            Product.Name = ctx.message.text
            ctx.reply('Укажите описание товара') 
            break    
        case 'AddProduct_D':
            Status = 'AddProduct_P'
            Product.Description = ctx.message.text
            ctx.reply('Укажите цену товара')
            break
        case 'AddProduct_P':
            Status = 'Sleep'
            Product.Price = parseInt(ctx.message.text)
            knex('my_productsinfo').insert({name: Product.Name, description: Product.Description, price: Product.Price})
            .then( resp =>ctx.reply('Товар успешно добавлен'))
            .catch( err => ctx.reply('Произошла ошибка во время добавления товара')
            )
            break
        case 'AddProductData':
            Status = 'Sleep'
            t = ctx.message.text.split('$')
            knex('my_products').insert({product_id: t[0], product_data: t[1]})
            .then( resp => ctx.reply('Продукт успешно добавлен в БД'))                
            .catch( err => ctx.reply('Во время добавления в БД произошла ошибка')) 
               
            break           

        case 'DelProductData':
            Status = 'Sleep'
            t = ctx.message.text.split('$')
            knex('my_products').where({product_id: t[0], product_data: t[1]}).del()
            .then( resp => ctx.reply('Продукт успешно удален'))            
            .catch( err => ctx.reply('Во время удаления произошла ошибка'))
            break
    }
})


bot.launch().then( () =>{ //Собственно стартуем нашего бота
    console.log('Bot Started!') 
    
    let timerId = setInterval( async () => { //После старта запускаем таймер который будет срабатывать каждые 10 минут, для проверки ордеров и удаления лишнего     
        my_orders = await knex('my_orders').whereNot({status: 'Выполнен'}).select('address', 'status', 'price', 'product_id', 'order_data')
        for (let order of my_orders){ //Получаем заказы которые не выполнены и проходимся по каждому из заказов
            let balance = await getBalance(order.address)
            if (balance.received >= order.price){ //Если есть баланс то собственно изменяем статус, и закидываем продукт
                console.log(balance)
                let response = await knex('my_products').where({product_id: order.product_id})
                if (response != 0){
                    await knex('my_products').where({product_id: response[0].product_id, product_data: response[0].product_data}).del()
                    await knex('my_orders').where({address: order.address}).update({status: 'Выполнен', product_data: response[0].product_data})
                    await Promise.reject(new Error("Упс!"));
                }
            } else if (balance.unconfirmed  >= order.price){ //Смотрим есть ли не подтвержденные ордеры
                await knex('my_orders').where({address: order.address}).update({status: 'В ожидании подтверждений'})
            } else if (balance.received != 'Error'){ //Удаляем лишние ордеры если прошло 90 и больше минут с момента его создания
                if (order.order_data.setMinutes(order.order_data.getMinutes()+90) <= new Date ){
                    await knex('my_orders').where({address: order.address}).del()
                    await Promise.reject(new Error("Упс!"));
                }
            }     
        }        
    }, TenMinutes) 
})


process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))