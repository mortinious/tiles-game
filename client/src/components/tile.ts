import { tooltip } from "../index";
import { Container, Graphics } from "pixi.js";

export class Tile extends Container{
    type: TileType;
    dragging: boolean;
    constructor (type: TileType, tileSize: number) {
        super()
        this.type = type;
        this.dragging = false;
        const data = this.getTypeData();
        const background = new Graphics().rect(0, 0, tileSize, tileSize).fill(data.color);
        this.addChild(background);

        const border = new Graphics().rect(0, 0, tileSize, tileSize).stroke({color: "black", width: 3, alpha: 0.3, alignment: 1});
        this.addChild(border);

        this.eventMode = "static";
        
        this.on("mouseenter", e => {
            tooltip.setText(data.text)
        });

        this.on("mouseleave", e => {
            tooltip.setText();
        })
    }

    getTypeData = () => {
        switch (this.type) {
            case "field":
                return {
                    color: "#dcdc88",
                    text: "Fält\n\nDenna bricka ger 1 poäng per angränsande Skog och Sjö."
                }
            case "forest":
                return {
                    color: "#55bb55",
                    text: "Skog\n\nDenna bricka ger 3 poäng om den angränsas av Sjö, Fält och Berg"
                }
            case "mountain":
                return {
                    color: "#778888",
                    text: "Berg\n\nDenna bricka ger 1 poäng per angränsande Skog eller Berg"
                }
            case "lake":
                return {
                    color: "#7777cc",
                    text: "Sjö\n\nDenna bricka ger 1 poäng per sammanlänkad Sjö."
                }
        }
    }
}

export type TileType = "field" | "forest" | "mountain" | "lake";
