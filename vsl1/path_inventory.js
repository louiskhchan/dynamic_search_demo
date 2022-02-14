function draw_fire(cx, cy, size) {
    let outer = new Path2D();
    outer.moveTo(cx - size / 6, cy);
    outer.quadraticCurveTo(
        cx - size / 6, cy + size / 6,
        cx, cy + size / 3);
    outer.quadraticCurveTo(
        cx + size / 6, cy + size / 6,
        cx + size / 6, cy);
    context.fillStyle = 'rgba(255,192,0,' + (.45 + .1 * get_time_sine(9)) + ')';
    context.fill(outer);
    let inner = new Path2D();
    inner.moveTo(cx - size / 12, cy);
    inner.quadraticCurveTo(
        cx - size / 12, cy + size / 8,
        cx, cy + size / 4);
    inner.quadraticCurveTo(
        cx + size / 12, cy + size / 8,
        cx + size / 12, cy);
    context.fillStyle = 'rgba(255,255,0,.9)';
    context.fill(inner);
}