import { BitmapText, Container, Graphics, Text, TextStyle } from "pixi.js";

export class Tooltip extends Container{
    text: Text; 
    constructor (text?: string) {
        super();

        const background = new Graphics().roundRect(0, 0, 250, 400, 10).fill({color: "black", alpha: 0.5});
        this.addChild(background);

        this.text = new Text({style: {fontSize: 17, fill: "white", wordWrap: true, wordWrapWidth: background.width - 40} as TextStyle});
        this.setText(text);
        this.text.x = 20;
        this.text.y = 20;
        this.addChild(this.text);
    }

    setText = (text?: string) => {
        if (!text) {
            this.text.text = "Håll muspekaren över en bricka för att få information om den.\n\nPå din tur väljer du en bricka från de 5 du blivit tilldelad och drar den ut på brädet.\nDu får poäng baserat på vilka brickor som angränsar brickan när du lägger ut den.\nPilarna på brickan säger vilka angrändande färger som get poäng.\n\nPå brädet finns några rutor som ger extra poäng (+1/+2).";
            return;
        }
        this.text.text = text;
    }
}