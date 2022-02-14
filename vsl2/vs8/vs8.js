/** parse_url_params
 * @return {Object}
 */
function parse_url_params() {
    return Object.fromEntries(new URLSearchParams(window.location.search));
}
/** create_url_params 
 * @return {String}
 */
function create_url_params(obj) {
    return Object.entries(obj).map(pair => pair.map(encodeURIComponent).join('=')).join('&');
}


/** padzero
 * @return {string}
 */
function padzero(num, size) {
    let s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

/** get date as a YYYYMMDD string
 * @returns {string} */
function get_date_str() {
    let date = new Date();
    return padzero(date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate(), 8);
}

/** get time as a HHMMSS string
 *  @returns {string} */
function get_time_str() {
    let date = new Date();
    return padzero(date.getHours() * 10000 + date.getMinutes() * 100 + date.getSeconds(), 6);
}

/** get date time as YYYYMMDD_HHMMSS
 * @returns {string} */
function get_datetime_str() {
    return get_date_str() + "_" + get_time_str();
}

/** suffle an arr inplace
 * @returns {void} */
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

/** sort a numeric array correctly (in place)
 * necessary because the default Array.sort is as strings
 * @returns {void}
 */
function sort_numeric(arr) {
    arr.sort(function (a, b) {
        return a - b;
    });
}

/** calculate sum
 * @returns{Number}
 */
function sum(arr) {
    return arr.reduce((acc, val) => acc + val, 0);
}

/** calculate mean
 * @returns{Number}
 */
function mean(arr) {
    return sum(arr) / arr.length;
}
/**
 * linear interpolation
 * @param {Number} positioni 
 * @param {Number} value0i 
 * @param {Number} value1i 
 */
function linear_interpolate(positioni, value0i, value1i) {
    //    return (1 - positioni) * value0i + positioni * value1i;
    return value0i + (positioni) * (value1i - value0i);
}
/**
 * get percentile. ASSUME arr is already SORTED
 * @param {Array<Number>} arr 
 * @param {Number} p 
 */
function get_percentile(arr, p) {
    let rank = p * (arr.length + 1);
    let rankd = Math.trunc(rank);
    let rankf = rank - rankd;
    if (rankd <= 0) return arr[0];
    else if (rankd >= arr.length) return arr[arr.length - 1];
    else return linear_interpolate(rankf, arr[rankd - 1], arr[rankd]);
}

/** make array unique 
 * @returns {Array}
 */
function array_unique(arr) {
    return arr.filter(function (value, index, self) {
        return self.indexOf(value) === index;
    });
}

/** assign an array of values as the property of an array of objects
 * the length of objarr will be used, therefore valarr.length should be >= objarr.length..
 * @param {Array<Object>} objarr 
 * @param {String} key
 * @param {Array<any>} valarr 
 */
function arr2prop(objarr, key, valarr) {
    for (let i = 0; i < objarr.length; i++) objarr[i][key] = valarr[i];
}
/** extract a property from an array of object to form an array
 * @param {Array<any>} arr
 * @param {String} key
 * @returns {Array<any>}
 */
function prop2arr(arr, key) {
    let out = [];
    for (let val of arr) out.push(val[key]);
    return out;
}

/** random between two numbers
 * @returns {number} */
function rand_between(lb, ub) {
    return lb + Math.random() * (ub - lb);
}

/** random between two integer
 * 
 * assume lb is integer, ub is exclusive
 * @returns {number} */
function rand_int_between(lb, ub) {
    return lb + Math.floor(Math.random() * (ub - lb));
}

/** random between two integer excluding integer set in array
 * 
 * assume lb is integer, ub is exclusive
 * @param {Array} arr
 * @param {number} lb
 * @param {number} ub
 * @returns {number} */
function rand_int_between_exclarr(arr, lb, ub) {
    let uarr = array_unique(arr);
    sort_numeric(uarr);
    let len = ub - lb - uarr.length;
    let rn = rand_int_between(lb, lb + len);
    for (let i of uarr) {
        if (rn >= i) rn++;
    }
    return rn;
}

/** deep copy by using JSON */
function deepcopy(from) {
    return JSON.parse(JSON.stringify(from));
}

/**
 * deep fill an array with (an object BY VALUE)
 * @param {Array} arr 
 * @param {Number} n
 * @param {Object} obj 
 */
function deepfill(arr, n, obj) {
    for (let i = 0; i < n; i++) arr.push(deepcopy(obj));
}

/**
 * deep fill a NEW array with (an object BY VALUE) and return the array
 * @param {Number} n
 * @param {Object} obj 
 */
function deepfillnew(n, obj) {
    let out = [];
    for (let i = 0; i < n; i++) out.push(deepcopy(obj));
    return out;
}

/**short hand for insertAdjacentHTML beforeend
 * 
 * @param {HTMLElement} parent 
 * @param {string} html 
 */
function addhtml(parent, html) {
    parent.insertAdjacentHTML('beforeend', html);
}

/**short hand for insertAdjacentText beforeend
 * 
 * @param {HTMLElement} parent 
 * @param {string} text 
 */
function addtext(parent, text) {
    parent.insertAdjacentText('beforeend', text);
}


/**make table (each key is a dv, the keys of each entry are headers)
 * @param {HTMLElement} parent
 * @param {Object} obj
 * @returns {HTMLTableElement} */
function addtable(parent, obj) {
    let htmlstr = '';
    //get conds first
    let conds;
    for (let dv in obj) {
        conds = Object.keys(obj[dv]);
        break;
    }
    htmlstr += '<table>';
    htmlstr += '<thead>';
    htmlstr += '<tr>';
    htmlstr += '<th>&nbsp;</th>';
    for (let cond of conds) {
        htmlstr += '<th>' + cond + '</th>';
    }
    htmlstr += '</tr>';
    htmlstr += '</thead>';
    htmlstr += '<tbody>';
    for (let dv in obj) {
        htmlstr += '<tr>';
        htmlstr += '<th>' + dv + '</th>';
        for (let cond of conds) {
            htmlstr += '<td>' + obj[dv][cond] + '</td>';
        }
        htmlstr += '</tr>';
    }
    htmlstr += '</tbody>';
    htmlstr += '</table>';
    addhtml(parent, htmlstr);
    let coll = parent.getElementsByTagName('table');
    return coll[coll.length - 1];
}


/** * add ele, text, or html ele some parent
 * 
 *  param: {ele, tag, text, html, class, style,attr} 
 * @param {{
 * ele:HTMLElement,
 * tag:string,
 * text:string,
 * html:string,
 * class:string, //space separated
 * attr:object //key as name, content str as value
 * tablecontentobj:object //table object as object
 * }} param
 * @returns {HTMLElement} */
function add(param) {
    //set parent
    let ele = document.body;
    if ('ele' in param) ele = param.ele;
    //set child
    /** @type HTMLElement */
    let p;
    if ('tag' in param) {
        p = document.createElement(param.tag);
        if ('class' in param) {
            p.classList.add(...param.class.split(' ').filter((str) => { return str.length > 0 }));
        }
        if ('style' in param) {
            p.style.cssText = param.style;
        }
        if ('text' in param) {
            addtext(p, param.text);
        }
        if ('html' in param) {
            addhtml(p, param.html);
        }
        if ('attr' in param) {
            for (let key in param.attr) {
                p.setAttribute(key, param.attr[key]);
            }
        }
        ele.appendChild(p);
    }
    return p;
}

/** wait for events such as button click
 * 
 * if timeout, the Promise will reject
 * 
 * param: {ele,type,timeout,preventDefault=false} 
 * @returns {Promise<Event,void>} */
function wait_event(param) {
    if (!('ele' in param)) param.ele = document.body;
    let p1 = new Promise((resolve, reject) => {
        /**@param {Event} e */
        let listener = function (e) {
            if ('preventDefault' in param && param.preventDefault) e.preventDefault();
            delete param.timeout_handle;
            resolve(e);
        };
        if ('timeout' in param) {
            param.timeout_handle = setTimeout(function () {
                if ('timeout_handle' in param) param.ele.removeEventListener(param.type, listener);
                reject();
            }, param.timeout);
        }
        param.ele.addEventListener(param.type, listener, { once: true });
    });
    return p1;
}


/** higher-level impl of waiting keyboard and mouse inputs.
 * preventDefault=true and ele=document.body  
 * continue wait until expected keys are pressed
 * @param {Array} keys if value is number, map to MouseEvent.button; if value is string, map to KeyboardEvent.code
 * @param {Number} timeout optional
 * @returns {Promise<{
 * idx:number,
 * timestamp:number
 * }>}
 */
async function wait_keys(keys, timeout = 0) {
    let listenman = new ListenerManager();
    let timeoutman;
    let prom = new Promise(resolve => {
        let keycb = function (e) {
            e.preventDefault();
            let idx = keys.indexOf(e.code);
            if (idx >= 0) resolve({ idx: idx, code: keys[idx], timestamp: e.timeStamp });
        };
        let mousecb = function (e) {
            e.preventDefault();
            let idx = keys.indexOf(e.button);
            if (idx >= 0) resolve({ idx: idx, code: keys[idx], timestamp: e.timeStamp });
        };
        let timeoutcb = function () {
            resolve({ idx: -1, code: 'timeout', timestamp: performance.now() });
        };
        listenman.add(document.body, 'keydown', keycb);
        listenman.add(document.body, 'mousedown', mousecb);
        if (timeout > 0) timeoutman = setTimeout(timeoutcb, timeout);
    });
    let out = await prom;
    listenman.removeall();
    if (timeout > 0) clearTimeout(timeoutman);
    return out;
}

/** wait timeout
 * @returns {Promise} */
function wait_timeout(ms) {
    return new Promise((resolve) => { setTimeout(resolve, ms); });
}

/** wait forever
 * @returns {Promise<void>} */
function wait_forever() {
    return new Promise(() => { });
}


/** wait game frame out
 * 
 * @returns {Promise<DOMHighResTimeStamp>} */
function wait_frame_out() {
    return new Promise((resolve) => {
        window.requestAnimationFrame(function (timestamp) {
            //            let te = new Event(''); //not sure if this is workaround and i keep it just to be safe
            resolve(timestamp);
        });
    });
}

/** wait timeout by looping frames
 * @returns {Promise<void>}
 */
async function wait_frame_timeout(ms, fpms) {
    let times = [];
    let nf = Math.round(ms * fpms);
    for (let i = 0; i < nf; i++) times.push(await wait_frame_out());
    return times;
}
/** parse cookie
 * @return Object
 */
function parse_cookie(cookie_str = document.cookie) {
    let out = {};
    for (let val of cookie_str.split(';')) {
        if (val) {
            let m;
            if (m = val.match(/(.*?)=(.*)/)) out[decodeURIComponent(m[1].trim())] = decodeURIComponent(m[2].trim());
            else out[decodeURIComponent(val.trim())] = '';
        }
    }
    return out;
}

/** print_r -- php-like print_r() for debug
 * @return void
 */
function print_r(obj) {
    addtext(JSON.stringify(obj).replace(/,/g, ', '));
    addhtml('<br>');
}

/** detect mobile
 * @returns {boolean} */
function is_mobile() {
    return navigator.userAgent.match(/mobile/i);
}

/** detect chrome
 * @returns {boolean} */
function is_chrome() {
    return navigator.userAgent.match(/chrome/i);
}

/** detect touch
 * @returns {boolean}  */
function is_touch() {
    return ('ontouchstart' in window);
}

/** estimate frame interval in ms
 * @returns {Promise<number>} */
async function estimate_frame_interval() {
    await wait_frame_out();
    let tss = [];
    let last_ts = await wait_frame_out();
    for (let i = 0; i < 9; i++) {
        let ts = await wait_frame_out();
        tss.push(ts - last_ts);
        last_ts = ts;
    }
    sort_numeric(tss);
    return tss[4];
}
/** estimate fps
 * @returns {Promise<number>} */
async function estimate_fps() {
    return 1000 / (await estimate_frame_interval());
}
/** estimate fps
 * @returns {Promise<number>} */
async function estimate_fpms() {
    return 1 / (await estimate_frame_interval());
}

/** degree to radian */
function deg2rad(deg) {
    return deg / 180 * Math.PI;
}

/** manager for adding and removing event listeners */
class ListenerManager {
    constructor() {
        this.listenerlist = [];
    }
    add(target, type, callback) {
        target.addEventListener(type, callback);
        this.listenerlist.push({ target: target, type: type, callback: callback });
    }
    removeall() {
        for (let listener of this.listenerlist) listener.target.removeEventListener(listener.type, listener.callback);
    }
}

/** shortcut for manager for hiding contextmenu
 * @param {HTMLElement } ele element to hide context menu. default to body 
 * @returns {ListenerManager} use removeall to remove the contextmenu handler 
 */
function hide_contextmenu(ele = document.body) {
    let hider = new ListenerManager();
    hider.add(ele, 'contextmenu', (e) => { e.preventDefault(); });
    return hider;
}


/** gen unique ID */
function unique_id() {
    let array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    let str = "000000" + array[0].toString(36);
    return str.substring(str.length - 6);
}

/** xhr upload as a promise
 * 
 * //return server response
 * @param {{
 * url:string,
 * body:string,
 * [method]:string,
 * [timeout]:number,
 * }} param
 * @returns {Promise<{
 * response:string,
 * success:boolean
 * }}>}
 */
function upload(param) {
    if (!('method' in param)) param.method = 'POST';
    if (!('timeout' in param)) param.timeout = 5000;
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open(param.method, param.url);
        xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        xhr.send(param.body);
        //xhr
        xhr.timeout = param.timeout;
        xhr.onerror = () => { resolve({ success: false }); };
        xhr.onload = () => { resolve({ success: true, response: xhr.response }); };
    });
}

//multiplatform fullscreen
/** @returns {Promise<Number>} View in fullscreen */
async function openFullscreen() {
    let fullscreenok = 1;
    try {
        if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen({ navigationUI: "hide" });
        } else if (document.documentElement.mozRequestFullScreen) { /* Firefox */
            await document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) { /* IE/Edge */
            document.documentElement.msRequestFullscreen();
        }
    } catch (e) {
        fullscreenok = 0;
    }
    await wait_timeout(300);
    return fullscreenok;
}

/** @returns {Promise<Number>} Close fullscreen */
async function closeFullscreen() {
    let fullscreenok = 1;
    try {
        if (document.exitFullscreen) {
            await document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { /* Firefox */
            await document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE/Edge */
            document.msExitFullscreen();
        }
    } catch (e) {
        fullscreenok = 0;
    }
    await wait_timeout(300);
    return fullscreenok;
}
function escape_regex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

