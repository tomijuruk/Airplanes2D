

class ScoreBoard {
    constructor() {
        this.planes = {};
        this.displayed = false;
    }

    initialize(planesArray) {
        this.planes = [];
        // {
        //     plane,
        //     score: 0,
        //     kills: 0,
        // }

        for (let plane of planesArray) {
            this.planes.push(
                {
                    plane: plane,
                    score: 0,
                    kills: 0,
                }
            );
        }
    }

    render(specificPlayer) {
        // debugger;
        if (specificPlayer != undefined) {
            let score = this.findPlane(specificPlayer);
            if (!score)
                return;

            noStroke();
            strokeWeight(1);
            fill(255);
            textAlign(RIGHT);
            textSize(12);
            text("Score: " + score.score, 0, height - 30, width - 30, height - 30);
            text("Kills: " + score.kills, 0, height - 45, width - 30, height - 45);
        }
    }

    display() {
        this.displayed = true;
        this.planes.sort((a, b) => (a.score < b.score) ? 1 : -1);
        let stringboard = "Name   |   Score   |   Kills   |   Died";
        for (let score of this.planes) {
            stringboard += "\n" + 
                score.plane.name +
                "   |   " +
                score.score +
                "   |   " +
                score.kills +
                "   |   " +
                ((score.plane.alive) ? "No" : "Yes");
        }
        alert(stringboard);
    }

    findPlane(plane) {
        for (let score of this.planes) {
            if (score.plane == plane) {
                return score;
            }
        }
        return false;
    }
    addKill(plane) {
        let x = this.findPlane(plane);
        if (x)
            x.kills++;
    }
    addScore(plane, value) {
        let x = this.findPlane(plane);
        if (x)
            x.score += value;
    }
    setScore(plane, value) {
        let x = this.findPlane(plane);
        if (x)
            x.score = value;
    }
    subScore(plane, value) {
        let x = this.findPlane(plane);
        if (x)
            x.score -= value;
    }
}