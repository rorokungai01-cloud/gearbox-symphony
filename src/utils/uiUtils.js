export function drawBeveledBorder(graphics, width, height, color, alpha, thickness, gap = 8, fillColor = null, fillAlpha = 0) {
    graphics.clear();
    const cut = 12; // Angled corner size

    const drawChamfer = (g, inset) => {
      const hW = width / 2 - inset;
      const hH = height / 2 - inset;
      const c = Math.max(0, cut - inset);
      
      g.beginPath();
      g.moveTo(-hW + c, -hH);
      g.lineTo(hW - c, -hH);
      g.lineTo(hW, -hH + c);
      g.lineTo(hW, hH - c);
      g.lineTo(hW - c, hH);
      g.lineTo(-hW + c, hH);
      g.lineTo(-hW, hH - c);
      g.lineTo(-hW, -hH + c);
      g.closePath();
    };

    // Fill background
    if (fillColor !== null) {
      drawChamfer(graphics, 0);
      graphics.fillStyle(fillColor, fillAlpha);
      graphics.fillPath();
    }

    // Outer Thick Metallic Border
    drawChamfer(graphics, 0);
    graphics.lineStyle(thickness + 1.5, 0x000000, 0.8 * alpha);
    graphics.strokePath();
    drawChamfer(graphics, 0);
    graphics.lineStyle(thickness, color, alpha);
    graphics.strokePath();

    // Inner bevel seam
    drawChamfer(graphics, gap);
    graphics.lineStyle(2, 0x000000, 0.9 * alpha);
    graphics.strokePath();
    
    drawChamfer(graphics, gap + 1);
    graphics.lineStyle(1.5, color, alpha * 0.4);
    graphics.strokePath();

    // Steampunk Screws (skip if area is extremely small)
    if (width > 40 && height > 40) {
      const drawScrew = (sx, sy) => {
        graphics.fillStyle(0x000000, 0.9 * alpha);
        graphics.fillCircle(sx, sy, 4.5);
        graphics.fillStyle(color, alpha * 0.7);
        graphics.fillCircle(sx, sy, 3);
        graphics.lineStyle(1.5, 0x000000, 0.9 * alpha);
        graphics.lineBetween(sx - 2, sy - 2, sx + 2, sy + 2);
      };

      const hW = width / 2;
      const hH = height / 2;
      const pad = Math.min(14, width / 4, height / 4); // Scale down pad for smaller boxes
      
      drawScrew(-hW + pad, -hH + pad);
      drawScrew(hW - pad, -hH + pad);
      drawScrew(-hW + pad, hH - pad);
      drawScrew(hW - pad, hH - pad);
    }
}
