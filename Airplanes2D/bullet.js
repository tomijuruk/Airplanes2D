

class Bullet {
    constructor(
        x,
        y,
        owner,
        velocity = { x, y },
        size,
        damage,
        speed,
        travelDistance,
        criticalChance = 0.05,
    ) {
        // Params
        this.x = x;
        this.y = y;
        this.owner = owner;
        this.velocity = velocity;
        this.size = size;
        this.damage = damage;
        this.speed = speed;
        this.travelDistance = travelDistance;
        this.criticalChance = criticalChance;
        //

        // Class Specific
        this.alive = true;
        this.previousX = this.x;
        this.previousY = this.y;
        this.traveledDistance = 0;
        this.criticalStrike = false;
        //
    }

    collide() {
        if (this.alive) {
            if (this.x > PLAYABLE_AREA.width || this.x < 0 || this.y > PLAYABLE_AREA.height || this.y < 0) {
                this.alive = false;
            }
            // die if out of bounds
            if (this.travelDistance <= 0) {
                this.alive = false;
            }
        }
        //bullet
        let range = new Circle(this.x, this.y, largestPlane);
        let points = qtree.query(range);
        for (let point of points) {
            let collider = point.userData;
            if (collider instanceof Plane) {
                let plane = collider;
                if (!this.alive)
                    continue;
                if (this.invulnerable)
                    continue;
                let d = sqrt((plane.x - this.x) * (plane.x - this.x) + (plane.y - this.y) * (plane.y - this.y));
                if (d - plane.r < this.size) {
                    plane.health -= this.calculateDamage();
                    plane.lastDamageDealer = this.owner;
                    logger.log(this);
                    this.alive = false;
                    scoreboard.addScore(this.owner, (this.criticalStrike) ? 2 : 1);
                    //debree
                    if (!(round(plane.health) % (plane.initialHealth / 5))) {
                        debris.push(new Debris(
                            plane.x,
                            plane.y,
                            {
                                x: plane.velocity.x * -0.1,
                                y: plane.velocity.y * -0.1
                            },
                            1,
                        ));
                    }
                    if (this instanceof Rocket) {
                        debris.push(new Debris(
                            plane.x,
                            plane.y,
                            {
                                x: plane.velocity.x * random(-.5, .5),
                                y: plane.velocity.y * random(-.5, .5)
                            },
                            30,
                            [55],
                        ));
                    }
                }
            }
        }
    }

    update() {
        this.previousX = this.x;
        this.previousY = this.y;

        this.x += this.velocity.x * this.speed;
        this.y += this.velocity.y * this.speed;

        this.travelDistance -= this.speedInPixels();
        this.traveledDistance += this.speedInPixels();
    }

    render() {
        noStroke();
        fill(155 + this.damage + this.speed, 155, 155);
        ellipse(this.x, this.y, this.size);
    }

    speedInPixels() {
        return (
            abs(
                abs(this.previousX - this.x)
                +
                abs(this.previousY - this.y)
            )
        );
    }

    speedInKm() {
        this.speedInPixels() * 65.78;
    }

    calculateDamage() {
        let x = constrain(this.damage - this.traveledDistance / 100, this.damage / 100, this.damage);
        if (random(1) <= this.criticalChance) {
            this.criticalStrike = true;
            return x * 2;
        }
        return x;
    }
}