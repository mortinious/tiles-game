import { GameData } from "common/gameData";
import { BitmapText, Container, FederatedPointerEvent, Graphics, Rectangle, Text } from "pixi.js";
import { LargeTextStyle, MediumTextStyle, SmallTextStyle } from "../util/textstyles";
import colors from "../../../common/colors.json";
import { GameConfig } from "common/gameConfig";

export class ConfigArea extends Container {
    config: GameConfig;
    widthSlider: Container;
    heightSlider: Container;
    roundsSlider: Container;
    constructor(config: GameConfig, onChange: (config: Partial<GameConfig>) => void) {
        super();
        this.config = config;

        this.addChild(new Graphics().roundRect(0, 0, 300, 300, 10).fill(colors.tilewhite).stroke({color: colors.areaborder, width: 5}))
        const title = new BitmapText({text: "Inställningar", style: MediumTextStyle});
        title.anchor = 0.5;
        title.position = {x: 150, y: 40};
        title.label = "title";
        this.addChild(title);

        this.widthSlider = this._createSlider("Spelbrädets bredd", 5, 12, 10, (val: number) => onChange({boardWidth: val}));
        this.widthSlider.position = {x: 15, y: 60}
        this.heightSlider = this._createSlider("Spelbrädets höjd", 5, 12, 10, (val: number) => onChange({boardHeight: val}));
        this.heightSlider.position = {x: 15, y: 120}
        this.roundsSlider = this._createSlider("Antal rundor", 2, 20, 15, (val: number) => onChange({rounds: val}));
        this.roundsSlider.position = {x: 15, y: 180}
        this.addChild(this.widthSlider, this.heightSlider, this.roundsSlider);

        this.update();
    }

    _createSlider = (title: string, min: number, max: number, staringValue: number, onUpdate: (value: number) => void) => {
        const stepsWidth = 270 / (max - min)
        const currentStep = staringValue - min;

        const sliderHeadWidth = 30;
        const sliderHeadHeight = 30;

        const container = new Container();
        const titleText = new BitmapText({text: title, style: SmallTextStyle});
        titleText.anchor = 0.5;
        titleText.position = {x: 135, y: 20}
        container.addChild(titleText);

        const slider = new Container();
        slider.position = {x: 0, y: 35}
        container.addChild(slider);

        const sliderLines = new Graphics().moveTo(0, 0).lineTo(0, sliderHeadHeight).moveTo(0, sliderHeadHeight / 2).lineTo(270, sliderHeadHeight / 2).moveTo(270, 0).lineTo(270, sliderHeadHeight).stroke({color: "black", width: 2});
        slider.addChild(sliderLines);

        const sliderHead = new Container();
        sliderHead.label = "head";
        sliderHead.addChild(new Graphics().roundRect(-sliderHeadWidth / 2, 0, sliderHeadWidth, sliderHeadHeight, 5).fill("black"));
        sliderHead.position = {x: stepsWidth * currentStep, y: 0}
        const style = SmallTextStyle.clone();
        style.fill = "white";
        const sliderHeadText = new BitmapText({text: staringValue, style});
        sliderHeadText.anchor = 0.5;
        sliderHeadText.y = sliderHeadHeight / 2;
        sliderHead.addChild(sliderHeadText);
        slider.addChild(sliderHead);
        slider.eventMode = "static";
        slider.hitArea = new Rectangle(-10, 0, 280, sliderHeadHeight);
        const onMoveSlider = (e: FederatedPointerEvent) => {
            const local = container.toLocal(e.global);
            const steps = Math.round(Math.max(Math.min(local.x, 270), 0) / stepsWidth);
            const snapX = steps * stepsWidth;
            sliderHead.x = snapX;
            sliderHeadText.text = min + steps;
        }
        const onReleaseSlider = (e: FederatedPointerEvent) => {
            slider.off("pointermove");
            slider.off("pointerout");
            slider.off("pointerup");
            const local = container.toLocal(e.global);
            const steps = Math.round(local.x / stepsWidth);
            onUpdate(min + steps);
        }
        slider.on("pointerdown", (e: FederatedPointerEvent) => {
            onMoveSlider(e);
            slider.on("pointermove", e => {
                onMoveSlider(e);
            })
            slider.on("pointerup", onReleaseSlider);
            slider.on("pointerout", onReleaseSlider);
        });

        container.on("updateSliderStep", (value: number) => {
            const snapX = (value - min) * stepsWidth;
            sliderHead.x = snapX;
            sliderHeadText.text = value;
        })

        return container;
    }

    update = () => {
        this.heightSlider.emit("updateSliderStep", this.config.boardHeight);
        this.widthSlider.emit("updateSliderStep", this.config.boardWidth);
        this.roundsSlider.emit("updateSliderStep", this.config.rounds);
    }
}