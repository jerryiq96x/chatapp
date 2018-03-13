var WebSocketServer = require('websocket').server;
var http = require('http');

module.exports = function(app,server){
    app.get('/box', function(req,res){
        var server = http.createServer(function(req,res){

        });

        // console.log(WebSocketServer);
        var wsServer = new WebSocketServer({
            httpServer: server
        }); 
        wsServer.on('request', function(request){
            console.log('Connect from => ' + request.origin);
        });
    });
}