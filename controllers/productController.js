const {product} = require("../models");
const uuid = require('uuid')
const path = require('path');
const ApiError = require('../error/ApiError');


class ProductController {
    async create(req, res, next) {
        try {
         
            let {title, category, description} = req.body
             const {img} = req.files
              let fileName = uuid.v4() + ".jpg"
           img.mv(path.resolve(__dirname, '..', 'static', fileName))
            const result = await product.create({title, category, description, img: fileName});
            return res.json(result)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }

    }

    async getAll(req, res) {
        try {
       
           const products = await product.findAll()
        
        
        return res.json(products)
    } catch (e) {
        (ApiError.badRequest(e.message))
    }

    }

    async getOne(req, res) {
        const {id} = req.params
        const result = await product.findOne(
            {
                where: {id},
            },
        )
        return res.json(result)
    }
}

module.exports = new ProductController()