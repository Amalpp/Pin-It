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

  if (ses) {

    cartCount = await userHelpers.getCartCount(req.session.user._Id)
  }
  productHelpers.getAllProduct().then((products) => {

    if (ses) {

      console.log('count', cartCount);

      res.render('user/index', { user: true, ses, products, cartCount })

    }
    else {
      res.render("user/index", { user: true, products })
    }

  })


});

router.get('/product-details/:id', verifyuser, async (req, res) => {
  let prodId = req.params.id
  console.log('tyiou', prodId);
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
  if (ses) {
    console.log('hiii');
    res.redirect('/')
  }
  else {

    res.render('user/user-login', { user: true })
    req.session.logginErr = false
  }

})
router.post('/login', function (req, res, next) {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true;

      req.session.user = response.user
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


// router.get("/otplogin",(req,res)=>{
//   client
//     .verify
//     .service(config.serviceID)
//     .verifications
//     .create({
//       to:"+91${req.query.phonenumber}",
//       channel:"sms"
//     }).then((data)=>{
//       res.render('user/user')
//     })

// })

router.get('/userOTPLogin', (req, res) => {
  console.log("start");
  res.render('user/userOTPLogin', { user: true, "phoneErr": req.session.phone })
  req.session.phone = false
})
router.post('/userOTPLogin', (req, res) => {
  console.log("post ethi", req.body.mobile);
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
  console.log("submit kerii");
  res.render('user/userOTPSubmit', { user: true })

})
router.post('/userOTPSubmit', (req, res) => {
  console.log("otpsubmit");
  console.log("this is body", req.body, req.session.otpPhone);
  twilio
    .verify
    .services(otp.serviceID)
    .verificationChecks
    .create({
      to: `+91${req.session.otpPhone}`,
      code: req.body.Otp
    }).then((data) => {
      console.log("then", data);
      if (data.valid) {
        console.log("if kerii")
        userHelpers.getuserOtp(req.session.otpPhone).then((user) => {
          req.session.user = user
          req.session.loggedIn = true
          res.redirect('/')
        })
        req.session.otpPhone = null
      }
      else {
        console.log("uyihjkiolkjilkhikjhiujh");
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


  userHelpers.dosignup(req.body).then((response) => {




    req.session.loggedIn = true;

    req.session.user = response.user
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
  console.log(('addcart'));
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
    res.render('user/place-order', { ses, total, address, user: req.session.user, })
  }
})





router.post('/place-order', async (req, res) => {
  let products = await userHelpers.getCartProductList(req.body.userId)
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
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

  console.log("body", req.body);

})
router.get("/adress", verifyuser, async (req, res) => {
  let ses = req.session.loggedIn
  if (ses) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  res.render("user/add-adress", { ses, cartCount })
})




router.post("/adress", verifyuser, (req, res) => {

  userHelpers.addAddress(req.body).then((details) => {

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
    console.log("userid ond", id);
    let orders = await userHelpers.getUserOrders(id)
    console.log('order', orders)
    res.render('user/orders', { user: req.session.user, orders, ses })
  }
})



router.get('/view-order-products/:id', async (req, res) => {
  let ses = req.session.loggedIn
  if (ses) {
    let products = await userHelpers.getOrderProducts(req.params.id)

    res.render('user/view-order-products', { user: req.session.user, products, ses })
  }
})



router.post('/verify-payment', verifyuser, (req, res) => {
  console.log(req.body);
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log("payment successfull");
      res.json({ status: true })
    })
  }).catch((err) => {
    res.json({ status: 'Payment Failed' })
  })
})










router.post("/deleteCartProduct/", (req, res) => {
  console.log("delete ", req.body);
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
router.get("/edit-profile/:id",(req,res)=>{

    res.render("user/edit-user")
 
})


module.exports = router;
