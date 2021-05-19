//jshint esversion:6
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const validator = require("validator");
const { check, validationResult } = require("express-validator");
const { max } = require("lodash");
const { urlencoded } = require("body-parser");
const app = express();
var cityname;
var statename;
var requirementname;
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// const {MongoClient} = require('mongodb');
// async function main(){
// const uri ='mongodb+srv://echospace:Ki9W5ltBM9yM3rHL@echospace.530yv.mongodb.net/echospaceDB?retryWrites=true&w=majority'
// const client = new MongoClient(uri);
// await client.connect();
// await listDatabases(client);
// try {
//   await client.connect();

//   await listDatabases(client);

// } catch (e) {
//   console.error(e);
// }
// finally {
//   await client.close();
// }
// }
// main().catch(console.error);

// async function listDatabases(client){
//   databasesList = await client.db().admin().listDatabases();

//   console.log("Databases:");
//   databasesList.databases.forEach(db => console.log(` - ${db.name}`));
// };

// const mongoPath = 'mongodb+srv://echospace:Ki9W5ltBM9yM3rHL@echospace.530yv.mongodb.net/echospaceDB?retryWrites=true&w=majority'

// module.exports = async () => {
//   await mongoose.connect(mongoPath,{  
//     useNewUrlParser: true,
//     useUnifiedTopology: true
//   })
//   return mongoose
// }




// mongoose.connect("mongodb+srv://echospace:Ki9W5ltBM9yM3rHL@echospace.530yv.mongodb.net/echospaceDB?retryWrites=true&w=majority", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
// mongoose.set("useCreateIndex", true);

mongoose.connect("mongodb://localhost:27017/covidDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("useCreateIndex", true);


const userSchema = new mongoose.Schema({
  email: {
    type: String,
  },
  password: String,
  googleId: String,
  firstname:String,
  lastName:String
 
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {

  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/Echospace",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

app.post("/register", function (req, res) {
  
  User.register(
    { username: req.body.username,firstName:req.body.firstName,
      lastName:req.body.lastName },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/feed");
        });
      }
    }
  );
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, function (err) {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/feed");
      });
    }
  });
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/feed");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/Echospace",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/feed");
  }
);










app.post("/filterposts", function (req, res) {

  global.cityfilter = req.body.cityfilter;
  global.statefilter = req.body.statefilter;
  global.requirementfilter = req.body.requirementfilter;

  requirementname = requirementfilter;
  cityname = cityfilter;
  statename = statefilter;
  res.redirect("/filterposts");



});

const posthelpSchema = {
  name: String,
  age: Number,
  city: String,
  state: String,
  temperature: Number,
  count: Number,
  contact: Number,
  content: String,
  requirement: String,
  result: String,
  time: Date

};

const PostHelp = mongoose.model("PostHelp", posthelpSchema);






app.post("/post", bodyParser.urlencoded({ extended: false }), [

  check('name', 'Looks like an invalid name').isLength({ min: 3 }),
  check('age', 'Invalid age').isNumeric().isLength({ max: 3 }),
  check('temperature', 'Please provide a valid body temperature of the Patient').isNumeric().isLength({ max: 3 }),
  check('contact', 'Invalid Phone Number').isNumeric().isLength({ max: 10,min:10 }),
], function (req, res) {

  const posterrors = validationResult(req)
  if (!posterrors.isEmpty()) {
    const postalert = posterrors.array()
    res.render('post', { postalert })
  }
  else{
  const posthelp = new PostHelp({
    name: req.body.name,
    age: req.body.age,
    city: req.body.city,
    state: req.body.state,
    temperature: req.body.temperature,
    count: req.body.count,
    contact: req.body.contact,
    content: req.body.content,
    requirement: req.body.requirement,
    result: req.body.result,
    time: new Date()
  });


  posthelp.save(function (err) {
    if (!err) {
      res.redirect("feedlogout");
    }
  });
  }
});







app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/submit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", function (req, res) {
  const submittedSecret = req.body.name;

  //Once the user is authenticated and their session gets saved, their user details are saved to req.user.
  // console.log(req.user.id);

  Post.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.name = submittedSecret;
        foundUser.save(function () {
          res.redirect("/secrets");
        });
      }
    }
  });
});

const port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log("Server started on port "+ port);
});

// app.listen();

const postServiceSchema = {
  type: String,
  pname: String,
  help: String,
  detail: String,
  city: String,
  state: String,
  phone: Number,
  time: Date
};

const PostSer = mongoose.model("PostSer", postServiceSchema);



app.get("/otherss", function (req, res) {
  PostSer.find({}, function (err, foundPostser) {
    res.render("otherss", {
      postsers: foundPostser
    });
  });
});



app.post("/post-services",bodyParser.urlencoded({ extended: false }), [

  check('pname', 'Looks like an invalid name').isLength({ min: 3 }),
 check('phone', 'Invalid Phone Number').isNumeric().isLength({ max: 10,min:10 }),
], function (req, res) {

  const posterrors = validationResult(req)
  if (!posterrors.isEmpty()) {
    const postservicesalert = posterrors.array()
    res.render('post-services', { postservicesalert })
  }
  else{
  const y = req.body.help;
  const postser = new PostSer({
    type: req.body.type,
    pname: req.body.pname,
    help: req.body.help,
    detail: req.body.detail,
    city: req.body.city,
    state: req.body.state,
    phone: req.body.phone,
    time: new Date()
  });



  postser.save(function (err) {
    if (!err) {
      res.redirect("services");
    }
  });
  }
});


var servicescityname;
var servicesstatename;
var servicesrequirementname;
app.post("/filterpost-services", function (req, res) {

  global.servicescityfilter = req.body.servicescityfilter;
  global.servicesstatefilter = req.body.servicesstatefilter;
  global.servicesrequirementfilter = req.body.servicesrequirementfilter;

  servicesrequirementname = servicesrequirementfilter;
  servicescityname = servicescityfilter;
  servicesstatename = servicesstatefilter;
  res.redirect("/filterpost-services");



});

app.get("/filterpost-services", function (req, res) {
  PostSer.find({}, function (err, foundPostser) {
    res.render("filterpost-services", {
      postsers: foundPostser, servicescitysearch: servicescityname, servicesstatesearch: servicesstatename, servicesrequirementsearch: servicesrequirementname
    });
  });
});
app.get("/filterposts", function (req, res) {
  if (req.isAuthenticated()) {
  PostHelp.find({ "name": { $ne: null } }, function (err, foundPosthelp) {
    if (err) {
      console.log(err);
    } else {
      if (foundPosthelp) {
        res.render("filterpostslogout", { posthelps: foundPosthelp, citysearch: cityname, statesearch: statename, requirementsearch: requirementname });

      }
    }

  });}
  else{
    PostHelp.find({ "name": { $ne: null } }, function (err, foundPosthelp) {
      if (err) {
        console.log(err);
      } else {
        if (foundPosthelp) {
          res.render("filterposts", { posthelps: foundPosthelp, citysearch: cityname, statesearch: statename, requirementsearch: requirementname });
  
        }
      }
  
    });
  }
});

app.get("/filterpostslogout", function(req,res){
  PostHelp.find({ "name": { $ne: null } }, function (err, foundPosthelp) {
    if (err) {
      console.log(err);
    } else {
      if (foundPosthelp) {
        res.render("filterpostslogout", { posthelps: foundPosthelp, citysearch: cityname, statesearch: statename, requirementsearch: requirementname });

      }
    }

  });
})

app.get("/feed", function (req, res) {
  if (req.isAuthenticated()) {
    PostHelp.find({}, function (err, foundPosthelp) {
    res.render("feedlogout", {
      posthelps: foundPosthelp
    });
  });} else{
  PostHelp.find({}, function (err, foundPosthelp) {
    res.render("feed", {
      posthelps: foundPosthelp
    });
  });}
});
app.get("/feedlogout", function (req, res) {
  if (req.isAuthenticated()) {
    PostHelp.find({}, function (err, foundPosthelp) {
      res.render("feed", {
        posthelps: foundPosthelp
      });
    });
  } else {
    res.redirect("/feed");
  }
});
app.get("/feedlogout", function (req, res) {
  PostHelp.find({}, function (err, foundPosthelp) {
    res.render("feedlogout", {
      posthelps: foundPosthelp
    });
  });
});

app.get("/post-services", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("post-services");
  } else {
    res.redirect("/login");
  }
});

app.get("/post", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("post");
  } else {
    res.redirect("/login");
  }
});

app.get("/services", function (req, res) {
  if (req.isAuthenticated()) {
    PostSer.find({}, function (err, foundPostser) {
    res.render("services", {
      postsers: foundPostser
    });
  } );}else {
    res.redirect("/login");
  }
});


app.get("/", function (req, res) {
  if (req.isAuthenticated()) {
    PostHelp.find({}, function (err, foundPosthelp) {
    res.render("feedlogout", {
      posthelps: foundPosthelp
    });
  });} else{
  PostHelp.find({}, function (err, foundPosthelp) {
    res.render("feed", {
      posthelps: foundPosthelp
    });
  });}
});