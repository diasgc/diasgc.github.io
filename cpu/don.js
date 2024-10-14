const data = {
    labels: [
      'Red',
      'Blue',
      'Yellow'
    ],
    datasets: [{
      label: 'My First Dataset',
      data: [300, 50, 100],
      backgroundColor: [
        'rgb(255, 99, 132)',
        'rgb(54, 162, 235)',
        'rgb(255, 205, 86)'
      ],
      hoverOffset: 4
    }]
  };

  const config = {
    type: 'doughnut',
    data: data,
  };

  const chart = new Chart(document.getElementById("line-chart"), {
    width: 400,
    height: 200,
    type: "line",
    data: {
      labels: Array(dataLen).fill(""),
      datasets: [{
        data: performanceData,
        borderColor: "#2080a0",
        fill: false,
        fillColor: "#96c4be",
        tension: 10,
        cubicInterpolationMode: "monotone" // cubic, monotone, linear
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