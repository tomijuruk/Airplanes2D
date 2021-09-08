

class Debris {
    constructor(
        x,
        y,
        velocity,
        size,
        color = [255],
        time,
    ) {
        this.x = x;
        this.y = y;
        this.velocity = velocity;
        this.size = (size == 1) ? 1 : round(size / random(size / 8, size / 3));
        this.color = color;
        this.pieces = [];
        this.time = (time) ? time : 60 * random(3, 5);
        this.alive = true;
        for (let i = 0; i < this.size; i++) {
            this.pieces.push(
                new Piece(
                    this.x,
                    this.y,
                    this.velocity,
                    this.size,
                )
            );
        }
    }
    
    update(){
        this.time--;
        if (this.time <= 0)
            this.alive = false;
    }

    render() {
        for (let piece of this.pieces) {
            piece.update();
            piece.render(this.color);
        }
    }
}

class Piece {
    constructor(
        x,
        y,
        velocity,
        size,
    ) {
        this.x = x;
        this.y = y;
        this.velocity = { x: 0, y: 0 }
        this.velocity.x = velocity.x * random(0.5, 3);
        this.velocity.y = velocity.y * random(0.5, 3);
        this.size = constrain(size + random(-1, 1), 0, size + 1);
        this.speed = random(1, 2);
        this.rotation = 0; // along PI
        this.rotationCounter = random(0.01, 0.1);
        this.vertices = [];
        for (let i = 0; i < random(3, 10); i++) {
            this.vertices.push(
                {
                    x:
                        random(-5 - this.size, 5 + this.size),
                    y:
                        random(-5 - this.size, 5 + this.size)
                }
            );
        }
    }

    update() {
        this.x += this.velocity.x * this.speed;
        this.y += this.velocity.y * this.speed;
    }

    render(color = [255]) {
        this.rotation = (this.rotation + this.rotationCounter) % TWO_PI;
        fill(color);
        noStroke();
        push();
        translate(this.x, this.y)
        rotate(this.rotation);
        beginShape()
        for (let i = 0; i < this.vertices.length; i++) {
            vertex(this.vertices[i].x, this.vertices[i].y)
        }
        endShape(CLOSE)
        pop();
    }

}