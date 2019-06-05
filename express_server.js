const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const cookieParser = require('cookie-parser');
// const bodyParser = require("body-parser");
// app.use(bodyParser.urlencoded({extended: true}));
// this is working its built in express dont need to install body-parser
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}))

app.use(cookieParser())

app.set('view engine', 'ejs');

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


app.post('/login',(req,res) =>{
    const { username } = req.body;
    res.cookie('username', username);
    res.redirect('/')
})

function generateRandomString() {
  return (Math.random() * 6).toString(36).substring(6).toUpperCase();
}
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
  res.clearCookie('username');
  res.redirect('/');
});


app.get("/u/:shortURL", (req, res) => {
  // const longURL = ... 
  let id = urlDatabase[req.params.shortURL];
  if (id) {
    res.redirect(id);
  } else {
    res.send('error')
  }
  // res.redirect(longURL);
});


// console.log(generateRandomString())
app.get("/", (req, res) => {
  let templateVars = {urls: urlDatabase,username: req.cookies['username']};
  res.render("urls_index", templateVars);
});


app.get('/urls/new', (req, res) => {
  res.render("urls_new",{username: req.cookies['username']});
})

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies['username']
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