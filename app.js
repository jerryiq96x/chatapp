var express = require('express');
var app = express();
var WebSocketServer = require('websocket').server;
var http = require('http');
var helpers = require('./libs/helpers');
var port = process.env.PORT || 1337;
var mysql = require('mysql');
var  db = mysql.createConnection({
    // 
    // host: '123.30.185.44',
    // port: 2083,
    
    // user: "qldttx_chatapp",
    // password: "Yenmiz!$!!96",
    // database:"qldttx_chatapp"
    host: "localhost",
    // port: 82,
    user: "root",
    password: '',
    database: 'chatapp'
});
var server = http.createServer();

var clients = [];
var masters = [];
var history = [];
var customerNhanvien = [];
var customerClients = [];
var AdminNhanvien = [];
var helper = require('./libs/helpers');
server.listen(port, function(){
    console.log('Server is listening on port + ' + port);
});
var wsServer = new WebSocketServer({
    httpServer: server,
    path: "/box"
});
wsServer.on('request', function(request){
    var conn = request.accept(null, request.origin);
    // var index = clientsNhap.push(conn)-1;
    var idUser = request.key;
    var client_cut = '';
    var nv_cut = '';
    var index = '';
    var ct_cut = '';
    conn.on('message', function(message){
        var d =  new Date().toLocaleString("vi-AS", {timeZone: "Asia/Bangkok"});
        // customerNhanvien
        if(message.type === 'utf8')
        {
            var object = JSON.parse(message.utf8Data);
            if(object.createClient)
            {
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
                    if(inObject.admin.isAd)
                    {
                        var adminIndex = AdminNhanvien.findIndex(i => i.id==inObject.nvId);
                        if(adminIndex<0)
                        {
                            var obj = {
                                name: inObject.admin.name,
                                id: inObject.nvId
                            };
                            AdminNhanvien.push(obj);
                        }
                    }
                    customerNhanvien[inObject.ctId].map((item)=>{
                        clients[item].map((x)=>{
                            x.sendUTF(JSON.stringify({type: 'updateListAdmin',data: AdminNhanvien}));
                        });
                    });
                    // console.log('Quan ly => ', AdminNhanvien);
                    //lấy lại danh sách người dùng đang truy cập mỗi lần có NV kết nối
                    // if(customerClients[inObject.ctId])
                    // {
                    //     var json_client = JSON.stringify(customerClients[inObject.ctId]);
                    //     for(let j =0;j<clients[inObject.nvId].length;j++)
                    //         clients[inObject.nvId][j].sendUTF(JSON.stringify({type: 'listClientsConnected', data: json_client}));
                    // }
                    var onOffline = (customerNhanvien[inObject.ctId])?true:false;
                    if(customerClients[inObject.ctId])
                    {
                        for(let i=0;i<customerClients[inObject.ctId].length;i++)
                        {
                            for(let j=0;j<clients[customerClients[inObject.ctId][i]].length;j++)
                            {
                                clients[customerClients[inObject.ctId][i]][j].sendUTF(JSON.stringify({type: 'DetectConnectStatus', onAir: onOffline}));
                            }
                        }
                    }
                    // var q = `SELECT PK_sSubAccID,sName FROM tbl_sub_account WHERE PK_sSubAccID like '${inObject.nvId}';`
                    // db.query(q,function(err,rows){
                    //     if(err) throw err;
                    //     else{
                    //         if(rows.length>0)
                    //         {
                    //             var obj = {
                    //                 name: rows[0]['sName'],
                    //                 id: rows[0]['PK_sSubAccID']
                    //             };
                    //             AdminNhanvien.push(obj);
                                
                    //         }
                    //     }
                    // });
                    
                    // conn.sendUTF();
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
                    var onOffline = (customerNhanvien[inObject.ctId])?true:false;
                    conn.sendUTF(JSON.stringify({type: 'DetectConnectStatus', onAir: onOffline}));
                    var q = `SELECT PK_sClientID FROM tbl_clients WHERE PK_sClientID = ?`;
                    db.query(q,inObject.clId,function(err,rows){
                        if(rows.length<=0)
                        {
                            var q = `INSERT INTO tbl_clients values(?,?,?,?,?,?,?)`;
                            var arr = [inObject.clId,'','','','','',''];
                            db.query(q,arr);
                        }
                    });
                    
                }
            }
            //client disconnect
            else if(object.spliceClient)
            {
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
                    
                    if(customerClients[ct_cut])
                    {
                        var onOffline = (customerNhanvien[ct_cut])?true:false;
                        for(let i=0;i<customerClients[ct_cut].length;i++)
                        {
                            var cc = customerClients[ct_cut][i];
                            for(let j=0;j<clients[cc].length;j++)
                            {
                                clients[cc][j].sendUTF(JSON.stringify({type: 'DetectConnectStatus', onAir: onOffline}));
                            }
                        }
                    }
                    if(arrSplice.isAdmin)
                    {
                        var adminIndex = AdminNhanvien.findIndex(i => i.id==nv_cut);
                        AdminNhanvien.splice(adminIndex,1);
                        if(customerNhanvien[ct_cut])
                        customerNhanvien[ct_cut].map((item)=>{
                            clients[item].map((x)=>{
                                x.sendUTF(JSON.stringify({type: 'updateListAdmin',data: AdminNhanvien}));
                            });
                        });
                    }
                    
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
            else if(object.getListMessage)
            {
                var json = object.getListMessage;
                if(json.isAdmin)
                {
                    var q = `select * from tbl_messenger where FK_sClientID like '${ json.clId }' ORDER BY sSendTime ASC`;
                }
                else{
                    var q = `select * from tbl_messenger where FK_sClientID like '${ json.clId }' AND FK_sSubAccID like '${ json.host }' ORDER BY sSendTime ASC`;
                }
                
                
                db.query(q, function(err, rows, field){
                    if(err) throw err;
                    else
                    {
                        if(rows.length>0)
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
                        conn.sendUTF(JSON.stringify({type: 'siteDeteted', data: rows}));
                    }
                });
            }
            else if(object.saveHistory)
            {
                var json = object.saveHistory;
                var pk = helper.getRandomString(25);
                var stdTime = (new Date()).getTime();
                var q_s = `SELECT PK_idHistory from tbl_history WHERE sLink like ? AND FK_sClientID like ?`;
                db.query(q_s,[json.link,json.client], function(err,rowsOut){
                    if(err) throw err;
                    else
                    {
                        if(rowsOut.length>0)
                        {
                            var q = `UPDATE tbl_history SET sTime = ? WHERE sLink like ? AND FK_sClientID like ?`;
                            var arr = [
                                stdTime,
                                json.link,
                                json.client
                            ];
                        }
                        else{
                            var arr = [
                                pk,
                                json.link,
                                json.title,
                                stdTime,
                                conn.remoteAddress,
                                json.client,
                                json.ctId
                            ];
                            var q  = `INSERT INTO tbl_history values(?,?,?,?,?,?,?)`;
                        }
                        db.query(q,arr,function(err,rows,field){
                            if(err) throw err;
                            else
                            {
                                var toSend = {
                                    time: stdTime,
                                    link: json.link,
                                    linksha: helper.getSHA1ofJSON(json.link),
                                    title: json.title,
                                    client: json.client,
                                    
                                };
                                if(clients[json.to])
                                for(let i=0;i<clients[json.to].length;i++)
                                {
                                    clients[json.to][i].sendUTF(JSON.stringify({type: 'visitSite', data: toSend}));
                                }
                            }
                        });
                    }
                });
            }
            else if(object.takeInfo)
            {
                var q = `SELECT * FROM tbl_clients WHERE PK_sClientID = ?`;
                db.query(q,object.takeInfo.client, function(err, rows){
                    if(rows.length>0)
                    {
                        var toSend = {
                            name: rows[0]['sName'],
                            phone: rows[0]['sPhone'],
                            email: rows[0]['sEmail'],
                            address: rows[0]['sAddress'],
                        };
                        conn.sendUTF(JSON.stringify({type: 'takeBackInfo', data: toSend}));
                    }                        
                });
            }
            else if(object.createClientInfo)
            {
                var j = object.createClientInfo;
                var q = `SELECT PK_sClientID FROM tbl_clients WHERE PK_sClientID = ?`;
                db.query(q,j.client,function(err, rows){
                    if(err) throw err;
                    else{
                        if(rows.length>0)
                        {
                            var q = `UPDATE tbl_clients SET sName = ?, sPhone = ?, sEmail = ?, sAddress = ?
                            WHERE PK_sClientID = ?`;
                            var arr = [j.sName,j.sPhone,j.sEmail,j.sAddress,j.client];
                        }
                        else{
                            var q = `INSERT INTO tbl_clients VALUES(?,?,?,?,?,?,?)`;
                            var arr = [j.client,j.sName,j.sPhone,j.sEmail,j.sAddress,'',0];
                        }
                        db.query(q,arr,function(err,rows){
                            if(err) throw err;
                            else{
                                if(clients[j.host]){
                                    clients[j.host].map((item)=> {item.sendUTF(JSON.stringify({type: 'getBackClientInfo', data: j}))});
                                }
                            }
                        });
                    }
                });
            }
            else if(object.endConversation)
            {
                var j = object.endConversation;
                var q = `UPDATE tbl_clients SET Status = ? WHERE PK_sClientID = ?`;
                var t = (new Date()).getTime();
                db.query(q,[t,j.client], function(err,rows){
                    if(rows.affectedRows>0)
                    {
                        var toSend = {
                            time: t,
                            client: j.client,
                            host: j.host
                        };
                        if(clients[j.host])
                            clients[j.host].map((item)=>{item.sendUTF(JSON.stringify({type: 'endConversation', data: toSend}))});
                        if(clients[j.client])
                            clients[j.client].map((item)=>{item.sendUTF(JSON.stringify({type: 'endConversation', data: toSend}))});
                    }
                });
            }
            else if(object.forward)
            {
                var json  = object.forward;
                clients[json.who].map((item)=>{
                    item.sendUTF(JSON.stringify({type:'forwardMessage',data:json}));
                });
            }
            else if(object.forwardMessageEvent)
            {
                var json = object.forwardMessageEvent;
                if(clients[json.nvID])
                clients[json.nvID].map((item)=>{
                    item.sendUTF(JSON.stringify({type: 'responseForward', data: json}));
                });
            }
            else
            {
                var mess = JSON.parse(message.utf8Data);
                console.log('mess in => ',mess);
                if(mess.to)
                {
                    var to = mess.to;
                }
                else{
                    var to = (customerNhanvien[mess.customer])?customerNhanvien[mess.customer][Math.floor(Math.random()*customerNhanvien.length)] : '';
                }
                var time = (new Date()).getTime();
                var obj = {
                    time: time,
                    text: mess.mess,
                    status: mess.status,
                    positionType: mess.positionType,
                    iKnowWho: mess.who,
                    from: mess.from,
                    to: to
                };
                console.log('mess out => ',obj);
                var q = `INSERT INTO tbl_messenger values(?,?,?,?,?,?,?,?,?)`;
                var qr_values = [helper.getRandomString(50),time,obj.text,'',obj.positionType,obj.status,'1'];
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