import { Application, Graphics} from "pixi.js";
import { io } from "socket.io-client";
import events from "../../common/events.json";
import { Login } from "./components/login";
import { Lobby } from "./components/lobby";
import { Game } from "./components/game";
import { GameData } from "common/gameData";
import { PlayerData } from "common/playerData";
import { Notice } from "./components/notice";



const app = new Application();
app.init({resizeTo: window}).then(() => {
    document.body.appendChild(app.canvas);

    let playerId = "";

    const resetScreen = () => {
        app.stage.children.forEach(child => child.destroy());
        const background = new Graphics().rect(0, 0, app.screen.width, app.screen.height).fill("#ddfaff");
        app.stage.addChild(background);
    }
    

    const socket = io({
        auth: (cb) => {
                cb({
                    token: localStorage.getItem("token")
                });
            }
    });


    const joinGame = (data: any) => {
        resetScreen();
        app.stage.addChild(new Game(socket, playerId, data, joinLobby));
    }

    const joinLobby = (games: GameData[]) => {
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
            app.stage.addChild(new Lobby(socket, data.games, joinGame));
        }
    });

    window.addEventListener("keydown", (e) => app.stage.emit("keydown", {key: e.key}));
});

export {
    app
}
