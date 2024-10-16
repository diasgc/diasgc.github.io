if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
  Chart.defaults.color = "#fff";
  Chart.defaults.borderColor = "#263238";
  Chart.defaults.backgroundColor = "#263238";
  Chart.defaults.elements.arc.borderColor = "#263238";
  document.body.style.color = "#ffffff";
}

const mainPalette = [
  "#039BE5", "#42A5F5", "#26C6DA", "#80DEEA", 
  "#FFCA28", "#FFB300", "#FB8C00", "#F4511E",
  "#F44336", "#E91E63", "#AB47BC", "#7E57C2",
  "#9575CD", "#B39DDB", "#9FA8DA", "#C5CAE9"
];

const nproc = navigator.hardwareConcurrency;
const performanceData = [0,0,0,0,0,0,0];
const backgroundColor = mainPalette.slice(0, nproc);
backgroundColor.push("#80808010");
// "#F44336", "#E91E63", "#AB47BC", "#7E57C2", "#512DA8", "#5C6BC0", "#0D47A1", ""
// [ "#d7e3fc","#ccdbfd","#c1d3fe","#abc4ff","#ccfddb","#c1fed3","#abffc4","#ffabc4","#80808010"];

var labelIds = [];
const ul = document.createElement('div');
document.getElementById("js-legend").appendChild(ul);
for (let i = 0 ; i < nproc + 1 ; i++){
  const li = document.createElement('div');
  li.innerHTML = `<div id="cbox" style="background-color: ${ backgroundColor[i] }"></span>`
  const sp = document.createElement('span');
  li.appendChild(sp);
  labelIds.push(sp);
  ul.appendChild(li);
};


var labelData = [];

function loadData(data){
  labelData = data.freq;
  var s = 0;
  for(let i = 0; i < nproc; i++){
    s += data.time[i];
    labelIds[i].innerHTML = "cpu " + i + ": " + data.time[i] + "% " + data.freq[i]/1000 + "MHz";
  }
  data.time.push(nproc * 100 - s);
  labelIds[nproc].innerHTML = "idle:  " + data.time[nproc]/nproc + "%";
  
  chart.data.datasets[0].data = data.time;
  chart.update();
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
    time: generateRandomArray(nproc,0,100),
    freq: generateRandomArray(nproc,1,3000)
  };

  loadData(r_data);
}

function generateRandomArray(length, min, max) {
  const randomArray = [];
  for (let i = 0; i < length; i++) {
      const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
      randomArray.push(randomNumber);
  }
  return randomArray;
}

function arrayCopy(arr1, index1, arr2, index2, length) {
  return []
      .concat(arr2.slice(0, index2))                  // Array 2 from beginning until the index to replace
      .concat(arr1.slice(index1, index1 + length))    // Array 1 from the index to copy for 'length' elements
      .concat(arr2.slice(index2 + length));           // Rest of Array 2, 'length' elements past the index to replace
}

setInterval(genData, 500);