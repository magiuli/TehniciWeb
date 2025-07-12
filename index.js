const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express(); 
const port = 8080;

obGlobal = {
  obErori:null
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/resources', express.static(path.join(__dirname, 'resources')));

console.log('__dirname:', __dirname);
console.log('__filename:', __filename);
console.log('process.cwd():', process.cwd());

const vFoldere = ['temp', 'backup']
vFoldere.forEach((folder) => {
  const caleFolder = path.join(__dirname, folder);

  if (!fs.existsSync(caleFolder)) {
    fs.mkdirSync(caleFolder);
    console.log(`Folderul ${folder} a fost creat la ${caleFolder}`);
  }
});

app.get(['/', '/index', '/home'], (req, res) => {
  res.render('pages/index.ejs', {
    ip: req.ip
  });
});

app.use("/resources", (req, res, next) => {
  if (req.path.match(/\/$/)){
    return afisareEroare(res, 403);
  } else {
    next();
  }
});

app.get("/{*any}.ejs", function(req, res, next){
    afisareEroare(res,400);
});

app.get("/favicon.ico", function(req, res){
    res.sendFile(path.join(__dirname, "resources/ico/favicon.ico"))
})

app.get('/:page', (req, res) => {
  const pageName = req.params.page;

  res.render(`pages/${pageName}.ejs`, (err, html) => {
    if (err) {
      if(err.message.startsWith('Failed to lookup view')) {
        afisareEroare(res, 404);
      } else {
        afisareEroare(res);
      }
    } else {
      res.send(html);
    }
  });
});

function initErori() {
  var continut = fs.readFileSync(path.join(__dirname, 'resources', 'json', 'erori.json'), 'utf8');
  
  obGlobal.obErori = JSON.parse(continut);
  // console.log('obGlobal.obErori:', obGlobal.obErori);

  var vErori = obGlobal.obErori.info_erori;

  for(let eroare of vErori) {
    eroare.imagine = path.join(obGlobal.obErori.cale_baza, eroare.imagine);
  }
}
initErori();

function afisareEroare(res, _cod, _titlu, _text, _imagine) {
  let vErori = obGlobal.obErori.info_erori;
  let eroare = vErori.find(e => e.cod === _cod);

  if(!eroare) eroare = obGlobal.obErori.eroare_default;

  let titlul = _titlu || eroare.titlu ;
  let textul = _text || eroare.text;
  let imaginea = _imagine || eroare.imagine;
  console.log('Imaginea:', imaginea);
  let codul = _cod || eroare.cod;
  res.render('pages/eroare.ejs', {
    titlu: titlul,
    text: textul,
    imagine: imaginea,
    cod: codul
  })
}

app.listen(port, () => {
  console.log(`Serverul rulează pe http://localhost:${port}`);
  console.log('Apăsați Ctrl+C pentru a opri serverul.');
});
