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

// Checking if user input is valid 
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

// Sorts url for a specific user and returns an object
function userUrls(userId, urlDatabase) {
  let newObj = {};
  for (shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === userId) {
      newObj[shortURL] = urlDatabase[shortURL];
    }
  }
  return newObj;
}

// Checking if user id exist in the users db and comparing email and password if they match 
app.post('/login', (req, res) => {
  const {email, password} = req.body;
  for (id in users) {
    if (users[id].email === email && bcrypt.compareSync(password, users[id].password)) {
      const userId = id;
      // setting a cookie session 
      req.session.user_id = userId;
      return res.redirect('/');
    }
  }
  // else return a status code 403 for and send a message
  res.status(403).send('<h2>fail to login incorrect username or password create account <a href="/register"> here </a> </h2>')
});

// cheking if password and email are not empty and email does not allready exist 
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  const newUserId = generateRandomString();
  if (newUserCheck(email, password, users)) {
    // creating new user in db 
    users[newUserId] = {
      id: newUserId,
      email: email,
      password: bcrypt.hashSync(password, 10)
    }
    // setting a cookie session
    req.session.user_id = newUserId;
    res.redirect("/");
  } else {
    res.status(403).send('user all ready exist');
  }
});

// creating new Tiny urls only if user is login 
app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  // cheking if user exist
  if(users[userId]){
    // generating new id for the new url
    let newUrlId = generateRandomString();
      urlDatabase[newUrlId] = {
      longURL: req.body.longURL,
      userID: userId
  }
  res.redirect('/');
  }else{
    res.status(401).send('invalid request please login');
  }
});

// delete url when user only if user is login
app.post('/urls/:shortURL/delete', (req, res) => {
  const { shortURL } = req.params;
  const userId = req.session.user_id;
  // checking if user exist and user id match url userid
  if (users[userId] && urlDatabase[shortURL].userID === userId) {
    delete urlDatabase[shortURL];
    res.redirect('/');
  } else {
    res.status(401).send('invalid request login');
  }
});

// update url if user in loged in and url exist
app.post('/urls/:shortURL/update', (req, res) => {
  const { shortURL } = req.params;
  const userId = req.session.user_id;
  // cheking if user is login and id match url user id
  if (users[userId] && urlDatabase[shortURL].userID === userId) {
    urlDatabase[shortURL].longURL = req.body.update;
    res.redirect('/');
  } else {
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

// urls redirection from Tiny url to the actual url long url
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  if (urlDatabase[shortURL]) {
    res.redirect(urlDatabase[shortURL].longURL);
  } else {
    res.send('sorry this short url does not exist');
  }
});

// render register view
app.get('/register', (req, res) => {
  const user = {
    user: users[req.session.user_id]
  }
  res.render('register', user);
});

// render login view
app.get('/login', (req, res) => {
  
  const templateVars = {
    user: users[req.session.user_id]
  }
  res.render('login', templateVars);
});

// redirecting from / route to urls route
app.get('/', (req, res) => {
  res.redirect('/urls')
});

// render view showing urls to the user 
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  let urls = userUrls(userId, urlDatabase);
  if (users[userId]) {
    res.render("urls_index", {
      urls: urls,
      user: users[userId]
    });
  } else {
    res.redirect('/login');
  }
});

// render create new url page
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

  // Render the url view
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.session.user_id]
  }
  res.render("urls_show", templateVars);
});

// Setting the port server 
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});