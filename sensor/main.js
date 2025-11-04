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
  id: null,
  data: [0,0,0],
  dim: 3,
  options: { referenceFrame: "device", frequency: 60 },
  list: {
    AbsoluteOrientationSensor: {
      get: function(){
        return new AbsoluteOrientationSensor( sensor.options );
      },
      read: function(){
        return sensor.id.quaternion;
      },
      requestPermission: function(){
        return Promise.all([
          navigator.permissions.query({ name: "accelerometer" }),
          navigator.permissions.query({ name: "magnetometer" }),
          navigator.permissions.query({ name: "gyroscope" }),
        ]);
      },
      dim: 4,
    },
    Accelerometer: {
      get: function(){
        return new Accelerometer(sensor.options);
      },
      read: function(){
        return [ sensor.id.x, sensor.id.y, sensor.id.z ]
      },
      requestPermission: function(){
        return navigator.permissions.query({ name: "accelerometer" });
      },
      dim: 3,
    },
    AmbientLightSensor: {
      dim: 1,
      get: function(){
        return new AmbientLightSensor(sensor.options);
      },
      read: function(){
        return [ sensor.id.illuminance ]
      },
      requestPermission: function(){
        return navigator.permissions.query({ name: 'ambient-light-sensor' });
      }
    },
    GravitySensor: {
      dim: 3,
      get: function(){
        return new GravitySensor(sensor.options);
      },
      read: function(){
        return [ sensor.id.x, sensor.id.y, sensor.id.z ]
      },
      requestPermission: function(){
        return navigator.permissions.query({ name: 'accelerometer' });      
      }
    },
    Gyroscope: {
      dim: 3,
      get: function(){
        return new Gyroscope(sensor.options);
      },
      read: function(){
        return [ sensor.id.x, sensor.id.y, sensor.id.z ]
      },
      requestPermission: function(){
        return navigator.permissions.query({ name: 'gyroscope' });      
      }
    },
    LinearAccelerationSensor: {
      dim: 3,
      get: function(){
        return new LinearAccelerationSensor(sensor.options);
      },
      read: function(){
        return [ sensor.id.x, sensor.id.y, sensor.id.z ]
      },
      requestPermission: function(){
        return navigator.permissions.query({ name: 'accelerometer' });      
      }
    },
    Magnetometer: {
      dim: 3,
      get: function(){
        return new Magnetometer(sensor.options);
      },
      read: function(){
        return [ sensor.id.x, sensor.id.y, sensor.id.z ]
      },
      requestPermission: function(){
        return navigator.permissions.query({ name: 'magnetometer' });
      }
    },
    RelativeOrientationSensor: {
      dim: 4,
      get: function(){
        return new RelativeOrientationSensor(sensor.options);
      },
      read: function(){
        return sensor.id.quaternion;
      },
      requestPermission: function(){
        return Promise.all([
          navigator.permissions.query({ name: "accelerometer" }),
          navigator.permissions.query({ name: "gyroscope" }),
        ]);
      }
    },
  },
  init: function(){
    const s = document.getElementById('sel-sensors');
    s.replaceChildren();
    Object.keys(sensor.list).forEach((k) => {
      if (window[k])
        s.innerHTML += `<option value='${k}'>${k}</option>`;
    });
    s.addEventListener('change', () => sensor.start(s.value));
  },
  start: function(key){
    const s = sensor.list[key];
    if (s){
      s.requestPermission().then((state) => {
        sensor.id = s.get();
        sensor.dim = s.dim;
        ui.reset();
        sensor.id.addEventListener("reading", (e) => {
          sensor.data = s.read();
        });
        sensor.id.start();
      });
    }
  }
}

const ui = {
  mainPalette: [
    "#039BE5", "#42A5F5", "#26C6DA", "#80DEEA", 
    "#FFCA28", "#FFB300", "#FB8C00", "#F4511E",
    "#F44336", "#E91E63", "#AB47BC", "#7E57C2",
    "#9575CD", "#B39DDB", "#9FA8DA", "#C5CAE9"
  ],
  backgroundColor: '',
  reset: function(){
    const cap = document.getElementById('js-legend');
    for (let i = 0 ; i < sensor.dim ; i++){
      cap.innerHTML += `<div class="grid-item">
      <div class="cbox" style="background-color: ${ this.backgroundColor[i] }"></div>
      <div id="cap-${i}" class="cap-info"></div>
      </div>`;
    };
    this.backgroundColor = this.mainPalette.slice(0, sensor.dim);
    this.backgroundColor.push("#80808010");
  }
}
const delay = 500;
const startTime = Date.now();

ui.reset();

const dataLen = 20;
const datasets = [];
var inputData = new Array(sensor.dim).fill(0);

function loadData(data){
  inputData = data;
}

function setPalette(palette){
  palette.splice(sensor.dim);
  palette.push("#80808020");
}

for (let i = 0; i < sensor.dim; i++){
  datasets.push({
    label: "line" + i,
    cubicInterpolationMode: 'monotone',
    borderColor: ui.backgroundColor[i],    
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
            for (let i = 0; i < sensor.dim; i++){
              let d = sensor.data[i].toFixed(2);
              document.getElementById(`cap-${i}`).innerHTML = "col" + i + ": " + d;
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