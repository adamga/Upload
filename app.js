/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

'use strict';

/******************************************************************************
 * Module dependencies.
 *****************************************************************************/

var express = require('express');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var passport = require('passport');
var util = require('util');
var bunyan = require('bunyan');
var config = require('./config');

var aToken = "";

var BBMEnterprise = require('bbm-enterprise');


// Noah Stuff
var req = require('request')
var DocumentDBClient = require('documentdb').DocumentClient

// Model Routing
var TaskList = require('./routes/tasklist');
var TaskDao = require('./models/taskDao');

var PublicKeyList = require('./routes/publickeylist');
var PublicKeyDao = require('./models/publicKeyDao');

var PrivateKeyList = require('./routes/privatekeylist');
var PrivateKeyDao = require('./models/privatekeyDao');

var RegIdsList = require('./routes/regidslist');
var RegIdsDao = require('./models/regidsDao');

var UsersList = require('./routes/userslist');
var UsersDao = require('./models/usersDao');

// End Model Routing
global.BBMEnterprise = BBMEnterprise;

// set up database for express session
var MongoStore = require('connect-mongo')(expressSession);
var mongoose = require('mongoose');

// Start QuickStart here

var OIDCStrategy = require('passport-azure-ad').OIDCStrategy;

var log = bunyan.createLogger({
    name: 'Microsoft OIDC Example Web Application'
});

/******************************************************************************
 * Set up passport in the app 
 ******************************************************************************/

//-----------------------------------------------------------------------------
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session.  Typically,
// this will be as simple as storing the user ID when serializing, and finding
// the user by ID when deserializing.
//-----------------------------------------------------------------------------
passport.serializeUser(function(user, done) {
  done(null, user.oid);
});

passport.deserializeUser(function(oid, done) {
  findByOid(oid, function (err, user) {
    done(err, user); 
  });
});

// array to hold logged in users
var users = [];

var findByOid = function(oid, fn) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
   log.info('we are using user: ', user);
    if (user.oid === oid) {
      return fn(null, user);
    }
  }
  return fn(null, null);
};

//-----------------------------------------------------------------------------
// Use the OIDCStrategy within Passport.
// 
// Strategies in passport require a `verify` function, which accepts credentials
// (in this case, the `oid` claim in id_token), and invoke a callback to find
// the corresponding user object.
// 
// The following are the accepted prototypes for the `verify` function
// (1) function(iss, sub, done)
// (2) function(iss, sub, profile, done)
// (3) function(iss, sub, profile, access_token, refresh_token, done)
// (4) function(iss, sub, profile, access_token, refresh_token, params, done)
// (5) function(iss, sub, profile, jwtClaims, access_token, refresh_token, params, done)
// (6) prototype (1)-(5) with an additional `req` parameter as the first parameter
//
// To do prototype (6), passReqToCallback must be set to true in the config.
//-----------------------------------------------------------------------------

global.RedirectUrl = "http://localhost:3000/auth/openid/return"; 

if (process.env.Enviroment != null) {
    global.RedirectUrl = process.env.RedirectUrl;
} else {

}

passport.use(new OIDCStrategy({
    identityMetadata: config.creds.identityMetadata,
    clientID: config.creds.clientID,
    responseType: config.creds.responseType,
    responseMode: config.creds.responseMode,
    redirectUrl: global.RedirectUrl,
    allowHttpForRedirectUrl: config.creds.allowHttpForRedirectUrl,
    clientSecret: config.creds.clientSecret,
    validateIssuer: config.creds.validateIssuer,
    isB2C: config.creds.isB2C,
    issuer: config.creds.issuer,
    passReqToCallback: config.creds.passReqToCallback,
    scope: config.creds.scope,
    loggingLevel: config.creds.loggingLevel,
    nonceLifetime: config.creds.nonceLifetime,
    nonceMaxAmount: config.creds.nonceMaxAmount,
    useCookieInsteadOfSession: config.creds.useCookieInsteadOfSession,
    cookieEncryptionKeys: config.creds.cookieEncryptionKeys,
    clockSkew: config.creds.clockSkew,
  },
  function(iss, sub, profile, accessToken, refreshToken, done) {
    if (!profile.oid) {
      return done(new Error("No oid found"), null);
      }
    aToken = accessToken;
    // asynchronous verification, for effect...
    process.nextTick(function () {
      findByOid(profile.oid, function(err, user) {
        if (err) {
          return done(err);
        }
        if (!user) {
          // "Auto-registration"
          users.push(profile);
          return done(null, profile);
        }
        return done(null, user);
      });
    });
  }
));


//-----------------------------------------------------------------------------
// Config the app, include middlewares
//-----------------------------------------------------------------------------
var express = require('express'), BBMEnterprise = require('bbm-enterprise');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set("BBMEnterprise", BBMEnterprise);
app.use(express.logger());
app.use(methodOverride());
app.use(cookieParser());

// Noah Stuff 
// Todo App
var newConfig = {}

newConfig.host = process.env.HOST || "https://agknowadb.documents.azure.com:443/";
newConfig.authKey = process.env.AUTH_KEY || "mG6f0cNunSbss3zBujjNzjAI27hqo9Y40WTutziK2To8hwWfPbvmM4mNLx5DtjUEKfysM4mmIeww5gthHgi85A==";
newConfig.databaseId = "NoahDev";
newConfig.collectionId = "Items";


var docDbClient = new DocumentDBClient(newConfig.host, {
    masterKey: newConfig.authKey
});
var taskDao = new TaskDao(docDbClient, newConfig.databaseId, newConfig.collectionId);
var taskList = new TaskList(taskDao);
taskDao.init(function (err) { if (err) throw err; });


// Init Public Key
newConfig.collectionId = "publicKeyStore";
docDbClient = new DocumentDBClient(newConfig.host, {
    masterKey: newConfig.authKey
});
var publicKeyDao = new PublicKeyDao(docDbClient, newConfig.databaseId, newConfig.collectionId);
var publicKeyList = new PublicKeyList(publicKeyDao);
publicKeyDao.init(function (err) { if (err) throw err; });

// Init Private Key
newConfig.collectionId = "privateKeyStore";
docDbClient = new DocumentDBClient(newConfig.host, {
    masterKey: newConfig.authKey
});
var privateKeyDao = new PrivateKeyDao(docDbClient, newConfig.databaseId, newConfig.collectionId);
var privateList = new PrivateKeyList(privateKeyDao);
privateKeyDao.init(function (err) { if (err) throw err; });

// Init Reg Ids
newConfig.collectionId = "regIds";
docDbClient = new DocumentDBClient(newConfig.host, {
    masterKey: newConfig.authKey
});
var regIdsDao = new RegIdsDao(docDbClient, newConfig.databaseId, newConfig.collectionId);
var regIdsList = new RegIdsList(regIdsDao);
regIdsDao.init(function (err) { if (err) throw err; });

// Init Users
newConfig.collectionId = "users";
docDbClient = new DocumentDBClient(newConfig.host, {
    masterKey: newConfig.authKey
});
var usersDao = new UsersDao(docDbClient, newConfig.databaseId, newConfig.collectionId);
var usersList = new UsersList(usersDao);
usersDao.init(function (err) { if (err) throw err; });

// set up session middleware
if (config.useMongoDBSessionStore) {
  mongoose.connect(config.databaseUri);
  app.use(express.session({
    secret: 'secret',
    cookie: {maxAge: config.mongoDBSessionMaxAge * 1000},
    store: new MongoStore({
      mongooseConnection: mongoose.connection,
      clear_interval: config.mongoDBSessionMaxAge
    })
  }));
} else {
  app.use(expressSession({ secret: 'keyboard cat', resave: true, saveUninitialized: false }));
}

app.use(bodyParser.urlencoded({ extended : true }));

// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static('content'));
//-----------------------------------------------------------------------------
// Set up the route controller
//
// 1. For 'login' route and 'returnURL' route, use `passport.authenticate`. 
// This way the passport middleware can redirect the user to login page, receive
// id_token etc from returnURL.
//
// 2. For the routes you want to check if user is already logged in, use 
// `ensureAuthenticated`. It checks if there is an user stored in session, if not
// it will call `passport.authenticate` to ask for user to log in.
//-----------------------------------------------------------------------------
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
};

app.get('/', function(req, res) { 
    /*Custom Code*/
    res.render('chat', { user: req.user, accessToken: aToken});
});

app.get('/teams', function (req, res) {
    /*Custom Code*/
    res.render('teams', { user: "" });
});

// '/account' is only available to logged in user
app.get('/account', ensureAuthenticated, function (req, res) {
  res.render('account', { user: req.user });
});

// '/chat' is only available to logged in user
app.get('/chat', ensureAuthenticated, function (req, res) {
    
    res.render('chat', { user: req.user, accessToken: aToken });
});

app.get('/login',
  function(req, res, next) {
    passport.authenticate('azuread-openidconnect', 
      { 
        response: res,                      // required
        resourceURL: config.resourceURL,    // optional. Provide a value if you want to specify the resource.
        customState: 'my_state',            // optional. Provide a value if you want to provide custom state value.
        failureRedirect: '/' 
      }
    )(req, res, next);
  },
  function(req, res) {
    log.info('Login was called in the Sample');
    res.redirect('/');
});

// 'GET returnURL'
// `passport.authenticate` will try to authenticate the content returned in
// query (such as authorization code). If authentication fails, user will be
// redirected to '/' (home page); otherwise, it passes to the next middleware.
app.get('/auth/openid/return',
  function(req, res, next) {
    passport.authenticate('azuread-openidconnect', 
      { 
        response: res,                      // required
        failureRedirect: '/'  
      }
    )(req, res, next);
  },
  function(req, res) {
    log.info('We received a return from AzureAD.');
    res.redirect('/');
  });

// 'POST returnURL'
// `passport.authenticate` will try to authenticate the content returned in
// body (such as authorization code). If authentication fails, user will be
// redirected to '/' (home page); otherwise, it passes to the next middleware.
app.post('/auth/openid/return',
  function(req, res, next) {
    passport.authenticate('azuread-openidconnect', 
      { 
        response: res,                      // required
        failureRedirect: '/'  
      }
    )(req, res, next);
  },
  function (req, res) {
      //
      log.info('We received a return from AzureAD.');
      res.redirect('/chat');
  });

// 'logout' route, logout from passport, and destroy the session with AAD.
app.get('/logout', function(req, res){
  req.session.destroy(function(err) {
    req.logOut();
    res.redirect(config.destroySessionUrl);
  });
});  
//var port = process.env.PORT || 3000;

// Noah Stuff
app.post('/addtask', taskList.addTask.bind(taskList));

// RegIds
//app.get('/getRegId', taskList.getRegId.bind(taskList));
//app.get('/getAllRegIds', taskList.getAllRegIds.bind(taskList));
app.post('/createRegId', function (req, res) {
    regIdsList.createRegId(req, res)
});
//app.post('/deleteRegId', taskList.deleteRegId.bind(taskList));
//app.post('/deleteAllRegIds', taskList.deleteAllRegIds.bind(taskList));

// Public Key Store
app.post('/createKeyStore', function (req, res) {
    publicKeyList.createRegId(req, res)
});
app.get('/getKeyStore', function (req, res) {
    publicKeyList.showKeys(req, res);
    //
});

app.post('/saveChat', function (req, res) {
    publicKeyList.saveChat(req, res);
    //
});

app.get('/getChat', function (req, res) {
    publicKeyList.getChat(req, res);
});

app.get('/getChats', function (req, res) {
    publicKeyList.getChats(req, res);
    //
});

/*app.get('/getChats', function (req, res) {
    publicKeyList.getChats(req, res);
    //
});*/
//app.get('/getKeyStore', taskList.getKeyStore.bind(taskList));
//app.get('/getAllKeyStores', taskList.getAllKeyStores.bind(taskList));
//app.post('/deleteKeyStore', taskList.deleteKeyStore.bind(taskList));
//app.post('/deleteAllKeyStores', taskList.deleteAllKeyStores.bind(taskList));

// Private Key Store


// Users
app.post('/createUser', function (req, res) {
    usersList.createUser(req, res)
});

app.get('/getAllUsers', function (req, res) {
    usersList.getAllUsers(req, res)
});

app.post('/translate', function (req, res) {
    
    var tranlsateMe = req.body.message;
    
    var options = {
        "method": "POST",
        "hostname": "collaboration.agknowa.org",
        "port": null,
        "path": "/api/speech/translate",
        "headers": {
            "text": "I love you so much, please marry me.",
        }
    };
    
    var req = http.request(options, function (res) {
        var chunks = [];

        res.on("data", function (chunk) {
            
            chunks.push(chunk);
        });

        res.on("end", function () {
            
            var body = Buffer.concat(chunks);
            console.log(body.toString());
        });
    });

    //req.end();


    res.send("Hello");
});


//app.post('/createUserObj', taskList.addUserObj.bind(taskList));
//app.get('/getUserObj', taskList.addUserObj.bind(taskList));
//app.get('/getAllUserObjs', taskList.addUserObj.bind(taskList));
//app.post('/deleteAllUserObjs', taskList.addUserObj.bind(taskList));
//app.post('/deleteUserObj', taskList.addUserObj.bind(taskList));

var port = 3000;
global.Enviroment = "Development"; 

if (process.env.Enviroment != null) {
    global.Enviroment = process.env.Enviroment; 
    port = process.env.PORT || 1337;
}
console.log(port);
app.listen(port); 

