var mysql = require('mysql');
var  db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database:"chatapp"
});
module.exports = function(app){
    app.get('/listmessages', function(req,res){
        console.log('vao roi');
        db.connect();
        db.query('select * from tbl_clients', function(err,rows, fields){
            if(err) throw err;

                res.json(rows);
        });
        db.end();
    });
}