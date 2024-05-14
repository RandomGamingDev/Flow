const floor = Math.floor;

// It just uses the colors of the rainbow
const ShapeColor = [
  [148, 0, 211], // VIOLET
  [0, 0, 255], // BLUE
  [255, 127, 0], // ORANGE
  [255, 255, 0], // YELLOW
  [0, 255, 0], // GREEN
  [75, 0, 130], // INDIGO
  [255, 0, 0], // RED
];
const Shapes = [ // (This can be changed to make certain shapes illegal)
  [ // I
    "XXXX"
  ],
  [ // J
    "XOO",
    "XXX"
  ],
  [ // L
    "OOX",
    "XXX"
  ],
  [ // O
    "XX",
    "XX"
  ],
  [ // S
    "OXX",
    "XXO"
  ],
  [ // T
    "OXO",
    "XXX",
  ],
  [ // Z
    "XXO",
    "OXX"
  ]
];
const ShapeID = {
  I: 0,
  J: 1,
  L: 2,
  O: 3,
  S: 4,
  T: 5,
  Z: 6,
  NUM_PIECES: 7
}
const get_random_piece = () => floor(Math.random() * ShapeID.NUM_PIECES);
const draw_tile = (x, y, s, c) => {
  const shade_color = (shade) => c.map((v) => v + shade);

  push();
  {
    // Apply the position and size
    translate(x, y);
    scale(s);

    // Top Side
    fill(shade_color(100));
    quad(0, 0, 0.24, 0.24, 0.76, 0.24, 1, 0);
    // Bottom Side
    fill(shade_color(-140));
    quad(0, 1, 0.24, 0.76, 0.76, 0.76, 1, 1);
    // Left Side
    fill(shade_color(50));
    quad(0, 0, 0.24, 0.24, 0.24, 0.76, 0, 1);
    // Right Side
    fill(shade_color(-90));
    quad(1, 0, 0.76, 0.24, 0.76, 0.76, 1, 1);
    // Front-Facing Side
    fill(c);
    rect(0.24, 0.24, 0.52, 0.52);
  }
  pop();
}
const draw_piece = (pieceID, loc, tile_size, col) => {
  const piece = Shapes[pieceID];
  for (const i in piece)
    for (const j in piece[i])
      if (piece[i][j] == "X")
        draw_tile(loc[0] + (j - piece[i].length / 2) * tile_size, loc[1] + (i - piece.length / 2) * tile_size, tile_size, col);
}

const TilePalette = {
  Empty: [0, 0, 0, 0],
  Tile: [255, 0, 0, 255],
  Selected: [0, 255, 0, 255]
};

const Sounds = {
  Select: null,
  Unselect: null,
  Wrong: null
}

let board;
let selected = [];
// Get the box containing all tiles (returns [<top left>, <bottom right>])
const get_bounding_box = () => {
  let topleft = [...board.res];
  let bottomright = [0, 0];
  for (const tile_pos of selected)
    for (let i = 0; i < 2; i++) {
      if (tile_pos[i] < topleft[i])
        topleft[i] = tile_pos[i];
      if (tile_pos[i] > bottomright[i])
        bottomright[i] = tile_pos[i];
    }

  return [topleft, bottomright]
};

let piece_window = [];
const add_random_piece = () => piece_window.push(get_random_piece());
for (let i = 0; i < 4; i++)
  add_random_piece();
const roll_piece_window = () => {
  piece_window.splice(0, 1)
  add_random_piece();
};

let held_piece = null;

const get_mouse_pos = () => [mouseX, mouseY];
const array_eq = (arr1, arr2) => {
  if (arr1.length != arr2.length)
    return false;
  for (let i = 0; i < arr1.length; i++)
    if (arr1[i] !== arr2[i])
      return false;
  return true;
}

function preload() {
  const loadSoundAsset = (filename) => loadSound(`assets/sound/${ filename }.wav`);
  Sounds.Select = loadSoundAsset("select");
  Sounds.Unselect = loadSoundAsset("erase");
  Sounds.Wrong = loadSoundAsset("wrong");
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Initialize some globals
  board = new Pixy([0, 0], [width, height], [12, 20]);

  // Set the tiles
  for (let x = 0; x < board.res[0]; x++)
    for (let y = 0; y < 15 + floor(Math.random() * 3); y++)
      board.setPixel([x, y], TilePalette.Tile);
  board.updatePixels();

  windowResized();
  noSmooth();
  noStroke();
}

function draw() {
  background(50);
  fill(0);

  // Display the board
  rect(...board.off, ...board.size);
  // board.display(); // Debug
  for (const i in board.res[1])
    for (const j in board.res[0])
      

  // Render Side Panels
  const panel_w = 0.6 * board.size[0];
  const panel_y = 0.1 * board.size[0];
  const panel_x = board.off[0] - panel_w - 0.1 * board.size[0];
  const panel_h = height - 2 * panel_y;

  { // Display the held shape (bottom left)
    held_piece = 0;
    const hold_piece_panel_height = panel_h * 0.2;
    rect(panel_x, panel_y, panel_w, hold_piece_panel_height);

    held_piece = ShapeID.O; // TEMP
    if (held_piece != null)
      draw_piece(held_piece, [panel_x + panel_w / 2, panel_y + hold_piece_panel_height / 2], 50, ShapeColor[held_piece]);
  }

  { // Display which shapes are available (top left)
    const piece_window_y = panel_y + panel_h * 0.3;
    const piece_window_h = panel_h * 0.7;
    rect(panel_x, piece_window_y, panel_w, piece_window_h);
    for (let i = 0; i < piece_window.length; i++)
      draw_piece(piece_window[i], [panel_x + panel_w / 2, piece_window_y + piece_window_h * (i + 0.5) / 4], 50, ShapeColor[piece_window[i]]);
  }

  { // Display the score, level (the speed the game's going at), and number of lines (award for riskier moves like clearing 4 lines with a line) top right

  }

  //draw_tile(50, 50, 100, [255, 0, 0]);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  board.size[1] = height;
  board.size[0] = height * (board.res[0] / board.res[1]);
  board.off[0] = (width - board.size[0]) / 2;
}

// all full and select and rotate to make everything fall and delete everything as quickly as possible

function mouseClicked() {
  // Calculate the possible tile coordinate
  const tile_coord = 
    get_mouse_pos()
      .map((v, i) =>
        floor((v - board.off[i]) / board.size[i] * board.res[i])
      );
    
  // Check whether the coordinates are in bound and return if they aren't
  for (const i in tile_coord) {
    const v = tile_coord[i];
    if (v < 0 || v >= board.res[i])
      return;
  }
  const selected_tile = board.getPixel(tile_coord);

  // Unselect a tile
  if (array_eq(selected_tile, TilePalette.Selected)) {
    for (const i in selected)
      if (array_eq(selected[i], tile_coord)) {
        selected.splice(i, 1);
        break;
      }
    board.setPixel(tile_coord, TilePalette.Tile);
    Sounds.Unselect.play();
  }
  // Select a tile
  else if (selected.length < 4 && array_eq(selected_tile, TilePalette.Tile)) {
    selected.push(tile_coord);
    board.setPixel(tile_coord, TilePalette.Selected);
    Sounds.Select.play();

    if (selected.length == 4) {
      const bounding_box = get_bounding_box();

    }
  }

  // Make it visible that the tile chosen is selected
  board.updatePixels();
}