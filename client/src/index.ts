import { Application, Graphics, Sprite, Texture } from "pixi.js";
import { Board } from "./components/board";
import { HandArea } from "./components/hand";
import { Tile } from "./components/tile";
import { getRandomTileType } from "./util/utils";
import { Tooltip } from "./components/tooltip";

const tileSize = 50;
const boardWidth = 10;
const boardHeight = 10;
const board = new Board(boardWidth, boardHeight, tileSize);;
const handArea = new HandArea(tileSize);
const tooltip = new Tooltip();

const init = () => {
    document.body.appendChild(app.canvas);

    const background = new Graphics().rect(0, 0, app.screen.width, app.screen.height).fill("#ddfaff");
    app.stage.addChild(background);
    
    const boardContainer = board;
    boardContainer.x = app.screen.width / 2 - boardContainer.width / 2;
    boardContainer.y = 60;
    app.stage.addChild(boardContainer);

    const handAreaContainer = handArea;
    handAreaContainer.x = boardContainer.x + boardContainer.width / 2 - handAreaContainer.areaWidth / 2;
    handAreaContainer.y = boardContainer.y + boardContainer.height + tileSize / 2;
    app.stage.addChild(handAreaContainer);

    tooltip.x = app.screen.width - 260;
    tooltip.y = 100;
    app.stage.addChild(tooltip);

    handArea.addTile(new Tile(getRandomTileType(), tileSize));
    handArea.addTile(new Tile(getRandomTileType(), tileSize));
    handArea.addTile(new Tile(getRandomTileType(), tileSize));
    handArea.addTile(new Tile(getRandomTileType(), tileSize));
    handArea.addTile(new Tile(getRandomTileType(), tileSize));
}

const app = new Application();
app.init({width: 1080, height: 720}).then(init);

export {
    app,
    board,
    handArea,
    tooltip
};
