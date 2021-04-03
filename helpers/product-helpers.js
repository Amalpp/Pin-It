var db = require('../config/connection')
var collection = require('../config/collection')
var objectId=require('mongodb').ObjectID;
const { CATEGORY_COLLECTION, PRODUCT_COLLECTION } = require('../config/collection');
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



getCategoryById: (categoryId) => {

    return new Promise(async (resolve, reject) => {


        await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: ObjectID(categoryId) }).then((data) => {

            resolve(data)
        })
    })
},

//category update

updateCategory: (categoryId, data) => {

    return new Promise(async (resolve, reject) => {
        await db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: ObjectID(categoryId) },
            {
                $set: {
                    category: data.category

                }
            }).then((response) => {
                resolve(response)
            })
    })
},
deleteCategory: (categoryId) => {
    return new Promise(async (resolve, reject) => {
        await db.get().collection(collection.CATEGORY_COLLECTION).removeOne({ _id: ObjectID(categoryId) }).then((response) => {
            resolve(response)
        })
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


 viewOffers: () => {
    return new Promise((resolve, reject) => {


        db.get().collection(collection.PRODUCT_COLLECTION).find({ discount: { $exists: true } }).toArray().then((products) => {
            console.log("count und" ,products);
            resolve(products)
        })
    })
},











addOfferToProduct:(prodId,data)=>{
   
     let discount=data.discount
     return new Promise(async(resolve,reject)=>{
     await  db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(prodId)}).then((product)=>{
             
             let price = product.price
             let oldPrice = product.price
             let disc = 100 - discount
             new_amount =(disc * price)/100



             db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(prodId)},{
                 $set:{
                     discount:data.discount,
                     oldPrice:oldPrice,
                     price:new_amount,
                     valid_from:data.valid_from,
                     valid_to:data.valid_to
                 }
             }).then((data) => {
                 resolve(data)
             })
         })
     })
 },







 addOfferToCategory: (category, data) => {
    return new Promise(async (resolve, reject) => {
        console.log("npppp", data);
        console.log("ccccccccc", category);
        let products = await db.get().collection(collection.CATEGORY_COLLECTION).find({ category: category }).toArray()

        console.log("$$$$$$$$$$$$$$$$$", products);
        let length = products.length
        console.log("lengthhthth", length);

        for (i = 0; i < length; i++) {
            let offer = data.discount

            let discounted_rate = products[i].price - (products[i].price * offer) / 100

            let updated = db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: ObjectID(products[i]._id) }, {
                $set: {
                    discount: offer,
                    oldPrice: products[i].price,
                    price: discounted_rate,
                    valid_from: data.valid_from,
                    valid_to: data.valid_to
                }
            }).then((data)=>{
               
                resolve(data)    
            })

        }

     
    })
},

deleteOffer: (prodId) => {

    return new Promise(async (resolve, reject) => {

        let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: ObjectID(prodId) })
        let price = product.oldPrice

        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: ObjectID(prodId) }, {
            $set: {
                price: price
            }
        })


        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: ObjectID(prodId) }, {
            $unset: {
                discount: 1,
                oldPrice: 1,
                valid_from: 1,
                valid_to: 1
            }
        })
        resolve()



    })

},


expireOffer: () => {
    return new Promise(async (resolve, reject) => {

        let allProducts = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()




        let length = allProducts.length

        for (let i = 0; i < length; i++) {
            if (allProducts[i].discount) {

                let current_date = moment(new Date()).format("MM/DD/YYYY");

                current_date = Date.parse(current_date)
                let valid_date = Date.parse(allProducts[i].valid_to)

                console.log("KAREDN<<<OLd", current_date, valid_date);
                if (current_date > valid_date) {

                    console.log("ith suucess aaayi");
                    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: ObjectID(allProducts[i]._id) }, {
                        $set: {
                            price: allProducts[i].oldPrice
                        },
                        $unset: {
                            discount: 1,
                            oldPrice: 1,
                            valid_from: 1,
                            valid_to: 1
                        }
                    })
                }
            }
        }

    })
},  
 getcoupon: () => {
    return new Promise(async (resolve, reject) => {

       db.get().collection(collection.COUPON_COLLECTION).find().toArray().then((result) => {
          resolve(result)
       })
    })
 },


 createCoupons: (offer, coupon) => {
    return new Promise(async (resolve, reject) => {
       db.get().collection(collection.COUPON_COLLECTION).insertOne({ offer: offer, coupon: coupon, status: true }).then((result) => {
          resolve(result)
       })


    })
 },
 deactivateCoupon: (couponId) => {
    return new Promise(async (resolve, reject) => {
       db.get().collection(collection.COUPON_COLLECTION ).removeOne({ _id: ObjectID(couponId) }).then((result) => {
          resolve(result)
       })
    })
 },




};




