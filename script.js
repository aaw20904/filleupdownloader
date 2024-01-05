window.onload = function () {
  
}

async function showFile (input) {
  const chSize = 65535;
  let file = input.files[0]
  console.log(file);
  const fileName = (((Math.random() * 65535)|0).toString(16))+file.name;
  //file.size
  //an amounts of chunks
  let currentPos = 0;
  let chunks = file.size / chSize;
  if (chunks < 1) {
    chunks = 1;
  }  
  for (let idx=0; idx<chunks; idx++) {
      let slice = file.slice(currentPos, currentPos+chSize);
      currentPos += chSize;

      let chukContent = await new Promise((resolve, reject) => {
        //читает данные из файла как кусок
          let reader = new FileReader ();
            reader.onload = function () {
              resolve(reader.result);
            }
            
          reader.readAsArrayBuffer(slice);
      });

   
    await new Promise((resolve, reject) => {
      //выолняет запрос к сереру посылая кусок post
        let xhr =  new XMLHttpRequest();
        xhr.open ("POST", '/upload', true);
        xhr.setRequestHeader ('Content-Type', 'application/octet-stream');
        xhr.setRequestHeader ('X-Filename', fileName);
        xhr.send (chukContent);
        xhr.onload=()=>{
            if (xhr.status >= 200 && xhr.status < 300) {
                  // Successful response
                  console.log('Success:', xhr.responseText);
                  resolve()
                } else {
                  // Handle errors
                  console.error('Error:', xhr.statusText);
                  reject();
            }
        }
    });

     

  
  }

 

  
}