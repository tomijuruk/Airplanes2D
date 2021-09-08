(function () { Math.clamp = function (a, b, c) { return Math.max(b, Math.min(c, a)); } })();
// #GLOBALS#

var GLOBALS=[];
GLOBALS["throttleRate"] = 0.04;


// const PLAYABLE_AREA = { width: screen.width, height: screen.height }
const PLAYABLE_AREA = { width: 10000, height: 10000 }

// #GLOBALS#

let largestPlane = 0;

var qtree; //Quad Tree
var logger = new Logger(); //Logger
var scoreboard = new ScoreBoard(); //Logger
var debris = [];

let planes = [];
let bullets = [];

let imgPlanes = [];
let textures = [];


function preload() {
	// maskImage = loadImage('images/bgAlpha.png');

	imgPlanes.push(loadImage('images/basic.png'));
	textures.push(loadImage('images/rocket.png'));

}

function setup() {
	createCanvas(screen.width, screen.height);
	frameRate(60);
	planes.push(
		new Plane(
			random(100, PLAYABLE_AREA.width - 100),
			random(100, PLAYABLE_AREA.height - 100),
			16, // Radius
			undefined,
			undefined, //Turn Rate
			undefined,
			10, // Max Throttle
			undefined,
			undefined, // Fire Rate
			undefined,
			undefined, // Max Ammo
			undefined, // Reload Time
			undefined, // Accuracy
			50, // Health
			3, //Bullet Size
			7.98, //Damage
			undefined, //Bullet Speed
			undefined,
			10, // Rockets
			true,
			)
	);
	planes[0].showReticle = true;
	for (let i = 0; i < 30; i++) {
		planes.push(
			new Plane(
				random(100, PLAYABLE_AREA.width - 100),
				random(100, PLAYABLE_AREA.height - 100),
				16, // Radius
				undefined,
				undefined, //Turn Rate
				undefined,
				10, // Max Throttle
				true, // BOT?
				undefined, // Fire Rate
				undefined,
				undefined, // Max Ammo
				undefined, // Reload Time
				undefined, // Accuracy
				50, // Health
				3, //Bullet Size
				7.98, //Damage
				undefined, //Bullet Speed
				undefined,
				0, // Rockets
				false,
			)
		);
	}
	scoreboard.initialize(planes);
}

let _startTime = 0;
let DeltaSeconds = 0;
let DeltaTime = 0;

let lastPosOffset = { x: 0, y: 0 };
let lastPos = { x: 0, y: 0 };

let deathTimer = 0;

function draw() {
	_startTime = performance.now();
	background(30);

    let boundary = new Rectangle(0, 0, PLAYABLE_AREA.width, PLAYABLE_AREA.height);
	qtree = new QuadTree(boundary, 4);

	// let t1 = floor(map(map(planes[0].x, 0, PLAYABLE_AREA.width,0, width), screen.width, 0, -PLAYABLE_AREA.width + screen.width, 0));
	// let t2 = floor(map(map(planes[0].y, 0, PLAYABLE_AREA.height,0,height), screen.height, 0, -PLAYABLE_AREA.height + screen.height, 0));

	// translate(
	// 	t1,
	// 	t2
	// );


	push();
	if (planes.length) {
		if (planes[0].id == 0) {
			translate(
				-planes[0].x + width / 2,
				-planes[0].y + height / 2
			);
			lastPosOffset.x = - planes[0].x + width / 2;
			lastPosOffset.y = -planes[0].y + height / 2;
			lastPos.x = planes[0].x;
			lastPos.y = planes[0].y;
		} else {
			if (deathTimer <= 60 * 3) {
				translate(
					lastPosOffset.x,
					lastPosOffset.y
				);
				deathTimer++;
			}else {
				translate(
					-planes[0].x + width / 2,
					-planes[0].y + height / 2
				);
				lastPosOffset.x = - planes[0].x + width / 2;
				lastPosOffset.y = -planes[0].y + height / 2;
				lastPos.x = planes[0].x;
				lastPos.y = planes[0].y;
			}
		}
	} else {
		let t1 = floor(map(width / 2, screen.width, 0, -PLAYABLE_AREA.width + screen.width, 0));
		let t2 = floor(map(height / 2, screen.height, 0, -PLAYABLE_AREA.height + screen.height, 0));
		translate(t1, t2);
	}
	stroke(255, 255, 255, 55);
	strokeWeight(1);
	for (let x = 0; x < PLAYABLE_AREA.width / 100; x++) {
		line(0, x * 100, PLAYABLE_AREA.width, x * 100);
	}
	for (let y = 0; y < PLAYABLE_AREA.height / 100; y++) {
		line(y * 100, 0, y * 100, PLAYABLE_AREA.height);
	}

	strokeWeight(50);
	noFill();
	stroke(0);
	rectMode(CORNER);
	rect(0, 0, PLAYABLE_AREA.width, PLAYABLE_AREA.height);
	if (planes.length <= 1)
		if (!scoreboard.displayed)
			scoreboard.display();
	if (!planes.length)
		return;


	planes[0].mouseX = mouseX + planes[0].x - width / 2;// map(mouseX, 0, width, 0, PLAYABLE_AREA.width);
	planes[0].mouseY = mouseY + planes[0].y - height/2;//map(mouseY, 0, height, 0, PLAYABLE_AREA.height);

	for (let i = debris.length - 1; i >= 0; i--) {
		const debree = debris[i];
		if (!debree.alive) {
			debris.splice(i, 1);
			continue;
		}
		debree.update();
		debree.render();
	}

	for (let i = planes.length - 1; i >= 0; i--) {
		const plane = planes[i];
		plane.update();
		plane.collide();
		plane.render();
		let point = new Point(plane.x, plane.y, plane);
		qtree.insert(point);
		if (!plane.alive) {
			planes.splice(i, 1);
			continue;
		}
	}

	for (let i = bullets.length - 1; i >= 0; i--) {
		const bullet = bullets[i];
		let point = new Point(bullet.x, bullet.y, bullets[i]);
		qtree.insert(point);
		bullet.update();
		bullet.collide();
		if (!bullet.alive) {
			bullets.splice(i, 1);
			continue;
		}
		bullet.render();
	}


	// let point = new Point(fish.x, fish.y, fish);
	// qtree.insert(point);


	// qtree.show();
	pop();

	DeltaSeconds = (performance.now() - _startTime)/1000;
	DeltaTime += DeltaSeconds;

	renderText();

	renderMinimap();


}

function renderMinimap() {
	stroke(255);
	strokeWeight(1);
	fill(255, 20);
	rect(30, screen.height-230, 200, 200);
	//View Screen
	// lastPos.x,
	// 	lastPos.y
	// debugger;
	let x = map(lastPos.x-width/2, 0, PLAYABLE_AREA.width, 0, 200);
	let y = map(lastPos.y-height/2, 0, PLAYABLE_AREA.height, 0, 200);
	let w = map(lastPos.x+width/2, 0, PLAYABLE_AREA.width, 0, 200);
	let h = map(lastPos.y+height/2, 0, PLAYABLE_AREA.height, 0, 200);
	x += 30;
	y += screen.height - 230;
	w += 30;
	h += screen.height - 230;
	// ellipse(x, y, 12);
	push()
	rectMode(CORNERS)
	rect(x, y, w, h);
	pop()
	//View Screen
	let range = new Circle(lastPos.x, lastPos.y, 2000);
	let points = qtree.query(range);
	for (let point of points) {
		if (point.userData instanceof Plane) {
			let plane = point.userData;
			// debugger;
			let x = map(plane.x, 0, PLAYABLE_AREA.width, 0, 200);
			let y = map(plane.y, 0, PLAYABLE_AREA.height, 0, 200);
			noStroke();
			fill(255, 0, 0);
			if (planes[0] == plane)
				fill(0, 255, 0);
			//offsets
			x += 30;
			y += screen.height - 230;
			ellipse(x, y, 8 - constrain((((PLAYABLE_AREA.width + PLAYABLE_AREA.height) / 2) / 3000), 0, 5));
		}
	}
}

function renderText() {
	if (!planes.length) 
		return;
	noStroke();
	fill(255);
	textSize(12);
	textAlign(LEFT);
	text("Throttle: " + (planes[0].throttlePercentage * 100).toFixed(0) + "%", 30,20); //throttle
	text("Speed: " + planes[0].speed().toFixed(0) + " km/h", 30,35); //speed
	push()
	if (planes[0].magazine <= planes[0].initialMagazine * 0.3)
		fill(255, 60, 30);
	text("Ammo: " + ((planes[0].magazine != 0) ? planes[0].magazine : "Reloading"), 30, 50); //ammo
	pop()
	text("Health: " + ((planes[0].health != 0) ? planes[0].health : "DEAD"), 30, 65); //health
	if (planes[0].health <= planes[0].initialHealth * 0.3) {
		push()
		fill(255, 60, 30);
		text("Oil Leak: " + (85 + planes[0].burnCounter / 60).toFixed(0) + " °C", 30, 80); //oil leakage
		pop()
	}	
	text("Planes: " + planes.length, screen.width-100, 20); //amount of planes
	text("Time: " + DeltaTime.toFixed(0), screen.width-100, 35); //amount of planes
	text("FPS: " + frameRate().toFixed(0) + "    " + "MS: " + DeltaSeconds, 10, height - 10, width, height - 10); // FPS
	// text(floor(depth/5), 30,40); //depth
	// text(floor(depth/50), 30,60); // fish bonus

	logger.update();
	logger.render();
	scoreboard.render(planes[0]);
}

function mousePressed(event) {
	// Shoot
	if (event.button === 0) {
		planes[0].shoot = true;
	}
	if (event.button === 2) {
		planes[0].shootRocket = true;
	}
}

function mouseReleased(event) {
	// Stop Shooting :P
	if (event.button === 0) {
		planes[0].shoot = false;
	}
	if (event.button === 2) {
		planes[0].shootRocket = false;
	}
}

function keyPressed() {
	// Do something
	if (planes[0].id != 0) 
		return;
	if (keyCode === UP_ARROW) {
		planes[0].increaseThrottle = true;
	}
	if (keyCode === DOWN_ARROW) {
		planes[0].decreaseThrottle = true;
	}
	if (key == 'r' || key == 'R') {
		planes[0].reload();
	}
	// return false; // prevent any default behaviour
}

function keyReleased() {
	// Do something
	if (planes[0].id != 0)
		return;
	if (keyCode === UP_ARROW) {
		planes[0].increaseThrottle = false;
	}
	if (keyCode === DOWN_ARROW) {
		planes[0].decreaseThrottle = false;
	}
	// return false; // prevent any default behaviour
}
