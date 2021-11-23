require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs"); 
const http = require('http');

const mongoose=require("mongoose");

const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose =require("passport-local-mongoose");

const app = express(); 

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true})); 
app.use(express.static("static"));


app.use(session({ 
    secret:process.env.SECRET_KEY,
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/ColaborarDB', {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
mongoose.set("useCreateIndex",true);

const chatschema = new mongoose.Schema({
    message:{
        type:String
    }
})

const personaldetailsSchema =  new mongoose.Schema({
    FName:{
        type:String
    },
    LName:{
        type:String
    },
    phone:{
        type:Number
    },
    about:{
        type:String
    }
})

const projectdetailsSchema = new mongoose.Schema({
    PName: {
        type: String
    }, 
    PTag:{
        type:String
    },
    PMember:{
        type:Number
    },
    PAbout:{
        type:String
    } 

})

const userSchema= new mongoose.Schema({
    username:{ 
        type:String
         },
    password:{ 
        type:String
    },
    personaldetails:{
        type:personaldetailsSchema
    },
    projectdetails:{
        type:projectdetailsSchema
    }

});

userSchema.plugin(passportLocalMongoose);



const User= mongoose.model("Users",userSchema)
const PDetail = mongoose.model("PDetails" , personaldetailsSchema);
const Project = mongoose.model("Projects" , projectdetailsSchema);
const ChatMessage =mongoose.model("Chats" , chatschema);


passport.use(User.createStrategy());
   
                                      /* For local strategy*/

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




 
 // -----------home -----------
app.route("/")
.get(function(request,response){
    response.render("home");
});


//------------login------------  
app.route("/login")
.get(function(request,response){
    response.render("login");
})
.post(function(req,res){
    const user =new User({
        username:req.body.username,
        password:req.body.password
    }); 
    passport.authenticate('local', function(err, user, info) {
        if (err) { 
            return next(err); 
        }
        if (!user) { 
            return res.redirect('/login'); 
        }
        req.logIn(user, function(err) {
          if (err) {
               return next(err); 
            }
          return res.redirect("/project/" + req.user.username);
        });
      })(req, res);
});

//-------------register-------------------

app.route("/register")
.get(function(request,response){
    response.render("register");
})
.post(function(request,response){
    if(request.body.password != request.body.cpassword){
        response.render("register");
    }
    else{
        User.register({ username:request.body.username},request.body.password,function(err,user){
            if(err){
                console.log(err);
                response.redirect("/register");
            }
            else{

                passport.authenticate("local")(request,response,function(){
                    response.redirect("/registernext");
                });
            }
        });
        
    }
    
})



//------------registernext---------
app.route("/registernext")
.get(function(request,response){
    response.render("registernext");
})
.post(function(request,response){
    const detail =new PDetail({
        FName:request.body.fname,
        LName:request.body.lname,
        phone:request.body.phone,
        about:request.body.about
    }); 
        
    User.findById(request.user.id,function(err,element){
        if(err){
            console.log(err);
        }
        else{
            element.personaldetails=detail; 
            element.save();
            response.redirect("/project/" + request.user.username);
        }
    });
    
})


//-----------project page -------------
app.route("/project/:username")
.get(function(request,response){
    User.find( { username : request.params.username , projectdetails: { $exists : true } } , function(err,element){
        if(err){
            console.log(err);
        }
        else{ 
            response.render("project" , { details:element });
        }
    });
});


//-----------createIt page -------------
app.route("/createIt")
.get(function(request,response){
    response.render("createIt" );
})
.post(function(request,response){
    const pdetail = new Project({
        PName:request.body.fname,
        PTag:request.body.tag , 
        PMember: request.body.numbo,
        PAbout: request.body.about_project 
       
});

    /*User.findById(request.user.id,function(err,element){
        if(err){
            console.log(err);
        }
        else{
            element.projectdetails=pdetail;
            element.save();
            response.redirect("/project/" + request.user.username);
        }
    });*/
    User.findOneAndUpdate( { username:'bhatanagar88.aditya@gmail.com' } , { $set : { projectdetails:pdetail } },null , function(err,element){
        if(err){
            console.log(err);
        }
        else{   
       
            response.redirect("/project/" + "bhatanagar88.aditya@gmail.com");
        }
    }  );
});

app.route("/chat")
.get(function(request,response){
    ChatMessage.find({ message:{ $ne:null} } , function(err,element){
        response.render("chat" , { message:element });
    });
})
.post(function(request,response){
    const M = new ChatMessage({
        message:request.body.message
    }); 
    M.save();
    response.redirect("/chat");
});
  

app.route("/project/:username/:projectname")
.get(function(request,response){

    User.find({username: request.params.username}, function(err,element){
        if(err){
            console.log(err);
        }
        else{

            response.render("created" , {details:element});
        }
    });
})

app.route("/proposalaccepted")
.get(function(request,response){
    User.find({username: "bhatanagar88.aditya@gmail.com"}, function(err,element){
        if(err){
            console.log(err);
        }
        else{

            response.render("proposalaccepted" , {details:element});
        }
    });
});


//---------logout-------------

app.route("/logout")
.get(function(request,response){
    request.logout();
    response.redirect("/");
});




 app.listen(3000,function(){
   console.log("Server running at port 3000");
});

