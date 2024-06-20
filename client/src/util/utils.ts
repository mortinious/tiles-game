import { Game } from "../components/game"
import { BaseTile } from "../components/tiles/baseTile"
import { ResourceTile } from "../components/tiles/resourceTile"
import colors from "../../../common/colors.json"
import assets from "./../assets/assets.json"
import { TileData } from "../../../common/tileData"
import { Assets, Ticker, TickerCallback } from "pixi.js"
import { CultureTile } from "../components/tiles/cultureTile"

export const getPossessiveName = (name: string, you?: boolean) => {
    if (you) {
        return "Din"
    }
    return name.match(/[sSxXzZ]$/) ? name : name + "s"
}

export const createTile = (tile: TileData, tileSize: number, game: Game, playerId: string): BaseTile | null => {
    const playerColors = game.getPlayerColors(playerId);
    if (!playerColors) return null;
    switch (tile.type) {
        case "resource": 
            return new ResourceTile(tile.name, tile.cost, tileSize, game, playerId, playerColors, tile.data.resources);
        case "culture": 
            return new CultureTile(tile.name, tile.cost, tileSize, game, playerId, playerColors, tile.data.score);
        default:
            return null;
    }
}

export const getPlayerColors = (color: string) => {
    return (colors.playercolors as any)[color];
}

export const loadAsset = (asset: string) => {
    if (Object.keys(assets).includes(asset)) {
        const assetName = assets[asset as keyof typeof assets];
        return Assets.load(`../../assets/${assetName}`);
    } else {
        return Promise.reject(`Asset ${asset} not registered!`)
    }
}

export const repeatWithDelay = (callback: (runCount: number) => void, delayMS: number, times: number, fireImmediately: boolean) => {
    let timeLeft = fireImmediately ? 0 : delayMS;
    let timesRun = 0;
    const tickerFn = (ticker: Ticker) => {
        timeLeft -= ticker.deltaMS;
        if (timeLeft <= 0) {
            callback(timesRun);
            timeLeft = delayMS;
            timesRun += 1;
        }
        if (timesRun >= times) {
            ticker.remove(tickerFn);
        }
    }
    Ticker.shared.add(tickerFn);
}
