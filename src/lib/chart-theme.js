/**
 * グラフ用のカラートークン。
 *
 * 配色は検証済みのカテゴリカルパレットを使用し、
 * ライト / ダークそれぞれの実際の背景色に対して検証スクリプトを通してある。
 * ライトモードの aqua / yellow / magenta は背景とのコントラストが 3:1 未満のため、
 * 凡例・ツールチップに加えて必ず表ビューを併記すること。
 */

// カテゴリカル（識別のための配色。順番は固定で、循環させない）
const CATEGORICAL_LIGHT = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4'];
const CATEGORICAL_DARK = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181'];

const INK_LIGHT = { primary: '#0b0b0b', secondary: '#52514e', muted: '#8a8983', grid: '#e6e5e1', surface: '#ffffff' };
const INK_DARK = { primary: '#f2f2f2', secondary: '#c3c2b7', muted: '#8a8983', grid: '#2b2c30', surface: '#16171a' };

/**
 * いまダーク表示かどうか。
 * 明示的な選択（html[data-theme]）を最優先し、未指定ならOSの設定に従う。
 */
export const isDark = () => {
  if (typeof document === 'undefined') return false;
  const explicit = document.documentElement.dataset.theme;
  if (explicit === 'dark') return true;
  if (explicit === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export function tokens() {
  const dark = isDark();
  return {
    dark,
    series: dark ? CATEGORICAL_DARK : CATEGORICAL_LIGHT,
    ...(dark ? INK_DARK : INK_LIGHT),
  };
}

/**
 * テーマ切り替えを購読する。解除用の関数を返す。
 * OS 設定の変更と、切り替えボタンが出す themechange の両方を見る。
 */
export function onThemeChange(handler) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', handler);
  window.addEventListener('themechange', handler);
  return () => {
    mq.removeEventListener('change', handler);
    window.removeEventListener('themechange', handler);
  };
}

/** 棒グラフの共通指定：細いマーク・データ端は 4px 角丸・基線側は角を落とさない */
export const BAR_SPEC = {
  barThickness: 20,
  maxBarThickness: 20,
  borderRadius: 4,
  borderSkipped: 'start',
};

export const FONT = {
  family: 'system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif',
  size: 12,
};
