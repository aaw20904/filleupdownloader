const http = require("http");
const fs = require("fs");
const { resolve } = require("path");
const url = require("url");
const mime = require('mime-types')
let server = http.createServer(onQuery);

async function onQuery (req, res) {
    const parsedUrl = url.parse(req.url, true);
     // Your logic to extract a part of the path
    const parts = parsedUrl.pathname.split('/');
    //console.log(parts);

     if (parts[1] === "files" && req.method === "GET") {
        try{
            await onDownload(req, res, parts[2]);
        }catch(e){
             res.statusCode=404;
        let msg = "Not found!";
        res.setHeader("Content-Type", "text/plain");
        res.setHeader("Content-Length", msg.length);
        res.end(msg);
        }
        
        return;
    }
    if (parts[1] === "upload" && req.method === "GET") {
        await onIndex(req, res);
        return;
    } if (parts[1] === "upload" && req.method === "POST") {
        await onUpload(req, res);
        return;
    } if(parts[1] === "download" && req.method === "GET"){
        await readDirectory(req, res);
        return;
    }else {
        res.statusCode=404;
        let msg = "Not found!";
        res.setHeader("Content-Type", "text/plain");
        res.setHeader("Content-Length", msg.length);
        res.end(msg);
    }
}

server.listen(80);

async function onDownload(req, res, fname) {
    let statistics = await fs.promises.stat(fname);
    let type = mime.lookup(fname);

    res.writeHead(200, {
        'Content-Type': type, // Adjust the content type accordingly
        'Content-Length': statistics.size
    });

    let rstream = fs.createReadStream(fname);
    rstream.pipe(res);
}

async function onUpload(req, res) {

   //промис не завершиься пока не выполниться функция resolve()
    await new Promise((resolve, reject) => {
        //create new or open existing file to append info:
        //---открыть существующий или создать новый файл 
        let fstream = fs.createWriteStream(req.headers['x-filename'],{flags:'a'});
        //--обработчик события "финиш" потока записи.
        //Он будет ждать события конца педедачи данных потом вызовет 
        //resolve для выхода из промиса
        fstream.on("finish",function(){resolve()});
        //pipe socket content into a file
        //---перенаправить поок чтения из сокета в поток записи (файл)
        req.pipe(fstream);
        //waiting until finished
    });

   res.setHeader('Content-Type', 'text/plain');
   res.statusCode=200;
   res.end('Ok!');
}

  async function onIndex (req, res) {
  let scr = await fs.promises.readFile("./script.js", {encoding: "utf8"});
        let template = `<!DOCTYPE html>
                            <html lang="en">
                            <head>
                                <meta charset="UTF-8">
                                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <title>Document</title>
                            </head>
                            <body>
                                <h1> helloword </h1>
                                <input type="file" onchange="showFile(this)">
                                <script>${scr}</script>
                            </body>
                        </html>`;

        res.setHeader("Content-Type", "text/html");
        res.setHeader("Content-Length", template.length);
        res.statusCode = 200;
        res.end(template);
}

async function readDirectory(req, res) {
    let result = await fs.promises.readdir("./");
    let jsdata = JSON.stringify(result);
    let content='';
 for(const x of result){
        let finfo = await fs.promises.stat(x);
        if(! finfo.isDirectory()) {
            content += `<a href="/files/${x}">${x}</a>`;
        }
    }

    let template = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
            <style>
    div{
        display: flex;
        justify-content: start;
        align-items: flex-start;
        margin:1em;
        flex-direction: column;
    }

    a{
        margin: 0.25em;
    }
    </style>
    </head>
    <body>
    <div>
    ${content}
    </div>
    </body>
    </html>`;

    res.statusCode=200;
    res.setHeader("Content-Type","text/html");
    res.setHeader("Content-Length",template.length);
    res.end(template);

}
