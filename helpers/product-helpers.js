var db = require('../config/connection')
var collection = require('../config/collection')
var objectId=require('mongodb').ObjectID;
const { CATEGORY_COLLECTION } = require('../config/collection');
const { ObjectID, ObjectId } = require('bson');
var moment = require('moment');



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
                productname  : prodDetails.productname,
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
getAllorders:(orderId)=>{
    return new Promise(async(resolve,reject)=>{
        let orders=await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
        resolve(orders)
    })
},
approveOrders:(orderId,keyword)=>{
    console.log("HIII KEYY",keyword);
    return new Promise(async(resolve,reject)=>{
       await  db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectId(orderId)},{
            
            $set:{
                status:keyword
            }
        }).then((data)=>{
            resolve(data)
        })
    })
},
viewOrders:(orderId)=>{
    return new Promise(async(resolve,reject)=>{
        console.log("next",orderId);
    let prod= await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
            $match:{_id:objectId(orderId)}
        },
        {
            $unwind:'$products'

        },
        {
            $project:{
                item:'$products.item',
                quantity:'$products.quantity'
            }
        },
        {
            $lookup:{
                from:collection.PRODUCT_COLLECTION,
                localField:'item',
                foreignField:'_id',
                as:'product'
            }
        },
        {
            $project:{
                item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
            }

        }
    ]).toArray()
    console.log("this ethi",prod);
    resolve(prod)
})


   
    
},
getOrderReport: () => {

    return new Promise((resolve, reject) => {

       let orders = db.get().collection(collection.ORDER_COLLECTION).find().toArray().then((result) => {

          resolve(result)
       })

    })


 },

 ordersGraph: () => {

    return new Promise(async (resolve, reject) => {

        let graphData = await db.get().collection(collection.ORDER_COLLECTION).aggregate([{
            $match: {
                status: "shippped"
            }
        },
        {
            $project: {
                date: 1,
                _id: 0,
                totalAmount: 1
            }
        },
        {
            $group: {
                _id: { month: "$date" },
                count: { $sum: 1 },
                total: { $sum: "$totalAmount" }
            }
        },
        {
            $project: {
                _id: 1,
                total: 1
            }
        }
        ]).toArray()

        var response = {
            date: [],
            total: []
        }
        for (i = 0; i < graphData.length; i++) {
            response.date[i] = graphData[i]._id.month
            response.total[i] = graphData[i].total
        }
        resolve(response)
        console.log("ReS IS", response);

    })
},
getUserCount:()=>{
    return new Promise(async(resolve,reject)=>{
       
        let userCount=await db.get().collection(collection.USER_COLLECTION).find().count()
        console.log("count",userCount);
        resolve(userCount)
    })
},
getOrderCount:()=>{
    return new Promise(async(resolve,reject)=>{
      let  orderCount=await db.get().collection(collection.ORDER_COLLECTION).find().count()
      resolve(orderCount)
    })
},
getCancelledOrder:()=>{
    return new Promise(async(resolve,reject)=>{
        let  cancelOrder=await db.get().collection(collection.ORDER_COLLECTION).find({status:'cancel'}).count()
        resolve(cancelOrder)
      })
},
gettotalProduct:()=>{
    return new Promise(async(resolve,reject)=>{
    let  product=await db.get().collection(collection.PRODUCT_COLLECTION).find().count()
    resolve(product)
})
  
},
getConfirmOrder:()=>{
    return new Promise(async(resolve,reject)=>{
        let  shippedOrder=await db.get().collection(collection.ORDER_COLLECTION).find({status:'confirm'}).count()
        console.log("hii",shippedOrder);
        resolve(shippedOrder)
      })
},

totalRevenue: () => {

    return new Promise(async (resolve, reject) => {

       let y = await db.get().collection(collection.ORDER_COLLECTION).aggregate([{
          $group: {
             _id: null,
             totalAmount: {
                $sum: "$totalAmount"
             }
          }
       }]).toArray()

       resolve(y)

    })
 },
 getOrderByDate: (req) => {

    return new Promise(async (resolve, reject) => {

       let from = req.fromDate
       let to = req.toDate
       let dfrom = moment(from).format("DD/MM/YYYY");
       let dto = moment(to).format("DD/MM/YYYY");
     

console.log("dsdddddddddddddddddd",dfrom,dto);

       let salesReport = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
          {
             $match: {
                date: {
                   $gte: dfrom,
                   $lte: dto
                }
             }
          },
          {
             $project: {
                totalAmount: 1,
                paymentMethod: 1,
                status: 1,
                date: 1,
                _id: 1

             }
          }
       ]).toArray()
       console.log("dssssssssssssssssssssss",salesReport)
       resolve(salesReport)

    })

 },



};




