var lightness = 70;
var sat = 50;

var tarhue = 145;
var tarori = 180;
var huezone = 45;

function rand_hue() {
    let hue = rand_between(huezone, 360 - huezone);
    return hue;
}

function advance(item, tt, amount) {
    if (item.nexthue[tt] == 0 && item.curhue[tt] > 180) item.nexthue[tt] = 360;
    if (item.curhue[tt] == 0 && item.nexthue[tt] > 180) item.curhue[tt] = 360;
    if (Math.abs(item.nexthue[tt] - item.curhue[tt]) < amount) {
        item.curhue[tt] = item.nexthue[tt];
        item.curhue[tt] = loop_hue(item.curhue[tt]);
        item.nexthue[tt] = loop_hue(item.nexthue[tt]);
        return true;
    }
    let dir = item.nexthue[tt] > item.curhue[tt] ? 1 : -1;
    item.curhue[tt] = item.curhue[tt] + dir * amount;
    item.curhue[tt] = loop_hue(item.curhue[tt]);
    item.nexthue[tt] = loop_hue(item.nexthue[tt]);
    return false;
}

function loop_hue(hue) {
    while (hue < 0) hue += 360;
    return hue % 360;
}

function outside_tar_range(hue) {
    return huezone < hue && hue < (360 - huezone);
}

function replaceitemcircle(desccanvasid, color) {
    /** @type {HTMLCanvasElement} tcc */
    let tcc = document.getElementById(desccanvasid);
    let [cx, cy, cw, ch] = [15, 15, 30, 30];
    tcc.width = cw;
    tcc.height = ch;
    let itemw = 10;
    let itemh = 30;
    let context = tcc.getContext('2d');
    context.fillStyle = chroma.lch(lightness, sat, loop_hue(color));
    context.lineWidth = itemw;
    context.fill(path_circle(cx, cy, itemh / 2));
    //context.stroke(path_line(10, 10, deg2rad(loop_hue(tarori) / 2), itemh));
}

function replaceitembar(desccanvasid, ori) {
    /** @type {HTMLCanvasElement} tcc */
    let tcc = document.getElementById(desccanvasid);
    let [cx, cy, cw, ch] = [15, 15, 30, 30];
    tcc.width = cw;
    tcc.height = ch;
    let itemw = 10;
    let itemh = 30;
    let context = tcc.getContext('2d');
    context.strokeStyle = chroma.lch(lightness, 0, 0);
    context.lineWidth = itemw;
    context.stroke(path_line(cx, cy, deg2rad(loop_hue(ori) / 2), itemh));
}