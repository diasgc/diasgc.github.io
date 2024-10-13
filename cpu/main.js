const dataLen = 50;
const intervalMs = 100;
const blob = new Blob(
    [
      `let time = performance.now();
       let iterations = 0;
       while(true){
         iterations++;
         let now = performance.now();
         if(now - time > ${intervalMs}){
           postMessage(iterations);
           time = performance.now();
           iterations = 0;
         }
       }`,
    ], {
      type: "text/javascript"
    }
  );
  
  const processWorker = new Worker(window.URL.createObjectURL(blob));
  const performanceData = [];
  
  processWorker.onmessage = (e) => {
    performanceData.push(+e.data);
    chart.data.datasets[0].data = performanceData.slice(-dataLen);
    chart.update();
  };
  
  const chart = new Chart(document.getElementById("line-chart"), {
    width: 400,
    height: 200,
    type: "line",
    data: {
      labels: Array(dataLen).fill(""),
      datasets: [{
        data: performanceData,
        borderColor: "#0f796b",
        fill: !0,
        fillColor: "#96c4be",
        tension: 10,
        cubicInterpolationMode: "monotone"
      }]
    },
    options: {
      title: {
        display: !1
      },
      plugins: {
        legend: {
          display: !1
        }
      },
      animation: {},
      elements: {
        point: {
          radius: 0,
          opacity: 0
        }
      }
    }
  });