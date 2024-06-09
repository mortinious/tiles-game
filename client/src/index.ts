import { Application, Container, FillStyle, FillStyleInputs, Graphics} from "pixi.js";
import { io } from "socket.io-client";
import events from "../../common/events.json";
import { Login } from "./components/login";
import { Lobby } from "./components/lobby";
import { Game } from "./components/game";
import { GameData } from "../../common/gameData";
import colors from "../../common/colors.json";

const colorArray = [colors.tileblue, colors.tilegreen, colors.tilewhite, colors.tileyellow];

const createLogo = () => {
    const ascii = 
`
#####  #  #     ####  #####
  #    #  #     #     #
  #    #  #     ###   #####
  #    #  #     #         #
  #    #  ####  ####  #####
`
    const size = 25;
    const logoContainer = new Container();
    logoContainer.label = "tiles";
    const rows = ascii.split("\n");
    let width = 0
    for (let row = 0; row < rows.length; row++) {
        const textrow = rows[row];
        width = Math.max(width, textrow.length);
        if (textrow.trim() === "") continue;
        for (let col = 0; col < textrow.length; col++) {
            if (textrow[col] === " ") continue;
            logoContainer.addChild(new Graphics().rect(col * size, row * size, size, size).fill(colorArray[Math.floor(Math.random() * 4)]).stroke({color: "black", width: 3, alpha: 0.3, alignment: 1}))
        }
    }
    logoContainer.width = width * size;
    return logoContainer;
}

const app = new Application();
app.init({resizeTo: window}).then(() => {
    document.body.appendChild(app.canvas);

    let playerId = "";
    let isInGame = false;

    const background = new Container();
    background.label = "background";
    app.stage.addChild(background);

    const backgroundColor = new Graphics().rect(0, 0, app.screen.width, app.screen.height).fill("#ddfaff");
    background.addChild(backgroundColor);
    
    const logo = createLogo();
    logo.zIndex = 10;
    logo.position = {x: app.screen.width / 2 - logo.width / 2, y : 80}
    background.addChild(logo);
    
    let ticksUntilNextColorchange = 5;
    let ticksUntilNextCFallingTile = 0;
    const fallingTiles: Graphics[] = [];
    const size = 50;

    app.ticker.add(() => {
        ticksUntilNextColorchange--;
        ticksUntilNextCFallingTile--;
        if (isInGame && logo.alpha > 0) {
            logo.alpha -= 0.02;
        }
        if (!isInGame && logo.alpha < 1) {
            logo.alpha += 0.02;
        }
        if (ticksUntilNextColorchange <= 0) {
            ticksUntilNextColorchange = (Math.floor(Math.random() * 10) + 5);
            if (!isInGame) {
                const tile = logo.getChildAt(Math.floor(Math.random() * logo.children.length)) as Graphics;
                tile.fill({color: colorArray[Math.floor(Math.random() * colorArray.length)]}).stroke({color: "black", width: 3, alpha: 0.3, alignment: 1});
            }
        }
        if (ticksUntilNextCFallingTile <= 0) {
            ticksUntilNextCFallingTile = (Math.floor(Math.random() * 20) + 30);
            const scale = 1 + Math.random() * 1; 
            const fallingTile = new Graphics().rect(0, 0, (scale*size), (scale*size)).fill({color: colorArray[Math.floor(Math.random() * 4)]}).stroke({color: "black", width: 3 * scale, alpha: 0.3, alignment: 1});
            fallingTile.position = {x: app.screen.width*Math.random(), y: 0 - (scale*size)}
            fallingTile.angle = 360 * Math.random();
            fallingTile.zIndex = 5;
            fallingTile.alpha = isInGame ? 0.2 : 1;
            fallingTiles.push(fallingTile);
            background.addChild(fallingTile);
        }
        const tilesToDelete = [];
        for (let index = 0; index < fallingTiles.length; index++) {
            const tile = fallingTiles[index];
            tile.y += (tile.width / size) * 1;
            if (isInGame && tile.alpha > 0.2) {
                tile.alpha -= 0.02;
            }
            if (!isInGame && tile.alpha < 1) {
                tile.alpha += 0.02;
            }
            if (tile.y > background.height + tile.width) {
                tilesToDelete.push(index);
            }
        }
        for (const index of tilesToDelete) {
            fallingTiles.splice(index, 1)[0].destroy();
        }
    })

    const resetScreen = () => {
        app.stage.children.forEach(child => child.label !== "background" && child.destroy());
    }
    

    const socket = io({
        auth: (cb) => {
                cb({
                    token: localStorage.getItem("token")
                });
            }
    });


    const joinGame = (data: any) => {
        isInGame = true;
        resetScreen();
        app.stage.addChild(new Game(socket, playerId, data, joinLobby));
    }

    const joinLobby = (games: GameData[]) => {
        isInGame = false;
        resetScreen();
        app.stage.addChild(new Lobby(socket, games, joinGame))
    }
    
    resetScreen();

    socket.on(events.global.RequestUsername, data => {
        playerId = data.player.id;
        resetScreen();
        localStorage.setItem("token", data.token);
        app.stage.addChild(new Login(app.screen.width / 2 - 150, 300, (name: string) => {
            socket.emit(events.global.RequestUsername, {playerId: data.id, name}, (response: any) => {
                if (response.success) {
                    joinLobby(response.games);
                }
            });
        }));
    });

    socket.on(events.global.Reconnected, data => {
        playerId = data.player.id;
        resetScreen();
        if (data.game?.gameId) {
            joinGame(data.game)
        } else {
            joinLobby(data.games)
        }
    });

    window.addEventListener("keydown", (e) => app.stage.emit("keydown", {key: e.key}));
});

export {
    app
}
