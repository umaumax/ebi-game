class Gallery {
    constructor(game) {
        this.game = game;
        this.items = [];
        this.currentIndex = 0;

        this.init();
    }

    init() {
        this.items = [
            { cls: Shrimp, name: "えびちゃん", desc: "家に帰りたい健気なエビ。\nジャンプ力には自信がある。" },
            { cls: FriendShrimp, name: "仲間エビ", desc: "はぐれた仲間。\n助けるとライフが増える。" },
            { cls: Fish, name: "魚", desc: "どこにでもいる普通の魚。" },
            { cls: Sardine, name: "イワシ", desc: "集団で泳ぐ小魚。\n一匹なら怖くない。" },
            { cls: Tuna, name: "マグロ", desc: "高速で泳ぐ海の弾丸。\n止まると死ぬらしい。" },
            { cls: Shark, name: "サメ", desc: "海のハンター。\n執拗に追いかけてくる。" },
            { cls: Anglerfish, name: "チョウチンアンコウ", desc: "深海の誘惑者。\n光に近づいてはいけない。" },
            { cls: Squid, name: "イカ", desc: "気まぐれに泳ぐ軟体動物。\nたまにダッシュする。" },
            { cls: Octopus, name: "タコ", desc: "くねくね動く。\n深海では寝ていることも。" },
            { cls: Flatfish, name: "ヒラメ", desc: "海底に潜む罠。\n踏むと食べられる。" },
            { cls: SeaUrchin, name: "ウニ", desc: "触ると痛い。\n海底の地雷。" },
            { cls: Jellyfish, name: "クラゲ", desc: "電気を帯びている。\n触れると痺れる。" },
            { cls: Porcupinefish, name: "ハリセンボン", desc: "怒ると針を飛ばす。\n普段はかわいい。" },
            { cls: ElectricEel, name: "電気ウナギ", desc: "強力な電気を放つ。\nS字に泳ぐ。" },
            { cls: MorayEel, name: "ウツボ", desc: "岩陰から狙っている。\n噛まれると痛い。" },
            { cls: Crab, name: "カニ", desc: "横歩きの達人。\nハサミは強力。" },
            { cls: SeaAnemone, name: "イソギンチャク", desc: "綺麗な花には毒がある。\n触手注意。" },
            { cls: Starfish, name: "ヒトデ", desc: "星形の生物。\n張り付かれると厄介。" },
            { cls: Penguin, name: "ペンギン", desc: "氷の海の住人。\n水中では飛ぶように泳ぐ。" },
            { cls: Seal, name: "アザラシ", desc: "愛らしい見た目だが\nぶつかると重い。" },
            { cls: Walrus, name: "セイウチ", desc: "立派な牙を持つ。\n氷の海の主。" },
            { cls: Whale, name: "クジラ", desc: "巨大な海の王者。\n吸い込み攻撃に注意。" },
            { cls: Architeuthis, name: "ダイオウイカ", desc: "深海の伝説。\n巨大な触手で襲いかかる。" },
            { cls: Hook, name: "釣り針", desc: "地上からの魔の手。\n引っかかると連れ去られる。" },
            { cls: Net, name: "底引き網", desc: "根こそぎ持っていく。\n連打で逃げろ！" },
            { cls: Trash, name: "ゴミ", desc: "人間が捨てたゴミ。\n海を汚さないで。" },
            { cls: Meteor, name: "隕石", desc: "宇宙からの来訪者。\n当たると痛いでは済まない。" },
            { cls: SpaceDebris, name: "スペースデブリ", desc: "宇宙のゴミ。\n高速で飛んでくる。" },
            { cls: Planet, name: "惑星", desc: "宇宙の彼方にある星。\n衝突注意。" }
        ];

        this.renderList();
    }

    renderList() {
        const listContainer = document.getElementById('gallery-list');
        if (!listContainer) return;

        listContainer.innerHTML = '';

        this.items.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'gallery-icon';
            if (index === this.currentIndex) div.classList.add('selected');
            
            // クリックイベント
            div.onclick = () => {
                this.currentIndex = index;
                // 選択状態の更新
                Array.from(listContainer.children).forEach((child, i) => {
                    if (i === index) child.classList.add('selected');
                    else child.classList.remove('selected');
                });
                // 親ゲーム側の表示更新メソッドがあれば呼ぶ（ここでは簡易的に音だけ）
                if (this.game && this.game.sound) this.game.sound.playItem();
                // 実際の詳細表示更新はUI側で行われる想定だが、
                // ここでイベントを発火するか、UI更新関数を呼ぶ必要がある
                // 簡易実装としてDOMを直接書き換える
                const nameEl = document.getElementById('gallery-name');
                const descEl = document.getElementById('gallery-desc');
                if (nameEl) nameEl.innerText = item.name;
                if (descEl) descEl.innerText = item.desc;
            };

            // Canvasサムネイル生成
            const canvas = document.createElement('canvas');
            canvas.width = 50;
            canvas.height = 50;
            const ctx = canvas.getContext('2d');

            // 敵の描画（サムネイル用）
            this.drawThumbnail(ctx, item.cls);

            div.appendChild(canvas);
            listContainer.appendChild(div);
        });

        // 初期表示更新
        const firstItem = this.items[this.currentIndex];
        const nameEl = document.getElementById('gallery-name');
        const descEl = document.getElementById('gallery-desc');
        if (nameEl) nameEl.innerText = firstItem.name;
        if (descEl) descEl.innerText = firstItem.desc;
    }

    drawThumbnail(ctx, EnemyClass) {
        // ダミーの環境を用意
        const dummyPlayer = { x: 0, y: 0, radius: 10 };
        const dummyGame = { score: 0, getGroundY: () => 100, decorations: [] };
        
        let enemy;
        try {
            // 中心(25, 25)に配置
            enemy = new EnemyClass(25, 25, dummyPlayer, dummyGame);
        } catch (e) {
            enemy = new EnemyClass(25, 25);
        }

        ctx.save();
        // サイズ調整: 半径が20を超える場合は縮小する
        if (enemy.radius && enemy.radius > 20) {
            const scale = 20 / enemy.radius;
            ctx.translate(25, 25);
            ctx.scale(scale, scale);
            ctx.translate(-25, -25);
        }
        
        // 一部の敵（Hookなど）は描画位置調整が必要
        if (EnemyClass.name === 'Hook') {
            ctx.translate(0, 50); // 針が見えるように下げる
        }

        enemy.draw(ctx);
        ctx.restore();
    }

    next() {
        this.currentIndex = (this.currentIndex + 1) % this.items.length;
        this.game.sound.playItem();
    }

    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
        this.game.sound.playItem();
    }

    getCurrentItem() {
        return this.items[this.currentIndex];
    }
}
