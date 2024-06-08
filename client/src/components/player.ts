import { BitmapText, Container, Text } from "pixi.js";
import colors from "../../../common/colors.json";
import { PlayerData } from "../../../common/playerData";
import { MediumTextStyle, SmallTextStyle } from "../util/textstyles";
import { GameData } from "../../../common/gameData";

export class Player extends Container{
    data: PlayerData;
    _game: GameData;
    _text: BitmapText;
    _subtext: BitmapText;
    constructor (data: PlayerData, gameData: GameData) {
        super();
        this.data = data;
        this._game = gameData;
        this.label = data.id;
        const text = data.name;
        this._text = new BitmapText({text: text, style: MediumTextStyle});
        this.addChild(this._text);

        this._subtext = new BitmapText({style: SmallTextStyle});
        if (this._game.state.stage === "readycheck") {
            this._subtext.text = data.ready ? "Redo" : "Ej redo";
        } else {
            this._subtext.text = `Poäng: ${data.score}`;
        }
        this._subtext.x = 0;
        this._subtext.y = 30;
        this.addChild(this._subtext);
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
    }
}