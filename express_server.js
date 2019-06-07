const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const cookieParser = require('cookie-parser');
// const bodyParser = require("body-parser");
// app.use(bodyParser.urlencoded({extended: true}));
// this is working its built in express dont need to install body-parser

// midleware

app.use(express.json());

app.use(express.urlencoded({
  extended: false
}));

app.use(cookieParser());

// set view engine 

app.set('view engine', 'ejs');

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

function generateRandomString() {
  return (Math.random() * 6).toString(36).substring(6).toUpperCase();
}

function newUserCheck(email, password, users) {
  for (userId in users) {
    if (users[userId].email === email) {
      return false
    }
    if (email === '' && password === '') {
      return false
    }
  }
  return true
}


function userUrls(cookieId, urlDatabase) {
  let newObj = {}
  let randomKey;
  for (shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === cookieId) {
      // randomKey = generateRandomString();
      newObj[shortURL] = urlDatabase[shortURL];
    }
  }
  return newObj;
}


app.post('/login', (req, res) => {
  const {
    email,
    password
  } = req.body;
  for (key in users) {
    if (users[key].email == email && users[key].password == password) {
      const userId = key;
      res.cookie('user_id', userId);
      res.redirect('/');
      return;
    }
  }
  res.status(403).send('<h2>fail to login incorrect username or password create account <a href="/register"> here </a> </h2>')
});

app.post('/register', (req, res) => {
  const {
    email,
    password
  } = req.body;
  const userId = generateRandomString();
  if (newUserCheck(email, password, users)) {
    users[userId] = {
      id: userId,
      email: email,
      password: password
    }
    res.cookie('user_id', userId).redirect("/");
  } else {
    res.redirect('/register');
  }
});


app.post("/urls", (req, res) => {
  const cookie = req.cookies['user_id'];
  let random = generateRandomString();
  urlDatabase[random] = {
    longURL: req.body.longURL,
    userID: cookie
  }
  res.redirect('/');
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const {
    shortURL
  } = req.params;

  const userId = req.cookies['user_id'];
  if(users[userId] && urlDatabase[shortURL].userID == userId){
    delete urlDatabase[shortURL];
    res.redirect('/');
  }else{
    res.status(401).send('invalid request login')
  }
 
});

app.post('/urls/:shortURL/update', (req, res) => {
  const {
    shortURL
  } = req.params;
  const userId = req.cookies['user_id'];
  if(users[userId] && urlDatabase[shortURL].userID == userId){
  urlDatabase[shortURL].longURL = req.body.update;
  res.redirect('/');
  }else{
    res.status(401).send('invalid request');
  }
  
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/');
});


// get requests 
app.get("/u/:shortURL", (req, res) => {
  // const longURL = ... 
  let id = urlDatabase[req.params.shortURL].longURL;
  if (id) {
    res.redirect(id);
  } else {
    res.send('error')
  }
});

app.get('/register', (req, res) => {
  const username = {
    cookie: req.cookies['user_id'],
    users: users
  }
  res.render('register', username);
})

app.get('/login', (req, res) => {
  const templateVars = {
    cookie: req.cookies['user_id'],
    users: users
  }
  res.render('login', templateVars);
})

app.get("/", (req, res) => {
  const cookie = req.cookies['user_id'];
  let urls = userUrls(cookie, urlDatabase);
  if (users[cookie]) {
    res.render("urls_index", {
      urls: urls,
      cookie: cookie,
      users: users
    });
  } else {
    res.redirect('/login')
  }
});


app.get('/urls/new', (req, res) => {
  const templateVars = {
    cookie: req.cookies['user_id'],
    users: users
  }
  if (users[req.cookies['user_id']]) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
})

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    cookie: req.cookies['user_id'],
    users: users
  };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});