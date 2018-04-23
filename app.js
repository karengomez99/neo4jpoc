var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver').v1;

var app = express();

//View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Driver para la session de conexión con neo4j
var driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', '12345')); // Conect neo4j
var session = driver.session();

// Servicio get para obtener los nodos
app.get('/', function (req, res) {
    session
        .run('MATCH(n:Movie) RETURN n')
        .then(function(result) {
            var movieArr = [];
            result.records.forEach(function (record) {
                movieArr.push({
                    title: record._fields[0].properties.title,
                    tagline: record._fields[0].properties.tagline,
                    released: record._fields[0].properties.released,
                });
            });

            session
                .run('MATCH(n:Actor) RETURN n')
                .then(function(result2) {
                    var personArray = [];
                    result2.records.forEach(function (record) {
                        personArray.push({
                            id: record._fields[0].identity.low,
                            name: record._fields[0].properties.name
                        });
                    });
                    res.render('index', {
                        movies: movieArr,
                        actors: personArray
                    });
                })
                .catch(function (err) {
                    console.log(err);
                });
        })
        .catch(function (err) {
            console.log(err);
        });
});

// Servicio Post para crear una película
app.post('/movie/add', function(req, res) {
    var title = req.body.title;
    var released = req.body.released;
    var tagLine = req.body.tagline;

    session
        .run('CREATE(n:Movie {title:{titleParam}, tagline:{tagParam}, released:{yearParam}}) RETURN n.title', {titleParam: title, tagParam:tagLine, yearParam: released})
        .then(function(result) {
            res.redirect('/');
            session.close();
        })
        .catch(function(err) {
            console.log(err);
        });
    res.redirect('/');
});

// Servicio Post para crear un actor
app.post('/actor/add', function(req, res) {
    var name = req.body.name;

    session
        .run('CREATE(n:Actor {name:{nameParam}}) RETURN n.name', {nameParam: name})
        .then(function(result) {
            res.redirect('/');
            session.close();
        })
        .catch(function(err) {
            console.log(err);
        });
    res.redirect('/');
});

// Servicio Post para crear un actor
app.post('/movie/actor/add', function(req, res) {
    var title = req.body.title;
    var name = req.body.name;

    session
        .run('MATCH(a:Actor {name:{nameParam}}),(b:Movie {title:{titleParam}}) MERGE(a)-[r:ACTED_IN]-(b) RETURN a,b', {titleParam:title, nameParam: name})
        .then(function(result) {
            res.redirect('/');
            session.close();
        })
        .catch(function(err) {
            console.log(err);
        });
    res.redirect('/');
});


app.listen(3000);
console.log('Server Started on Port 3000');

module.exports = app;