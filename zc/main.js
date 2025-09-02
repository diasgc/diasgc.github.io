setInterval(()=>{
    const t = document.getElementById('time');
    const d = new Date();
    t.innerText = d.toTimeString().split(' ')[0];
},1000);