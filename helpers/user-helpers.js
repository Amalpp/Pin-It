var db = require('../config/connection')
var collection = require('../config/collection')
var objectId = require('mongodb').ObjectID;
const bcrypt = require('bcrypt');
const { USER_COLLECTION } = require('../config/collection');
const { response } = require('../app');
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
    }

};



   
