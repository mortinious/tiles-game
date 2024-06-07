import { Container, Graphics, Text } from "pixi.js";
import { app } from "../index";
import colors from "../../../common/colors.json";
import { Input } from "@pixi/ui";
import { LargeTextStyle, MediumTextStyle } from "../util/textstyles";

export class Login extends Container {
    constructor (x: number, y: number, loginCallback: (name: string) => void) {
        super();
        this.x = x;
        this.y = y; 

        this.addChild(new Graphics().roundRect(0, 0, 300, 200, 10).fill(colors.boardsquare1).stroke({color: colors.tilegreen, width: 5}));

        const login = () => {
            const value = input.value;
            if (!value.trim()) {
                return;
            }
            localStorage.setItem("name", value);
            loginCallback(value);
        }

        const input = new Input({
            bg: new Graphics().roundRect(0, 0, 200, 40, 5).fill("white").stroke({color: "black", width: 2, alpha: 0.5}),
            textStyle: MediumTextStyle,
            align: "center",
            padding: {top: 5, left: 5, bottom: 5, right: 5}
        });
        input.position = {x: 50, y: 100};
        input.value = localStorage.getItem("name") || "";
        this.addChild(input);

        const nameText = new Text({text: "Välj ett namn", style: LargeTextStyle});
        nameText.position = {x: this.width / 2, y: 40};
        nameText.anchor = 0.5;
        this.addChild(nameText);

        const button = new Graphics().roundRect(100, 150, 100, 40, 5).fill(colors.tilegreen).stroke({color: "black", width: 4, alignment: 1, alpha: 0.3});
        button.eventMode = "static";
        button.on("click", () => {
            login();
        })
        this.addChild(button);

        const buttonText = new Text({text: "OK", style: MediumTextStyle});
        buttonText.position = {x: this.width / 2, y: 170};
        buttonText.anchor = 0.5;
        this.addChild(buttonText);

        const onEnter = (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                login();
            }
        };
        app.stage.on("keydown", onEnter)
        

    }


}