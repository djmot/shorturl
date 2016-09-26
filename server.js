var express = require('express');
var path = require('path');
var app = express();

app.get('/new/*', function(request, response) {
    response.writeHead(200, { 'Content-Type' : 'text/plain' });
    response.end("new");
});

app.get('*', function(request, response) {
    response.sendFile(path.join(__dirname, '/about.html'));
});

app.listen(process.env.PORT, process.env.IP);
console.log("Listening on port " + process.env.PORT);
