const ninjaController = {
  fruitSlicingGame: null,
  fruitsList: ['apple', 'banana', 'peach', 'strawberry', 'watermelon'],
  fruit: [
    require("./images/fruitNinja/fruits/apple.png"),
    require("./images/fruitNinja/fruits/banana.png"),
    require("./images/fruitNinja/fruits/peach.png"),
    require("./images/fruitNinja/fruits/strawberry.png"),
    require("./images/fruitNinja/fruits/watermelon.png"),
  ],
  slicedFruit1: [
    require("./images/fruitNinja/fruits/apple-1.png"),
    require("./images/fruitNinja/fruits/banana-1.png"),
    require("./images/fruitNinja/fruits/peach-1.png"),
    require("./images/fruitNinja/fruits/strawberry-1.png"),
    require("./images/fruitNinja/fruits/watermelon-1.png"),
  ],
  slicedFruit2: [
    require("./images/fruitNinja/fruits/apple-2.png"),
    require("./images/fruitNinja/fruits/banana-2.png"),
    require("./images/fruitNinja/fruits/peach-2.png"),
    require("./images/fruitNinja/fruits/strawberry-2.png"),
    require("./images/fruitNinja/fruits/watermelon-2.png"),
  ],

  init(canvas = null) {
    this.fruitSlicingGame = new FruitSlicingGame(canvas, this.fruitsList, this.fruit, this.slicedFruit1, this.slicedFruit2);
    this.fruitSlicingGame.preload(() => {
      this.startGame(); // Start the game after images are loaded
    });
  },

  startGame() {
    this.fruitSlicingGame.isPlay = true;
    const loop = () => {
      this.fruitSlicingGame.game();
      requestAnimationFrame(loop);
    };
    loop();
  },
}

export default ninjaController;

// Fruit Class
class Fruit {
  constructor(canvas, x, y, speed, color, size, fruit, slicedFruit1, slicedFruit2, name) {
    this.canvas = canvas;
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.color = color;
    this.size = size * 2; // Adjust size for drawing
    this.xSpeed = this.randomXSpeed(x);
    this.ySpeed = Math.random() * (-10.4 + 7.4) + 7.4; // Random speed
    this.fruit = fruit;
    this.slicedFruit1 = slicedFruit1;
    this.slicedFruit2 = slicedFruit2;
    this.name = name;
    this.sliced = false;
    this.visible = true;
  }

  draw(ctx) {
    if (this.sliced && this.name !== 'boom') {
      ctx.drawImage(this.slicedFruit1, this.x - 25, this.y, this.size, this.size);
      ctx.drawImage(this.slicedFruit2, this.x + 25, this.y, this.size, this.size);
    } else {
      if (this.fruit && this.fruit instanceof HTMLImageElement) {
        ctx.drawImage(this.fruit, this.x, this.y, this.size, this.size);
      } else {
        console.error("Fruit image is invalid");
      }
    }
  }

  update(gravity) {
    if (this.sliced && this.name !== 'boom') {
      this.x -= this.xSpeed;
      this.y += this.ySpeed;
      this.ySpeed += gravity * 5;
    } else {
      this.x += this.xSpeed;
      this.y += this.ySpeed;
      this.ySpeed += gravity;
    }
    if (this.y > this.canvas.height) {
      this.visible = false;
    }
  }

  randomXSpeed(x) {
    return x > this.canvas.width / 2 ? Math.random() * (-2.8 + 0.5) + 0.5 : Math.random() * (2.8 + 0.5) - 0.5;
  }
}

// Sword Class
class Sword {
  constructor(color) {
    this.swipes = [];
    this.color = color;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    this.swipes.forEach((swipe, index) => {
      const size = (index / this.swipes.length) * 25 + 2;
      ctx.beginPath();
      ctx.arc(swipe.x, swipe.y, size, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  update() {
    if (this.swipes.length > 20) {
      this.swipes.splice(0, 1); // Remove the first swipe
    }
  }

  checkSlice(fruit) {
    if (fruit.sliced || this.swipes.length < 2) {
      return false;
    }
    const stroke1 = this.swipes[this.swipes.length - 1]; // Latest stroke
    const stroke2 = this.swipes[this.swipes.length - 2]; // Second last stroke

    const d1 = this.distance(stroke1, fruit);
    const d2 = this.distance(stroke2, fruit);
    const d3 = this.distance(stroke1, stroke2);

    const sliced = (d1 < fruit.size) || ((d1 < d3 && d2 < d3) && (d3 < fruit.canvas.width / 4));
    fruit.sliced = sliced;
    return sliced;
  }

  swipe(x, y) { // Sword swipe
    this.swipes.push({ x, y });
  }

  distance(point, fruit) {
    return Math.sqrt((point.x - fruit.x) ** 2 + (point.y - fruit.y) ** 2);
  }
}

// Main Game Class
class FruitSlicingGame {
  constructor(canvas = null, fruitsList = null, fruitsImgs = null, slicedFruit1 = null, slicedFruit2 = null) {
    this.canvas = canvas;
    this.score = 0;
    this.points = 0;
    this.lives = 3;
    this.isPlay = false;
    this.gravity = 0.1;
    this.sword = null;
    this.fruit = [];
    this.slicedFruit1 = slicedFruit1;
    this.slicedFruit2 = slicedFruit2;
    this.fruitsImgs = fruitsImgs;
    this.slicedFruitsImgs = [];
    this.fruitsList = fruitsList;
    this.ctx = this.canvas.getContext('2d');
    this.canvas.addEventListener('click', (event) => this.handleClick(event));
    this.sword = new Sword("#FFFFFF");
  }

  preload(callback) {
    const totalImages = this.fruitsList.length * 3; // Each fruit has 3 images
    let loadedImages = 0;

    const onImageLoad = () => {
      loadedImages++;
      if (loadedImages === totalImages && callback) {
        callback(); // Call the callback when all images are loaded
      }
    };

    this.fruitsImgs.forEach((imgSrc) => {
      const img = new Image();
      img.src = imgSrc;
      img.onload = onImageLoad;
      img.onerror = () => console.error(`Failed to load image: ${imgSrc}`);
      this.slicedFruitsImgs.push(img);
    });

    this.slicedFruit1.forEach((imgSrc) => {
      const img = new Image();
      img.src = imgSrc;
      img.onload = onImageLoad;
      img.onerror = () => console.error(`Failed to load sliced image: ${imgSrc}`);
    });

    this.slicedFruit2.forEach((imgSrc) => {
      const img = new Image();
      img.src = imgSrc;
      img.onload = onImageLoad;
      img.onerror = () => console.error(`Failed to load sliced image: ${imgSrc}`);
    });
  }

  draw() {
    // Set the background color to black
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw the fruits
    this.fruit.forEach((f) => f.draw(this.ctx));
    this.sword.draw(this.ctx);
  }

  game() {
    // Randomly spawn a new fruit
    if (Math.random() < 0.1) { // Adjust the probability as needed
      const newFruit = this.randomFruit();
      if (newFruit) {
        this.fruit.push(newFruit);
      }
    }

    // Update and draw fruits
    this.fruit.forEach((f) => {
      f.update(this.gravity);
      if (!f.visible) {
        this.fruit.splice(this.fruit.indexOf(f), 1);
      } else {
        if (this.sword.checkSlice(f) && f.name !== 'boom') {
          f.sliced = true; // Mark as sliced
        }
      }
    });

    this.sword.update();
    this.draw(); // Call the draw method to render the frame
  }

  handleClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.sword.swipe(x, y);
  }

  randomFruit() {
    const size = Math.random() * 200 + 40; // Random size
    const x = Math.random() * this.canvas.width;
    const y = this.canvas.height - size; // Start from the bottom
    const idx = Math.floor(Math.random() * this.fruitsList.length);

    const fruitImg = this.fruitsImgs[idx]; // This should be an Image object
    const slicedFruit1 = this.slicedFruit1[idx];
    const slicedFruit2 = this.slicedFruit2[idx];
    const name = this.fruitsList[idx];

    // Log the images to verify they are valid
    console.log(`Creating fruit: ${name}, Image:`, fruitImg);

    return new Fruit(this.canvas, x, y, 0, null, size, fruitImg, slicedFruit1, slicedFruit2, name);
  }

  gameOver() {
    console.log("Game Over");
    this.lives = 0; // Reset lives or handle game over
  }
}
