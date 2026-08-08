(function (root, factory) {
  const api = factory();
  root.Merge2048 = root.Merge2048 || {};
  root.Merge2048.Share = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const colors = {
    0: [222, 229, 226, 1],
    2: [239, 243, 241, 1],
    4: [217, 231, 223, 1],
    8: [240, 197, 82, 1],
    16: [233, 154, 76, 1],
    32: [223, 104, 72, 1],
    64: [189, 65, 56, 1],
    128: [49, 129, 111, 1],
    256: [34, 103, 89, 1],
    512: [23, 76, 66, 1],
    1024: [70, 65, 118, 1],
    2048: [23, 34, 31, 1],
  };

  function roundRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    context.fill();
  }

  function tileColor(value) {
    return colors[value] || [17, 23, 21, 1];
  }

  function render(game, modeLabel) {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1500;
    const context = canvas.getContext("2d");
    context.fillStyle = "#f4f7f6";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "#17221f";
    context.font = '700 54px "Segoe UI", sans-serif';
    context.fillText("并格 2048", 96, 120);
    context.fillStyle = "#247465";
    context.font = '700 25px "Segoe UI", sans-serif';
    context.fillText(modeLabel, 96, 170);

    context.fillStyle = "#66716d";
    context.font = '700 24px "Segoe UI", sans-serif';
    context.fillText("本局分数", 96, 260);
    context.fillStyle = "#17221f";
    context.font = '800 108px "Segoe UI", sans-serif';
    context.fillText(String(game.score), 92, 365);

    const boardX = 90;
    const boardY = 450;
    const boardSize = 1020;
    const gap = 22;
    const padding = 26;
    const cell = (boardSize - padding * 2 - gap * 3) / 4;
    context.fillStyle = "#c7d0cc";
    roundRect(context, boardX, boardY, boardSize, boardSize, 22);

    game.grid.forEach((row, rowIndex) => {
      row.forEach((value, columnIndex) => {
        const x = boardX + padding + columnIndex * (cell + gap);
        const y = boardY + padding + rowIndex * (cell + gap);
        const rgba = tileColor(value);
        context.fillStyle = `rgba(${rgba.join(",")})`;
        roundRect(context, x, y, cell, cell, 14);
        if (!value) return;
        context.fillStyle = value >= 32 ? "#ffffff" : "#21302c";
        if (value === 2048) context.fillStyle = "#f1c451";
        const size = String(value).length >= 5 ? 54 : String(value).length === 4 ? 68 : 82;
        context.font = `800 ${size}px "Segoe UI", sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(String(value), x + cell / 2, y + cell / 2 + 3);
      });
    });

    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    context.fillStyle = "#66716d";
    context.font = '600 24px "Segoe UI", sans-serif';
    context.fillText(`${game.moveCount} 次移动 · 最大数字 ${Math.max(...game.grid.flat())}`, 96, 1450);
    return canvas;
  }

  function download(game, modeLabel) {
    const canvas = render(game, modeLabel);
    const filename = `merge-2048-${new Date().toISOString().slice(0, 10)}.png`;
    if (canvas.toBlob) {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = filename;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 500);
      }, "image/png");
    } else {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = filename;
      link.click();
    }
  }

  return { render, download };
});
