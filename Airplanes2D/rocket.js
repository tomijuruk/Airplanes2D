

class Rocket extends Bullet {
    constructor(
        x,
        y,
        owner,
        velocity = { x, y },
        size,
        damage,
        speed,
        travelDistance,
        homing = false,
    ) {
        // Params
        super(
            x,
            y,
            owner,
            velocity,
            size,
            damage,
            speed,
            travelDistance,
        );
        this.homing = homing;
        
        //

        this.counter = 0;
        this.pushPower = 30;
        this.minus = Math.round(Math.random()) * 2 - 1

        // Class Specific
        this.destination = { x: this.velocity.x, y: this.velocity.y };
        this.destination.x *= this.travelDistance ;
        this.destination.y *= this.travelDistance ;
        
        this.destination.x = this.x + this.destination.x; // Location to end on X
        this.destination.y = this.y + this.destination.y; // Location to end on Y
        //

        this.previousSpeed = 0;
        this.invulnerable = true;
    }

    update() {
        this.previousX = this.x;
        this.previousY = this.y;

        let thspeed = lerp(this.previousSpeed, this.speed, 0.1);
        if (this.pushPower) {
            let vc1 = atan2(this.velocity.y, this.velocity.x);
            vc1 += HALF_PI * this.minus;
            let v1 = p5.Vector.fromAngle(vc1);
            this.x += v1.x * 2.5;
            this.y += v1.y * 2.5;
            thspeed = (this.owner.speedInPixels());
        } else {
            if (thspeed >= this.speed * 0.5) {


                if (this.invulnerable) {
                    this.invulnerable = false;

                    let x = this.destination.x - this.x;
                    let y = this.destination.y - this.y;

                    let angle = atan2(y, x);

                    let v1 = p5.Vector.fromAngle(angle);
                    this.velocity.x = v1.x;
                    this.velocity.y = v1.y;
                }
                if (this.homing) {
                    // FIND CLOSEST PLANE
                    let range = new Circle(this.x, this.y, 500);
                    let points = qtree.query(range);
                    let distances = [];
                    for (let point of points) {
                        if (point.userData instanceof Plane) {
                            let plane = point.userData;
                            if (plane == this.owner)
                                continue;
                            let d = sqrt((this.x - plane.x) * (this.x - plane.x) + (this.y - plane.y) * (this.y - plane.y));
                            distances.push({ plane: plane, distance: d });
                        }
                    }
                    // if found any
                    if (distances.length) {
                        distances.sort((a, b) => (a.distance > b.distance) ? 1 : -1);

                        let plane = distances[0].plane;

                        let x = plane.x - this.x;
                        let y = plane.y - this.y;

                        let angle = atan2(y, x);
                        let angle2 = atan2(this.velocity.y, this.velocity.x);

                        let direction = this.angle_rotate(angle2, angle, 0.0074533);

                        let v1 = p5.Vector.fromAngle(direction);

                        this.velocity.x = v1.x;
                        this.velocity.y = v1.y;
                    }
                }
            }
        }

        this.previousSpeed = thspeed;

        this.x += this.velocity.x * thspeed;
        this.y += this.velocity.y * thspeed;


        this.travelDistance -= this.speedInPixels();
        this.traveledDistance += this.speedInPixels();
        this.pushPower = max(this.pushPower - 1, 0);
    }

    render() {
        noStroke();
        fill(200, 200, 200);
        this.counter++;
        if (!(this.counter % 10)) {
            debris.push(new Debris(
                this.x,
                this.y,
                {
                    x: this.velocity.x * -0.1,
                    y: this.velocity.y * -0.1
                },
                1,
                [55],
                60
            ));
        }
        // push()
        // translate(this.x, this.y)
        // rotate(atan2(this.velocity.y, this.velocity.x));
        // ellipse(0, 0, 15, 5);
        // pop()

        push()
        translate(this.x, this.y);
        rotate(atan2(this.velocity.y, this.velocity.x) + HALF_PI);
        imageMode(CENTER)
        image(textures[0], 0, 0, textures[0].width / (this.size*.5), textures[0].height / (this.size*.5));
        pop()
    }
    
    calculateDamage() {
        let x = constrain(this.damage - this.traveledDistance / 200, this.damage / 200, this.damage);        
        return x;
    }

    // math 

    /// cycle(value, min, max)
    cycle(argument0, argument1, argument2) {    
        var result, delta;
        delta = (argument2 - argument1);
        result = (argument0 - argument1) % delta;
        if (result < 0) result += delta;
        return result + argument1;
    }
    /// angle_rotate(angle, target, speed)
    angle_rotate(argument0, argument1, argument2) {
        var diff;
        // 180 is to be replaced by "pi" for radians
        diff = this.cycle(argument1 - argument0, -PI, PI);
        // clamp rotations by speed:
        if (diff < -argument2) return argument0 - argument2;
        if (diff > argument2) return argument0 + argument2;
        // if difference within speed, rotation's done:
        return argument1;
    }
}