import { Application, Text, Container, Ticker, TextStyle } from "pixi.js";
import {app} from "../index";

export class ScoreNotice extends Container {
    text: Text;
    _elapsedTime: number;
    constructor(score: number, x: number, y: number) {
        super();
        this._elapsedTime = 0;
        this.text = new Text({text: `+${score}`, style: {fontSize: 30, fontWeight: "600", align: "center", fill: "#ffddaa", stroke: {color: "#443300", width: 3}} as TextStyle});
        this.addChild(this.text);
        this.text.anchor = 0.5;
        this.text.position = {x: 0, y: 0};

        this.position = {x, y};
        this.alpha = 0;
        this.zIndex = 100;

        const ticker = Ticker.shared;
        ticker.add(() => {
            this._elapsedTime += ticker.deltaMS;
            if (this._elapsedTime < 300) {
                this.alpha += (ticker.deltaMS / 300);
                this.y -= 40 * (ticker.deltaMS / 300);
            } else if (this._elapsedTime > 600 && this._elapsedTime < 1000) {
                this.alpha -= (ticker.deltaMS / 500);
            } else if (this._elapsedTime >= 1200) {
                ticker.destroy();
                this.destroy();
            }
        })

    }
}