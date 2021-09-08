var PlaneGlobalIDCounter = -1;

class Plane {
    constructor(
        x = 0,
        y = 0,
        radius = 16,
        velocity = { x: 0, y: -1 },
        turnRate = 0.05,
        throttle = 1,
        maxThrottle = 5,
        randomMovement = false,
        fireRate = 0.08,
        color = [255, 255, 255, 255],
        magazine = 200,
        reloadTime = 10, // in seconds
        accuracy = 0.05,
        health = 50,
        bulletSize = 3,
        bulletDamage = 7.98,
        bulletSpeed = 10,
        gunTolerance = 40, // how many bullets to shoot before heat
        rockets = 0,
        rocketHoming = false,
    ) {
        this.x = x;
        this.y = y;
        this.velocity = velocity;
        this.acceleration = { x: 0, y: 0 };
        this.color = color;
        this.r = radius;
        largestPlane = (largestPlane < this.r) ? this.r : largestPlane;
        this.turnRate = turnRate; // lerp alpha
        this.throttle = throttle;
        this.maxThrottle = maxThrottle;
        this.magazine = magazine;
        this.bulletSize = bulletSize;
        this.bulletDamage = bulletDamage;
        // this.bulletDamage = 20.00;
        this.bulletSpeed = bulletSpeed;
        this.reloadTime = reloadTime;
        this.accuracy = accuracy;
        this.health = health;
        this.initialHealth = this.health;
        //Rockets
        this.rockets = rockets;
        this.rocketHoming = rocketHoming;
        //
        this.increaseThrottle = false;
        this.decreaseThrottle = false;
        this.shoot = false;
        this.shootRocket = false;
        this.gunHeat = 0;
        this.gunTolerance = gunTolerance;
        this.previousThrottle = 1;
        this.throttlePercentage = 0;
        this.previousX = x;
        this.previousY = y;
        this.fireRate = fireRate; // 0.1 == 6 rounds per 1 sec
        this.initialMagazine = this.magazine; // max ammo
        this.alive = true;
        this.lastDamageDealer = null;
        this.healed = false;

        // counters

        this.counter = 0;
        this.rocketCounter = 0;
        this.burnCounter = 0;
        this.reloadCounter = 0;
        this.xoff = random(0, 10000);
        this.yoff = random(0, 10000);

        this.randomShootCounter = random(0, 10000);

        // counters

        this.mouseX = width/2;
        this.mouseY = height/2;

        this.showReticle = false;

        this.randomMovement = randomMovement;

        PlaneGlobalIDCounter++;
        this.id = PlaneGlobalIDCounter; // unique ID
        this.name = (this.id == 0) ? "You" : "Plane " + this.id;
    }

    collide() {
        //Die if out of bounds
        if (this.x > PLAYABLE_AREA.width || this.x < 0 || this.y > PLAYABLE_AREA.height || this.y < 0) {
            this.health = 0;
        }
        let range = new Circle(this.x, this.y, this.r);
        let points = qtree.query(range);
        for (let point of points) {
            let collider = point.userData;
            if (collider instanceof Plane) {
                let plane = collider;
                let d = sqrt((this.x - plane.x) * (this.x - plane.x) + (this.y - plane.y) * (this.y - plane.y));
                if (d - this.r < plane.r) {
                    this.health = 0;
                    plane.health = 0;
                    logger.log("Plane Collision!");
                    this.lastDamageDealer = plane;
                    plane.lastDamageDealer = this;
                }
            }        
        }
    }

    update() {
        if (!this.alive) 
            return;

        if (this.health <= 0) {
            this.alive = false;
            let clr = random(200, 255);
            debris.push(new Debris(
                this.x,
                this.y,
                this.velocity,
                this.r,
                [clr, clr, clr]
            ));
            scoreboard.addScore(this.lastDamageDealer, 30);
            scoreboard.addKill(this.lastDamageDealer);
            logger.log(this);
        }

        if (this.randomMovement) {
            // this.mouseX = lerp(this.mouseX, random(0, width), 0.01);
            // this.mouseY = lerp(this.mouseY, random(0, height), 0.01);

            this.xoff = this.xoff + 0.01;
            this.yoff = this.yoff + 0.01;
            let n1 = noise(this.xoff) * PLAYABLE_AREA.width;
            let n2 = noise(this.yoff) * PLAYABLE_AREA.height;

            this.mouseX = n1;
            this.mouseY = n2;
            
            // this.mouseX = planes[0].x;
            // this.mouseY = planes[0].y;

            this.throttlePercentage = 1;
            this.throttle = this.maxThrottle;
            this.randomShootCounter++;
            if ((this.randomShootCounter % 100) <= 20)
                this.shootRocket = true;
            else
                this.shootRocket = false;

            if ((this.randomShootCounter % 60 * 3) < 60 * random(1.7, 2.2))
                this.shoot = true;
            else
                this.shoot = false;
        }
        if (this.magazine != 0) {
            if (this.shoot) {
                if (this.gunHeat > this.gunTolerance)
                    this.magazine = 0;
                this.counter++;
                if (this.counter > (this.fireRate * 60)) {
                    this.gunHeat++;
                    this.counter = 0;
                    this.magazine = max(this.magazine - 1, 0);
                    let gunLoc = this.gunLocation();
                    let gunOff = this.gunOffset();
                    let norm = createVector(this.velocity.x + random(-this.accuracy, this.accuracy),
                        this.velocity.y + random(-this.accuracy, this.accuracy));
                    norm.normalize();
                    bullets.push(
                        new Bullet(
                            gunLoc.x + gunOff.x,
                            gunLoc.y + gunOff.y,
                            this,
                            { x: norm.x, y: norm.y },
                            this.bulletSize,
                            this.bulletDamage,
                            this.bulletSpeed + (this.speed() * 0.01),
                            2394,
                            // (this.bulletSize * this.bulletDamage * this.bulletSpeed) * this.bulletSpeed
                        )
                    )
                }
            } else {
                // this.gunHeat = constrain(this.gunHeat - this.gunTolerance / 120, 0, this.gunTolerance);
                this.counter++
                if (this.counter > (this.fireRate * 60)) {
                    this.gunHeat = constrain(this.gunHeat - 1.4, 0, this.gunTolerance);
                    this.counter = 0;
                }
            }
        } else {
            this.reloadCounter++;
            this.gunHeat = this.gunTolerance;
            if (this.reloadCounter > (this.reloadTime * 60)) {
                this.reloadCounter = 0;
                this.magazine = this.initialMagazine;
                this.gunHeat = 0;
            }
        }
        if (this.rockets != 0) {
            if (this.shootRocket) {
                this.rocketCounter++;
                if (this.rocketCounter > (this.fireRate * 180)) {
                    this.rocketCounter = 0;
                    this.rockets = max(this.rockets - 1, 0);
                    // let gunLoc = this.gunLocation();
                    // let gunOff = this.gunOffset();
                    // let norm = createVector(this.velocity.x + random(-this.accuracy, this.accuracy),
                    //     this.velocity.y + random(-this.accuracy, this.accuracy));
                    // norm.normalize();
                    bullets.push(
                        new Rocket(
                            this.x,
                            this.y,
                            this,
                            { x: this.velocity.x, y: this.velocity.y },
                            6,
                            60,
                            this.bulletSpeed + (this.speed() * 0.01) * 1.5,
                            2000 + this.speed(),
                            this.rocketHoming,
                        )
                    )
                }
            }
        }

        if (this.increaseThrottle) {
            this.throttlePercentage += GLOBALS["throttleRate"];
            this.throttlePercentage = constrain(this.throttlePercentage, 0, 1);
            this.throttle = constrain(this.maxThrottle * this.throttlePercentage, 1, this.maxThrottle);
        }
        if (this.decreaseThrottle) {
            this.throttlePercentage -= GLOBALS["throttleRate"];
            this.throttlePercentage = constrain(this.throttlePercentage, 0, 1);
            this.throttle = constrain(this.maxThrottle * this.throttlePercentage, 1, this.maxThrottle);
        }

        // Accellerate towards mouse, short lerp

        // let v1 = createVector(this.x, this.y);
        // let v2 = createVector(this.mouseX, this.mouseY);

        this.acceleration = {
            x: this.mouseX - this.x,
            y: this.mouseY - this.y
        }
        // Repair on +50%
        if (this.health >= this.initialHealth * 0.5) {
            if (!(floor(DeltaTime % 10))) {
                if (!this.healed) {
                    this.healed = true;
                    this.health = constrain(this.health + 0.1, 0, this.initialHealth);                    
                }
            } else
                this.healed = false;
        }
        // Repair on +50%
        // Burn on 30% hp
        if (this.health <= this.initialHealth * 0.3) {
            // this.burnCounter++;
            this.burnCounter += ceil(((this.initialHealth / this.health) / 5) * max(this.throttlePercentage, 0.1));
            if (!(this.burnCounter % 60)) {
                debris.push(new Debris(
                    this.x,
                    this.y,
                    { x: 0, y: 0 },
                    1,
                    [255, 100, 10]
                ));
            }
            if ((this.burnCounter > 60*60)) {
                this.health -= (this.initialHealth / this.health) / 1800;
            }
            if (this.burnCounter > 6900) { // explode on 200 degrees                
                this.health = 0;
                debris.push(new Debris(
                    this.x,
                    this.y,
                    { x: random(-1, 1), y: random(-1, 1) },
                    this.r,
                    [255, 100, 10]
                ));
            }
        }
        // Burn on 30% hp
        // Disadvantage on 10% hp
        let disadvantage = { x: 1, y: 1 }
        if (this.health <= this.initialHealth * 0.1) {
            disadvantage.x = random(-500, 500);
            disadvantage.y = random(-500, 500);
        }
        this.acceleration.x += disadvantage.x;
        this.acceleration.y += disadvantage.y;
        // Disadvantage on 10% hp

        let normal = createVector(this.acceleration.x, this.acceleration.y);
        normal.normalize();

        this.acceleration.x = normal.x;
        this.acceleration.y = normal.y;

        this.previousThrottle = lerp(this.previousThrottle, this.throttle, 0.001);

        this.velocity = {
            x: lerp(this.velocity.x, this.acceleration.x, this.turnRate / this.previousThrottle),
            y: lerp(this.velocity.y, this.acceleration.y, this.turnRate / this.previousThrottle)
        }

        // reset acceleration
        this.acceleration = { x: 0, y: 0 };

        this.previousX = this.x;
        this.previousY = this.y;

        this.x += this.velocity.x * this.previousThrottle;
        this.y += this.velocity.y * this.previousThrottle;

        // noStroke();
        // fill(255);
        // text(lerp(this.velocity.x, this.velocity.x * this.throttle, 0.1), 30, 40); //throttle
        // text(lerp(this.velocity.y, this.velocity.y * this.throttle, 0.1), 30, 80); //throttle
        // text(this.previousThrottle, 30, 90); //throttle

        // this.y = constrain(this.y, 0 + this.r / 2, height - this.r / 2);
        // this.x = constrain(this.x, 0 + this.r / 2, width - this.r / 2);
        
        
        // Actually die not constrain :P

        // this.y = constrain(this.y, 0 + this.r / 2, PLAYABLE_AREA.height - this.r / 2);
        // this.x = constrain(this.x, 0 + this.r / 2, PLAYABLE_AREA.width - this.r / 2);

    }

    render() {
        //texture
        push()
        translate(this.x, this.y);
        rotate(atan2(this.velocity.y, this.velocity.x)+HALF_PI);
        imageMode(CENTER)
        image(imgPlanes[0], 0, 0, this.r * 2, this.r * 2);
        pop()
        //texture

        //PLANE
        noStroke();
        fill(this.color);
        // ellipse(this.x, this.y, this.r); // render
        //PLANE
        //GUN
        fill(255, 0, 0);
        let offset = this.gunOffset();
        // ellipse(this.x + offset.x, this.y + offset.y, 5); // render
        //GUN
        if (!this.showReticle)
            return;
        //AIM RETICLE
        noFill();
        stroke(255);
        strokeWeight(1);
        ellipse(this.mouseX, this.mouseY, 30);
        stroke(255, 0, 0, 155);
        strokeWeight(1.5);
        if (this.gunHeat > this.gunTolerance / 4) {
            arc(this.mouseX, this.mouseY, 30, 30, -HALF_PI, 0);
            if (this.gunHeat > this.gunTolerance / 3) {
                arc(this.mouseX, this.mouseY, 30, 30, 0, HALF_PI);
                if (this.gunHeat > this.gunTolerance / 2) {
                    arc(this.mouseX, this.mouseY, 30, 30, HALF_PI, PI);
                    if (this.gunHeat > this.gunTolerance / 1.5) {
                        arc(this.mouseX, this.mouseY, 30, 30, PI, HALF_PI + PI);
                    }
                }
            }
        }
        //AIM RETICLE
        //GunPointing Reticle
        stroke(255);
        strokeWeight(0.1);
        let coffset = this.gunOffset();
        // let vc = createVector(this.x - this.mouseX, this.y - this.mouseY);
        // vc.normalize();
        // let scalex = abs((this.mouseX - this.x) / 8.03);
        // let scaley = abs((this.mouseY - this.y) / 8.03);
        coffset.x *= 30
        coffset.y *= 30
        // this.x = 5;
        // this.y = 5;
        // coffset.y = constrain(coffset.y, this.y, this.y);
        push()
        translate(this.x, this.y);
        line(coffset.x + 2, coffset.y, coffset.x + 15, coffset.y);
        line(coffset.x - 2, coffset.y, coffset.x - 15, coffset.y);
        line(coffset.x, coffset.y + 2, coffset.x, coffset.y + 15);
        line(coffset.x, coffset.y - 2, coffset.x, coffset.y - 15);
        stroke(255, 0, 0);
        strokeWeight(1.5);
        point(coffset.x, coffset.y);
        pop()
        //GunPointing Reticle
    }

    speedInPixels() {
        return abs(
            abs(this.previousX - this.x)
            +
            abs(this.previousY - this.y)
        );
    }

    speed() {
        return this.speedInPixels() * 65.78;
    }

    reload() {
        if (this.magazine < this.initialMagazine)
            this.magazine = 0;
    }

    gunOffset() {
        let normal = createVector(this.velocity.x, this.velocity.y);
        normal.normalize();
        return normal.mult(this.r / 2);
    }

    gunLocation() {
        let offset = this.gunOffset();
        let loc = {
            x: this.x + offset.x,
            y: this.y + offset.y,
        }
        return loc;
    }


}