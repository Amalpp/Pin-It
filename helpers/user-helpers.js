var db = require('../config/connection')
var collection = require('../config/collection')
var objectId = require('mongodb').ObjectID;
const bcrypt = require('bcrypt');
const { USER_COLLECTION, COUPON_COLLECTION, PRODUCT_COLLECTION } = require('../config/collection');
const { response } = require('../app');
const { ObjectID } = require('bson');
const Razorpay = require('razorpay')
const moment = require('moment')

var instance = new Razorpay({
    key_id: 'rzp_test_0vH5oqVbjyHRrQ',
    key_secret: 'z30ZtbK3XkwsRALruU8dY7ja',
});


const paypal = require('paypal-rest-sdk');
const { profile } = require('console');
const { resolve } = require('path');
paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AX9fyik-uWHl25xJrAtL98FJcIlvP_z1xBOXOg-AQvHxxdkBDuMLxPD3DGNbWGoyZxdS9yXSGvGXozx8',
    'client_secret': 'ELw5oaGz6UIBAZVUdlsruVU3hOuMCv4IjgPBuSinsy4Ib4yJ-lVo8FswIBc0OBrwUBqJZMTlcWEU4ysX'
});



module.exports = {
    dosignup: (userData) => {

        return new Promise(async (resolve, reject) => {

            userData.password = await bcrypt.hash(userData.password, 10)
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })

            if (user) {
                reject(user)

            } else {
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                    
                    resolve(data.ops[0])
                })
            }
        })
    },

    doLogin: (userData) => {

        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })

            if (user) {

                if (user.status == 1) {
                    reject(user)
                }
                else {


                    bcrypt.compare(userData.password, user.password).then((status) => {
                        if (status) {

                            response.user = user
                            response.status = true
                            resolve(response)
                        } else {

                            resolve({ status: false })
                        }
                    })

                }
            } else {

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
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) }).then((user) => {
                resolve(user)
            }).then((data) => {
                resolve(data)

            })
        })
    },
    blockuser: (userId) => {

        return new Promise(async (resolve, reject) => {

            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $set: {
                    status: 1
                }
            }).then((data) => {
                resolve(data)
            })

        })


    },
    unblock: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $set: {
                    status: 0
                }
            }).then((data) => {
                resolve(data)
            })

        })
    },



    addToCart: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1

        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })

            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)

                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }
                        ).then((response) => {
                            resolve(response)
                        })
                } else {


                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) },
                        {

                            $push: { products: proObj }

                        }
                    ).then((response) => {
                        resolve(response)
                    })
                }
            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }

                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve(response)
                })
            }
        })
    },




    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {

            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $project: {
                        item: 1,
                        quantity: 1,
                        products: { $arrayElemAt: ['$product', 0] },
                        subtotal: { $multiply: [{ $arrayElemAt: ["$product.price", 0] }, "$quantity"] }

                    }
                }

            ]).toArray()

            resolve(cartItems)
        })
    },
    getCartCount: (userId) => {

        console.log("the user is ", userId);
        return new Promise(async (resolve, reject) => {

            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })

            if (cart) {
                console.log("the caart os ", cart);

                count = cart.products.length
                console.log("cart length is ", cart.products);
            }
            else {
                console.log("cartilla");
            }
            resolve(count)
        })
    },
    changeProductQuantity: (details) => {

        let count = parseInt(details.count)
        let quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {

            if (count == -1 && quantity == 1) {

                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart) },
                        {
                            $pull: { products: { item: objectId(details.product) } }
                        }
                    ).then((response) => {
                        resolve({ removeProduct: true })
                    })

            } else {

                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': count }
                        }
                    ).then((response) => {
                        resolve(true)
                    })
            }


        })
    },
    deleteCartProduct: (details) => {

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

    getTotalAmount: (userId, coupon) => {

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

            resolve(total[0].total)
        });
    },
    subTotalAmount: (userId, proId) => {

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
                        $match: { item: objectId(proId) }
                    },

                    {
                        $project: {
                            _id: null,
                            total: { $multiply: [{ $arrayElemAt: ["$products.price", 0] }, "$quantity"] }
                        }
                    }
                ])
                .toArray();

            resolve(total[0].total)
        });
    },





    addAddress: (details,user) => {
        console.log("user",user);

        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADRESS_COLLECTION).insertOne({ details })
                .then((data) => {

                    resolve(data.ops[0]._id);
                });
        });
    },





    getAllAddress: (id) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.ADRESS_COLLECTION).find().toArray();

            resolve(address);
        });
    },
    placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {

            let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
            let currentDate = moment(new Date()).format("DD/MM/YYYY")

            let orderobj = {
                deliveryDetails: {
                    mobile: order.mobile,
                    address: order.address,
                    pincode: order.pincode

                },
                userId: objectId(order.userId),
                paymentMethod: order['payment-method'],
                products: products,
                totalAmount: total,
                status: status,
                date: currentDate
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderobj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).removeOne({ user: objectId(order.userId) })
                resolve(response.ops[0]._id)
            })

        })

    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            resolve(cart.products)
        })
    },
    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: objectId(userId) }).toArray()

            resolve(orders)
        })
    },
    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $unwind: '$products'

                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }

                }
            ]).toArray()

            resolve(orderItems)
        })
    },
    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: "" + orderId
            };
            instance.orders.create(options, function (err, order) {

                resolve(order)
            });

        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'z30ZtbK3XkwsRALruU8dY7ja');
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },

                {
                    $set: {
                        status: 'placed'
                    }
                }

            ).then(() => {
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

        return new Promise(async (resolve, reject) => {


            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ mobile: phone })
            if (user) {

                let stat = user.status
                if (!stat) {

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

            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ mobile: phone })
            if (user) {

                resolve(user)
            }
        })
    },
    getProfile: (userId) => {
        return new Promise(async (resolve, reject) => {

            let profile = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) }).then((response) => {
                resolve(response)

            })

        })
    },

    verifyCoupon: (coupon, user) => {


        return new Promise(async (resolve, reject) => {

            let response = {}
            let couponfound = await db.get().collection(collection.COUPON_COLLECTION).findOne({ coupon: coupon })
            if (couponfound) {

                if (couponfound.status) {
                    response.status = 0
                    db.get().collection(collection.COUPON_COLLECTION).updateOne({ coupon: coupon }, {
                        $set: {

                            status: false
                        }
                    })
                    db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectID(user) }, {
                        $unset: {
                            coupon: 1
                        }
                    })

                    response.offer = parseInt(couponfound.offer)
                    resolve(response)
                }
                else {
                    response.status = 2
                    resolve(response)

                }

            }
            else {
                response.status = 1
                resolve(response)
            }

        })
    },
    getCoupons: (userId) => {


        return new Promise(async (resolve, reject) => {

            let res = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectID(userId) })
            resolve(res)

        })

    },
    searchProduct: (search) => {

        db.get().collection(collection.PRODUCT_COLLECTION).find({ $or: [{ name: search }, { category: search }] })
    },



    getCasualCollection: () => {
        return new Promise(async (resolve, reject) => {

            let casual = await db.get().collection(collection.PRODUCT_COLLECTION).find({
                category: 'Casual Shoes'
            }).toArray()

            resolve(casual)
        })
    },



    getSportsCollection: () => {
        return new Promise(async (resolve, reject) => {

            let sports = await db.get().collection(collection.PRODUCT_COLLECTION).find({
                category: 'Sports Shoes'
            }).toArray()

            resolve(sports)
        })
    },


    getFormalCollection: () => {
        return new Promise(async (resolve, reject) => {

            let formal = await db.get().collection(collection.PRODUCT_COLLECTION).find({
                category: 'Formal Shoes'
            }).toArray()

            resolve(formal)
        })
    },
    getSneakersCollection: () => {
        return new Promise(async (resolve, reject) => {

            let sneakers = await db.get().collection(collection.PRODUCT_COLLECTION).find({
                category: 'Sneakers'
            }).toArray()

            resolve(sneakers)
        })
    },
    getSandalsCollection: () => {
        return new Promise(async (resolve, reject) => {

            let sadals = await db.get().collection(collection.PRODUCT_COLLECTION).find({
                category: 'Sandals & floaters'
            }).toArray()

            resolve(sadals)
        })
    },
    getFipFlopCollection: () => {
        return new Promise(async (resolve, reject) => {

            let flip = await db.get().collection(collection.PRODUCT_COLLECTION).find({
                category: 'Flip Flops'
            }).toArray()

            resolve(flip)
        })
    },
    searchProduct: (keyword) => {
        console.log("log kerriiiiii");

        return new Promise((resolve, reject) => {
            let result = db.get().collection(collection.PRODUCT_COLLECTION).find({ productname: { $regex: keyword, $options: '$i' } }).toArray()
            if (result[0]) {

                resolve(result)
                console.log("from11",result);
            }
            else {
                result = db.get().collection(collection.PRODUCT_COLLECTION).find({ category: { $regex: keyword, $options: '$i' } }).toArray().then((result) => {

                    if (result[0]) {
                        resolve(result)
                        console.log("frim222");
                    }

                    else {
                        result = db.get().collection(collection.PRODUCT_COLLECTION).find({ discription: { $regex: keyword, $options: "$i" } }).toArray().then((result) => {

                            if (result[0]) {
                                resolve(result)
                                console.log("frm 3");
                            }
                            else {
                                reject(result);
                                console.log("rjct");
                            }
                        })

                    }


                })
            }


        })
    },


    editaddress: (proId, data) => {
        let Number=parseInt(data.number)
        return new Promise((resolve, reject) => {
          db.get()
            .collection(collection.ADRESS_COLLCTION)
            .updateOne(
              { _id: objectId(proId) },
              {
                $set: {details:{
                  firstname: data.firstname,
                  email: data.email,
                  number: data.number,
                  address:data.address,
                  city:data.city,
                  state:data.state,
                  pincode:data.pincode
                }
                },
              }
            )
            .then((response) => {
      
              resolve();
            });
        });
      },
      
      
      
      getoneaddress:(Proid)=>{
        return new Promise(async(resolve,reject)=>{
         let address=await db.get().collection(collection.ADRESS_COLLECTION).findOne({_id:objectId(Proid)})
         resolve(address)
        })
      
      },
      
      
      
      changePassword: (data, userId) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
            if (user) {
                console.log(data.CurrentPassword);
                console.log(user.password);
                bcrypt.compare(data.CurrentPassword, user.password).then(async(status) => {
                    if (status) {
                        console.log("Psd Match");
                        data.NewPassword = await bcrypt.hash(data.NewPassword, 10)
                        db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                            $set: {
                                password: data.NewPassword
                            }
                        }).then((response) => {
                            response.success = true
                            resolve(response)
                        })
      
                    }
                    else {
                        response.failure = true
                        resolve(response)
                    }
      
                })
            }
        })
      },
      
      userDetailes:(userId)=>{
          return new Promise(async(resolve,reject)=>{
              user=await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)}).then((user)=>{
                  resolve(user)
              })
          })
      }




};




