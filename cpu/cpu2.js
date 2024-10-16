if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
  Chart.defaults.color = "#fff";
  Chart.defaults.borderColor = "#263238";
  Chart.defaults.backgroundColor = "#263238";
  Chart.defaults.elements.arc.borderColor = "#263238";
  document.body.style.color = "#ffffff";
}

const performanceData = [0,0,0,0,0,0,0];
const backgroundColor = [ "#d7e3fc","#ccdbfd","#c1d3fe","#abc4ff","#ccfddb","#c1fed3","#abffc4","#ffabc4","#80808010"];

var labelIds = [];
const ul = document.createElement('div');
document.getElementById("js-legend").appendChild(ul);
for (let i = 0 ; i < 8 ; i++){
  const li = document.createElement('div');
  li.innerHTML = `<span style="color: ${ backgroundColor[i] }; opacity: 1;">&#x25a0;&nbsp;&nbsp;&nbsp;</span>`
  const sp = document.createElement('span');
  li.appendChild(sp);
  labelIds.push(sp);
  ul.appendChild(li);
};


var labelData = [];

function loadData(data){
  chart.data.datasets[0].data = data.time;
  labelData = data.freq;
  chart.update();
  var s, t =0;
  for(let i = 0; i < 8; i++){
    labelIds[i].innerHTML = "cpu " + i + ": " + data.time[i] + "% " + data.freq[i];
  }
  //chart.data.labels[8] = "idle:  " + data.time[8]/8 + "%");
}



function setPalette(palette){
  palette.splice(8);
  palette.push("#80808020");
  console.log("Palette: " + palette);
  chart.data.datasets[0].backgroundColor = palette;

}

const chart = new Chart(document.getElementById("chart"), {
  type: "doughnut",
  data: {
    datasets: [{
      label: 'CPU Usage',
      data: performanceData,
      backgroundColor: backgroundColor,
    }]
  },
  options: {
    maintainAspectRatio: false,
    cutout: '70%',
    rotation: -225,
    circumference: 270,
    plugins: {
      legend: {
        display: false
      }
    }
  }
});

function genData(){
  r_data = {
    time: generateRandomArray(8,0,100),
    freq: generateRandomArray(8,1,3)
  };
  loadData(r_data);
}

function generateRandomArray(length, min, max) {
  console.log("generateRandomArray");
  const randomArray = [];
  for (let i = 0; i < length; i++) {
      const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
      randomArray.push(randomNumber);
  }
  console.log(randomArray);
  return randomArray;
}

setInterval(genData, 500);