var express = require('express');
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
var router = express.Router();





/* GET home page. */
router.get('/', function(req, res, next) {
  let ses=req.session.loggedIn
  productHelpers.getAllProduct().then((products)=>{

if(ses){


    
    res.render('user/index',{user:true,ses,products})
 
}
else{
  res.render("user/index",{user:true,products})
}

})

 
});

router.get('/product-details/:id',(req,res)=>{
  let prodId=req.params.id
  console.log('tyiou',prodId);
  let data=productHelpers.singleProduct(prodId).then((product)=>{
    res.render('user/product-details',{user:true,product})
  })

  })

  
// loginpage
router.get('/login',function(req,res,next){
  console.log(req.body);
  let ses=req.session.loggedIn
  if(ses){
    res.redirect('/')
  }
  else{

    res.render('user/user-login',{user:true})
    req.session.logginErr=false
  }
  
})
router.post('/login',function(req,res,next){
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.loggedIn=true;

      req.session.user =response.user
      res.redirect('/')
    }else{
      req.session.logginErr='Invalid username or Password'
      res.redirect('/login')
    }
  })
 
});


// user signup

router.get('/user-signup',function(req,res,next){
  let ses=req.session.loggedIn
  if(ses){
    res.redirect('/')

  }
  else{
    res.render('user/user-login')
  }
})

router.post('/user-signup',function(req,res,next){

  console.log(req.body)
  console.log("hyyyjyu");
  userHelpers.dosignup(req.body).then((response)=>{
    console.log("yuiyuio",response);

   
 
    req.session.loggedIn=true;

    req.session.user =response.user
    res.redirect('/')
   
  }).catch((user)=>{
  
      
     let amal=true
      res.render("user/user-login",{amal:true})
      
  })
})




router.get('/contactus',function(req,res,next){
  res.render('user/contactus',{user:true})
});
router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/')
})
module.exports = router;
