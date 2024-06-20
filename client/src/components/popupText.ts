import { Container, Ticker } from "pixi.js";
import { DynamicText } from "./dynamicText";

export class PopupText extends Container {
    text: DynamicText;
    _elapsedTime: number;
    constructor(text: string, x: number, y: number) {
        super();
        this._elapsedTime = 0;
        this.text = new DynamicText(text, {fontSize: 30, fontWeight: "600", align: "center", fill: "#ffddaa", stroke: {color: "#443300", width: 3}});
        this.text.onLoaded.then(() => {
            this.text.pivot = {x: this.text.width / 2, y: this.text.height/ 2};
            this.text.position = {x: 0, y: 0};
        })
        this.addChild(this.text);

        this.position = {x, y};
        this.alpha = 0;
        this.zIndex = 100;

        Ticker.shared.add(ticker => {
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