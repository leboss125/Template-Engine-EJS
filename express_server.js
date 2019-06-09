const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bcrypt = require('bcrypt');
var cookieSession = require('cookie-session')


// midleware

app.use(express.json());
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))

app.use(express.urlencoded({
  extended: false
}));

// set view engine 

app.set('view engine', 'ejs');

//user and urlDatabase

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
      return false;
    }
    if (email === '' && password === '') {
      return false;
    }
  }
  return true;
}

function userUrls(userId, urlDatabase) {
  let newObj = {};
  for (shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === userId) {
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
    if (users[key].email == email && bcrypt.compareSync(password, users[key].password)) {
      const userId = key;
      req.session.user_id = userId;
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
      password: bcrypt.hashSync(password, 10)
    }
    req.session.user_id = userId;
    res.redirect("/");
  } else {
    res.status(403).send('user all ready exist');
  }
});

app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  let random = generateRandomString();
  urlDatabase[random] = {
    longURL: req.body.longURL,
    userID: userId
  }
  res.redirect('/');
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const {
    shortURL
  } = req.params;
  const userId = req.session.user_id;
  if (users[userId] && urlDatabase[shortURL].userID == userId) {
    delete urlDatabase[shortURL];
    res.redirect('/');
  } else {
    res.status(401).send('invalid request login');
  }
});

app.post('/urls/:shortURL/update', (req, res) => {
  const {
    shortURL
  } = req.params;
  const userId = req.session.user_id;
  if (users[userId] && urlDatabase[shortURL].userID == userId) {
    urlDatabase[shortURL].longURL = req.body.update;
    res.redirect('/');
  } else {
    res.status(401).send('invalid request register');
  }
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

// get requests 

app.get("/u/:shortURL", (req, res) => {
  let id = urlDatabase[req.params.shortURL].longURL;
  if (id) {
    res.redirect(id);
  } else {
    res.send('error')
  }
});

app.get('/register', (req, res) => {
  const Newuser = {
    cookie: req.session.user_id,
    user: users[req.session.user_id]
  }
  res.render('register', Newuser);
})

app.get('/login', (req, res) => {
  const templateVars = {
    cookie: req.session.user_id,
    user: users[req.session.user_id]
  }
  res.render('login', templateVars);
})

app.get('/', (req, res) => {
  res.redirect('/urls')
})

app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  let urls = userUrls(userId, urlDatabase);
  if (users[userId]) {
    res.render("urls_index", {
      urls: urls,
      cookie: userId,
      user: users[userId]
    });
  } else {
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
})

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    cookie: req.session.user_id,
    user: users[req.session.user_id]
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