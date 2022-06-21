const {order} = require("../models");
const path = require('path');

const ApiError = require('../error/ApiError');



class OrderController {
    async create(req, res, next) {
        try {
            if (req.body == undefined||0){
                return message("Заповніть поля")
            }
            let {name,phone,problem} = req.body;
            const result = await order.create({name,phone,problem});
            return res.json(result)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }

    }

    async getAll(req, res) {
        try {
       
           const orders = await order.findAll()
        
        
        return res.json(orders)
    } catch (e) {
        (ApiError.badRequest(e.message))
    }

    }

    async getOne(req, res) {
        const {id} = req.params
        const result = await order.findOne(
            {
                where: {id},
            },
        )
        return res.json(result)
    }
}

module.exports = new OrderController()