setInterval(()=>{
    const t = document.getElementById('time');
    const d = new Date();
    t.innerText = d.toTimeString().split(' ')[0];
},1000);

//https://developers.sefaria.org/reference/get-v3-texts
//https://www.hebcal.com/home/1663/zmanim-halachic-times-api
