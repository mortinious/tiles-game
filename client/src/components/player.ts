import { BitmapText, Container, Graphics, Text } from "pixi.js";
import colors from "../../../common/colors.json";
import { PlayerData } from "../../../common/playerData";
import { MediumTextStyle, SmallTextStyle } from "../util/textstyles";
import { GameData } from "../../../common/gameData";

export class Player extends Container{
    data: PlayerData;
    _game: GameData;
    _text: Text;
    _background: Graphics;
    _subtext: BitmapText;
    constructor (data: PlayerData, gameData: GameData) {
        super();
        this.data = data;
        this._game = gameData;
        this.label = data.id;

        const text = data.name;
        const style = MediumTextStyle.clone();
        this._background = new Graphics().roundRect(0, 0, 220, 70, 10);
        this.addChild(this._background);
        this._text = new Text({text: text, style: style});
        this._text.position = {x: 10, y: 5};
        this.addChild(this._text);

        this._subtext = new BitmapText({style: SmallTextStyle});
        if (this._game.state.stage === "readycheck") {
            this._subtext.text = data.ready ? "Redo" : "Ej redo";
        } else {
            this._subtext.text = `Poäng: ${data.score}`;
        }
        this._subtext.position = {x: 10, y: 35};
        this.addChild(this._subtext);

        this.updatePlayerColor();
    }

    updatePlayerColor = () => {
        const colors = this.getPlayerColors() || {main: "white", border: "black", text: "black"};
        this._background.fill(colors.main);
        this._background.stroke({color: colors.border, width: 5});
        this._text.style.fill = colors.text;
        this._subtext.style.fill = colors.text;
    }

    getPlayerColors = () => {
        if (!Object.keys(colors.playercolors).includes(this.data.color)) return null;
        return colors.playercolors[this.data.color as keyof typeof colors.playercolors];
    }

    updatePlayer = (data: Partial<PlayerData>) => {
        Object.assign(this.data, data);
        if (Object.hasOwn(data, "name")) {
            this._text.text = data.name || "";
        }
        if (this._game.state.stage === "readycheck" && Object.hasOwn(data, "ready")) {
            this._subtext.text = data.ready ? "Redo" : "Ej redo";
        }
        if (this._game.state.stage !== "readycheck" && Object.hasOwn(data, "score")) {
            this._subtext.text = `Poäng: ${data.score}`;
        }
        if (Object.hasOwn(data, "color")) {
            this.updatePlayerColor();
        }
    }
}