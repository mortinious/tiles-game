import { Assets, BitmapText, Container, Sprite, TextStyleOptions } from "pixi.js";
import { loadAsset } from "../util/utils";

export class DynamicText extends Container {
    style: TextStyleOptions;
    _spaceWidth = 5;
    _lineHeight: number;
    options?: {maxWidth: number}
    text: string;
    onLoaded: Promise<void>;
    constructor(text: string, styles: TextStyleOptions | TextStyleOptions[], options?: {maxWidth: number}) {
        super();
        this.style = Array.isArray(styles) ? styles[0] : styles;
        this._lineHeight = new BitmapText({text: "I", style: this.style}).height;
        this.text = text;
        this.options = options;
        this.onLoaded = new Promise(resolve => {
            this.initParts().then(resolve);
        })
    }

    initParts = () => {
        return new Promise<void>((resolve) => {
            this.removeChildren().forEach(child => child.destroy());
            const promises = [];
            console.log("full text : "+this.text)
            for (const part of this.text.split(/\s+/)) {
                const matches = part.match(/\[asset:([\w+]+)\]/)
                if (matches) {
                    const subparts = part.split(/(\[asset:[\w.-_]+\])/)
                    for (const subpart of subparts) {
                        if (subpart.startsWith("[")) {
                            const asset = matches[1];
                            console.log("asset: "+asset)
                            promises.push(loadAsset(asset).then(texture => {
                                const sprite = new Sprite(texture);
                                sprite.label = "subpart";
                                sprite.scale = this._lineHeight / sprite.height;
                                return sprite;
                            }));
                        } else {
                            console.log("text: "+subpart)
                            promises.push(Promise.resolve(new BitmapText({text: subpart, style: this.style})));
                        }
                    }
                } else {
                    console.log("text: "+part)
                    promises.push(Promise.resolve(new BitmapText({text: part, style: this.style})));
                }
            }
            Promise.all(promises).then(parts => {
                parts.forEach(part => {
                    this.addChild(part);
                })
                this.updatePartPosition();
                resolve();
            })
        })
    }

    updatePartPosition = () => {
        let x = 0;
        let y = 0;
        this.children.forEach((part, index) => {
            if (index > 0) {
                const prevPart = this.getChildAt(index - 1);
                if (part.label !== "subpart" || prevPart.label !== "subpart") {
                    x += this._spaceWidth
                }
                x += prevPart.width;
                if (this.options?.maxWidth && x + part.width > this.options.maxWidth) {
                    x = 0;
                    y += this.style.lineHeight as number as number;
                }
            }
            part.position = {x: x, y: y}
        })
    }
}