import { Application, Container, Text, Graphics, Rectangle} from "pixi.js";
import { io } from "socket.io-client";
import events from "../../common/events.json";
import { Login } from "./components/login";
import { Lobby } from "./components/lobby";
import { Game } from "./components/game";
import { GameData } from "../../common/gameData";
import colors from "../../common/colors.json";
import { SmallTextStyle } from "./util/textstyles";
import { Socket } from "socket.io-client";

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

const toggleAdmin = (socket: Socket) => {
    const admin = app.stage.getChildByLabel("admin");
    if (!!admin) {
        admin.destroy();
        return;
    }
    const adminContainer = new Container();
    adminContainer.zIndex = 1000;
    adminContainer.label = "admin";
    adminContainer.position = {x: app.screen.width / 2 - 200, y: 150};
    adminContainer.interactive = true;
    app.stage.addChild(adminContainer);

    adminContainer.addChild(new Graphics().rect(0, 0, 400, 250).fill({color:"black"}));

    const adminTitle = new Text({text: "Admin", style: {fontSize: 40, fill: "white"}});
    adminTitle.position = {x: 200, y: 30};
    adminTitle.anchor = 0.5;
    adminContainer.addChild(adminTitle);

    const resetAllButton = new Text({text: "Återställ server", style: {fontSize: 30, fill: "white"}});
    resetAllButton.position = {x: 200, y: 80};
    resetAllButton.anchor = 0.5;
    resetAllButton.eventMode = "static";
    resetAllButton.cursor = "pointer";
    resetAllButton.hitArea = new Rectangle(0, 0, 400, 30);
    resetAllButton.on("pointerdown", () => {
        socket.emit(events.admin.ResetAll);
        adminContainer.destroy();
    })
    resetAllButton.on("pointerenter", () => {
        resetAllButton.style.fill = colors.tileyellow;
    });
    resetAllButton.on("pointerleave", () => {
        resetAllButton.style.fill = "white";
    });
    adminContainer.addChild(resetAllButton)

    const resetGamesButton = new Text({text: "Återställ spel", style: {fontSize: 30, fill: "white"}});
    resetGamesButton.position = {x: 200, y: 120};
    resetGamesButton.anchor = 0.5;
    resetGamesButton.eventMode = "static";
    resetGamesButton.cursor = "pointer";
    resetGamesButton.hitArea = new Rectangle(0, 0, 400, 30);
    resetGamesButton.on("pointerdown", () => {
        socket.emit(events.admin.ResetGames);
        adminContainer.destroy();
    })
    resetGamesButton.on("pointerenter", () => {
        resetGamesButton.style.fill = colors.tileyellow;
    });
    resetGamesButton.on("pointerleave", () => {
        resetGamesButton.style.fill = "white";
    });
    adminContainer.addChild(resetGamesButton)

    const closeButton = new Text({text: "Stäng", style: {fontSize: 30, fill: "white"}});
    closeButton.position = {x: 200, y: 250 - 30};
    closeButton.anchor = 0.5;
    closeButton.eventMode = "static";
    closeButton.hitArea = new Rectangle(0, 0, 400, 30);
    closeButton.cursor = "pointer";
    closeButton.on("pointerdown", () => {
        adminContainer.destroy();
    })
    closeButton.on("pointerenter", () => {
        closeButton.style.fill = colors.tileyellow;
    });
    closeButton.on("pointerleave", () => {
        closeButton.style.fill = "white";
    });
    adminContainer.addChild(closeButton)
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
            if (tile.y > app.screen.height + tile.width) {
                tilesToDelete.push(index);
            }
        }
        for (const index of tilesToDelete) {
            fallingTiles.splice(index, 1)[0].destroy();
        }
    })

    const changelogLink = new Text({text: "Changlog (GitHub)", style: SmallTextStyle});
    changelogLink.position = {x: app.screen.width - 10, y: app.screen.height - 10};
    changelogLink.anchor = 1;
    changelogLink.cursor = "pointer";
    changelogLink.hitArea = new Rectangle(-100, -20, 100, 20);
    changelogLink.on("pointerdown", () => {
        window.open("https://mortinious.github.io/tiles-game/CHANGELOG.html")
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

    window.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.ctrlKey && event.code === "Backquote") {
            toggleAdmin(socket);
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

    socket.on(events.admin.ResetGames, () => {
        window.location.reload();
    });

    socket.on(events.admin.ResetAll, () => {
        window.location.reload();
    });

    window.addEventListener("keydown", (e) => app.stage.emit("keydown", {key: e.key}));
});

export {
    app
}
