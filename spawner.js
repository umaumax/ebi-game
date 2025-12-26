import { CONSTANTS } from './constants.js';
import {
    Fish, Sardine, Tuna, Shark, Anglerfish, Hook, Net, Squid, Flatfish, SeaUrchin, Octopus, Porcupinefish, Needle,
    Whirlpool, Whale, Architeuthis, GiantTentacle, WaterSpout, WaterDrop, Jellyfish, Crab, SeaAnemone, Starfish, ElectricEel,
    Trash, MorayEel, Penguin, Seal, Walrus, IceFloe, Meteor, SpaceDebris, Planet, Satellite
} from './enemies.js';
import { Pearl, TreasureChest, Plankton, FriendShrimp, Clownfish, GardenEel, Seaweed, RuggedTerrain, Coral, Shipwreck } from './objects.js';

export class Spawner {
    constructor(game) {
        this.game = game;
    }

    spawnEnemy() {
        // ボス出現中は雑魚敵を出さない
        if (this.game.uiWarning.classList.contains('active') || this.game.enemies
            .some(e => e instanceof Whale || e instanceof Architeuthis)
        ) {
            return;
        }

        // 難易度調整: 時間経過で出現頻度が上がる
        let baseRate = 120; // 敵の出現頻度を下げる
        let minRate = 40;

        if (this.game.difficulty === 'EASY') {
            baseRate = 100;
            minRate = 35;
        }
        else if (this.game.difficulty === 'HARD') {
            baseRate = 45;
            minRate = 12;
        }
        else {
            baseRate = 70;
            minRate = 20;
        }

        // スマホ調整
        if (this.game.width < 600) {
            baseRate = Math.floor(baseRate * 1.2);
            minRate = Math.floor(minRate * 1.2);
        }

        const spawnRate = Math.max(minRate, baseRate - Math.floor(
            this.game.score / 25));

        if (this.game.frameCount % spawnRate === 0) {
            const type = Math.random();
            const isDeep = this.game.score > 1000;
            
            // ゾーンごとの敵生成
            if (this.game.isSludgeZone) return this.spawnSludgeEnemies();
            if (this.game.isIceZone) return this.spawnIceEnemies();

            if (this.game.isSpaceZone) {
                this.spawnSpaceEnemies();
                return;
            }

            // 岩の上に敵を配置できるかチェック
            const rock = this.game.decorations.find(d => d instanceof RuggedTerrain &&
                d.x > this.game.width - 100 && d.x < this.game.width +
                200);

            if (isDeep && Math.random() < 0.3) {
                this.game.enemies.push(new Anglerfish(this.game.width, Math
                    .random() * (this.game.height - 100) + 50));
            }
            else if (rock && Math.random() < 0.5) {
                const pointIndex = Math.floor(Math.random() * (
                    rock.points.length - 2)) + 1;
                const p = rock.points[pointIndex];
                if (!p) return;
                const enemyX = rock.x + p.x;
                const enemyY = rock.y + p.y;
                if (Math.random() < 0.5) {
                    this.game.enemies.push(new SeaAnemone(enemyX,
                        enemyY));
                }
                else {
                    if (!isDeep) this.game.enemies.push(new Starfish(
                        enemyX, enemyY));
                    else this.game.enemies.push(new SeaUrchin(enemyX,
                        enemyY - 15));
                }
                return;
            }
            else if (type < 0.20) {
                if (!isDeep) this.game.enemies.push(new Fish(this.game.width,
                    Math.random() * (this.game.height - 100) +
                    50));
                else this.game.enemies.push(new Flatfish(this.game.width,
                    this.game.height - 40));
            }
            else if (type < 0.35) {
                if (!isDeep) {
                    const baseY = Math.random() * (this.game.height -
                        150) + 50;
                    const count = Math.floor(Math.random() * 6) +
                        10;
                    for (let i = 0; i < count; i++) {
                        this.game.enemies.push(new Sardine(this.game.width +
                            Math.random() * 200, baseY +
                            Math.random() * 80 - 40));
                    }
                }
                else {
                    this.game.enemies.push(new SeaUrchin(this.game.width,
                        this.game.height - 65));
                }
            }
            else if (type < 0.45) {
                this.game.enemies.push(new Tuna(this.game.width, Math.random() *
                    (this.game.height - 100) + 50));
            }
            else if (type < 0.50) {
                this.game.enemies.push(new Shark(this.game.width, Math.random() *
                    (this.game.height - 100) + 50, this.game.player
                ));
            }
            else if (type < 0.60 && !isDeep) {
                this.game.enemies.push(new Net(this.game.width + 100, Math.random() *
                    (this.game.height - 200) + 100));
            }
            else if (type < 0.70 && !isDeep) {
                this.game.enemies.push(new Hook(this.game.width, -100));
            }
            else if (type < 0.80) {
                this.game.enemies.push(new Squid(this.game.width, Math.random() *
                    (this.game.height - 200) + 100));
            }
            else if (type < 0.85) {
                this.game.enemies.push(new Jellyfish(this.game.width, Math.random() *
                    (this.game.height - 150) + 50));
            }
            else if (type < 0.90) {
                this.game.enemies.push(new Octopus(this.game.width, Math.random() *
                    (this.game.height - 200) + 100));
            }
            else if (type < 0.93) {
                this.game.enemies.push(new Porcupinefish(this.game.width,
                    Math.random() * (this.game.height - 100) +
                    50, this.game));
            }
            else if (type < 0.95 && isDeep) {
                this.game.enemies.push(new ElectricEel(this.game.width,
                    Math.random() * (this.game.height - 100) +
                    50, this.game.player));
            }
            else if (type < 0.97) {
                this.game.enemies.push(new Whirlpool(this.game.width, Math.random() *
                    80 + 40));
            }
            else if (type < 0.98) {
                this.game.enemies.push(new Flatfish(this.game.width, this.game.height -
                    40));
            }
            else if (type < 0.995) {
                this.game.enemies.push(new Crab(this.game.width, this.game.getGroundY(
                    this.game.width)));
            }
            else {
                this.game.enemies.push(new SeaUrchin(this.game.width, this.game.height -
                    65));
            }

            const enemy = this.game.enemies[this.game.enemies.length - 1];
            if (enemy) {
                enemy.radius *= this.game.scaleFactor;
            }
        }
    }

    spawnSludgeEnemies() {
        if (this.game.frameCount % 60 === 0) {
            const r = Math.random();
            if (r < 0.6) {
                this.game.enemies.push(new Trash(this.game.width, Math.random() * (this.game.height - 100) + 50));
            } else if (r < 0.9) {
                this.game.enemies.push(new MorayEel(this.game.width, Math.random() * (this.game.height - 150) + 100));
            } else {
                this.game.enemies.push(new Jellyfish(this.game.width, Math.random() * (this.game.height - 100) + 50));
            }
        }
    }

    spawnIceEnemies() {
        if (this.game.frameCount % 70 === 0) {
            const r = Math.random();
            if (r < 0.4) {
                this.game.enemies.push(new Penguin(this.game.width, Math.random() * (this.game.height / 2)));
            } else if (r < 0.7) {
                this.game.enemies.push(new Seal(this.game.width, Math.random() * (this.game.height - 100) + 50));
            } else if (r < 0.9) {
                this.game.enemies.push(new Walrus(this.game.width, Math.random() * (this.game.height - 150) + 100));
            } else {
                this.game.enemies.push(new IceFloe(this.game.width, 0));
            }
        }
    }

    spawnSpaceEnemies() {
        if (this.game.frameCount % 50 === 0) {
            if (Math.random() < 0.7) {
                this.game.enemies.push(new Meteor(this.game.width, Math.random() *
                    this.game.height));
            }
            else {
                this.game.enemies.push(new SpaceDebris(this.game.width,
                    Math.random() * this.game.height));
            }
        }
        if (this.game.score > 5500 && !this.game.enemies.some(e => e instanceof Planet)) {
            this.game.enemies.push(new Planet(this.game.width + 200, this.game.height /
                2));
        }
    }

    spawnDecorations() {
        const groundY = this.game.getGroundY(this.game.width);
        const isDeep = this.game.score > 1000;

        if (this.game.isSpaceZone) {
            if (this.game.frameCount % 100 === 0) this.game.backgroundObjects
                .push(new Satellite(this.game.width, Math.random() *
                    this.game.height));
            return;
        }

        if (this.game.frameCount % 30 === 0) {
            if (this.game.isKelpZone) {
                if (Math.random() < 0.8) this.game.decorations.push(
                    new Seaweed(this.game.width, groundY));
            }
            else if (Math.random() < 0.8) {
                const rand = Math.random();
                if (rand < 0.5 && !isDeep) {
                    this.game.decorations.push(new Seaweed(this.game.width,
                        groundY));
                    if (Math.random() < 0.1) {
                        this.game.items.push(new GardenEel(this.game.width +
                            20, groundY));
                    }
                }
                else if (rand < (isDeep ? 0.8 : 0.9)) {
                    this.game.decorations.push(new RuggedTerrain(this.game.width,
                        this.game.height));
                }
                else if (!isDeep) {
                    this.game.decorations.push(new Coral(this.game.width,
                        groundY));
                    if (Math.random() < 0.5) {
                        this.game.items.push(new Clownfish(this.game.width,
                            this.game.height - 80));
                    }
                }
            }
        }
        if (this.game.frameCount % 300 === 0) {
            this.game.items.push(new Pearl(this.game.width, groundY - 15));
        }
        if (this.game.frameCount % 100 === 0) {
            this.game.items.push(new Plankton(this.game.width, Math.random() *
                (this.game.height - 100) + 50));
        }
        
        // 仲間エビの出現頻度調整
        // 基本は600フレームごとだが、ライフが少ない時や序盤は頻度を上げる
        let friendInterval = 600;
        if (this.game.lives < 3 || this.game.score < 1000) {
            friendInterval = 200; // 頻度アップ（約3.3秒に1回）
        }
        
        if (this.game.frameCount % friendInterval === 0) {
            this.game.items.push(new FriendShrimp(this.game.width, Math.random() *
                (this.game.height - 100) + 50));
        }

        const item = this.game.items[this.game.items.length - 1];
        if (item) item.radius *= this.game.scaleFactor;
    }

    scatterItems(x, y) {
        for (let k = 0; k < 8; k++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 6 + 2;
            const p = new Pearl(x, y, Math.cos(angle) * speed,
                Math.sin(angle) * speed);
            p.radius *= this.game.scaleFactor;
            this.game.items.push(p);
        }
        for (let k = 0; k < 15; k++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 6 + 2;
            const p = new Plankton(x, y, Math.cos(angle) * speed,
                Math.sin(angle) * speed);
            p.radius *= this.game.scaleFactor;
            this.game.items.push(p);
        }
    }

    spawnBackgroundObjects() {
        if (this.game.score > 1000 && this.game.frameCount % 1200 === 0) {
            const x = this.game.width;
            const y = this.game.height - 50;
            this.game.backgroundObjects.push(new Shipwreck(x, y));
            const chest = new TreasureChest(x + 100, this.game.getGroundY(
                x + 100));
            chest.radius *= this.game.scaleFactor;
            this.game.items.push(chest);
        }
    }
}
