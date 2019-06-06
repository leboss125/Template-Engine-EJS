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

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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


function newUserCheck(email, password){
  if(email !== '' && password !== '' ){
      return true;
  }
  return false;
}


// post request

// app.post('/login',(req,res) =>{
//     const { username } = req.body;
//     res.cookie('user_id', username);
//     res.redirect('/')
// });

app.post('/register',(req,res)=>{
  const { email, password } = req.body;
  const userId = generateRandomString();
  if(newUserCheck(email, password)){
    users[userId]  = {
      id: userId,
      email: email,
      password: password
    }
    console.log('user_id',userId, users)
      if(users[userId]) {
        res.cookie('user_id',userId);
        res.status(200).redirect('/')
      }
  }
    res.status(401).redirect('/register');
});


app.post("/urls", (req, res) => {
  let random = generateRandomString().toString();
  urlDatabase[random] = req.body.longURL;
  res.redirect('/');
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const { shortURL } = req.params;
  delete urlDatabase[shortURL];
  res.redirect('/');
});

app.post('/urls/:shortURL/update', (req, res) => {
  const { shortURL } = req.params;
  // console.log(shortURL, req.body)
  urlDatabase[shortURL] = req.body.update
  res.redirect('/');
});

app.post('/logout', (req,res)=>{
  res.clearCookie('user_id');
  res.redirect('/');
});

// get requests 

app.get("/u/:shortURL", (req, res) => {
  // const longURL = ... 
  let id = urlDatabase[req.params.shortURL];
  if (id) {
    res.redirect(id);
  } else {
    res.send('error')
  }
});


app.get('/register', (req,res) =>{
  const username = { cookie: req.cookies['user_id'], users: users }
  res.render('register', username);
})

app.get("/", (req, res) => {
  let templateVars = {urls: urlDatabase,cookie: req.cookies['user_id'], users:users};
  res.render("urls_index", templateVars);
});


app.get('/urls/new', (req, res) => {
  res.render("urls_new",{cookie: req.cookies['user_id'], users:users});
})

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    cookie: req.cookies['user_id'],
    users:users
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