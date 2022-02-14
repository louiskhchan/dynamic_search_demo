/** make trial permutations
 * @returns {number} */
function calc_nperm(ivs) {
    let nperm = 1;
    for (key in ivs) nperm *= ivs[key].length;
    return nperm;
}

/** make trial permutations
 * @returns {Array} */
function permu_trials(ivs, nt) {
    let nperm = calc_nperm(ivs);
    if (nt % nperm) throw "Number of trials is not permutation of IVs";
    let trials = new Array(nt);
    for (let ti = 0; ti < trials.length; ti++) {
        let carry = ti;
        trials[ti] = {};
        let ivs_entries = Object.entries(ivs);
        ivs_entries.reverse();
        let trialvals = {};
        for (let [key, value] of ivs_entries) {
            let nl = value.length;
            let remainder = carry % nl;
            trialvals[key] = value[remainder];
            carry -= remainder;
            carry /= nl;
        }
        for (key in ivs) trials[ti][key] = trialvals[key];
    }
    return trials;
}

/** produce the permutation of conditions 
 * @returns {Array}
 */
function permu_conds(ivs) {
    let nperm = calc_nperm(ivs);
    return permu_trials(ivs, nperm);
}

/**
 * 
 * @param {Object} cond 
 * @param {Object} trial 
 * @returns {Boolean}
 */
function match_cond(cond, trial) {
    let match = true;
    for (let key in cond) match = match && cond[key] == trial[key];
    return match;
}

/** gen trials, support practice trials and shuffled
 * @returns {Array} */
function gen_trials(ivs, nt, npt = 0) {
    let nperm = calc_nperm(ivs);

    let ptrials = [];
    if (npt > 0) {
        let nptcarry = npt;
        if (nptcarry % nperm);
        nptcarry += nperm - npt % nperm;
        ptrials = permu_trials(ivs, nptcarry);
        shuffle(ptrials);
        ptrials = ptrials.slice(0, npt);
        ptrials.forEach(function(trial, ti) { trial.ti = ti - npt; });
    }
    let trials = permu_trials(ivs, nt);
    shuffle(trials);
    trials.forEach(function(trial, ti) { trial.ti = ti; });
    return ptrials.concat(trials);
}
/** search_ring
 *  
 * holder size, ring radius, cx, cy, options={phase:-pi/2,shuffle:true,ssize:hsize} 

 * return an array of coordinates
 * @returns {Array<Array<number>> }
 */
function search_ring(hsize, cx, cy, radius, options = { phase: -Math.PI / 2, shuffle: true }) {
    let out = [];
    for (let i = 0; i < hsize; i++) {
        let pos_angle = i / hsize * Math.PI * 2 + options.phase;
        out.push([cx + Math.cos(pos_angle) * radius, cy + Math.sin(pos_angle) * radius]);
    }
    if (options.shuffle) shuffle(out);
    if ('ssize' in options) out.splice(options.ssize);
    return out;
}

/** search_table
 *  
 * mw and mh is for calculating the margin, which is calculated from item center. it should be slightly larger than half the item width and height.
 *ncol, nrow, cx, cy, w, h, mw, mh, options={shuffle:true,ssize:(ncol*nrow)}
 * 
 * return an array of coordinates
 * @returns {Array<Array<number>> }
 */
function search_table(ncol, nrow, cx, cy, w, h, mw, mh, options = { shuffle: true }) {
    //check param validity
    if (mw * 2 > w / ncol) throw "mw too wide";
    if (mh * 2 > h / nrow) throw "mh too tall";
    //set table
    let out = [];
    for (let i = 0; i < ncol; i++)
        for (let j = 0; j < nrow; j++) {
            let pos = [
                (cx - w / 2) + i / ncol * w + mw + Math.random() * (w / ncol - mw * 2),
                (cy - h / 2) + j / nrow * h + mh + Math.random() * (h / nrow - mh * 2)
            ];
            out.push(pos);
        }

    if (options.shuffle) shuffle(out);
    if ('ssize' in options) out.splice(options.ssize);
    return out;
}

/** random sample an element from an array */
function sample(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}