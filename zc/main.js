function rotate(d){
  //const dd = d.getTime()/1000 % 86400 / 86400 * 360;
  const dd = (d.getHours()*60 + d.getMinutes()) / 1440 * 360;
  img.style.transform = `rotate(${-dd}deg)`;
}


const img = document.getElementById('iclock')
rotate(new Date());

setInterval(()=>{
    const t = document.getElementById('time');
    const d = new Date();
    rotate(d);
    t.innerText = `${d.getHours()}:${d.getMinutes()}`;
},5000);

//https://developers.sefaria.org/reference/get-v3-texts
//https://www.hebcal.com/home/1663/zmanim-halachic-times-api
