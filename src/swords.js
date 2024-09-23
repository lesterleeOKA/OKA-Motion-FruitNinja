export function Sword(color) {
  this.swipes = [];
  this.color = color;
  this.maxCircles = 10; // Maximum number of circles to keep
  this.arcLengthFactor = 1.5; // Factor to increase arc length for slicing
  this.minSliceDistance = 50; // Minimum distance for a slice to register
}

Sword.prototype.draw = function (ctx) {
  const l = this.swipes.length;

  ctx.lineCap = 'round';

  if (l < 2) return; // Ensure there are enough swipes to draw

  // Create a gradient based on the first and last swipe points
  const gradient = ctx.createLinearGradient(this.swipes[0].x, this.swipes[0].y, this.swipes[l - 1].x, this.swipes[l - 1].y);
  gradient.addColorStop(0, 'rgba(5, 245, 245, 1)'); // Gray
  gradient.addColorStop(1, 'rgba(255, 255, 255, 1)'); // White

  // Draw the outline first
  for (let i = 0; i < l - 1; i++) {
    ctx.lineWidth = (i + 1) * (20 / l) + 4; // Increase line width for the outline
    ctx.beginPath();
    ctx.moveTo(this.swipes[i].x, this.swipes[i].y);
    ctx.lineTo(this.swipes[i + 1].x, this.swipes[i + 1].y);
    ctx.strokeStyle = 'black'; // Set stroke style to black for outline
    ctx.stroke();
  }

  // Draw the gradient fill on top
  ctx.lineWidth = 0; // Reset line width for the gradient
  ctx.strokeStyle = gradient; // Set the stroke style to the gradient

  for (let i = 0; i < l - 1; i++) {
    ctx.lineWidth = (i + 1) * (20 / l); // Dynamic line width
    ctx.beginPath();
    ctx.moveTo(this.swipes[i].x, this.swipes[i].y);
    ctx.lineTo(this.swipes[i + 1].x, this.swipes[i + 1].y);
    ctx.stroke();
  }
};

Sword.prototype.update = function () {
  if (this.swipes.length > this.maxCircles) {
    this.swipes.splice(0, this.swipes.length - this.maxCircles);
  }
};

Sword.prototype.checkSlice = function (fruit) {
  if (fruit.sliced || this.swipes.length < 2) {
    return false;
  }
  const length = this.swipes.length;
  const stroke1 = this.swipes[length - 1];
  const stroke2 = this.swipes[length - 2];

  const d1 = this.distance(stroke1.x, stroke1.y, fruit.x, fruit.y);
  const d2 = this.distance(stroke2.x, stroke2.y, fruit.x, fruit.y);
  const d3 = this.distance(stroke1.x, stroke1.y, stroke2.x, stroke2.y);

  const sliced = (d1 < fruit.size) || ((d1 < d3 * this.arcLengthFactor && d2 < d3 * this.arcLengthFactor) && (d3 < this.minSliceDistance));
  fruit.sliced = sliced;
  return sliced;
};

Sword.prototype.swipe = function (x, y) {
  this.swipes.push({ x: x, y: y });
};

Sword.prototype.mapSize = function (index, total) {
  return map(index, 0, total, 10, 40);
};

Sword.prototype.distance = function (x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};

Sword.prototype.clearSwipes = function () {
  this.swipes = [];
};

function map(value, start1, stop1, start2, stop2) {
  return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}

export default Sword;
