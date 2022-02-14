var lightness = 70;
var sat = 50;

var tarhue = 145;
var huezone = 45;

function rand_hue() {
    let hue = rand_between(0, 360 - 2 * huezone);
    if (hue > (tarhue - huezone)) hue += 2 * huezone;
    return hue;
}

function loop_hue(hue) {
    while (hue < 0) hue += 360;
    return hue % 360;
}

function detdir(curhue, nexthue) {
    if (curhue < tarhue && tarhue < nexthue) return -1;
    if (nexthue < tarhue && tarhue < curhue) return 1;
    return ((nexthue - curhue) < 0) ? -1 : 1;
}

function noncrossdist(curhue, nexthue) {
    let dir = detdir(curhue, nexthue);
    if (dir > 0)
        while (nexthue < curhue) nexthue += 360;
    else
        while (nexthue > curhue) nexthue -= 360;
    let out = dir * (nexthue - curhue);
    return out;
}

function advance(item, amount) {
    let dir = detdir(item.curhue, item.nexthue);
    if (noncrossdist(item.curhue, item.nexthue) < amount) {
        item.curhue = item.nexthue;
        return true;
    }
    item.curhue = loop_hue(item.curhue + dir * amount);
    return false;
}