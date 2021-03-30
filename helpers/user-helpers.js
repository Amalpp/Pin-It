var db = require('../config/connection')
var collection = require('../config/collection')
var objectId = require('mongodb').ObjectID;
const bcrypt = require('bcrypt');
const { USER_COLLECTION } = require('../config/collection');
const { response } = require('../app');
const { ObjectID } = require('bson');
const Razorpay=require('razorpay')
const moment = require('moment')

var instance = new Razorpay({
    key_id: 'rzp_test_0vH5oqVbjyHRrQ',
    key_secret: 'z30ZtbK3XkwsRALruU8dY7ja',
  });


  const paypal = require('paypal-rest-sdk');
const { profile } = require('console');
  paypal.configure({
      'mode': 'sandbox', //sandbox or live
      'client_id': 'AX9fyik-uWHl25xJrAtL98FJcIlvP_z1xBOXOg-AQvHxxdkBDuMLxPD3DGNbWGoyZxdS9yXSGvGXozx8',
      'client_secret': 'ELw5oaGz6UIBAZVUdlsruVU3hOuMCv4IjgPBuSinsy4Ib4yJ-lVo8FswIBc0OBrwUBqJZMTlcWEU4ysX'
  });



module.exports = {
    dosignup: (userData) => {
        console.log("fdfefwf");
        return new Promise(async (resolve, reject) => {
            console.log(userData);
            userData.password = await bcrypt.hash(userData.password, 10)
            let response={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
            console.log("hdkfjslsda",user);
            if(user){
                reject(user)
                 console.log("kerunnilla");
            }else{
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                    console.log(data)
                    console.log("ettthhhiii");
                    resolve(data.ops[0])
                })
            }
        })
    },
        
    doLogin: (userData) => {
        console.log(userData);
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({email: userData.email})
            console.log("uuu",user);
            if (user) {
                
if(user.status==1){
    reject(user)
}
else{
                console.log('user',user);

                bcrypt.compare(userData.password,user.password).then((status) => {
                    if (status) {
                        console.log("login success");
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log("login incorrect failed")
                        resolve({ status: false })
                    }
                })

            }
         } else {
                console.log('login not user failed');
                resolve({ status: false })
            }
        })
        
    },
    getAllUser: () => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            
            resolve(user)
        })
    },
    
    deleteUser: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).removeOne({ _id: objectId(userId) }).then((result) => {
                resolve(result)
            })
        })
    },
    updateuser: (userId, proDetails) => {
        return new Promise((resolve, reject) => {
            
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $set: {
                    username: proDetails.username,
                    email: proDetails.email,
                    mobile: proDetails.mobile
                }
            }).then((response) => {
                resolve(response)
            })
        })
    },  
    getuserDetails: (userId) => {
        return new Promise((resolve,reject) => {
             db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) }).then((user) => {
                resolve(user)
            }).then((data) => {
            resolve(data)

         })
        })
    },
    blockuser: (userId)=>{
        console.log("lsdjf",userId);
        return new Promise(async(resolve,reject)=>{
            
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},{
                $set:{
                    status:1
                }
            }).then((data)=>{
                resolve(data)
            } )
           
        })
    
        
    },
    unblock:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},{
                $set:{
                    status:0
                }
            }).then((data)=>{
                resolve(data)
            } )
           
        })
    },
  
   

    addToCart:(proId,userId)=>{
       let proObj={
           item:objectId(proId),
           quantity:1 

       }
        return new Promise(async (resolve,reject)=>{
            let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            console.log(userCart);
            if(userCart){
                let proExist=userCart.products.findIndex(product=> product.item==proId)
                console.log(proExist);
                if(proExist!=-1){
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({user:objectId(userId),'products.item':objectId(proId)},
                    {
                         $inc:{'products.$.quantity':1}
                    }
                    ).then((response)=>{
                        resolve(response)
                    })
                }else{

               
                db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},
                {
                    
                        $push:{products:proObj }
                    
                } 
                ).then((response)=>{
                    resolve(response)
                })
            }
            }else{
                let cartObj={
                    user:objectId(userId),
                    products:[proObj]
                }
                
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve(response)
                }) 
            }
        })
    },



    
    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
           
            let cartItems =await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
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
                },{
                    $project:{
                        item:1,
                        quantity:1,
                        products:{$arrayElemAt:['$product',0]},
                        subtotal:{$multiply:[{$arrayElemAt:["$product.price",0]},"$quantity"]}
                        
                    }
                }
                
            ]).toArray()
          console.log("iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii",cartItems);
            resolve(cartItems)
        })
    },
    getCartCount:(userId)=>{
        console.log('jfdfjh');
        return new Promise(async(resolve,reject)=>{
       
            let count=0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            console.log("fkdj",cart);
            if(cart){
                console.log("nfkjdnf",cart);
                count=cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity: (details)=>{
        console.log('change value',details.product);
   let count=parseInt(details.count)
   let quantity=parseInt(details.quantity)
        return new Promise ((resolve,reject)=>{
            console.log("if munp");
            if(count==-1 && quantity ==1){
                console.log('qeam');
                db.get().collection(collection.CART_COLLECTION )
                .updateOne({_id:objectId(details.cart)},
                {
                    $pull:{products:{item:objectId(details.product)}}
                }
                ).then((response)=>{
                    resolve({removeProduct:true})
                })

            }else{
               
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
                {
                    $inc:{'products.$.quantity':count}
                }
                ).then((response)=>{
                    resolve(true) 
                })
            }
            
            
        })
    },
    deleteCartProduct: (details) => {
        console.log('hiiii',details);
        return new Promise((resolve, reject) => {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              {
                _id: objectId(details.cart),
              },
              {
                $pull: { products: { item: objectId(details.product) } },
              }
            )
            .then((response) => {
              resolve({ removeProduct: true });
            });
        });
      },

  getTotalAmount: (userId) => {
    console.log("hiii userid",userId)
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) }
          },
          {
            $unwind: "$products"
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity"
            }
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product"
            }
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              products: { $arrayElemAt: ["$product", 0] }
            }
          },

          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$quantity", "$products.price"] } }
            }
          }
        ])
        .toArray();
        console.log('**--**',total[0].total);
      resolve(total[0].total)
    });
  },
  subTotalAmount: (userId,proId) => {
    console.log("subtotal",userId)
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) }
          },
          {
            $unwind: "$products"
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity"
            }
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product"
            }
          },
        
          {
            $match:{item:objectId(proId)}
          },
  
          {
            $project: {
              _id: null,
              total:  { $multiply:[{$arrayElemAt:["$products.price",0]},"$quantity"] }
            }
          }
        ])
        .toArray();
        
      resolve(total[0].total)
    });
  },
  




  addAddress: (details) => {

    return new Promise((resolve, reject) => {
        db.get().collection(collection.ADRESS_COLLECTION).insertOne({ details })
        .then((data) => {
     
          resolve(data.ops[0]._id);
        });
    });
  },





  getAllAddress: () => {
    return new Promise(async (resolve, reject) => {
      let address = await db.get().collection(collection.ADRESS_COLLECTION).find().toArray();
  
      resolve(address);
    });
  },
  placeOrder:(order,products,total)=>{
    return new Promise((resolve,reject)=>{
        console.log('order',order,products,total);
        let status=order['payment-method']==='COD'?'placed':'pending'
        let currentDate=moment(new Date()).format("DD/MM/YYYY")
        console.log("current Date",currentDate);
        let orderobj={
            deliveryDetails:{
                mobile:order.mobile,
                address:order.address,
                pincode:order.pincode

            },
            userId:objectId(order.userId),
            paymentMethod:order['payment-method'],
            products:products,
            totalAmount:total,
            status:status,
            date:currentDate
        }
        db.get().collection(collection.ORDER_COLLECTION).insertOne(orderobj).then((response)=>{
            db.get().collection(collection.CART_COLLECTION).removeOne({user:objectId(order.userId)})
            resolve(response.ops[0]._id)
        })

    })

},
getCartProductList:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
        resolve(cart.products)
    })
},
getUserOrders:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let orders=await db.get().collection(collection.ORDER_COLLECTION).find({userId:objectId(userId)}).toArray()
        console.log("orderssssssss",orders);
        resolve(orders)
    })
},
getOrderProducts:(orderId)=>{
    return new Promise(async(resolve,reject)=>{
        let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
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
        console.log(orderItems);
        resolve(orderItems)
    })
},
generateRazorpay:(orderId,total)=>{
    return new Promise((resolve,reject)=>{
        var options = {
            amount: total,  // amount in the smallest currency unit
            currency: "INR",
            receipt: ""+orderId
          };
          instance.orders.create(options, function(err, order) {
            console.log("order",order);
            resolve(order)
          });
        
    })
},
verifyPayment:(details)=>{
    return new Promise((resolve,reject)=>{
        const crypto=require('crypto');
        let hmac=crypto.createHmac('sha256','z30ZtbK3XkwsRALruU8dY7ja');
        hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
        hmac=hmac.digest('hex')
        if(hmac==details['payment[razorpay_signature]']){
            resolve()
        }else{
            reject()
        }
    })
},
changePaymentStatus:(orderId)=>{
    return new Promise((resolve, reject)=>{
        db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},

        {
            $set:{
                status:'placed'
            }
        }
        
        ).then(()=>{
            resolve()
        })
      
    })
},
generatePaypal: (orderId, total) => {
    return new Promise((resolve, reject) => {

        const create_payment_json = {

            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": ""
            },
            "transactions": [{
                "item_list": {
                    "items": [{
                        "name": "name",
                        "sku": "sku",
                        "price": total,
                        "currency": "INR",

                    }]

                },
                "amount": {
                    "currency": "INR",
                    "total": total
                },

            }]

        };
        
        paypal.payment.create(create_payment_json, function (error, payment) {


            if (error) {
                throw error;
            }
            else {
                for (let i = 0; i < payment.links.length; i++) {
                    if (payment.links[i].rel === 'approval_url') {
                        res.redirect(payment.links[i].href);
                    }
                }
            }
        })

    })



},
OtpRequest: (phone) => {
    console.log("otpreq kerii");
    return new Promise(async (resolve, reject) => {


        let user = await db.get().collection(collection.USER_COLLECTION).findOne({ mobile: phone })
        if (user) {
            console.log("user indon nkki",user)
            let stat = user.status
            if (!stat) {
                console.log(user.mobile);
                resolve(user.mobile)
            }
            else {
                reject()    
            }

        }
        else {
            reject()
        }



    })
},
getuserOtp: (phone) => {
    return new Promise(async (resolve, reject) => {
        console.log("get otp kerii");
        let user = await db.get().collection(collection.USER_COLLECTION).findOne({ mobile: phone })
        if (user) {
            console.log(("ingane oru user ind",user));
            resolve(user)
        }
    })
},
getProfile:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        console.log("user",userId)
    let profile=await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)}).then((response)=>{
        resolve(response)

    })
        
    })
}



};



   
