const LogTypes = {
    SCREEN: 'screen',
    CHAT: 'chat',
}
Object.freeze(LogTypes);

class Logger {

    constructor() {
        this.queue = [];
    }

    update() {
        if (this.queue.length > 0) {
            this.queue[0].displayTime--;
            if (this.queue[0].displayTime <= 0) {
                this.queue.splice(0, 1);
            }
        }
    }

    render() {
        if (this.queue.length > 0) {
            noStroke();
            strokeWeight(1);
            fill(this.queue[0].color);
            textAlign(CENTER);
            textSize(constrain(((this.queue[0].displayTime / 60) * 10), 12, Infinity));
            text(this.queue[0].message, 0, height / 6, width, height / 6);
        }
    }

    log(msg) {
        if (msg instanceof Bullet) {
            let bullet = msg;
            if (bullet.owner != planes[0])
                return;
            if (this.queue.length > 0) {
                if (this.queue[0].type == SCREEN)
                    this.queue[0].displayTime = 0;
            }
            this.queue.push(
                new Log(
                    (bullet.criticalStrike) ? "Critical Hit!" : "Hit!",
                    SCREEN,
                )
            );
        } else if (msg instanceof Plane) {
            let plane = msg;
            if (plane.lastDamageDealer != planes[0])
                return;
            if (this.queue.length > 0) {
                if (this.queue[0].type == SCREEN)
                    this.queue[0].displayTime = 0;
            }
            this.queue.push(
                new Log(
                    "Aircraft Destroyed!",
                    SCREEN,
                    undefined,
                    [255, 60, 30, 255],
                )
            );
        } else if (msg instanceof String) {
            this.queue.push(
                msg,
                CHAT,
            );
        }

    }
}

class Log {
    /**
     * 
     * @param {string} message 
     * @param {LogTypes} type
     */
    constructor(
        message,
        type,
        displayTime = 3,
        color = [255,255,255,255],
    ) {
        this.message = message;
        this.type = type;
        this.displayTime = displayTime * 60 // seconds * fps ( 60 fps == 1 sec )
        this.color = color;
    }
}