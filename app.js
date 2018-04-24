var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver').v1;
var path1 = __dirname + '/views/';

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
        .run('MATCH(n:Concept) RETURN n')
        .then(function(result) {
            var movieArr = [];
            result.records.forEach(function (record) {
                movieArr.push({
                    title: record._fields[0].properties.title,
                    released: record._fields[0].properties.released
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
                    res.sendFile(path1 + 'poc.html', {
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

    session
        .run('CREATE(n:Concept {title:{titleParam}, released:{yearParam}}) RETURN n.title', {titleParam: title, yearParam: released})
        .then(function(result) {
            res.redirect('/');
            session.close();
        })
        .catch(function(err) {
            console.log(err);
        });
    res.redirect('/');
});


// Servicio Post para relacionar dos conceptos
app.post('/movie/actor/add', function(req, res) {
    var title1 = req.body.title1;
    var title2 = req.body.title2;

    session
        .run('MATCH(a:Concept {title:{titleParam1}}),(b:Concept {title:{titleParam2}}) MERGE(a)-[r:CONCEPT]-(b) RETURN a,b', {titleParam1:title1, titleParam2: title2})
        .then(function(result) {
            res.redirect('/');
            session.close();
        })
        .catch(function(err) {
            console.log(err);
        });
    res.redirect('/');
});

// Servicio Post para encontrar el shortest path entre dos nodos
app.post('/firstActor/secondActor/find', function(req, res) {
    var title1 = req.body.title1;
    var title2 = req.body.title2;

    session
        .run('MATCH p=shortestPath((n:Concept {title: {firstActor}})-[*..4]-(m:Concept {title: {secondActor}})) RETURN p', {firstActor:title1, secondActor:title2})
        .then(function(result) {
            console.log(result.records[0]._fields);
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