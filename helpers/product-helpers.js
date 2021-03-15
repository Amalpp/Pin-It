var db = require('../config/connection')
var collection = require('../config/collection')
var objectId=require('mongodb').ObjectID;
const { CATEGORY_COLLECTION } = require('../config/collection');



module.exports={
    addProduct:(product,callback)=>{
        console.log(product)
        db.get().collection('product').insertOne(product).then((data)=>{
    
            callback (data.ops[0]._id)
        })
    },
    getAllProduct:()=>{
        return new Promise(async(resolve,reject)=>{
            let products= await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
            console.log(products);
        })
    },
    deleteProduct:(prodId)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({ _id: objectId(prodId) }).then((result) => {
                resolve(result)
        })
    })
},
    updateProduct: (prodId, prodDetails) => {
    return new Promise((resolve, reject) => {
        
        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(prodId) }, {
            $set: {
                productname  : prodDetails.username,
                size: prodDetails.size,
                category: prodDetails.category,  
                price :prodDetails.price,
                discription:prodDetails.discription,
            }
        }).then((response) => {
            resolve(response)
        })
    })
}, 
    getprodDetails: (prodId) => {
    return new Promise((resolve,reject) => {
         db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(prodId) }).then((products) => {
            resolve(products)
        })
    })
},
singleProduct:(prodId)=>{
    return new Promise(async(resolve,reject)=>{
       let product=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id: objectId(prodId)}).then((data)=>{
        resolve(data)
        })
    })
},


addCategory: (category) => {

    return new Promise(async (resolve, reject) => {
        await db.get().collection(CATEGORY_COLLECTION).insertOne(category).then((data) => {

            resolve(data)


        })
    })
},
getAllCategory: () => {
    return new Promise(async (resolve, reject) => {
        console.log('amal');

        let category = await db.get().collection(CATEGORY_COLLECTION).find().toArray()

        if (category) {
            resolve(category)
        }
        else {
            reject()
        }
    })
},



};




