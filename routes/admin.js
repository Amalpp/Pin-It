const { Router } = require('express');
var express = require('express');
var router = express.Router();
var userHelpers = require('../helpers/user-helpers')
var productHelper = require('../helpers/product-helpers');
const { request } = require('../app');
const productHelpers = require('../helpers/product-helpers');

var data = { name: "amal", password: 1111 }


const verifyLogin = (req, res, next) => {
  if (req.session.name) {
    next()

  }
  else {
    console.log("dsf");
    res.redirect('/admin')
  }
}

// admin panel
router.get('/admin',async function (req, res, next) {
  let sess = req.session.name
  if (sess) {
    let usercount=await productHelpers.getUserCount()
    console.log("usercount",usercount);
    let ordercount=await productHelpers.getOrderCount()
    let cancelled_orders=await productHelpers.getOrderCount()
    let totalProducts =await productHelpers.gettotalProduct()
    let completed_orders=await productHelpers.getConfirmOrder()
    let Revenue=await productHelpers.totalRevenue()
    let monthsales = await productHelpers.ordersGraph()
    console.log("month sale",monthsales);
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
    res.render('admin/admin-login', { admin: true })
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
      console.log("sfd", data);
      res.render('admin/user-management', { admin: true, data, ses })
    });

  }
  else {
    res.redirect('/admin')
  }
});
router.get('/delete/:id', verifyLogin, (req, res) => {

  let proId = req.params.id
  console.log(proId)
  userHelpers.deleteUser(proId).then((response) => {
    res.redirect('/user-management')
  })

});
router.get('/edit/', verifyLogin, async (req, res) => {
  console.log("start");
  let user = await userHelpers.getuserDetails(req.query.id)
  res.render('admin/edit-user', { admin: true, user })
});
router.post('/edit/:id', (req, res) => {
  userHelpers.updateuser(req.params.id, req.body).then(() => {
    console.log('gtyf');
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
  console.log("dsnfkuhoihhinf");
  productHelper.getAllProduct().then((products) => {

    res.render('admin/product-management', { admin: true, products });
  })
});

router.get('/add-product', verifyLogin, function (req, res) {
  productHelper.getAllCategory().then((result) => {
    res.render('admin/add-product', { admin: true, result })
  })

});


router.post('/add-product', verifyLogin, function (req, res) {

  req.body.price = parseInt(req.body.price)
  productHelper.addProduct(req.body, (id) => {
    console.log(req.body);
    let image = req.files.image

    image.mv('./public/product-image/' + id + '.jpg', (err) => {
      if (!err) {
        console.log('hushfiu');
        res.redirect('/product-management')
      } else {
        console.log(err)
      }
    })

  })

});
router.get('/deleteProduct/:id', verifyLogin, (req, res) => {

  let prodId = req.params.id
  console.log(prodId)
  console.log('fdsfds');
  productHelper.deleteProduct(prodId).then((response) => {
    res.redirect('/product-management')
  })

});
router.get('/edit-product', verifyLogin, async (req, res) => {
  console.log("start");
  let products = await productHelper.getprodDetails(req.query.id)
  
  res.render('admin/edit-product', { admin: true, products })
});

router.post('/edit-product/:id', verifyLogin, (req, res) => {
  console.log(req.params.id)

  productHelper.updateProduct(req.params.id, req.body).then(() => {
    res.redirect('/product-management')

  })
})






router.get('/add-category', verifyLogin, ((req, res) => {

  res.render('admin/add-category', { admin: true })
}));
router.post('/add-category', ((req, res) => {

  productHelper.addCategory(req.body).then(() => {
    console.log('sdfs', req.body);
    res.redirect("/category-management")
  })

}));


router.get('/category-management', verifyLogin, ((req, res) => {
  productHelper.getAllCategory().then((category) => {
    console.log('dsfds');
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
router.post("/order-management", (req, res) => {
  let keyword = req.body.name
  let orderId = req.body.orderId
  productHelpers.approveOrders(orderId, keyword).then((data) => {
    res.redirect("/order-management")
  })
})

router.get("/view-order/:id",async (req,res)=>{
  let ses = req.session.name
  if (ses) {
    let orderId=req.params.id
  console.log("ordere",req.body);
  productHelpers.viewOrders(orderId).then((prod)=>{
    console.log("last",prod)
    res.render("admin/view-orders",{prod,admin:true,ses})
  })
  }
  
  
})


    

router.get('/admin-logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin-login')
})

router.get("/saleReport",(req,res)=>{
  productHelpers.getOrderReport().then(async(result)=>{
    let monthsales = await productHelpers.ordersGraph()

    res.render('admin/reports', { admin: true, result, monthsales })
  })
  
})
router.post('/findReportbyDate', verifyLogin, (req, res) => {

  productHelpers.getOrderByDate(req.body).then((response) => {
    console.log("yeah its wrking", response);
    res.render('admin/viewSalesByDate', { admin: true, response })
  })

})

module.exports = router;
