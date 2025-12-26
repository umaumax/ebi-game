import { STATE } from './constants.js';
import { Shrimp } from './shrimp.js';
import {
    Fish, Sardine, Tuna, Shark, Anglerfish, Hook, Net, Squid, Flatfish, SeaUrchin, Octopus, Porcupinefish, Needle,
    Whirlpool, Whale, Architeuthis, GiantTentacle, WaterSpout, WaterDrop, Jellyfish, Crab, SeaAnemone, Starfish, ElectricEel,
    Trash, MorayEel, Penguin, Seal, Walrus, IceFloe, Meteor, SpaceDebris, Planet, Satellite
} from './enemies.js';
import { Pearl, TreasureChest, Plankton, FriendShrimp, Clownfish, GardenEel, Seaweed, RuggedTerrain, Coral, Shipwreck, StreamLine, Bubble } from './objects.js';

export class ReplaySystem {
    constructor(game) {
        this.game = game;
        this.buffer = [];
        this.index = 0;
        this.dummies = {};
        this.initDummies();
    }

    initDummies() {
        const classes = [
            Fish, Sardine, Tuna, Shark, Anglerfish, Hook, Net,
            Squid, Flatfish,
            SeaUrchin, Octopus, Porcupinefish, Needle,
            Whirlpool, Whale, Architeuthis, GiantTentacle,
            WaterSpout, WaterDrop, Jellyfish, Crab,
            SeaAnemone, Starfish, ElectricEel,
            Pearl, Plankton, FriendShrimp, Clownfish,
            GardenEel, TreasureChest,
            Shipwreck,
            Seaweed, RuggedTerrain, Coral, StreamLine, Bubble
        ];
        classes.forEach(cls => {
            try {
                if (cls === Shark) this.dummies[cls.name] = new cls(0, 0, null);
                else if (cls === Porcupinefish) this.dummies[cls.name] = new cls(0, 0, this.game);
                else if (cls === Architeuthis) this.dummies[cls.name] = new cls(0, 0, this.game);
                else if (cls === GiantTentacle) this.dummies[cls.name] = new cls(0, 0, this.game);
                else this.dummies[cls.name] = new cls(0, 0);
            }
            catch (e) {
                console.error("Dummy init failed for", cls.name, e);
            }
        });
        this.dummies['Shrimp'] = new Shrimp(0, 0);
    }

    recordState() {
        if (this.game.frameCount % 2 !== 0) return;

        const snapshot = {
            player: {
                x: this.game.player.x,
                y: this.game.player.y,
                angle: this.game.player.angle,
                isBending: this.game.player.isBending,
                lives: this.game.lives
            },
            scrollOffset: this.game.scrollOffset,
            score: this.game.score,
            objects: [],
            decorations: []
        };

        const saveObj = (obj) => {
            const data = {
                type: obj.constructor.name,
                x: obj.x,
                y: obj.y,
                angle: obj.angle,
                timer: obj.timer,
                moveTimer: obj.moveTimer,
                hasExploded: obj.hasExploded,
                width: obj.width,
                height: obj.height,
                color: obj.color,
                branches: obj.branches,
                life: obj.life,
                size: obj.size,
                isBackground: obj.isBackground,
                length: obj.length
            };
            snapshot.objects.push(data);
        };

        this.game.decorations.forEach(saveObj);
        this.game.backgroundObjects.forEach(saveObj);
        this.game.items.forEach(saveObj);
        this.game.enemies.forEach(saveObj);
        this.game.particles.forEach(saveObj);
        this.game.streamLines.forEach(saveObj);
        snapshot.decorations = this.game.decorations.map(d => ({
            type: d.constructor.name,
            x: d.x,
            y: d.y,
            width: d.width,
            height: d.height
        }));

        this.buffer.push(snapshot);
        if (this.buffer.length > 300) {
            this.buffer.shift();
        }
    }

    start() {
        this.game.state = STATE.REPLAY;
        this.game.screenGameOver.style.display = 'none';
        this.game.uiReplay.style.display = 'block';
        this.index = Math.max(0, this.buffer.length - 90);
    }

    draw(ctx) {
        const snapshot = this.buffer[this.index];
        if (!snapshot) return;

        // 背景描画
        const maxDepth = 2000;
        const ratio = Math.min(snapshot.score / maxDepth, 1);
        const r = Math.floor(135 * (1 - ratio) + 0 * ratio);
        const g = Math.floor(206 * (1 - ratio) + 16 * ratio);
        const b = Math.floor(235 * (1 - ratio) + 32 * ratio);
        const gradient = ctx.createLinearGradient(0, 0, 0, this.game.height);
        gradient.addColorStop(0, `rgb(${Math.min(255, r + 30)},${Math.min(255, g + 30)},${Math.min(255, b + 30)})`);
        gradient.addColorStop(1, `rgb(${r},${g},${b})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.game.width, this.game.height);

        // 地面
        ctx.fillStyle = '#E0C090';
        ctx.beginPath();
        ctx.moveTo(0, this.game.height);
        const getGroundY = (x) => {
            const base = this.game.height - 50;
            return base + Math.sin((x + snapshot.scrollOffset) * 0.005) * 20 + Math.sin((x + snapshot.scrollOffset) * 0.02) * 10;
        };
        for (let x = 0; x <= this.game.width; x += 10) {
            ctx.lineTo(x, getGroundY(x));
        }
        ctx.lineTo(this.game.width, this.game.height);
        ctx.fill();

        // オブジェクト描画
        snapshot.objects.forEach(data => {
            const dummy = this.dummies[data.type];
            if (dummy) {
                Object.assign(dummy, data);
                dummy.draw(ctx, this.game.frameCount);
            }
        });

        // プレイヤー描画
        const pData = snapshot.player;
        const pDummy = this.dummies['Shrimp'];
        Object.assign(pDummy, pData);

        const followerCount = Math.max(0, pData.lives - 1);
        for (let i = 1; i <= followerCount; i++) {
            const delayIdx = i * 4;
            const prevSnapshot = this.buffer[this.index - delayIdx];
            if (prevSnapshot) pDummy.drawFollower(ctx, prevSnapshot.player);
        }
        Object.assign(pDummy, pData);
        pDummy.draw(ctx, pData.lives, snapshot.decorations.map(d => Object.assign(this.dummies[d.type], d)));

        // 深海モード
        if (snapshot.score > 500) {
            const darknessStart = 500;
            const darknessEnd = 3000;
            const maxDarkness = 0.95;
            const ratio = Math.min(Math.max((snapshot.score - darknessStart) / (darknessEnd - darknessStart), 0), 1);
            const darknessAlpha = ratio * maxDarkness;

            if (darknessAlpha > 0.01) {
                const cx = snapshot.player.x;
                const cy = snapshot.player.y;
                const lightRadius = 150;
                const fadeRadius = lightRadius + 400;
                const grad = ctx.createRadialGradient(cx, cy, lightRadius, cx, cy, fadeRadius);
                grad.addColorStop(0, 'rgba(0, 0, 20, 0)');
                grad.addColorStop(1, `rgba(0, 0, 20, ${darknessAlpha})`);
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, this.game.width, this.game.height);
            }
        }

        ctx.fillStyle = 'white';
        ctx.font = '20px sans-serif';
        ctx.fillText("REPLAY", 20, 80);
    }
}
