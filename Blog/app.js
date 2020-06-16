var express = require('express')
var bodyParser = require('body-parser')
var session = require('express-session')
var morgan = require('morgan')
var port = process.env.PORT||5000;

var app = express();

app.use(bodyParser.json())
app.use(morgan('combined'))

app.use(session({
    secret: 'someRandomSecretValue',
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 30 },
    proxy: true,
    resave: true,
    saveUninitialized: true
}));

const sqlite3 = require('sqlite3').verbose()

//Dont forget to do db.close

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html')
})


app.get('/statistics', function (req, res) {
  res.sendFile(__dirname + '/statistics.html')
})

app.get('/styles', function (req, res) {
  res.sendFile(__dirname + '/styles.css')
})

app.get('/styles2', function (req, res) {
  res.sendFile(__dirname + '/styles2.css')
})

app.get('/allStories', function (req, res) {
  var template = `
  <head><link rel="stylesheet" type="text/css" href="/styles">
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.0/umd/popper.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js"></script>
</head>
<body style="background-color:maroon;">
  <ul>
<nav class="navbar navbar-expand-sm bg-dark navbar-dark fixed-top">
  <ul class="navbar-nav">
    <li class="nav-item">
      <a class="nav-link" href="/">Home</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="/allStories">See blog posts</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="/editStories">Edit your stories</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="/statistics">Statistics</a>
    </li>
  </ul>
</nav><br><br><br> <div id="main" ><br><br>

  `
      ;
  let db = new sqlite3.Database('blog.db', (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Connected to the in-memory SQlite database.');
  });
  //Server side templating node.js
  db.all("SELECT * FROM stories", [], (err, rows) => {
    if (err) {
      console.log(err);
    }
    rows.forEach((row) => {
        template += `
        <img src="${row.image}" style="width:15%;height:175px;border-radius:50%;" align="left"> 
        <div><h1>${row.title}</h1><br>
        <p>Total Pageviews: ${row.pageviews}</p>
        <a href="/users/${row.id}">Read more</a><br><br>
        </div> <hr><br>
      `

    });
    template += "</div></body>"
    res.send(template);
  });

  db.close();
})

//Graph : chart.js
app.get('/editStories', function (req, res) {
  var editTemplate = `
  <head><link rel="stylesheet" type="text/css" href="/styles">
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.0/umd/popper.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js"></script>
</head>
<body style="background-color:maroon;">
  <nav class="navbar navbar-expand-sm bg-dark navbar-dark fixed-top">
  <ul class="navbar-nav">
    <li class="nav-item">
      <a class="nav-link" href="/">Home</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="/allStories">See blog posts</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="/editStories">Edit your stories</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="/statistics">Statistics</a>
    </li>
  </ul>
</nav><br><br><br><div id="main"><br><br>`
      ;
  let db = new sqlite3.Database('blog.db', (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Connected to the in-memory SQlite database.');
  });
  //Server side templating node.js
  db.all("SELECT * FROM stories", [], (err, rows) => {
    if (err) {
      console.log(err);
    }
    rows.forEach((row) => {
        editTemplate += `
        <img src="${row.image}" style="width:15%;height:175px;border-radius:50%;" align="left">
        <div><h1>${row.title}</h1><br>
        <p>Total Pageviews: ${row.pageviews}</p>

        <a href="/edit/${row.id}">Edit Story</a><br>
        <a href="/delete/${row.id}">Delete Story</a><br>
        </div> <hr><br>
      `

    });
    editTemplate += "</div></body>"
    res.send(editTemplate);
  });

  db.close();
})

app.post('/stories', function (req, res) {
  var title = req.body.title
  var image = req.body.image
  var story = req.body.story
  var sql = "INSERT INTO stories(title,image,story,pageviews) VALUES ($1,$2,$3,$4)"
  let db = new sqlite3.Database('blog.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the in-memory SQlite database.');
});
  db.run(sql, [title,image,story,0] , function(err){
    if (err) {
      res.status(500).send(err.toString())
      console.log(err.toString())
    }
    // get the last insert id
    console.log('A row has been inserted');
  });

  db.close();
})


app.get('/users/:id', function (req, res) {
  var today = new Date();
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  var storyTemplate = `
  <head><link rel="stylesheet" type="text/css" href="/styles2">
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.0/umd/popper.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js"></script>
</head>
<body style="background-color:maroon;">
  <nav class="navbar navbar-expand-sm bg-dark navbar-dark fixed-top">
  <ul class="navbar-nav">
    <li class="nav-item">
      <a class="nav-link" href="/">Home</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="/allStories">See blog posts</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="/editStories">Edit your stories</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="/statistics">Statistics</a>
    </li>
  </ul>
</nav><br><br><br> <div id="mainStory"><br><br>`
      ;
  let db = new sqlite3.Database('blog.db', (err) => {
    if (err) {
      return console.error(err.message);
    }
      console.log('Connected to the in-memory SQlite database.');
    });
  db.all("SELECT title,story,pageviews FROM stories WHERE id = $1", [req.params.id], (err, rows) => {
    if (err) {
      throw err;
    }
    rows.forEach((row) => {
        storyTemplate += `
        <div id="main" align="center">
        <h1>${row.title}</h1> <hr>
        <font size="5px;">${row.story}</font>
        </div>
      `
      row.pageviews += 1;
      //Add another counter and insert into ANOTHER TABLE for each minute within 3 minutes interval.
      db.run("UPDATE stories SET pageviews = $1 WHERE id = $2", [row.pageviews,req.params.id] , function(err){
        if (err) {
          res.status(500).send(err.toString())
          console.log(err.toString())
        }
        // get the last insert id
        console.log('You got a new reader!');
      });
      db.run("INSERT INTO hits (hit,date) VALUES ($1,$2)", [1,date] , function(err){
        if (err) {
          res.status(500).send(err.toString())
          console.log(err.toString())
        }
        // get the last insert id
        console.log('Added to hits!');
      });
    });
    storyTemplate += '</body>'
    res.send(storyTemplate);
  });

  db.close();
})

app.get('/edit/:id', function (req, res) {
  var temp = `
  <head><link rel="stylesheet" type="text/css" href="/styles2">
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.0/umd/popper.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js"></script>
</head>
<body style="background-color:maroon;">
  <nav class="navbar navbar-expand-sm bg-dark navbar-dark fixed-top">
  <ul class="navbar-nav">
    <li class="nav-item">
      <a class="nav-link" href="/">Home</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="/allStories">See blog posts</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="/editStories">Edit your stories</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="/statistics">Statistics</a>
    </li>
  </ul>
</nav><br><br><br> <br> <div id="main"><br><br>`
      ;
  let db = new sqlite3.Database('blog.db', (err) => {
    if (err) {
      return console.error(err.message);
    }
      console.log('Connected to the in-memory SQlite database.');
    });
  db.all("SELECT title,story FROM stories WHERE id = $1", [req.params.id], (err, rows) => {
    if (err) {
      throw err;
    }
    rows.forEach((row) => {
        temp += `
        <div id="main" align="center">
        <h3>Edit Your Story:</h3>
        <input type="text" id="title" value="${row.title}"><br>

        <textarea cols="100" rows="25" id="story">${row.story}</textarea><br>


        <input type="submit" id="submit_btn" value="Update Your story">
        </div>
        <script type="text/javascript">
          function sleep(milliseconds) {
            var start = new Date().getTime();
            for (var i = 0; i < 1e7; i++) {
              if ((new Date().getTime() - start) > milliseconds){
                break;
              }
            }
          }
          </script>
          <script type="text/javascript">
            var submit = document.getElementById('submit_btn')
              submit.onclick = function () {
                  var request = new XMLHttpRequest();
                  request.onreadystatechange = function() {
                      if (this.readyState == 4 && this.status == 200 || this.status == 304){
                        console.log('Should Redirect!')
                        //window.location.replace('/allStories')
                  } else {
                        //submit.value = "Some error!"
                        //alert('Some error')
                        submit.value = "Some error occured!"
                      }
                  }
                  var title = document.getElementById('title').value;
                  var story = document.getElementById('story').value;
                  request.open('POST', '/updateStory', true);
                  request.setRequestHeader('Content-Type', 'application/json');
                  request.send(JSON.stringify({title:title,story:story,id:${req.params.id}}));
                  submit.value = "Submitting..."
                  sleep(3000)
                  window.location.replace('/allStories')
              }
          </script>
          </body>
      `
    });
    res.send(temp);
  });

  db.close();
})

app.post('/updateStory', function (req, res) {
  var title = req.body.title
  var story = req.body.story
  var id = req.body.id
  var sql = "UPDATE stories SET title = $1, story = $2 WHERE id = $3"
  let db = new sqlite3.Database('blog.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the in-memory SQlite database.');
});
  db.run(sql, [title,story,id] , function(err){
    if (err) {
      res.status(500).send(err.toString())
      console.log(err.toString())
    }
    // get the last insert id
    console.log('A row has been updated!');
  });

  db.close();
})


app.get('/delete/:id', function (req, res) {
  var redirect = `<html><script>window.location.replace('/editStories')</script></html>`
  let db = new sqlite3.Database('blog.db', (err) => {
    if (err) {
      return console.error(err.message);
    }
      console.log('Connected to the in-memory SQlite database.');
    });
  db.all("DELETE FROM stories WHERE id = $1", [req.params.id], (err, rows) => {
    if (err) {
      throw err;
    }
    res.send(redirect);
  });

  db.close();
})

app.get('/totalViews', function(req,res){
  let db = new sqlite3.Database('blog.db', (err) => {
    if (err) {
      return console.error(err.message);
    }
      console.log('Connected to the in-memory SQlite database.');
    });
  db.all("SELECT SUM(pageviews) AS pageviews FROM stories", [], (err, rows) => {
    if (err) {
      throw err;
    }
    console.log(JSON.stringify(rows));
    res.send(JSON.stringify(rows));
  });

  db.close();
})

app.get('/hits', function(req,res){
  let db = new sqlite3.Database('blog.db', (err) => {
    if (err) {
      return console.error(err.message);
    }
      console.log('Connected to the in-memory SQlite database.');
    });
    db.all("SELECT * FROM hits", [], (err, rows) => {
      if (err) {
        throw err;
      }
    res.send(JSON.stringify(rows));
    });   

  db.close();
})



app.listen(port, function () {
  console.log('Server running on port: ' + port);
});