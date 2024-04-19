function preload() {
}

function setup() {
  createCanvas(1, 1);

  // Initialize some globals
  pixy = new Pixy([0, 0], [width, height], [10, 20]);

  // Resize the canvas to fit the screen
  windowResized();
  // Make sure that the textures aren't blurry
  noSmooth();
}

function draw() {
  background(50);

  pixy.setPixel([0, 0], color('red'));
  pixy.updatePixels();

  fill(0);
  rect(...pixy.off, ...pixy.size);
  pixy.display();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  pixy.size[1] = height;
  pixy.size[0] = height / (pixy.size[1] / pixy.size[0]);
  pixy.off[0] = (width - pixy.size[0]) / 2;
}

// all full and select and rotate to make everything fall and delete everything as quickly as possible