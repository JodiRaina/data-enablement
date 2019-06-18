var mysql = require('mysql');
var redis = require("redis"),
    client_redis = redis.createClient();

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database:"wilayah_ktp"
}); 

const Keyv = require('keyv');
const keyv = new Keyv('redis://@localhost:6379', { namespace: 'wilayah_2018' });

const { Client } = require('pg');
  const client_pg = new Client({
      user: 'postgres',
      host: 'localhost',
      database: 'wilayah_2018',
      password: 'postgres',
      port: 5432,
  });
client_pg.connect();


client_redis.on("error", function (err) {
console.log("Error " + err);

});
con.connect(function(err) {
  if (err) throw err;
  con.query("SELECT * FROM wilayah_2018", function (err, result, fields) {
    if (err) throw err;
    async function setData() {
        var prov='';
        var kec='';
        keyv.on('error', err => console.log('Connection Error', err));
        for (i of result) {
            var kode=i.kode;
            
            var split = kode.split(".");
            if (split.length == 1) {
                prov = i.nama;
            }
            if (split.length == 3) {
                var lowernama = prov + ' - ' + i.nama;
                var nama = lowernama.toUpperCase();
                var kdwilayah = split[0] + split[1] + split[2];

                // iNSERT to REDiS
                await keyv.set(kdwilayah, nama);

                // iNSERT to POSTGRESQL
                const query = 'INSERT INTO wilayah_2018 (kode, nama) VALUES($1, $2) RETURNING *';
                const values = [kdwilayah, nama];
                client_pg.query(query, values, (err, result) => {
                console.log('row inserted');
                  if (err) {
                    console.log(err.stack);
                  } else {
                    console.log(result.rows[0]);
                  }
                }); 
            }
        }
    }
    setData();
  });

});

