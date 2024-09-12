
export function Fruit(x, y, speed, color, size, fruit, slicedFruit1, slicedFruit2, name) {
  this.x = x;
  this.y = y;
  this.speed = speed;
  this.color = color;
  this.size = size * 2;
  this.xSpeed = randomXSpeed(x);
  this.ySpeed = random(-10.4, -7.4);
  this.fruit = fruit;
  this.slicedFruit1 = slicedFruit1;
  this.slicedFruit2 = slicedFruit2;
  this.name = name;
  this.sliced = false;
  this.visible = true;
}

Fruit.prototype.draw = function () {
  if (this.fruit) {
    fill(this.color);
    if (this.sliced && this.name !== 'boom') {
      let aspectRatio_sliced1 = this.slicedFruit1.width / this.slicedFruit1.height;
      let sliced1_width = this.size;
      let sliced1_height = this.size / aspectRatio_sliced1;

      let aspectRatio_sliced2 = this.slicedFruit2.width / this.slicedFruit2.height;
      let sliced2_width = this.size;
      let sliced2_height = this.size / aspectRatio_sliced2;

      image(this.slicedFruit1, this.x - 25, this.y, sliced1_width, sliced1_height);
      image(this.slicedFruit2, this.x + 25, this.y, sliced2_width, sliced2_height);
    } else {
      let aspectRatio = this.fruit.width / this.fruit.height;
      let newWidth = this.size;
      let newHeight = this.size / aspectRatio;

      image(this.fruit, this.x, this.y, newWidth, newHeight);
    }
  }
  else {
    console.error("Fruit image not loaded for index");
  }

};

Fruit.prototype.update = function (gravity, force = 5) {
  if (this.sliced && this.name !== 'boom') {
    // After slicing, apply gravity and movement
    this.x -= this.xSpeed; // Move sideways
    this.y += this.ySpeed; // Fall down
    this.ySpeed += gravity * force; // Apply gravity
  } else {
    // Normal movement for non-sliced fruits
    this.x += this.xSpeed;
    this.y += this.ySpeed;
    this.ySpeed += gravity; // Apply gravity to falling fruit
  }

  // Check if the fruit goes off-screen
  if (this.y > height) {
    this.visible = false;
  }
};

Fruit.prototype.slice = function () {
  this.sliced = true; // Mark as sliced
  this.ySpeed = random(-5, -3); // Add a small upward momentum after slicing
};

export function randomFruit(fruitsList, fruitsImgs, slicedFruitsImgs) {
  var x = random(width);
  var y = height;
  var size = noise(frameCount) * 20 + 40; // Size based on noise
  var col = color(random(255), random(255), random(255)); // Random color
  var idx = round(random(0, fruitsList.length - 1));
  var fruit = fruitsImgs[idx];
  var slicedFruit1 = slicedFruitsImgs[2 * idx];
  var slicedFruit2 = slicedFruitsImgs[2 * idx + 1];
  var name = fruitsList[idx];
  return new Fruit(x, y, random(3, 5), col, size, fruit, slicedFruit1, slicedFruit2, name); // Start at height
}

function randomXSpeed(x) {
  return x > width / 2 ? random(-2.8, -0.5) : random(0.5, 2.8);
}
