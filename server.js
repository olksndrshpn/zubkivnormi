require('./bot')
require("dotenv").config()
const fileUpload = require('express-fileupload')
const serverless = require('serverless-http')
const cors = require("cors");
const express = require("express");
const sequelize = require('./db');
const router = require('./routes/index')
const errorHandler = require('./middleware/ErrorHandlingMiddleware')
const path = require('path')
const app = express(); 
const bodyParser = require('body-parser');
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());
app.use(express.json())
app.use(express.static(path.resolve(__dirname, 'static')))
app.use(fileUpload({}))
app.use('/api', router)
app.use(errorHandler)
const runApp = async () => {
    try {
          await sequelize.authenticate() 
          console.log('Локальна база запущена')
  await sequelize.sync()
                  app.listen(process.env.PORT, () => {
            console.log(`Сервер запущено на  ${process.env.PORT}`);
        })
   
    } catch(err) {
        console.log(err);

        
    }
};
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});
app.get('/products', function(req, res) {
    res.sendFile(path.join(__dirname, './static/portfolio.html'));
  });
  app.get('/about', function(req, res) {
    res.sendFile(path.join(__dirname, './static/about.html'));
  });

  module.exports.handler = serverless(app)

runApp();
