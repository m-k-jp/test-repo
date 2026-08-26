import { useEffect, useRef } from 'preact/hooks';
import { tokens, onThemeChange, BAR_SPEC, FONT } from '../lib/chart-theme.js';

/**
 * このサイトが実際に生成した JS チャンクのサイズ（実測値・非圧縮）。
 * three.js（523,431 B）は桁が2つ違うためこのグラフからは外し、
 * ページ側のスタットで別途示している。
 */
const DATA = [
  { label: 'Astro プリロード補助', bytes: 11814 },
  { label: '3D シーン本体', bytes: 3048 },
  { label: 'Preact hooks', bytes: 2598 },
  { label: 'Astro アイランド起動', bytes: 1407 },
];

// 軸の目盛りがきれいな整数になるよう、値は KB に換算して渡す
const toKb = (b) => b / 1024;
const kb = (b) => toKb(b).toFixed(1) + ' KB';
const fmt = (v) => v.toFixed(1) + ' KB';

export default function BundleChart() {
  const canvasRef = useRef(null);

  useEffect(() => {
    let chart;
    let unsubscribe = () => {};
    let disposed = false;

    Promise.all([
      import('chart.js/auto'),
    ]).then(([{ default: Chart }]) => {
      if (disposed || !canvasRef.current) return;

      // 棒の先端に値を直接置くプラグイン（軸だけに頼らせない）
      const valueLabels = {
        id: 'valueLabels',
        afterDatasetsDraw(c) {
          const t = tokens();
          const { ctx } = c;
          ctx.save();
          ctx.font = `600 12px ${FONT.family}`;
          ctx.fillStyle = t.secondary;
          ctx.textBaseline = 'middle';
          ctx.textAlign = 'left';
          c.getDatasetMeta(0).data.forEach((bar, i) => {
            ctx.fillText(kb(DATA[i].bytes), bar.x + 8, bar.y);
          });
          ctx.restore();
        },
      };

      const build = () => {
        const t = tokens();
        chart?.destroy();
        chart = new Chart(canvasRef.current, {
          type: 'bar',
          data: {
            labels: DATA.map((d) => d.label),
            datasets: [
              {
                // 1系列なので識別の必要がなく、スロット1の単色を使う
                label: 'サイズ',
                data: DATA.map((d) => toKb(d.bytes)),
                backgroundColor: t.series[0],
                ...BAR_SPEC,
              },
            ],
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 450 },
            // リサイズのたびに 0 から伸び直すと目がちらつくので、その分だけ無効化する
            transitions: { resize: { animation: { duration: 0 } } },
            layout: { padding: { right: 64 } }, // 先端の値ラベルぶんの余白
            plugins: {
              legend: { display: false }, // 1系列に凡例は不要（見出しが系列名を兼ねる）
              tooltip: {
                callbacks: { label: (c) => fmt(c.raw) },
                backgroundColor: t.dark ? '#2b2c30' : '#0b0b0b',
                titleFont: FONT,
                bodyFont: FONT,
                padding: 10,
                displayColors: false,
              },
            },
            scales: {
              x: {
                border: { display: false },
                grid: { color: t.grid, lineWidth: 1, drawTicks: false },
                ticks: {
                  color: t.muted,
                  font: FONT,
                  padding: 8,
                  callback: (v) => v + ' KB',
                },
              },
              y: {
                border: { display: false },
                grid: { display: false },
                ticks: { color: t.secondary, font: FONT, padding: 8 },
              },
            },
          },
          plugins: [valueLabels],
        });
      };

      build();
      unsubscribe = onThemeChange(build);
    });

    return () => {
      disposed = true;
      unsubscribe();
      chart?.destroy();
    };
  }, []);

  return (
    <div class="chart-box">
      <canvas ref={canvasRef} role="img" aria-label="JS チャンク別のサイズを示す横棒グラフ。数値は下の表にも記載。" />
    </div>
  );
}
