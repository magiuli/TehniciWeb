const express = require('express');
const path = require('path');
const fs = require('fs');
const sass = require('sass');

const app = express(); 
const port = 8080;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/resources', express.static(path.join(__dirname, 'resources')));

console.log('__dirname:', __dirname);
console.log('__filename:', __filename);
console.log('process.cwd():', process.cwd());

obGlobal = {
  obErori:null,
  folderScss: path.join(__dirname, 'resources', 'scss'),
  folderCss: path.join(__dirname, 'resources', 'css')
}

const vFoldere = ['temp', 'backup']
vFoldere.forEach((folder) => {
  const caleFolder = path.join(__dirname, folder);

  if (!fs.existsSync(caleFolder)) {
    fs.mkdirSync(caleFolder);
    console.log(`Folderul ${folder} a fost creat la ${caleFolder}`);
  }
});

function compileazaScss(caleScss, caleCss) {
    if (!caleCss) {
        let numeFisExt = path.basename(caleScss);
        let numeFis = numeFisExt.split(".")[0];
        caleCss = numeFis + ".css";
    }

    if (!path.isAbsolute(caleScss)) {
        caleScss = path.join(obGlobal.folderScss, caleScss);
    }
    if (!path.isAbsolute(caleCss)) {
        caleCss = path.join(obGlobal.folderCss, caleCss);
    }

    const caleBackup = path.join(__dirname, "backup", "resources", "css");
    if (fs.existsSync(caleCss)) {
        try {
            if (!fs.existsSync(caleBackup))
                fs.mkdirSync(caleBackup, { recursive: true });

            const numeFisierCss = path.basename(caleCss);
            const extFisier = path.extname(numeFisierCss);
            const numeFaraExt = path.basename(numeFisierCss, extFisier);
            // const timestamp = Date.now();
            // const numeBackup = `${numeFaraExt}_${timestamp}${extFisier}`;
            const numeBackup = `${numeFaraExt}${extFisier}`;

            fs.copyFileSync(caleCss, path.join(caleBackup, numeBackup));
            console.log(`Backup creat pentru ${numeBackup}`);
        } catch (err) {
            console.error(`Eroare la crearea backup-ului pentru ${caleCss}:`, err);
        }
    }

    try {
        const rezultat = sass.compile(caleScss, { "sourceMap": true });
        fs.writeFileSync(caleCss, rezultat.css);
        console.log(`Fisierul ${caleScss} a fost compilat cu succes in ${caleCss}`);
    } catch (err) {
        console.error(`Eroare la compilarea ${caleScss}:`, err.message);
    }
}

vFisiere = fs.readdirSync(obGlobal.folderScss);
for (let numeFis of vFisiere) {
    if (path.extname(numeFis) == ".scss") {
        compileazaScss(numeFis);
    }
}

fs.watch(obGlobal.folderScss, function (eveniment, numeFis) {
    console.log(eveniment, numeFis);
    if (eveniment == "change" || eveniment == "rename") {
        let caleCompleta = path.join(obGlobal.folderScss, numeFis);
        if (fs.existsSync(caleCompleta)) {
            compileazaScss(caleCompleta);
        }
    }
})

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
