const Router = require('express');
const router = new Router;
const userRouter = require('./userRoute')
const productRouter = require('./productRoute')
const orderRouter = require('./orderRoute')



router.use('/user', userRouter)
router.use('/product', productRouter)
router.use('/order', orderRouter)

module.exports = router;