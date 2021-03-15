var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session= require('express-session');
var fileUpload=require('express-fileupload');
var hbs=require('express-handlebars');
var bodyParser=require('body-parser');

var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
var db= require('./config/connection')

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine( 'hbs', hbs( { 
  extname: 'hbs', 
  defaultLayout: 'layout', 
  layoutsDir: __dirname + '/views/layout/',
  partialsDir: __dirname + '/views/partials/'
} ) );

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended:true}))
app.use(fileUpload());


app.use(express.static('/public'))
app.use(express.static('/public/product-image'))
app.use(session({
  key:'user_id',
  secret:'this is param',
  resave:false,
  saveUninitialized:false,
  cookies:{
    expires:500000
  }
}))

app.use(function(req,res,next){
  res.set('cache-control','no-dcache,private,no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0')
  next();
})

db.connect((err)=>{
  if(err) console.log("connection Error"+err);
  else console.log("Database connected to port 27017");
})


app.use('/', userRouter);
app.use('/', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
