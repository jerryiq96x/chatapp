var express = require('express');
var app = express();
var WebSocketServer = require('websocket').server;
var http = require('http');
var helpers = require('./libs/helpers');
var port = process.env.PORT || 1337;

var server = http.createServer();

var clients = [];
var masters = [];
var history = [];
var customerNhanvien = [];
var customerClients = [];
var clientsNhap = [];


server.listen(port, function(){
    console.log('Server is listening on port + ' + port);
});

var wsServer = new WebSocketServer({
    httpServer: server,
    path: "/box"
});
// var wsServerForMessage = new WebSocketServer({
//     httpServer: server,
//     path: "/message"
// });

// w
wsServer.on('request', function(request){
    var conn = request.accept(null, request.origin);
    // var index = clientsNhap.push(conn)-1;
    var idUser = request.key;
    var client_cut = '';
    var nv_cut = '';
    var index = '';
    var ct_cut = '';
    // console.log(conn);
    // customerNhanvien['megthomatho'] = clients;

    conn.on('message', function(message){
        // console.log('message => ', message);
        if(message.type === 'utf8')
        {
            var object = JSON.parse(message.utf8Data);
            if(object.createClient){
                if(object.createClient.type==='master'){
                    var inObject = object.createClient;
                    ct_cut = inObject.ctId;       
                    nv_cut = inObject.nvId;
                    
                    if(!customerNhanvien[inObject.ctId])
                    {
                        customerNhanvien[inObject.ctId] = [];
                        customerNhanvien[inObject.ctId].push(inObject.nvId);
                    }
                    else{
                        if(!customerNhanvien[inObject.ctId].includes(inObject.nvId))
                            customerNhanvien[inObject.ctId].push(inObject.nvId);
                    }
                    if(!clients[inObject.nvId])
                    {
                        clients[inObject.nvId] = [];
                        clients[inObject.nvId].push(conn);
                    }
                    else{
                        clients[inObject.nvId].push(conn);
                    }
                    console.log('customerNhanvien => ',customerNhanvien);
                    //lấy lại danh sách người dùng đang truy cập mỗi lần có NV kết nối
                    if(customerClients[inObject.ctId])
                    {
                        var json_client = JSON.stringify(customerClients[inObject.ctId]);
                        for(let j =0;j<clients[inObject.nvId].length;j++)
                            clients[inObject.nvId][j].sendUTF(JSON.stringify({type: 'listClientsConnected', data: json_client}));
                    }
                    
                }
                
                else{
                    var inObject = object.createClient;
                    client_cut = inObject.clId;
                    ct_cut = inObject.ctId;
                    if(!customerClients[inObject.ctId])
                    {
                        customerClients[inObject.ctId] = [];
                        customerClients[inObject.ctId].push(inObject.clId);
                    }
                    else{
                        if(!customerClients[inObject.ctId].includes(inObject.clId))
                            customerClients[inObject.ctId].push(inObject.clId);
                    }

                    if(!clients[inObject.clId])
                    {
                        clients[inObject.clId] = [];
                        clients[inObject.clId].push(conn);
                    }
                    else{
                        clients[inObject.clId].push(conn);
                    }
                    //lấy danh sách người dùng, broadcast cho toàn bộ nhân viên mỗi lần có người dùng truy cập
                    if(customerNhanvien[inObject.ctId])
                    {
                        var json_client = JSON.stringify(customerClients[inObject.ctId]);
                        for(let i =0; i<customerNhanvien[inObject.ctId].length;i++)
                        {
                            for(let j =0;j<clients[customerNhanvien[inObject.ctId][i]].length;j++)
                                clients[customerNhanvien[inObject.ctId][i]][j].sendUTF(JSON.stringify({type: 'listClientsConnected', data: json_client}));
                        }
                    }
                    
                }
            }
            else if(object.spliceClient){
                var arrSplice = object.spliceClient;
                if(arrSplice.type === 'master')
                {
                    var findIndex = clients[nv_cut].indexOf(conn);
                    if(clients[nv_cut].length===1){
                        delete clients[nv_cut];
                    }                        
                    else
                        clients[nv_cut].splice(findIndex,1);
                    
                    if(customerNhanvien[ct_cut])
                    {
                        findIndex = customerNhanvien[ct_cut].indexOf(nv_cut);
                        if(customerNhanvien[ct_cut].length===1)
                            delete customerNhanvien[ct_cut];
                        else
                            customerNhanvien[ct_cut].splice(findIndex,1);
                    }

                    // if(customerClients[ct_cut])
                    // {
                    //     var json_client = JSON.stringify(customerClients[ct_cut]);
                    //     for(let j =0;j<clients[nv_cut].length;j++)
                    //         clients[nv_cut][j].sendUTF(JSON.stringify({type: 'listClientsConnected', data: json_client}));
                    // }
                    
                    
                }
                else{
                    console.log('client_cut => ', client_cut);
                    console.log('ct_cut => ', ct_cut);
                    var findIndex = clients[client_cut].indexOf(conn);
                    if(clients[client_cut].length===1)
                        delete clients[client_cut];
                    else
                        clients[client_cut].splice(findIndex,1);

                    if(!clients[client_cut])
                    {
                        findIndex = customerClients[ct_cut].indexOf(client_cut);
                        if(customerClients[ct_cut].length===1)
                            delete customerClients[ct_cut];
                        else
                            customerClients[ct_cut].splice(findIndex,1);

                        var json_client = JSON.stringify(customerClients[ct_cut]||[]);
                        for(let i =0; i<customerNhanvien[ct_cut].length;i++)
                        {
                            for(let j =0;j<clients[customerNhanvien[ct_cut][i]].length;j++)
                                clients[customerNhanvien[ct_cut][i]][j].sendUTF(JSON.stringify({type: 'listClientsConnected', data: json_client}));
                        }
                    }
                }
            }
            else{
                console.log('mess in => ', message);
                var mess = JSON.parse(message.utf8Data);
                
                if(mess.to)
                {
                    var to = mess.to;
                }
                else{
                    var to = customerNhanvien[mess.customer][Math.floor(Math.random()*customerNhanvien.length)];
                }
                var obj = {
                    time: (new Date()).getTime(),
                    text: mess.mess,
                    positionType: mess.positionType,
                    from: mess.from,
                    to: to
                };
                console.log('mess out =>', obj);
                var json = JSON.stringify({type: 'message', data: obj});
                for(let i =0; i<clients[to].length;i++)
                {
                    clients[to][i].sendUTF(json);
                }
                for(let i=0; i<clients[mess.from].length; i++)
                {
                    clients[mess.from][i].sendUTF(json);
                }
            }
            
        }
    });

    conn.on('close', function(conn1){
        // var findIndex = clients[nv_cut].indexOf(conn);
        // // customerNhanvien[ct_cut].splice()
        // // clientsNhap.splice(index,1);
        // console.log('ct_cut =>', ct_cut);
        // console.log('clients => ', clients);
        console.log('nhanvien => ', customerNhanvien);
        console.log('KH => ', customerClients);
    });
});