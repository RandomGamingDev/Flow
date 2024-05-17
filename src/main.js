const floor = Math.floor;
const reverse_str = (s) => s.split("").reverse().join("");

const background_color = 10;

let font;

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
  // Make sure that we don't modify the original serialized selection
  serialized_selection = [...serialized_selection];

  switch (dims_type) {
    case ShapeDimID.D3x2: // Anything from ShapeID.J to ShapeID.Z
      // Transpose the selection
      if (serialized_selection.length == 3)
        serialized_selection = rotate_shape(serialized_selection);

      // Test regular and flipped versions
      let i = ShapeDimID.D3x2
      for (; i < Shapes.length; i++) {
        if (array_eq(serialized_selection, Shapes[i]))
          break;

        const temp = reverse_str(serialized_selection[0]);
        serialized_selection[0] = reverse_str(serialized_selection[1]);
        serialized_selection[1] = temp;

        if (array_eq(serialized_selection, Shapes[i]))
          break;
      }

      if (i == Shapes.length)
        return null;
      else
        return i;
    case ShapeDimID.D2x2: // Just ShapeID.O
      return ShapeID.O;
    case ShapeDimID.D4x1: // Just ShapeID.I
      return ShapeID.I;
    case null:
      return null;
  }
}
const get_shape_lowest_tiles = (serialized_selection) => {
  let lowest = [];
  for (let x = 0; x < serialized_selection[0].length; x++) {
    let y = serialized_selection.length - 1;
    for (; y >= 0; y--)
      if (serialized_selection[y][x] === 'X')
        break;
    lowest.push(y);
  }

  return lowest;
}
const is_empty_below = (shape_lowest_tiles, bounding_box) => {
  for (let i = 0; i < shape_lowest_tiles.length; i++) {
    const x = bounding_box[0][0] + i;
    for (let y = bounding_box[0][1] + shape_lowest_tiles[i] + 1; y < board.res[1]; y++)
      if (!array_eq(board.getPixel([x, y]), TilePalette.Empty))
        return false;
  }

  return true;
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
const draw_serialized_piece = (serialized_piece, loc, tile_size, col) => {
  for (const i in serialized_piece)
    for (const j in serialized_piece[i])
      if (serialized_piece[i][j] === 'X')
        draw_tile(loc[0] + (j - serialized_piece[i].length / 2) * tile_size, loc[1] + (i - serialized_piece.length / 2) * tile_size, tile_size, col);
}
const draw_piece = (pieceID, loc, tile_size, col) => draw_serialized_piece(Shapes[pieceID], loc, tile_size, col);

const TilePalette = {
  Empty: [0, 0, 0, 0],
  Tile: [75, 156, 185, 255],
  Selected: [0, 240, 240, 255],
};

const Sounds = {
  Select: null,
  Unselect: null,
  Wrong: null,
  Done: null
}

const default_rounding = 10;

let board;
let column_heights = [];
let average_column_height = 0;
/*
const recalc_average_column_height = (shortened_column_x) => {

}
*/
let tallest_column_height = 0;
// Returns the new tallest height and takes in the column to be shortened
const recalc_tallest_column_height = (shortened_column_x) => {
  // Check if it's even the tallest
  if (column_heights[shortened_column_x] < tallest_column_height)
    return tallest_column_height;

  // Check if another column has the same (or great just in case) height
  for (let i = 0; i < shortened_column_x; i++)
    if (column_heights[i] >= tallest_column_height)
      return tallest_column_height;
  for (let i = shortened_column_x + 1; i < board.res[0]; i++)
    if (column_heights[i] >= tallest_column_height)
      return tallest_column_height;

  // If it's truly the tallest then decrease it
  return tallest_column_height - 1;
};
const get_tile_size = () => board.size[0] / board.res[0];
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
let last_flow = new Date();
// Progress a random column by one (returns false if unsuccessful/reached end) which should mean a game end
const flow_tick = () => {
  let x;
  // Get an unselected column
  while (true) {
    x = floor(Math.random() * column_heights.length);

    let i = 0;
    for (; i < selected.length; i++)
      if (x == selected[i][0])
        break;
    if (i == selected.length)
      break;
  }
  const y = column_heights[x];
  column_heights[x]++;

  if (y >= board.res[1]) // Add some code so that selected columns don't tick
    return false;

  board.setPixel([x, y], TilePalette.Tile);
  return true;
}

const piece_window_size = 4;
let piece_window = [];
const add_random_piece = () => piece_window.push(get_random_piece());
for (let i = 0; i < piece_window_size; i++)
  add_random_piece();

let score = 0;
const starting_flow_delay = 2000; // Delay before being divided by the level
let level = 1;
let lines = 0; // Maybe store best??
class FallingPiece {
  static gravity_multiplier = 0.01;

  constructor(x, y, s, piece_type, serialized_piece) {
    this.x = x;
    this.y = y;
    this.s = s;
    this.piece_type = piece_type;
    this.serialized_piece = serialized_piece;

    this.y_vel = 0;
  }

  // Tells you whether or not the object's active true if yes false if no
  tick() {
    this.y_vel += level * FallingPiece.gravity_multiplier;
    this.y += this.y_vel;

    return this.y - this.serialized_piece.length < board.res[1];
  }

  render() {
    const tile_size = get_tile_size();

    draw_serialized_piece(
      this.serialized_piece,
      [board.off[0] + this.x * tile_size, board.off[1] + this.y * tile_size],
      this.s * tile_size,
      ShapeColor[this.piece_type]
    );
  }
};
let falling_pieces = [];
class LineClearAnimation {
  static lifetime = 200;

  constructor(y, h) {
    this.y = y;
    this.h = h;

    this.creation_time = new Date();
  }

  // Tells you whether or not the object's active true if yes false if no
  render() {
    const tile_size = get_tile_size();
    console.log(tile_size);

    push();
    {
      const brightness = 2 * abs((new Date() - this.creation_time) / LineClearAnimation.lifetime - 0.5);
      if (brightness > 1)
        return;

      fill(brightness * 255);
      rect(board.off[0], board.off[1] + this.y * tile_size, board.size[0], this.h * tile_size);
    }
    pop();
  }
};
let line_clear_animations = [];

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
  font = loadFont("assets/font/fff-forward.ttf");
  const loadSoundAsset = (filename) => loadSound(`assets/sound/${ filename }.wav`);
  Sounds.Select = loadSoundAsset("select");
  Sounds.Unselect = loadSoundAsset("erase");
  Sounds.Wrong = loadSoundAsset("wrong");
  Sounds.Done = loadSoundAsset("done");
}


class BackgroundParticle {
  static particle_distance_limit = 0.2;

  constructor() {
    this.x = Math.random();
    this.y = Math.random();
    this.r = 0.001 + Math.random() * 0.01;
    const particle_speed = 0.005;
    this.x_vel = Math.random() * particle_speed;
    this.y_vel = Math.random() * particle_speed;
  }

  tick() {
    // Wall bouncing
    this.x += this.x_vel;
    this.y += this.y_vel; 
    if (this.x < 0 || this.x > 1)
      this.x_vel *= -1;
    if (this.y < 0 || this.y > 1)
      this.y_vel *= -1;
  }

  render(particle_list) {
    const render_x = this.x * width;
    const render_y = this.y * height;

    // Draw the particle itself
    circle(render_x, render_y, this.r * board.size[0]);

    // Linking the particles
    push();
    for (const particle of particle_list) {
      const particle_dist = dist(this.x, this.y, particle.x, particle.y) / sqrt(2);
      if (particle_dist >= BackgroundParticle.particle_distance_limit)
        continue;

      const brightness = background_color + particle_dist / BackgroundParticle.particle_distance_limit * 0.3 * (255 - background_color);
      stroke(brightness);
      line(render_x, render_y, particle.x * width, particle.y * height);
    }
    pop();
  }
};
const num_background_particles = 25;
let background_particles = [];
for (let i = 0; i < num_background_particles; i++)
  background_particles.push(new BackgroundParticle());
const particle_background = () => {
  for (const particle of background_particles) {
    particle.tick();
    particle.render(background_particles);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Initialize some globals
  board = new Pixy([0, 0], [width, height], [12, 20]);

  // Set the tiles
  for (let x = 0; x < board.res[0]; x++) {
    let y = 0;
    const column_height = 15 + floor(Math.random() * 3);
    if (column_height > tallest_column_height)
      tallest_column_height = column_height;

    for (; y < column_height; y++)
      board.setPixel([x, y], TilePalette.Tile);
    for (; y < board.res[1]; y++)
      board.setPixel([x, y], TilePalette.Empty);
    column_heights.push(column_height);
  }
  board.updatePixels();

  // Initialize some settings
  windowResized();
  noSmooth();
  noStroke();
}

function draw() {
  textFont(font);
  background(background_color);
  particle_background();
  fill(0);

  const now = new Date();
  const tile_size = get_tile_size();

  // Display the board
  rect(...board.off, ...board.size);
  // board.display(); // Debug
  for (let x = 0; x < board.res[0]; x++)
    for (let y = 0; y < board.res[1]; y++)
      draw_tile(board.off[0] + x * tile_size, board.off[1] + y * tile_size, tile_size, Array.from(board.getPixel([x, y])));

  console.log(line_clear_animations);
  // Draw the line clear animation
  for (let i = 0; i < line_clear_animations.length; i++) {
    if (line_clear_animations[i].render())
      falling_pieces.splice(i, 1);
    else
      i++;
  }

  // Draw the falling pieces
  for (let i = 0; i < falling_pieces.length;) {
    const falling_piece = falling_pieces[i];

    // Just dispose the inactive pieces instantly we haven't hit a performance limit that requires pooling yet
    if (!falling_piece.tick()) {
      falling_pieces.splice(i, 1);
      continue;
    }

    // If not disposed render and go on to the next
    falling_piece.render();
    i++;
  }

  // Render Side Panels
  const panel_w = 0.5 * board.size[0];
  const panel_y = 0.1 * board.size[0];
  const panel_x = board.off[0] - panel_w - 0.1 * board.size[0];
  const panel_h = height - 2 * panel_y;
  const display_piece_tile_size = panel_w * 0.15;


  { // Display which shapes are available (top left)
    //rect(panel_x, panel_y, panel_w, panel_h, default_rounding);

    for (let i = 0; i < piece_window.length; i++)
      draw_piece(piece_window[i], [panel_x + panel_w / 2, panel_y + panel_h * (i + 0.5) / piece_window_size], display_piece_tile_size, ShapeColor[piece_window[i]]);
  }

  { // Display the score, level (the speed the game's going at), and number of lines (award for riskier moves like clearing 4 lines with a line) top right
    const score_panel_x = board.off[0] + 1.1 * board.size[0];
    const score_panel_h = panel_h * 0.6;
    //rect(score_panel_x, panel_y, panel_w, score_panel_h, default_rounding);

    fill(255);
    textSize(0.07 * board.size[0]);
    textAlign(CENTER, CENTER);
    textLeading(0.1 * board.size[0]);
    text(
      "Score:" + '\n' +
      String(score) + '\n\n' +
      "Level:" + '\n' +
      String(level) + '\n\n' +
      "Lines:" + '\n' +
      String(lines),
      score_panel_x + panel_w / 2,
      panel_y + score_panel_h / 2
    );
  }

  // Losing screen
  push();
  {
    // Darken everything
    fill(0, 0, 0, 150);
    rect(0, 0, width, height);

    // Popup you lost
    fill(0);
    const lose_w = 0.9 * board.size[0];
    const lose_h = 0.4 * board.size[0];
    rect((width - lose_w) / 2, (height - lose_h) / 2, lose_w, lose_h, default_rounding);

    // Lose and stats
    fill(255);
    text(
      "You lost!" + '\n' +
      "Your score:",
      width / 2,
      height / 2
    );
  }
  pop();

  // Handle flow (level only makes speed rise to the root)
  if (now - last_flow > starting_flow_delay / sqrt(level)) {
    flow_tick(); // Check for whether or not you hit a loss later
    last_flow = now;
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
  const tile_size = get_tile_size();

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

    if (selected.length == 4) {
      // Get the bounding box, shape type, and then use it to identify validity as well as do the rest of the needed calculations
      const bounding_box = get_bounding_box();
      const bounding_dims = get_bounding_box_dims(bounding_box);
      const dims_type = get_bounding_dims_type(bounding_dims);
      const serialized_selection = get_serialized_selection(bounding_box);
      const shape = get_selection_shape(serialized_selection, dims_type);

      // Calculate what's underneath and if we can play it falling down and make the falling correspond to the game fall/flow speed
      const shape_window_i = piece_window.lastIndexOf(shape); // Check held lastIndexOf and combine with held
      if (shape_window_i != -1) {
        const shape_lowest_tiles = get_shape_lowest_tiles(serialized_selection);
        const empty_below = is_empty_below(shape_lowest_tiles, bounding_box);

        if (empty_below) {
          // Add a falling piece entity (gets cleared upon exiting the scren)
          falling_pieces.push(
            new FallingPiece(
              bounding_box[0][0] + bounding_dims[0] / 2,
              bounding_box[0][1] + bounding_dims[1] / 2,
              1, shape, serialized_selection
            )
          );

          const old_tallest_column_height = tallest_column_height;
          // Update column_heights and remove the selected
          for (const tile of selected) {
            board.setPixel(tile, TilePalette.Empty);
            const tile_x = tile[0];

            // Recalculate the tallest column height
            tallest_column_height = recalc_tallest_column_height(tile_x);
            column_heights[tile_x]--;
          }

          // Reset the selection and update the board
          selected = [];
          piece_window[shape_window_i] = get_random_piece();

          // Calculate the score, level, and lines cleared
          const lines_cleared = old_tallest_column_height - tallest_column_height;
          if (lines_cleared > 0)
            line_clear_animations.push(new LineClearAnimation(bounding_box[0][1], bounding_dims[1]));

          lines += lines_cleared;
          score += (4 + lines_cleared * lines_cleared) * level;
          level = 1 + floor(lines / 8);

          Sounds.Done.play();
        }
        else
          Sounds.Wrong.play();
      }
      else
        Sounds.Wrong.play();
    }
    else
      Sounds.Select.play();
  }

  // Make it visible that the tile chosen is selected
  board.updatePixels();
}