const { Router } = require('express');
var express = require('express');
var router = express.Router();
var userHelpers = require('../helpers/user-helpers')
var productHelper = require('../helpers/product-helpers');
const { request } = require('../app');
const productHelpers = require('../helpers/product-helpers');
var base64ToImage = require('base64-to-image');
var voucher_codes = require('voucher-code-generator');

var data = { name: "amal", password: 1111 }


const verifyLogin = (req, res, next) => {
  if (req.session.name) {
    next()

  }
  else {

    res.redirect('/admin')
  }
}

// admin panel
router.get('/admin',async function (req, res, next) {
  let sess = req.session.name
  if (sess) {
    let usercount=await productHelpers.getUserCount()
  
    let ordercount=await productHelpers.getOrderCount()
    let cancelled_orders=await productHelpers.getOrderCount()
    let totalProducts =await productHelpers.gettotalProduct()
    let completed_orders=await productHelpers.getConfirmOrder()
    let Revenue=await productHelpers.totalRevenue()
    let monthsales = await productHelpers.ordersGraph()
  
    res.render('admin/admin-home', { admin: true, sess,usercount,ordercount,cancelled_orders,totalProducts,completed_orders,Revenue, monthsales})
  }
  else {
    res.redirect('/admin-login')
  }


});


// admin login

router.get('/admin-login', function (req, res, next) {


  let sess = req.session.name


  if (sess) {

    res.redirect('/admin')
  }
  else {
    let log=true
    res.render('admin/admin-login', { admin: true,log,"loginErr":req.session.loginErr})
    req.session.loginErr=false
  }

})

router.post('/admin-login', function (req, res) {

  if (req.body.username == data.name && req.body.password == data.password) {
    req.session.name = data.name

    res.redirect('/admin')
  }
  else {
    req.session.loginErr = 'invalid username or password'
    res.redirect('/admin-login')
  }
});


router.get('/user-management', (req, res) => {
  let ses = req.session.name
  if (ses) {
    userHelpers.getAllUser().then((data) => {
    
      res.render('admin/user-management', { admin: true, data, ses })
    });

  }
  else {
    res.redirect('/admin')
  }
});
router.get('/delete/:id', verifyLogin, (req, res) => {

  let proId = req.params.id

  userHelpers.deleteUser(proId).then((response) => {
    res.redirect('/user-management')
  })

});
router.get('/edit/:id', verifyLogin, async (req, res) => {
  
  let user = await userHelpers.getuserDetails(req.params.id)
  res.render('admin/edit-user', { admin: true, user })
});
router.post('/edit/:id', (req, res) => {
  userHelpers.updateuser(req.params.id, req.body).then(() => {
   
    res.redirect('/user-management')

  })
})
router.get('/block/:id', verifyLogin, (req, res) => {

  userHelpers.blockuser(req.params.id).then((data) => {

    res.redirect('/user-management')

  })
});
router.get('/unblock/:id', verifyLogin, (req, res) => {
  userHelpers.unblock(req.params.id).then((data) => {
    res.redirect('/user-management')
  })
})



// view product

router.get('/product-management', verifyLogin, function (req, res) {

  productHelpers.getAllProduct().then((products) => {
   
    res.render('admin/product-management', { admin: true, products });
  })
});

router.get('/add-product', verifyLogin, function (req, res) {
  productHelpers.getAllCategory().then((result) => {
    res.render('admin/add-product', { admin: true, result })
  })

});






router.post('/add_product', verifyLogin ,(req, res) => {
  
  req.body.price = parseInt(req.body.price)
  
  productHelpers.addProduct(req.body, (id) => {
    let image1 = req.files.image1
    let image2 = req.files.image2
        


    var base64Str1 = req.body.imageBase64Data1
  
    var path = "./public/product-image/";
    var optionalObj = { fileName: id+'1', type: "jpg" };
    base64ToImage(base64Str1, path, optionalObj);

    var base64Str2 = req.body.imageBase64Data2
  
    var path = "./public/product-image/";
    var optionalObj = { fileName: id+'2', type: "jpg" };
    base64ToImage(base64Str2, path, optionalObj);

   

  
    res.redirect('/product-management')

  });
})







router.get('/deleteProduct/:id', verifyLogin, (req, res) => {

  let prodId = req.params.id

  productHelper.deleteProduct(prodId).then((response) => {
    res.redirect('/product-management')
  })

});
router.get('/edit-product/:id', verifyLogin, async (req, res) => {
 
  let products = await productHelpers.getprodDetails(req.params.id)

  res.render('admin/edit-product', { admin: true, products })

});

router.post('/edit-product/:id', verifyLogin, (req, res) => {
 

  productHelper.updateProduct(req.params.id, req.body).then(() => {
    res.redirect('/product-management')

  })
})






router.get('/add-category', verifyLogin, ((req, res) => {

  res.render('admin/add-category', { admin: true })
}));
router.post('/add-category', ((req, res) => {

  productHelper.addCategory(req.body).then(() => {

    res.redirect("/category-management")
  })

}));

router.get("/edit-category/:id",verifyLogin,(req,res)=>{
  let ses = req.session.name
  if (ses) {
    productHelpers.getCategoryById(req.params.id).then((category) => {
      res.render('admin/edit-category', { admin: true, category })
    })
  }
  else {
    res.redirect('/admin')
  }
})


router.post('/edit-category/:id', (req, res) => {
  let sess = req.session.name
  if (sess) {
    productHelpers.updateCategory(req.params.id, req.body).then(() => {

      res.redirect('/category-management')
    })
  }

  else {
    res.redirect('/admin')
  }

})
router.get('/delete-category/:id', (req, res) => {
  let sess = req.session.name
  if (sess) {
    productHelpers.deleteCategory(req.params.id).then(() => {

      res.redirect('/category-management')
    })
  }
  else {
    res.redirect('/admin')
  }

})






router.get('/category-management', verifyLogin, ((req, res) => {
  productHelper.getAllCategory().then((category) => {

    res.render('admin/category-management', { admin: true, category })
  })
}))


//order Management


router.get("/order-management", (req, res) => {
  let ses = req.session.name
  if (ses) {
    productHelpers.getAllorders().then((orders) => {
      res.render("admin/order-management", { admin: true, ses, orders })
    })

  }
  else {
    res.redirect("/admin")
  }


})
// router.post("/order-management", (req, res) => {
//   let keyword = req.body.name
//   let orderId = req.body.orderId
//   productHelpers.approveOrders(orderId, keyword).then((data) => {
//     res.redirect("/order-management")
//   })
// })

router.get('/confirm_order:id', (req, res) => {
  console.log('routeril ethiye...', req.params.id);
  productHelpers.confirmOrder(req.params.id).then(() => {
    res.json(response)
  })
})

router.get('/cancel_order:id', (req, res) => {
  console.log('routeril ethiye...', req.params.id);
  productHelpers.cancelOrder(req.params.id).then(() => {
    res.json(response)
  })
})

router.get('/ship_order:id', (req, res) => {
  console.log('routeril ethiye...', req.params.id);
  productHelpers.shipOrder(req.params.id).then(() => {
    res.json(response)
  })
})

router.get('/delivered_order:id', (req, res) => {
  console.log('routeril ethiye...', req.params.id);
  productHelpers.deliveredOrder(req.params.id).then(() => {
    res.json(response)
  })
})













router.get("/view-order/:id",async (req,res)=>{
  let ses = req.session.name
  if (ses) {
    let orderId=req.params.id

  productHelpers.viewOrders(orderId).then((prod)=>{
 
    res.render("admin/view-orders",{prod,admin:true,ses})
  })
  }
  
  
})


    



router.get("/saleReport",(req,res)=>{
  productHelpers.getOrderReport().then(async(result)=>{
    let monthsales = await productHelpers.ordersGraph()

    res.render('admin/reports', { admin: true, result, monthsales })
  })
  
})
router.post('/findReportbyDate', verifyLogin, (req, res) => {

  productHelpers.getOrderByDate(req.body).then((response) => {

    res.render('admin/viewSalesByDate', { admin: true, response })
  })

})



router.get('/create-offer-ByCategory', verifyLogin, async(req, res) => {

  productHelper.getAllCategory().then((category) => {

    res.render('admin/add-offers', { admin: true, category })
  })
})

router.post('/create-offer-ByCategory', verifyLogin, (req, res) => {

  let catId = req.body.category

  productHelper.addOfferToCategory(catId, req.body).then((data) => {
    res.redirect('/offers')
  })
})



router.get('/offers', verifyLogin, async (req, res) => {

  productHelper.viewOffers().then((data) => {


    res.render('admin/offer', { admin: true, data })

  })
});
router.get('/create-offer', verifyLogin, async (req, res) => {

  productHelpers.getAllProduct().then((products) => {


    res.render('admin/add-offer', { admin: true, products })
  })
});

router.post('/create-offer', verifyLogin, (req, res) => {

  let prodId = req.body.product
 
  productHelpers.addOfferToProduct(prodId , req.body).then((data) => {
    res.redirect('/offers')
  });

})

  
  
  router.get('/delete-offer/:id', verifyLogin,async (req, res) => {
  
    let prodId = req.params.id
    productHelpers.deleteOffer(prodId).then((data) => {
     
  
      res.redirect('/offers')
    })
  })
  


  
  router.get('/coupon', verifyLogin, (req, res) => {

    productHelpers.getcoupon().then((coupons) => {
  
  
      res.render('admin/coupon', { admin: true, coupons })
    })
  })

  router.get('/new-coupon', verifyLogin, (req, res) => {

    res.render('admin/add-coupon', { admin: true })
  })
  
  router.get('/generate-couponCode', verifyLogin, (req, res) => {

    let voucher = voucher_codes.generate({
      length: 8,
      count: 1
    })
    let voucherCode = voucher[0]
   
    res.send(voucherCode)
  })

  router.post('/new-coupon', async (req, res) => {

    let coupon = req.body.coupon
    let offer = req.body.offer
  
    await productHelpers.createCoupons(offer, coupon).then(() => {
      res.redirect('/coupon')
    })
  
  })


  router.get('/delete-coupon/:id', async (req, res) => {

    await productHelpers.deactivateCoupon(req.params.id).then(() => {
 
      res.redirect('/coupon')
    })
  
  })
  



  router.get('/admin-logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin-login')
  })





module.exports = router;
