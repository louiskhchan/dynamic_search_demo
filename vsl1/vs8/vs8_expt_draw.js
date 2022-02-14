/** @returns {Path2D} */
function path_cross(cx, cy, length) {
    let out = new Path2D();
    out.moveTo(cx - length / 2, cy);
    out.lineTo(cx + length / 2, cy);
    out.moveTo(cx, cy - length / 2);
    out.lineTo(cx, cy + length / 2);
    return out;
}

function path_triangle(cx, cy, base, height) {
    let out = new Path2D();
    out.moveTo(cx, cy - height / 2);
    out.lineTo(cx - base / 2, cy + height / 2);
    out.lineTo(cx + base / 2, cy + height / 2);
    out.closePath();
    return out;
}

/** @returns {Path2D} */
function path_circle(cx, cy, radius) {
    let out = new Path2D();
    out.arc(cx, cy, radius, 0, 2 * Math.PI, false);
    return out;
}

/** @returns {Path2D} */
function path_round_rectangle(cx, cy, w, h, radius) {
    let out = new Path2D();
    out.moveTo(cx - w / 2 + radius, cy - h / 2);
    out.lineTo(cx + w / 2 - radius, cy - h / 2);
    out.arcTo(cx + w / 2, cy - h / 2,
        cx + w / 2, cy - h / 2 + radius,
        radius);
    out.lineTo(cx + w / 2, cy + h / 2 - radius);
    out.arcTo(cx + w / 2, cy + h / 2,
        cx + w / 2 - radius, cy + h / 2,
        radius);
    out.lineTo(cx - w / 2 + radius, cy + h / 2);
    out.arcTo(cx - w / 2, cy + h / 2,
        cx - w / 2, cy + h / 2 - radius,
        radius);
    out.lineTo(cx - w / 2, cy - h / 2 + radius);
    out.arcTo(cx - w / 2, cy - h / 2,
        cx - w / 2 + radius, cy - h / 2,
        radius);
    return out;
}

/** make line path, rotation in radians. use deg2rad() to convert
 *  @returns {Path2D} */
function path_line(cx, cy, rotation, length) {
    let out = new Path2D();
    out.moveTo(cx - Math.cos(rotation) * length / 2, cy - Math.sin(rotation) * length / 2);
    out.lineTo(cx + Math.cos(rotation) * length / 2, cy + Math.sin(rotation) * length / 2);
    return out;
}

/** hit test by radius 
 * @return {Boolean}
 */
function hittest_radius(hx, hy, cx, cy, radius) {
    return (hx - cx) ** 2 + (hy - cy) ** 2 < radius ** 2;
}
/** hit test by rect region 
 * @return {Boolean}
 */
function hittest_rect(hx, hy, x, y, w, h) {
    return (x < hx && hx < (x + w)) && (y < hy && hy < y + h);
}

function clear_context(context) {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
}

/** set expt canvas and context, and return useful objects
 *  let [cp, cx, cy, cw, ch, context] = [c.cp, c.cx, c.cy, c.cw, c.ch, c.context];
 * 
 * @param {HTMLElement} parent_ele
 * @param {HTMLCanvasElement} canvas
 * 
 * @returns {{
 * v2c: function ,
 * context:CanvasRenderingContext2D
 * }}
 */
function expt_setup_canvas(canvas, orientation = 'auto') {
    let out = {};

    //global vars
    out.vw = canvas.clientWidth;
    out.vh = canvas.clientHeight;

    //determine orientation
    //we default a 16:9 aspect ratio
    if (orientation == 'none') out.orientation = 'none';
    if (orientation == 'auto') out.orientation = out.vw > out.vh ? 'landscape' : 'portrait';
    if (orientation.match(/portrait/)) out.orientation = 'portrait';
    if (orientation.match(/landscape/)) out.orientation = 'landscape';
    if (out.orientation == 'landscape') {
        //landscape
        if (out.vw / out.vh > 16 / 9) out.vw = Math.floor(out.vh / 9 * 16 / 2) * 2;
        else out.vh = Math.floor(out.vw / 16 * 9 / 2) * 2;
        out.vn = out.vh;
    } else if (out.orientation == 'portrait') {
        //portrait
        if (out.vh / out.vw > 16 / 9) out.vh = Math.floor(out.vw / 9 * 16 / 2) * 2;
        else out.vw = Math.floor(out.vh / 16 * 9 / 2) * 2;
        out.vn = out.vw;
    } else {
        //none
        out.vn = Math.min(out.vw, out.vh);
    }

    //unit converter
    out.v2c = function(v) {
        if (Array.isArray(v)) v.forEach((v, i, a) => { a[i] = v * window.devicePixelRatio; });
        else v = v * window.devicePixelRatio;
        return v;
    };
    //set context size
    out.cn = out.v2c(out.vn);
    out.cw = canvas.width = out.v2c(out.vw);
    out.ch = canvas.height = out.v2c(out.vh);
    out.cx = out.cw / 2;
    out.cy = out.ch / 2;

    //  vs8 expt scale note
    // iphone11: 6.45 cm wide :41.06cm
    // s10; 6.65 cm wide: 42.3 cm
    // FOR SIMPLICITY, we take 1 deg == 0.1 vn
    // FOR CONVENIENCE, we take 1 vn == 100 vp at 1deg == 10 vp
    // set virtual pixel, in which each represent 1% of screen width or height, whichever is smaller
    out.cp = out.cn / 100;
    //create context
    out.context = canvas.getContext("2d");
    return out;
}

/** save context
 * @param {CanvasRenderingContext2D} context
 * @returns {ImageData}
 */
function save_context(context) {
    return context.getImageData(0, 0, context.canvas.width, context.canvas.height);
}
/** return a sine wave of time, freq in hz */
function get_time_sine(freq) {
    return Math.sin(performance.now() * freq / 1000 * Math.PI * 2);

}