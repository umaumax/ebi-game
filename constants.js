/**
 * ゲーム仕様定数
 */
export const CONSTANTS = {
    GRAVITY: 0.15,
    JUMP_FORCE_Y: -5.0, // 上方向への力
    JUMP_FORCE_X: -4.0, // 後方への力（バック）
    AUTO_FORWARD_SPEED: 1.5, // 何もしない時に前（右）に戻る力
    SCROLL_SPEED: 3.5, // 背景・敵のスクロール速度
    SHRIMP_COLOR: '#FF6F61',
    SHRIMP_BASE_SIZE: 20,
    MAX_LIVES: 5,
    BOSS_INTERVAL: 300 // ボス出現間隔(m)
};

/**
 * ゲームの状態管理
 */
export const STATE = {
    START: 0,
    PLAYING: 1,
    GAMEOVER: 2,
    PAUSED: 3,
    BITTEN: 4, // ヒラメに食べられている状態
    REPLAY: 5, // リプレイ再生中
    CAUGHT: 6 // 網に捕まっている
};
