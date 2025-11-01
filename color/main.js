const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const colorDisplay = document.getElementById('color');

    // Access the camera
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        video.srcObject = stream;
        video.addEventListener('loadedmetadata', () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        });
      })
      .catch((err) => console.error('Camera access error:', err));

    // Draw video to canvas and get pixel color on click
    canvas.addEventListener('click', (event) => {
      // Draw the current video frame to the canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get the click position relative to the canvas
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Get pixel data at the clicked position
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const [r, g, b, a] = pixel;

      // Display the color
      colorDisplay.textContent = `Color: rgba(${r}, ${g}, ${b}, ${a / 255})`;
      canvas.style.border = `5px solid rgba(${r}, ${g}, ${b}, ${a / 255})`;
    });