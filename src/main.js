function preload() {
}

function setup() {
  createCanvas(1, 1);

  // Initialize some globals
  board = new Pixy([0, 0], [width, height], [10, 20]);

  for (let x = 0; x < board.res[0]; x++)
    for (let y = 0; y < board.res[1]; y++)
      board.setPixel([x, y], color('red'));
  board.updatePixels();

  // Resize the canvas to fit the screen
  windowResized();
  // Make sure that the textures aren't blurry
  noSmooth();
}

function draw() {
  background(50);

  // Display the board
  fill(0);
  rect(...board.off, ...board.size);
  board.display();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  board.size[1] = height;
  board.size[0] = height * (board.res[0] / board.res[1]);
  board.off[0] = (width - board.size[0]) / 2;
}

// all full and select and rotate to make everything fall and delete everything as quickly as possible

function mouseClicked() {
  
}