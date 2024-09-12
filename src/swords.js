export function Sword(color) {
  this.swipes = [];
  this.color = color;
  this.maxCircles = 20; // Maximum number of circles to keep
  this.arcLengthFactor = 1.5; // Factor to increase arc length for slicing
  this.minSliceDistance = 50; // Minimum distance for a slice to register
}

Sword.prototype.draw = function (ctx) {
  const l = this.swipes.length;

  for (let i = 0; i < this.swipes.length; i++) {
    const size = this.mapSize(i, l);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.swipes[i].x, this.swipes[i].y, size / 2, 0, Math.PI * 2); // Draw circle
    ctx.fill();
  }

  if (l < 1) {
    return;
  }
};

Sword.prototype.update = function () {
  if (this.swipes.length > this.maxCircles) {
    // Remove the oldest swipes; keep only the last defined in maxCircles
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

  // Adjust the condition to increase the arc length needed for slicing
  const sliced = (d1 < fruit.size) || ((d1 < d3 * this.arcLengthFactor && d2 < d3 * this.arcLengthFactor) && (d3 < this.minSliceDistance));
  fruit.sliced = sliced;
  return sliced;
};

Sword.prototype.swipe = function (x, y) {
  this.swipes.push({ x: x, y: y }); // Use plain object instead of createVector
};

// Helper method to map size
Sword.prototype.mapSize = function (index, total) {
  return map(index, 0, total, 10, 40); // Increase size range from 10 to 40
};

// Helper method to calculate distance
Sword.prototype.distance = function (x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};

Sword.prototype.clearSwipes = function () {
  this.swipes = []; // Reset the swipes array to empty
};

// Simple map function for size calculation
function map(value, start1, stop1, start2, stop2) {
  return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}

export default Sword;
