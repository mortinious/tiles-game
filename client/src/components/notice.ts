import { Application, Text, Container, Ticker, TextStyle } from "pixi.js";
import {app} from "../index";

export class Notice extends Container {
    text: Text;
    ttl: number;
    _elapsedTime: number;
    constructor(text: string, ttl: number) {
        super();
        this._elapsedTime = 0;
        this.ttl = ttl;
        this.text = new Text({text: text, style: {fontSize: 100, fontWeight: "600", align: "center", fill: "white", stroke: {color: "black", width: 5}} as TextStyle});
        this.addChild(this.text);
        this.text.anchor = 0.5;
        this.text.position = {x: 0, y: 0};

        this.position = {x: app.screen.width / 2, y: app.screen.width * 0.25};
        this.alpha = 0;
        this.zIndex = 100;

        const fadeInMS = 300;
        const fadeOutMS = 300;

        const ticker = Ticker.shared;
        ticker.add(() => {
            this._elapsedTime += ticker.deltaMS;
            if (this._elapsedTime < fadeInMS) {
                this.alpha = (this._elapsedTime / fadeInMS);
                this.scale = 1 + (5 -  5 * (this._elapsedTime / fadeInMS))
            } else if (this._elapsedTime >= fadeInMS && this._elapsedTime < fadeInMS + this.ttl) {
                if (this.alpha !== 1) this.alpha = 1;
                if (this.scale.x !== 1  || this.scale.y !== 1) this.scale = 1;
            } else if (this._elapsedTime >= fadeInMS + this.ttl && this._elapsedTime < fadeInMS + this.ttl + fadeOutMS) {
                this.alpha = 1 - ((this._elapsedTime - (fadeInMS + this.ttl)) / fadeOutMS);
            } else {
                ticker.destroy();
                this.destroy();
            }
        })

    }
}