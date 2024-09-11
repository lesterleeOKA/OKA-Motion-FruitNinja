var force = 5;
// FRUIT 
function Fruit(x,y,speed,color,size,fruit,slicedFruit1,slicedFruit2,name){
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

Fruit.prototype.draw = function(){
    fill(this.color);
    if(this.sliced && this.name != 'boom'){ // Draw sliced fruit
        let aspectRatio_sliced1 = this.slicedFruit1.width / this.slicedFruit1.height;
        let sliced1_width = this.size;
        let sliced1_height = this.size / aspectRatio_sliced1;

        let aspectRatio_sliced2 = this.slicedFruit2.width / this.slicedFruit2.height;
        let sliced2_width = this.size;
        let sliced2_height = this.size / aspectRatio_sliced2;

        image(this.slicedFruit1, this.x - 25, this.y, sliced1_width, sliced1_height);
        image(this.slicedFruit2, this.x + 25, this.y, sliced2_width, sliced2_height);
    }else{ // Draw fruit
        let aspectRatio = this.fruit.width / this.fruit.height;
        let newWidth = this.size;
        let newHeight = this.size / aspectRatio; // Maintain aspect ratio

        image(this.fruit, this.x, this.y, newWidth, newHeight);
    }
};

Fruit.prototype.update = function(){
    if(this.sliced && this.name != 'boom'){
        this.x -= this.xSpeed ;
        this.y += this.ySpeed;
        this.ySpeed += gravity * force;
    }else{
        this.x += this.xSpeed;
        this.y += this.ySpeed;
        this.ySpeed += gravity;
    }
    if(this.y > height){
        this.visible = false;
    }
};

function randomFruit(){ // Create randon fruit
    var x = random(width);
    var y = height;
    var size = noise(frameCount)*20 + 40;
    var col = color(random(255),random(255),random(255));
    var speed = random(3,5);
    var idx = round(random(0,fruitsList.length-1));
    var fruit = fruitsImgs[idx];
    var slicedFruit1 = slicedFruitsImgs[2*idx];
    var slicedFruit2 = slicedFruitsImgs[2*idx + 1];
    var name = fruitsList[idx];
    return new Fruit(x,y,speed,col,size,fruit,slicedFruit1,slicedFruit2,name);
}

function randomXSpeed(x){
    if( x > width/2 ){
        return random(-2.8,-0.5); // If fruit generated on right side, go left
    }else{
        return random(0.5,2.8); // If fruit generated on right side, go left  
    }
};
