var express = require("express");
var logfmt = require("logfmt");
var app = express();
var pg = require("pg");
var constants = require("./constants");
var pgclient;
var current_date;


app.use(logfmt.requestLogger());

//any get call will first establish the connection and then move to next.
app.get('*', function(req,res,next){
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
     if(client != null){
        pgclient = client;
        console.log("Client connection with Postgres DB is established");
	next();
     }
     else{
        console.log("Client is null");
	//TODO - Load the connection error page
     }
  });
});


// Any call with post will first try to connect to pg and initialize the pgclient
// In case of any error in connecting, load the connection error page.
app.post('*', function(req,res,next){
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
     if(client != null){
        pgclient = client;
        console.log("Client connection with Postgres DB is established");
        next();
     }
     else{
        console.log("Client is null");
        //TODO - Load the connection error page
     }
  });
});


// call to load the home page
app.get('/', function(req, res) {
  res.send('Load the home page here');
});

//TODO - review the below get code - MAY NOT BE NEEDED.
// rest call 
app.get('/:loc/:srchqry', function(req,res,next){
  //If first param is "dish" call next() - this will call the other get method 
  if(req.params.loc == "dish" || req.params.loc == "hotel" ||req.params.loc == "review"){
    console.log("request.params.loc is equal to dish");
    next();
  }
  else{
    console.log("req.params.loc is not equal to dish");
  
  console.log("Location:"+req.params.loc+" search query:"+req.params.srchqry);
  console.log(constants.SELECT_DISH_TABLE_QUERY);
  var qry = (constants.SELECT_DISH_TABLE_QUERY).replace('$1',req.params.srchqry);
  console.log("Final Query:"+qry);
  pgclient.query(qry,function(error, result){
	console.log("The result set:"+result.rows.length);
  });
  res.send("Location:"+req.params.loc+" search query:"+req.params.srchqry);
  }
});

//API - for the table "DISH"
//GET API for the dish table
//    url - http://locahost:port/dish/<dish_name>
//TODO - add null check for pgclient
//TODO - IN CASE OF ALL QUERY FUNCTION CALL FOR pgclient, HANDLE THE ERROR SCENARIO
app.get('/dish/:dish_name', function(req,res){
  console.log(constants.SELECT_DISH_TABLE_QUERY);
  var qry = (constants.SELECT_DISH_TABLE_QUERY).replace('$1',req.params.dish_name);
  console.log("Final Query:"+qry);
  var dish_id;
  pgclient.query(qry,function(error, result){
        console.log("The result set:"+result.rows.length);
	if(result != null && result.rows !=null && result.rows.length > 0){
	    dish_id = result.rows[0].dish_id.toString();
	}
	else{
	    dish_id = "No Data found for the given dish_name";
	}
	console.log("dish_id:"+dish_id);
        //send the dish_id as the response
        res.send(dish_id);
  });
});

//POST API for the dish table
//	url - http://localhost:port/dish/<dish_name>
//TODO - call worker service to insert images.
//TODO - extract image from the body the request. there can be multiple images. images will be sent in Base64 encoded format.
app.post('/dish/:dish_name/:dish_type/:dish_category', function(req,res){
  console.log(constants.INSERT_DISH_TABLE_QUERY);
  current_date = new Date().getTime();
  console.log("current_date:"+current_date);
  var qry = (constants.INSERT_DISH_TABLE_QUERY).replace('$1',current_date).replace('$2',req.params.dish_name).replace('$3',req.params.dish_type).replace('$4',req.params.dish_category);
  console.log("Final Query:"+qry);
  var insert_succeeded = false;
  if(pgclient != null){
    pgclient.query(qry,function(error, result){
        if(error){
	   console.log("Error in inserting into the DB");
	}
	else{
           //TODO - Add call to worker to insert the images one by one.
	   console.log("Successful insertion in the DB - Proceed call to worker for insetion of images");
	   insert_succeeded = true;
	}
	res.send(insert_succeeded);
        console.log("The result:"+result);
    });
  }
  else{
     //TODO - load the no connection error page here
     res.send(insert_succeeded);
  }
});

//API - for the table hotel
//    url - http://localhost:port/hotel/<hotel_name>
app.get('/hotel/:hotel_name', function(req,res){
  console.log(constants.SELECT_HOTEL_TABLE_QUERY);
  var qry = (constants.SELECT_HOTEL_TABLE_QUERY).replace('$1',req.params.hotel_name);
  console.log("Final Query:"+qry);
  var hotel_id;
  if(pgclient != null){
    pgclient.query(qry,function(error, result){
        console.log("The result set:"+result.rows.length);
        if(result != null && result.rows !=null && result.rows.length > 0){
            hotel_id = result.rows[0].hotel_id.toString();
        }
        else{
            hotel_id = "No Data found for the given dish_name";
        }
        console.log("hotel_id:"+hotel_id);
        //send the hotel_id as the response
        res.send(hotel_id);
    });
  }
  else{
     //TODO - load the connnection error page.
     res.send("Load the connection error page");
  }
});

//API for the table review
//   url for get - http://localhost:port/review/:hotel_dish_id
//      Algorithm - Based on the hotel_dish_id
app.get('/review/:hotel_dish_id', function(req,res){
   var qry = (constants.SELECT_REVIEW_TABLE_QUERY).replace('$1', req.params.hotel_dish_id);
   console.log("Final Query:"+qry);
   var review_id;
   if(pgclient != null){
      pgclient.query(qry, function(error, result){
           if(result != null){
               review_id = result.rows[0].review_id.toString();
           }
           else{
               review_id = "No Review Id found for the hotel_dish_id";
           }
           console.log("review_id:"+review_id);
           res.send(review_id);
      });
   }
   else{
      //TODO - load the error connection page.
      console.log("Load the error connection page");
   }

});


//add require for the worker.js file - 
require("./worker")(app);

//declare the port and listen to it
var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});
