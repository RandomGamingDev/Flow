const floor = Math.floor;

// It just uses the colors of the rainbow
const ShapeColor = [
  [148, 0, 211], // VIOLET
  [255, 255, 0], // YELLOW
  [0, 0, 255], // BLUE
  [255, 127, 0], // ORANGE
  [0, 255, 0], // GREEN
  [75, 0, 130], // INDIGO
  [255, 0, 0], // RED
];
const Shapes = [ // (This can be changed to make certain shapes illegal)
  [ // I
    "XXXX"
  ],
  [ // O
    "XX",
    "XX"
  ],
  [ // J
    "XOO",
    "XXX"
  ],
  [ // L
    "OOX",
    "XXX"
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
const rotate_shape = (shape) => {
  let transposed_shape = [];
  for (let i = shape[0].length - 1; i >= 0; i--) {
    let row = "";
    for (let j = 0; j < shape.length; j++)
      row += shape[j][i];
    transposed_shape.push(row);
  }

  return transposed_shape;
};

const ShapeID = {
  I: 0,
  O: 1,
  J: 2,
  L: 3,
  S: 4,
  T: 5,
  Z: 6,
  NUM_PIECES: 7
};
const get_bounding_dims_type = (dims) => {
  if (
    (dims[0] == 3 && dims[1] == 2) ||
    (dims[0] == 2 && dims[1] == 3)
  ) return ShapeDimID.D3x2;
  else if (dims[0] == 2 && dims[1] == 2)
    return ShapeDimID.D2x2;
  else if (
    (dims[0] == 4 && dims[1] == 1) ||
    (dims[0] == 1 && dims[1] == 4)
  ) return ShapeDimID.D4x1;

  return null;
};
const get_selection_shape = (serialized_selection, dims_type) => {
  switch (dims_type) {
    case ShapeDimID.D3x2: // Anything from ShapeID.J to ShapeID.Z
      // Transpose the selection
      if (serialized_selection.length == 3)
        serialized_selection = rotate_shape(serialized_selection);

      console.log(serialized_selection);

      // Test regular and flipped versions

      /*
      for (let i = 0; i < 2; i++)
      */

      break;
    case ShapeDimID.D2x2: // Just ShapeID.O
      return ShapeID.O;
    case ShapeDimID.D4x1: // Just ShapeID.I
      return ShapeID.I;
    case null:
      return null;
  }
}

// All valid shape dimensions
const ShapeDims = [
  [4, 1], // D4x1
  [2, 2], // D2x2
  [3, 2] // D3x2
];
// Lists index where all shapes following until the next index have the listed shape
const ShapeDimID = {
  D4x1: 0,
  D2x2: 1,
  D3x2: 2,
};

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
      if (piece[i][j] === 'X')
        draw_tile(loc[0] + (j - piece[i].length / 2) * tile_size, loc[1] + (i - piece.length / 2) * tile_size, tile_size, col);
}

const TilePalette = {
  Empty: [0, 0, 0, 0],
  Tile: [75, 156, 185, 255],
  Selected: [0, 240, 240, 255],
};

const Sounds = {
  Select: null,
  Unselect: null,
  Wrong: null
}

const default_rounding = 10;

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
const get_bounding_box_dims = (box) => [box[1][0] - box[0][0] + 1, box[1][1] - box[0][1] + 1];
const get_serialized_selection = (bounding_box) => {
  let serialized_selection = [];
  for (let y = bounding_box[0][1]; y <= bounding_box[1][1]; y++) {
    let row = "";
    for (let x = bounding_box[0][0]; x <= bounding_box[1][0]; x++)
      row += array_eq(board.getPixel([x, y]), TilePalette.Selected) ? 'X' : 'O';
    serialized_selection.push(row);
  }

  return serialized_selection;
}

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
  for (let x = 0; x < board.res[0]; x++) {
    let y = 0;
    for (; y < 15 + floor(Math.random() * 3); y++)
      board.setPixel([x, y], TilePalette.Tile);
    for (; y < board.res[1]; y++)
      board.setPixel([x, y], TilePalette.Empty);
  }
  board.updatePixels();

  windowResized();
  noSmooth();
  noStroke();
}

function draw() {
  background(50);
  fill(0);

  const tile_size = board.size[0] / board.res[0];

  // Display the board
  rect(...board.off, ...board.size);
  // board.display(); // Debug
  for (let x = 0; x < board.res[0]; x++)
    for (let y = 0; y < board.res[1]; y++)
      draw_tile(board.off[0] + x * tile_size, board.off[1] + y * tile_size, tile_size, Array.from(board.getPixel([x, y])));

  // Render Side Panels
  const panel_w = 0.5 * board.size[0];
  const panel_y = 0.1 * board.size[0];
  const panel_x = board.off[0] - panel_w - 0.1 * board.size[0];
  const panel_h = height - 2 * panel_y;
  const display_piece_tile_size = panel_w * 0.15;

  { // Display the held shape (bottom left)
    held_piece = 0;
    const hold_piece_panel_height = panel_h * 0.2;
    rect(panel_x, panel_y, panel_w, hold_piece_panel_height, default_rounding);

    held_piece = ShapeID.O; // TEMP
    if (held_piece != null)
      draw_piece(held_piece, [panel_x + panel_w / 2, panel_y + hold_piece_panel_height / 2], display_piece_tile_size, ShapeColor[held_piece]);
  }

  { // Display which shapes are available (top left)
    const piece_window_y = panel_y + panel_h * 0.3;
    const piece_window_h = panel_h * 0.7;
    rect(panel_x, piece_window_y, panel_w, piece_window_h, default_rounding);
    for (let i = 0; i < piece_window.length; i++)
      draw_piece(piece_window[i], [panel_x + panel_w / 2, piece_window_y + piece_window_h * (i + 0.5) / 4], display_piece_tile_size, ShapeColor[piece_window[i]]);
  }

  { // Display the score, level (the speed the game's going at), and number of lines (award for riskier moves like clearing 4 lines with a line) top right
    const score_panel_x = board.off[0] + 1.1 * board.size[0];
    const score_panel_h = panel_h * 0.3;
    rect(score_panel_x, panel_y, panel_w, score_panel_h, default_rounding);
  }
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
      const bounding_dims = get_bounding_box_dims(bounding_box);
      const dims_type = get_bounding_dims_type(bounding_dims);
      const serialized_selection = get_serialized_selection(bounding_box);
      const shape = get_selection_shape(serialized_selection, dims_type);
      console.log(shape);
      // Calculate what's underneath and if we can play it falling down and make the falling correspond to the game fall/flow speed
    }
  }

  // Make it visible that the tile chosen is selected
  board.updatePixels();
}