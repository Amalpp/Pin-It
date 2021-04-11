var express = require('express');
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
var router = express.Router();


var otp = require('../config/otp-secrets')
const twilio = require('twilio')(otp.accountSID, otp.authToken)

const verifyuser = (req, res, next) => {
  let user = req.session.loggedIn
  if (user) {
    next()
  } else {
    res.redirect('/login')
  }
}





/* GET home page. */
router.get('/', async function (req, res, next) {
  let ses = req.session.loggedIn
  let cartCount = null
  let userfound = req.session.user
   console.log('pres',userfound);
  if (ses) {
    console.log("icivdik");
    cartCount = await userHelpers.getCartCount(userfound._id)
  }
  else {
    console.log("in e;se");
  }
  productHelpers.getAllProduct().then((products) => {
    userHelpers.getCasualCollection().then((casual) => {
      userHelpers.getSneakersCollection().then((sneakers) => {
        userHelpers.getFormalCollection().then((formal) => {
          userHelpers.getSandalsCollection().then((sandals) => {
            userHelpers.getFipFlopCollection().then((flip) => {
              userHelpers.getSportsCollection().then((sports) => {

                if (ses) {

                  console.log("csartjkjdggfgfl", cartCount);

                  res.render('user/index', { user: true, ses, products, cartCount, casual, sneakers, formal, sandals, flip, sports })

                }
                else {
                  res.render("user/index", { user: true, products, casual, sneakers, formal, sandals, flip, sports })
                }
              })
            })
          })
        })
      })
    })
  })


});

router.get('/product-details/:id', verifyuser, async (req, res) => {
  let prodId = req.params.id

  let cartCount = await userHelpers.getCartCount(req.session.user._Id)
  let data = productHelpers.singleProduct(prodId).then((product) => {
    let ses = req.session.user
    if (ses)
      res.render('user/product-details', { user: true, ses, product, cartCount })
  })

})





// loginpage
router.get('/login', function (req, res, next) {

  let ses = req.session.loggedIn
  console.log('ses',ses);
  if (ses) {

    res.redirect('/')
  }
  else {

    res.render('user/user-login', { "logginErr": req.session.logginErr })
    req.session.logginErr = false
  }

})
router.post('/login', function (req, res, next) {
  userHelpers.doLogin(req.body).then((response) => {
    console.log("hii",response);
    if (response.status) {

      req.session.user = response.user
      req.session.loggedIn = true;

      res.redirect('/')
    } else {
      req.session.logginErr = 'Invalid username or Password'
      res.redirect('/login')
    }
  }).catch(() => {
    let err = 1
    res.render('user/user-login', { err })
    err = 0
  })

});








router.get('/userOTPLogin', (req, res) => {

  res.render('user/userOTPLogin', { user: true, "phoneErr": req.session.phone })
  req.session.phone = false
})
router.post('/userOTPLogin', (req, res) => {

  userHelpers.OtpRequest(req.body.mobile).then((number) => {
    req.session.otpPhone = number
    twilio
      .verify
      .services(otp.serviceID)
      .verifications
      .create({
        to: `+91${number}`,
        channel: 'sms'
      }).then((data) => {
        res.render('user/userOTPSubmit', { user: true })
      })



  }).catch(() => {
    req.session.phone = "User is not Valid"
    res.redirect('/userOTPLogin')
  })

})

router.get('/userOTPSubmit', (req, res) => {

  res.render('user/userOTPSubmit', { user: true })

})
router.post('/userOTPSubmit', (req, res) => {
  twilio
    .verify
    .services(otp.serviceID)
    .verificationChecks
    .create({
      to: `+91${req.session.otpPhone}`,
      code: req.body.Otp
    }).then((data) => {

      if (data.valid) {

        userHelpers.getuserOtp(req.session.otpPhone).then((user) => {
          req.session.user = user
          req.session.loggedIn = true
          res.redirect('/')
        })
        req.session.otpPhone = null
      }
      else {

        res.redirect('/userOTPSubmit')
      }


      // req.session.otpPhone=null
    }).catch((data) => {

      res.redirect('/userOTPSubmit')
    })
})









// user signup

router.get('/user-signup', function (req, res, next) {
  let ses = req.session.loggedIn
  if (ses) {
    res.redirect('/')

  }
  else {
    res.render('user/user-login')
  }
})

router.post('/user-signup', function (req, res, next) {

console.log('in signup');
  userHelpers.dosignup(req.body).then((response) => {
    console.log('added',response);
    
    req.session.user = response
    req.session.loggedIn = true;
    res.redirect('/')

  }).catch((user) => {
    let amal = true
    res.render("user/user-login", { amal: true })

  })
})







router.get('/logout', (req, res) => {
  req.session.loggedIn = false
  res.redirect('/')
})






router.get('/cart', verifyuser, async (req, res) => {
  let products = await userHelpers.getCartProducts(req.session.user._id)
  if (products[0]) {
    var total = await userHelpers.getTotalAmount(req.session.user._id)
  }

  let ses = req.session.loggedIn
  if (ses) {

    res.render('user/cart', { products, user: req.session.user, total, ses })
  }
})






router.get('/add-to-cart/:id', verifyuser, (req, res) => {

  let response = {}
  userHelpers.addToCart(req.params.id, req.session.user._id).then(async () => {
    response.cartCount = await userHelpers.getCartCount(req.session.user._id)
    response.status = true
    res.json(response)
  })
})





router.post('/change-product-quantity', (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async (result) => {
    let response = {}
    if (result.removeProduct) {
      response.removeProduct = true
    }

    let products = await userHelpers.getCartProducts(req.session.user._id)
    if (products[0]) {
      response.cartCount = await userHelpers.getCartCount(req.body.user)
      response.total = await userHelpers.getTotalAmount(req.body.user)
    }
    res.json(response)
  })
})







router.get('/place-order', verifyuser, async (req, res) => {
  var total = await userHelpers.getTotalAmount(req.session.user._id)
  let address = await userHelpers.getAllAddress(req.session.user._id)

  let ses = req.session.loggedIn
  if (ses) {
    console.log("hiiiiiiiiiiiiiiiiiiiiiiii", ses);
    res.render('user/place-order', { ses, total, address, user: req.session.user, })
  }
})








router.post('/place-order', async (req, res) => {
  let products = await userHelpers.getCartProductList(req.body.userId)
  let totalPrice = req.body.total
  userHelpers.placeOrder(req.body, products, totalPrice).then((orderId) => {
    if (req.body['payment-method'] === 'COD') {
      res.json({ codSuccess: true })
    }
    else if (req.body['payment-method'] === 'paypal') {

      res.json({ paypal: true, total: totalPrice })


    }
    else {
      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        res.json(response)
      })
    }

  })






})
router.get("/adress", verifyuser, async (req, res) => {
  let ses = req.session.loggedIn
  if (ses) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  res.render("user/add-adress", { ses, cartCount })
})






router.post("/adress", verifyuser, (req, res) => {
console.log('hhhhh',req.body)
let user=req.session.user._id
console.log('hhhhssssssssssssssssssssh',user);
  userHelpers.addAddress(req.body,user).then((details) => {
   
console.log("ggg",details);
    res.redirect("/place-order")

  })

});





router.get('/order-success', verifyuser, (req, res) => {
  let ses = req.session.loggedIn
  if (ses) {
    res.render('user/order-success', { user: req.session.user, ses })
  }
});





router.get('/orders', verifyuser, async (req, res) => {
  let ses = req.session.loggedIn
  if (ses) {
    let id = req.session.user._id

    let orders = await userHelpers.getUserOrders(id)

    res.render('user/orders', { user: req.session.user, orders, ses })
  }
})






// router.get('/view-order-products/:id', async (req, res) => {

//   let products = await userHelpers.getOrderProducts(req.params.id)

//   res.render('user/view-order-products', { user: req.session.user, products })

// })






router.post('/verify-payment', verifyuser, (req, res) => {

  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {

      res.json({ status: true })
    })
  }).catch((err) => {
    res.json({ status: false, errMsg: "payment Failed" })
  })
})










router.post("/deleteCartProduct/", (req, res) => {

  userHelpers.deleteCartProduct(req.body).then((response) => {
    res.json(response)
  })
})





router.get("/user-profile", verifyuser, async (req, res) => {
  let ses = req.session.loggedIn
  if (ses) {
    let id = req.session.user._id
    profile = await userHelpers.getProfile(id)
    res.render("user/user-profile", { user: req.session.user, ses, profile })
  }
})



router.get("/edit-profile",(req,res)=>{
  let ses=req.session.loggedIn
  if(ses){

   let user= userHelpers.userDetailes(req.session.user._id).then(async(user)=>{
     let id=req.session.user._id

     let address= await userHelpers.getAllAddress(id).then((address)=>{
       console.log("ddddddddddd",address);
      res.render("user/edit-profile",{ses,user,address})
     })
   
   })
    
  }

})








router.post('/verifyCoupon', (req, res) => {


  let coupon = req.body.couponis
  let user = req.session.user._id

  userHelpers.verifyCoupon(coupon, user).then((response) => {

    res.json(response)

  })
})








router.post("/appy-coupon", async (req, res) => {
  let userId = req.session.user._id


  let coupon = userHelpers.checkValidCoupon(req.body)

  if (coupon) {
    let discount = coupon.discount

    let totalPrice = await userHelpers.getTotalAmount(req.body.userId, discount)
  }


})





router.get('/casual', verifyuser, (req, res) => {
  let ses = req.session.loggedIn
  if (ses) {
    userHelpers.getCasualCollection().then((casual) => {


      res.render('user/casual-collection', {
        ses,
        casual

      })
    })
  }

})





router.get('/sports', verifyuser, (req, res) => {
  let ses = req.session.loggedIn
  if (ses) {
    userHelpers.getSportsCollection().then((sports) => {


      res.render('user/sports-collection', { sports, ses })
    })
  }
})




router.get('/formal', verifyuser, (req, res) => {
  let ses = req.session.loggedIn
  if (ses) {
    userHelpers.getFormalCollection().then((formal) => {


      res.render('user/formal-collection', { formal, ses })
    })
  }
})




router.get('/sneakers', verifyuser, (req, res) => {
  let ses = req.session.loggedIn
  if (ses) {
    userHelpers.getSneakersCollection().then((sneakers) => {


      res.render('user/sneakers-collection', { sneakers, ses })
    })
  }
})

router.get('/sandals', verifyuser, (req, res) => {
  let ses = req.session.loggedIn
  if (ses) {
    userHelpers.getSandalsCollection().then((sandals) => {


      res.render('user/sandals-collection', { sandals, ses })
    })
  }
})



router.get('/flipflop', verifyuser, (req, res) => {
  let ses = req.session.loggedIn
  if (ses) {
    userHelpers.getFipFlopCollection().then((flip) => {


      res.render('user/flipflop-collection', { flip, ses })
    })
  }
})


router.post('/search-product', (req, res) => {

  let search = req.body.search
  console.log("kk", search);

  userHelpers.searchProduct(search)

})

router.post('/search', (req, res) => {

  let keyword = req.body.search
  let userfound = req.session.loggedIn

console.log("jjjjjjjj",req.session.user);
  userHelpers.searchProduct(keyword).then((products) => {
    console.log("oooo",products);
    if (userfound) {
      res.render('user/allproducts', { products, userfound })
    }
    else {
      res.render('user/allproducts', { products })
    }
  }).catch(() => {

    if (userfound) {
      res.render('user/allproducts', { noproducts: true, userfound })
    }
    else {
      res.render('user/allproducts', { noproducts: true })
    }
  })
})



module.exports = router;
