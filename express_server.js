const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bcrypt = require('bcrypt');
var cookieSession = require('cookie-session');

// midleware

// this works like body-parser it built in expresss
app.use(express.json());

// using cookieSession midleware
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))

app.use(express.urlencoded({
  extended: false
}));

// set view engine 
app.set('view engine', 'ejs');

// urlDatabase it a simle js object for now
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

// users and database 
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

// My functions 

// Generate Random string it's used to create id's for urls and user's
function generateRandomString() {
  return (Math.random() * 6).toString(36).substring(6).toUpperCase();
}

// Checking if user input is valid before storing it in user's database
function newUserCheck(email, password, users) {
  for (userId in users) {
    if (users[userId].email === email) {
      return false;
    }
    if (email === '' && password === '') {
      return false;
    }
  }
  return true;
}

// Sorts url for a specific user  and returns an object
function userUrls(userId, urlDatabase) {
  let newObj = {};
  for (shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === userId) {
      newObj[shortURL] = urlDatabase[shortURL];
    }
  }
  return newObj;
}

// Login post route  
app.post('/login', (req, res) => {
  // getting the email and password from the request body
  const {email, password} = req.body;
  // looping in to id in user's database
  for (id in users) {
    // Checking if user id exist in the users db and comparing email and password if they match 
    if (users[id].email == email && bcrypt.compareSync(password, users[id].password)) {
      // if match storing id in userId const 
      const userId = id;
      // setting a cookie session 
      req.session.user_id = userId;
      // then redirect to the route
      return res.redirect('/');
    }
  }
  // else return a status code 403 for and send a message
  res.status(403).send('<h2>fail to login incorrect username or password create account <a href="/register"> here </a> </h2>')
});

// register post route 
app.post('/register', (req, res) => {
  // getting request body
  const { email, password } = req.body;
  // generatting a new user id 
  const newUserId = generateRandomString();
  // cheking if password and email are not empty and does not allready exist 
  if (newUserCheck(email, password, users)) {
    // creating new user in db 
    users[newUserId] = {
      id: newUserId,
      email: email,
      password: bcrypt.hashSync(password, 10)
    }
    // setting a cookie session
    req.session.user_id = newUserId;
    // redirecting user in home page
    res.redirect("/");
  } else {
    // else return 403 status and a message  to the user
    res.status(403).send('user all ready exist');
  }
});

// urls post rout for creating new Tiny urls only if user is login  
app.post("/urls", (req, res) => {
  // geting the user id
  const userId = req.session.user_id;
  // cheking if user exist
  if(users[userId]){
    // generating new id for the new url
    let newUrlId = generateRandomString();
      urlDatabase[newUrlId] = {
      longURL: req.body.longURL,
      userID: userId
  }
  // redirect user to urls get path 
  res.redirect('/');
  }else{
    res.status(401).send('invalid request please login');
  }
});

// delete url when user is  loged in 
app.post('/urls/:shortURL/delete', (req, res) => {
  // getting shorturl from url
  const { shortURL } = req.params;
  // getting user id from cookie-session
  const userId = req.session.user_id;
  // cheking if user exist and he's id match url id 
  if (users[userId] && urlDatabase[shortURL].userID == userId) {
    // delete url
    delete urlDatabase[shortURL];
    res.redirect('/');
  } else {
    // else response with status code and message error 
    res.status(401).send('invalid request login');
  }
});

// update url if user in loged in and url exist
app.post('/urls/:shortURL/update', (req, res) => {
  // getting shortUrl from as parame from url
  const { shortURL } = req.params;
  // getting user id from cookie-session
  const userId = req.session.user_id;
  // cheking if user is login and id match url user id
  if (users[userId] && urlDatabase[shortURL].userID == userId) {
    // updating the url
    urlDatabase[shortURL].longURL = req.body.update;
    res.redirect('/');
  } else {
    // else responde with status code and error message 
    res.status(401).send('invalid request register');
  }
});

// logout route 
app.post('/logout', (req, res) => {
  // Setting cookie session to null
  req.session = null;
  res.redirect('/');
});

// Get requests 

// urls redirection from Tiny url to the actual url
app.get("/u/:shortURL", (req, res) => {
  // getting the long url from the short url 
  let longURL = urlDatabase[req.params.shortURL].longURL;
  // checking if its exist
  if (longURL) {
    // then redirect to longURL 
    res.redirect(longURL);
  } else {
    // else send error
    res.send('error')
  }
});

// get route for register page
app.get('/register', (req, res) => {
  // getting the user
  const user = {
    user: users[req.session.user_id]
  }
  // rendering the view
  res.render('register', user);
});

// login route 
app.get('/login', (req, res) => {
  // giving the user id to render function
  const templateVars = {
    user: users[req.session.user_id]
  }
  // render the login view
  res.render('login', templateVars);
});

// redirecting from / route to urls route
app.get('/', (req, res) => {
  res.redirect('/urls')
});

// urls get route
app.get("/urls", (req, res) => {
  // getting user id from session cookie
  const userId = req.session.user_id;
  // getting urls for this specific user
  let urls = userUrls(userId, urlDatabase);
  // cheking id user exist 
  if (users[userId]) {
    // render view with usels
    res.render("urls_index", {
      urls: urls,
      user: users[userId]
    });
  } else {
    // else redirect to user login page
    res.redirect('/login');
  }
});

app.get('/urls/new', (req, res) => {
  const templateVars = {
    cookie: req.session.user_id,
    user: users[req.session.user_id]
  }
  if (users[req.session.user_id]) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

// showing user url 
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.session.user_id]
  }
  // Render the view
  res.render("urls_show", templateVars);
});

// Setting the port server 
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});