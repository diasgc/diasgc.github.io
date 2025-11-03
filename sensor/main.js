if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
  Chart.defaults.color = "#fff";
  Chart.defaults.borderColor = "#263238";
  Chart.defaults.backgroundColor = "#263238";
  Chart.defaults.elements.arc.borderColor = "#263238";
  document.body.style.color = "#ffffff";
  document.body.style.backgroundColor = "#263238";
}

const mainPalette = [
  "#039BE5", "#42A5F5", "#26C6DA", "#80DEEA", 
  "#FFCA28", "#FFB300", "#FB8C00", "#F4511E",
  "#F44336", "#E91E63", "#AB47BC", "#7E57C2",
  "#9575CD", "#B39DDB", "#9FA8DA", "#C5CAE9"
];

const sensor = {
  sensor: null,
  data: [0,0,0],
  init: function(){
    navigator.permissions
      .query({ name: 'gyroscope' })
      .then((p) => {
        this.sensor = new Gyroscope({ frequency: 60 });
        this.sensor.addEventListener("reading", (e) => {
          this.data = [ this.sensor.x, this.sensor.y, this.sensor.z ];
        });
        this.sensor.start();
      });
  }
}

const nlines = 3;
const delay = 500;
const startTime = Date.now();
const backgroundColor = mainPalette.slice(0, nlines);
backgroundColor.push("#80808010");

var labelIds = [];
const ul = document.createElement('div');
document.getElementById("js-legend").appendChild(ul);
for (let i = 0 ; i < nlines + 1 ; i++){
  const li = document.createElement('div');
  li.innerHTML = `<div id="cbox" style="background-color: ${ backgroundColor[i] }"></span>`
  const sp = document.createElement('span');
  li.appendChild(sp);
  labelIds.push(sp);
  ul.appendChild(li);
};

const dataLen = 20;
const datasets = [];
const labels = [];
var inputData = new Array(nlines).fill(0);

function loadData(data){
  inputData = data;
}

function setPalette(palette){
  palette.splice(nlines);
  palette.push("#80808020");
}

for (let i = 0; i < nlines; i++){
  datasets.push({
    label: "line" + i,
    cubicInterpolationMode: 'monotone',
    borderColor: backgroundColor[i],    
    fill: false,
    data: []
  })
}

const chart = new Chart(document.getElementById("chart"), {
  type: "line",
  data: {
    datasets: datasets
  },
  options: {
    scales: {
      x: {
        type: 'realtime',
        realtime: {
          delay: 2000,
          onRefresh: chart => {
            for (let i = 0; i < nlines; i++){
              let d = sensor.data[i].toFixed(2);
              labelIds[i].innerHTML = "col" + i + ": " + d;
              chart.data.datasets[i].data.push({
                x: Date.now(),
                y: d
              })
            }
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  }
});

function genData(){
  inputData = sensor.data;
}

sensor.init();

//setInterval(genData, delay);