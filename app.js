var express = require('express');
var app = express();
var WebSocketServer = require('websocket').server;
var http = require('http');
var helpers = require('./libs/helpers');
var port = process.env.PORT || 1337;
var mysql = require('mysql');
// var  db = mysql.createConnection({
//     // host: "localhost",
//     host: '118.70.222.157',
//     user: "root",
//     password: "",
//     database:"chatapp"
// });
var  db = mysql.createConnection({
    // host: "localhost",
    host: '118.70.222.157',
    user: "chatapp",
    password: "appchat",
    database:"dbcl_chatapp"
});
var server = http.createServer();

var clients = [];
var masters = [];
var history = [];
var customerNhanvien = [];
var customerClients = [];
var clientsNhap = [];
// var route = require('./route');
// route(app);
var helper = require('./libs/helpers');


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
                //client connect
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
                    //lấy lại danh sách người dùng đang truy cập mỗi lần có NV kết nối
                    // if(customerClients[inObject.ctId])
                    // {
                    //     var json_client = JSON.stringify(customerClients[inObject.ctId]);
                    //     for(let j =0;j<clients[inObject.nvId].length;j++)
                    //         clients[inObject.nvId][j].sendUTF(JSON.stringify({type: 'listClientsConnected', data: json_client}));
                    // }
                    
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
                    // if(customerNhanvien[inObject.ctId])
                    // {
                    //     var json_client = JSON.stringify(customerClients[inObject.ctId]);
                    //     for(let i =0; i<customerNhanvien[inObject.ctId].length;i++)
                    //     {
                    //         for(let j =0;j<clients[customerNhanvien[inObject.ctId][i]].length;j++)
                    //             clients[customerNhanvien[inObject.ctId][i]][j].sendUTF(JSON.stringify({type: 'listClientsConnected', data: json_client}));
                    //     }
                    // }
                    
                }
                
            }
            //client disconnect
            else if(object.spliceClient){
                // console.log('=========================BEFOR DELETE ++++++++++++++++++++++++++++');
                // console.log('customerNhanvien => ',customerNhanvien);
                // console.log('customerClients => ',customerClients);
                // console.log('clients =>',clients);
                var arrSplice = object.spliceClient;
                if(arrSplice.type === 'master')
                {
                    var findIndex = customerNhanvien[ct_cut].indexOf(nv_cut);
                    if(clients[nv_cut].length === 1)
                    {
                        
                        if(customerNhanvien[ct_cut].length===1)
                            delete customerNhanvien[ct_cut];
                        else
                            customerNhanvien[ct_cut].splice(findIndex,1);
                    }
                    
                    findIndex = clients[nv_cut].indexOf(conn);
                    if(clients[nv_cut].length===1){
                        delete clients[nv_cut];
                    }                        
                    else
                        clients[nv_cut].splice(findIndex,1);
                    
                    

                    // if(customerClients[ct_cut])
                    // {
                    //     var json_client = JSON.stringify(customerClients[ct_cut]);
                    //     for(let j =0;j<clients[nv_cut].length;j++)
                    //         clients[nv_cut][j].sendUTF(JSON.stringify({type: 'listClientsConnected', data: json_client}));
                    // }
                }
                else{
                    var findIndex = customerClients[ct_cut].indexOf(client_cut);
                    if(clients[client_cut].length === 1)
                    {
                        // nếu số kết nối của client chỉ còn 1 thì tiến hành xóa client khỏi mảng khách hàng
                        if(customerClients[ct_cut].length===1)
                        {
                            //nếu chỉ còn duy nhất 1 clients trong mảng khách hàng thì xóa toàn bộ mảng đó
                            delete customerClients[ct_cut];
                        }
                        else{
                            //nếu còn nhiều hơn 1 client thì xóa client đó khỏi mảng
                            customerClients[ct_cut].splice(findIndex,1);
                        }
                    }

                    findIndex = clients[client_cut].indexOf(conn);
                    if(clients[client_cut].length===1)
                        delete clients[client_cut];
                    else
                        clients[client_cut].splice(findIndex,1);
                    // if(clients[client_cut])
                    // {
                    

                    // var json_client = JSON.stringify(customerClients[ct_cut]||[]);
                    // if(customerNhanvien[ct_cut])
                    //     for(let i =0; i<customerNhanvien[ct_cut].length;i++)
                    //     {
                    //         for(let j =0;j<clients[customerNhanvien[ct_cut][i]].length;j++)
                    //             clients[customerNhanvien[ct_cut][i]][j].sendUTF(JSON.stringify({type: 'listClientsConnected', data: json_client}));
                    //     }
                    // }
                }
                // console.log('++++++++++++++++++++AFTER DELETE ++++++++++++++++++++++++++++');
                // console.log('customerNhanvien => ',customerNhanvien);
                // console.log('customerClients => ',customerClients);
                // console.log('clients =>',clients);
            }
            //query lấy list tin nhắn mới nhất + client:SELECT * FROM tbl_messenger where sSendTime IN (SELECT MAX(sSendTime) from tbl_messenger WHERE FK_sSubAccID like '92YugxBnw390' GROUP BY FK_sClientID)
            //get message when ever client connect
            else if(object.getListMessage){
                var json = object.getListMessage;
                var q = `select * from tbl_messenger where FK_sClientID IN ('${ json.clId }') AND FK_sSubAccID IN ('${ json.host }') ORDER BY sSendTime ASC`;
                db.query(q, function(err, rows, field){
                    if(err) throw err;
                    else
                    {
                        if(rows)
                        {
                            for(let i=0;i<rows.length;i++)
                            {
                                var toSend = {
                                    time: rows[i].sSendTime,
                                    text: rows[i].sMessageText,
                                    positionType: rows[i].PositionType,
                                    // from: mess.from,
                                    // to: to
                                };
                                var json = JSON.stringify({type: 'getMessBack', data: toSend});
                                conn.sendUTF(json);
                            }
                        }
                    }
                });
                if(json.read){
                    q = ` UPDATE tbl_messenger SET Status = '' WHERE Status = '${json.read}' AND FK_sClientID = '${json.clId}' AND FK_sSubAccID = '${json.host}'`;
                    db.query(q, function(err,rows,field){
                        if(err) throw err;
                        else
                            console.log('update => ',rows.affectedRows);
                    });
                }
            }
            else if(object.detectSite)
            {
                var json = object.detectSite;
                var q = `SELECT c.PK_sCustomerID,pc.Status FROM tbl_customer as c
                        INNER JOIN tbl_package_customer as pc ON c.PK_sCustomerID = pc.PK_sCustomerID
                        WHERE c.PK_sCustomerID = ? AND c.sWebsite = ?`;
                var condition = [json.ctId,json.site];
                db.query(q,condition,function(err,rows,field){
                    if(err) throw err;
                    else
                    {
                        console.log('detectSite => ',rows);
                        conn.sendUTF(JSON.stringify({type: 'siteDeteted', data: rows}));
                    }
                });
            }
            else{
                var mess = JSON.parse(message.utf8Data);
                console.log('mess in => ',mess);
                if(mess.to)
                {
                    var to = mess.to;
                }
                else{
                    var to = (customerNhanvien[mess.customer])?customerNhanvien[mess.customer][Math.floor(Math.random()*customerNhanvien.length)] : '';
                }
                var obj = {
                    time: (new Date()).getTime(),
                    text: mess.mess,
                    status: mess.status,
                    positionType: mess.positionType,
                    iKnowWho: mess.who,
                    from: mess.from,
                    to: to
                };
                console.log('mess out => ',obj);
                var q = `INSERT INTO tbl_messenger values(?,?,?,?,?,?,?,?,?)`;
                var qr_values = [helper.getRandomString(50),(new Date()).getTime(),obj.text,'',obj.positionType,obj.status,'1'];
                if(obj.from === obj.iKnowWho)
                {
                    // q += `, '${obj.from}','${obj.to}' )`;
                    qr_values.push(obj.from);
                    qr_values.push(obj.to);
                }else{                    
                    // q += `,'${ obj.to }', '${ obj.from }' )`;                    
                    qr_values.push(obj.to);
                    qr_values.push(obj.from);
                }
                db.query(q,qr_values, function(err, rows, field){
                    if(err) throw err;
                    else console.log(rows.affectedRows);
                });

                var json = JSON.stringify({type: 'message', data: obj});
                if(clients[to])
                for(let i =0; i<clients[to].length;i++)
                {
                    clients[to][i].sendUTF(json);
                }
                if(clients[mess.from])
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
        // console.log('nhanvien => ', customerNhanvien);
        // console.log('KH => ', customerClients);
    });
});