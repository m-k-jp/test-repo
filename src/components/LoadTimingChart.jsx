import { useEffect, useRef, useState } from 'preact/hooks';
import { tokens, onThemeChange, BAR_SPEC, FONT } from '../lib/chart-theme.js';

/**
 * Navigation Timing API から、いま開いているこのページ自身の
 * 読み込み内訳を取り出して積み上げ棒で表示する。
 * サンプルデータではなく、閲覧している人のブラウザの実測値。
 */
const PHASES = [
  { key: '接続', from: 'fetchStart', to: 'connectEnd' },
  { key: 'サーバー応答待ち', from: 'requestStart', to: 'responseStart' },
  { key: 'ダウンロード', from: 'responseStart', to: 'responseEnd' },
  { key: 'DOM 構築', from: 'responseEnd', to: 'domContentLoadedEventEnd' },
  { key: '描画完了', from: 'domContentLoadedEventEnd', to: 'loadEventEnd' },
];

const ms = (v) => `${v.toFixed(1)} ms`;

function measure() {
  const nav = performance.getEntriesByType('navigation')[0];
  if (!nav || !nav.loadEventEnd) return null;
  return PHASES.map(({ key, from, to }) => ({
    key,
    // 計測できない区間（キャッシュ利用時の接続など）は 0 になる
    value: Math.max(0, (nav[to] || 0) - (nav[from] || 0)),
  }));
}

export default function LoadTimingChart() {
  const canvasRef = useRef(null);
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let chart;
    let unsubscribe = () => {};
    let disposed = false;

    const start = () => {
      const data = measure();
      if (!data) return false;
      setRows(data);

      import('chart.js/auto').then(({ default: Chart }) => {
        if (disposed || !canvasRef.current) return;

        const build = () => {
          const t = tokens();
          chart?.destroy();
          chart = new Chart(canvasRef.current, {
            type: 'bar',
            data: {
              labels: ['このページ'],
              datasets: data.map((d, i) => ({
                label: d.key,
                data: [d.value],
                backgroundColor: t.series[i],
                // 隣り合うセグメントは背景色の 2px の隙間で分ける（囲み線は引かない）
                borderColor: t.surface,
                borderWidth: { top: 0, bottom: 0, left: 0, right: 2 },
                ...BAR_SPEC,
                barThickness: 24,
                maxBarThickness: 24,
              })),
            },
            options: {
              indexAxis: 'y',
              responsive: true,
              maintainAspectRatio: false,
              animation: { duration: 450 },
              transitions: { resize: { animation: { duration: 0 } } },
              scales: {
                x: {
                  stacked: true,
                  border: { display: false },
                  grid: { color: t.grid, lineWidth: 1, drawTicks: false },
                  ticks: { color: t.muted, font: FONT, padding: 8, callback: (v) => v + ' ms' },
                },
                y: {
                  stacked: true,
                  border: { display: false },
                  grid: { display: false },
                  ticks: { display: false },
                },
              },
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    color: t.secondary,
                    font: FONT,
                    boxWidth: 10,
                    boxHeight: 10,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 14,
                  },
                },
                tooltip: {
                  callbacks: { label: (c) => `${c.dataset.label}  ${ms(c.raw)}` },
                  backgroundColor: t.dark ? '#2b2c30' : '#0b0b0b',
                  titleFont: FONT,
                  bodyFont: FONT,
                  padding: 10,
                },
              },
            },
          });
        };

        build();
        unsubscribe = onThemeChange(build);
      });
      return true;
    };

    // load 完了前だと loadEventEnd が 0 なので、完了を待ってから計測する
    if (!start()) {
      const onLoad = () => setTimeout(start, 0);
      window.addEventListener('load', onLoad, { once: true });
      return () => {
        disposed = true;
        window.removeEventListener('load', onLoad);
        unsubscribe();
        chart?.destroy();
      };
    }

    return () => {
      disposed = true;
      unsubscribe();
      chart?.destroy();
    };
  }, []);

  const total = rows ? rows.reduce((a, r) => a + r.value, 0) : 0;

  return (
    <div>
      <div class="chart-box chart-box--short">
        <canvas ref={canvasRef} role="img" aria-label="このページの読み込み時間の内訳を示す積み上げ横棒グラフ。数値は下の表にも記載。" />
      </div>

      <table class="chart-table">
        <caption>読み込み内訳（あなたのブラウザの実測値）</caption>
        <thead>
          <tr><th scope="col">区間</th><th scope="col">時間</th></tr>
        </thead>
        <tbody>
          {rows
            ? rows.map((r) => (
                <tr key={r.key}>
                  <th scope="row">{r.key}</th>
                  <td>{ms(r.value)}</td>
                </tr>
              ))
            : (
              <tr><td colSpan={2}>計測中…</td></tr>
            )}
        </tbody>
        {rows && (
          <tfoot>
            <tr><th scope="row">合計</th><td>{ms(total)}</td></tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
