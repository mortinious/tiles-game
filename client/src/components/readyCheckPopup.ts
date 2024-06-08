import { GameData } from "common/gameData";
import { BitmapText, Container, Graphics, Text } from "pixi.js";
import { LargeTextStyle, SmallTextStyle } from "../util/textstyles";
import colors from "../../../common/colors.json";

export class ReadyCheckPopup extends Container {
    data: GameData;
    waiting: number;
    _playerId: string;
    constructor(data: GameData, playerId: string, onReadyUp: (ready: boolean, waiting: boolean) => void) {
        super();
        this.data = data;
        this.waiting = data.players.length;
        this._playerId = playerId;
        this.addChild(new Graphics().roundRect(0, 0, 300, 120, 10).fill(colors.tilewhite).stroke({color: colors.areaborder, width: 5}))
        const title = new BitmapText({text: "Är du redo?", style: LargeTextStyle});
        title.anchor = 0.5;
        title.position = {x: 150, y: 40};
        title.label = "title";
        this.addChild(title);

        const button = new Graphics().roundRect(90, 70, 120, 40, 5).fill(colors.tileyellow).stroke({color: colors.areaborder, width: 5});
        button.eventMode = "static";
        button.label = "button";
        const buttonText = new BitmapText({text: "Jag är redo!", style: SmallTextStyle});
        buttonText.anchor = 0.5;
        buttonText.position = {x: 150, y: 90};
        button.addChild(buttonText);
        button.eventMode = "static";

        button.on("pointerdown", () => {
            onReadyUp(!this.data.players.find(x => x.id === playerId)?.ready, this.waiting !== 0);
        });

        this.addChild(button);

        this.updateReadyCheckButton(this.data.players.length);
    }

    updateReadyCheckButton = (waiting: number) => {
        this.waiting = waiting;
        const title = (this.getChildByLabel("title") as Text);
        const button = this.getChildByLabel("button");
        if (!title || !button) return;
        if (!this.data.players.find(x => x.id === this._playerId)?.ready) {
            title.text = "Är du redo?";
            (button.children[0] as Text).text = "Jag är redo!";
            button.alpha = 1;
        } else if (waiting === 0) {
            title.text = "Alla är redo!";
            (button.children[0] as Text).text = "Starta spelet";
            button.alpha = 1;
        } else {
            title.text = "Inväntar spelare";
            (button.children[0] as Text).text = "Avbryt";
        }
    }
}