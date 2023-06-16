const res=document.getElementById('result');
document.getElementById('picker').addEventListener('change', async e => {
    let file = e.target.files[0];
    EXIF.getData(file, function () {
        var MetaData = EXIF.getAllTags(this);
        res.innerHTML=JSON.stringify(MetaData, null, "\t")
      });
})