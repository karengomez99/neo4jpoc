var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver').v1;
var loop = require('node-while-loop');
var path1 = __dirname + '/views/';

var app = express();

//View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist/css'));


// Driver para la session de conexión con neo4j
var driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', '1234')); // Conect neo4j
var session = driver.session();

app.get('/', function(req, res){
    res.render('index');
});

app.get('/create', function(req, res){
    res.render('create_node');
});

app.get('/createRelationship', function(req, res){
    res.render('create_relationship');
});

app.get('/findNodes', function(req, res){
    res.render('find_nodes');
});


// Servicio get para obtener nodos
app.get('/findNode', function (req, res) {
    session
        .run('MATCH (n:Nodes) RETURN n')
        .then(function (result) {
            var listaNodos = [];
            var listaRespuesta = result.records;

            for (var i = 0; i < listaRespuesta.length; i++) {
              /*  var nodo = new Object();
                nodo.nombre = listaRespuesta[i]._fields[0].properties.title;
                nodo.descripcion = listaRespuesta[i]._fields[0].properties.description;    */
                listaNodos.push(listaRespuesta[i]._fields[0].properties.title);            
            }    
            console.log(listaNodos);
            res.render('find_nodes', { listaNodos: listaNodos});
          //  res.redirect('/findNodes', segmentos);
            session.close();
        })
        .catch(function (err) {
            console.log(err);
        });
  //  res.redirect('/');
});

// Servicio Post para crear un nodo
app.post('/createNode', function (req, res) {
    var titleParam = req.body.nodeTitle;
    var descriptionParam = req.body.nodeDescription;

    session
        .run('CREATE(n:Nodes {title:{nodeTitleParam}, description:{nodeDescriptionParam}}) RETURN n.title', { nodeTitleParam: titleParam, nodeDescriptionParam: descriptionParam })
        .then(function (result) {
            res.redirect('/');
            session.close();
        })
        .catch(function (err) {
            console.log(err);
        });
  //  res.redirect('/');
});


// Servicio Post para relacionar dos conceptos
app.post('/createRelation', function (req, res) {
    var nodeFrom = req.body.nodeFrom;
    var nodeTo = req.body.nodeTo;
    var relationParam = req.body.relation;

    session
        .run('MATCH(a:Nodes {title:{titleParam1}}),(b:Nodes {title:{titleParam2}}) MERGE(a)-[r:'+ relationParam +']->(b) RETURN a,b', { titleParam1: nodeFrom, titleParam2: nodeTo })
        .then(function (result) {
            res.redirect('/');
            session.close();
        })
        .catch(function (err) {
            console.log(err);
        });
    res.redirect('/');
});

/* Servicio Post para encontrar el shortest path entre dos nodos
app.post('/firstActor/secondActor/find', function (req, res) {
    var title1 = req.body.title1;
    var title2 = req.body.title2;

    session
        .run('MATCH p=shortestPath((n:Concept {title: {firstActor}})-[*..4]->(m:Concept {title: {secondActor}})) RETURN p', { firstActor: title1, secondActor: title2 })
        .then(function (result) {
            var segmentos = result.records[0]._fields[0].segments[0].start.properties.title;

            res.render('index1', { title0: segmentos });
            
           for(var count = 0; count < segmentos.length; count++){
               console.log(segmentos[count].start.properties.title);
               console.log(segmentos[count].relationship.type);
           }

         //   res.redirect('/');
            session.close();
        })
        .catch(function (err) {
            console.log(err);
        });
 //   res.redirect('/');
});*/

/* Servicio Post para borrar base de datos
app.post('/borrarbd', function (req, res) {
  
    session
        .run('MATCH (n) OPTIONAL MATCH (n)-[r]-() DELETE n,r')
        .then(function (result) {
            console.log('Bd borrada');
            res.redirect('/');
            session.close();
        })
        .catch(function (err) {
            console.log(err);
        });
    res.redirect('/');
});*/

app.listen(3000);
console.log('Server Started on Port 3000');

module.exports = app;