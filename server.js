'use strict';
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.set('view engine', 'ejs');
// const client = new pg.Client(process.env.DATABASE_URL);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL,   ssl: { rejectUnauthorized: false } });


// routes
app.get('/', homehandeler);
app.get('/gitonecity', gitonecityhandeler);
app.get('/allcountries', allcountrieshandeler);
app.post('/addrecord', addrecordhandeler);
app.get('/myRecords', myRecordsdhandeler);
app.get('/recordDetails/:id', recordDetailsdhandeler);
app.delete('/delete/:id', deletedhandeler);
app.put('/update/:id', updatedhandeler);
// functions
function homehandeler(req, res) {
    let url = 'https://api.covid19api.com/world/total';
    superagent.get(url).then(data => {
        res.render('pages/home', { data: data.body })
    });
};
function gitonecityhandeler(req, res) {
    let { city, from, to } = req.query;
    let url = `https://api.covid19api.com/country/${city}/status/confirmed?from=${from}T00:00:00Z&to=${to}T00:00:00Z`;
    superagent.get(url).then(data => {
        let countryData=data.body.map(city=>{
            return new Country(city);
        })
        res.render('pages/getCountryResult', { data: countryData})
    });
};
function allcountrieshandeler(req, res) {
    let url = 'https://api.covid19api.com/summary';
    superagent.get(url).then(data => {
        let countryData=data.body.Countries.map(city=>{
            return new Cities(city);
        })
        res.render('pages/allcountries', { data:countryData })
    });
};
function  addrecordhandeler(req, res) {
    let {country,totalconfirmed,totaldeath,totalrecovered,date}=req.body;
    let sql= `INSERT INTO country (country,totalconfirmed,totaldeath,totalrecovered,date) VALUES ($1,$2,$3,$4,$5);`;
    let values=[country,totalconfirmed,totaldeath,totalrecovered,date];
    client.query(sql,values).then(results=>{
        res.redirect('/myRecords');
    }) ;
};
function myRecordsdhandeler(req, res) {
    let sql= 'SELECT * FROM country;';
    client.query(sql).then(results=>{
        res.render('pages/myRecords',{data:results.rows});
    }) ;
};
function recordDetailsdhandeler(req, res) {
    let id = req.params.id;
    let sql= 'SELECT * FROM country WHERE id=$1;';
    let value =[id]
    client.query(sql,value).then(results=>{
        res.render('pages/recordDetails',{item:results.rows[0]});
    }) ;
};
function  deletedhandeler (req, res) {
    let id = req.params.id;
    let sql= 'DELETE FROM country WHERE id=$1;';
    let value =[id]
    client.query(sql,value).then(results=>{
        res.redirect('/myRecords');
    });
};
function updatedhandeler  (req, res) {
    let {country,totalconfirmed,totaldeath,totalrecovered,date}=req.body;
    let id = req.params.id;
    let sql= `UPDATE country SET country=$1,totalconfirmed=$2,totaldeath=$3,totalrecovered=$4,date=$5 WHERE id=$6;`;
    let value =[country,totalconfirmed,totaldeath,totalrecovered,date,id]
    client.query(sql,value).then(results=>{
        res.redirect(`/recordDetails/${id}`);
    });
};
// constructors
function Country (data){
    this.cases=data.Cases;
    this.date=data.Date;
}

function Cities (data){
this.country=data.Country;
this.totalconfirmed=data.TotalConfirmed;
this.totaldeath=data.TotalDeaths;
this.totalrecovered=data.TotalRecovered;
this.date=data.Date;
}

// listening
const PORT = process.env.PORT || 3030;
client.connect().then(() => {
    app.listen(PORT, () => {
        console.log(`http://localhost:${PORT}`);
    });
});




