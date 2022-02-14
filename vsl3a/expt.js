var colorspeed = 100 / 1000;
var prac_stopduration = 3 * 1000;
var expt_stopduration = 2.5 * 1000;

//within-subj ivs
var ivs = {
	prev: ['colormore', 'orimore'],
	ssize: [4, 12],
	ttype: ['color', 'ori']
};
//between-subj ivs
var btws = {
	ttype_order: ['colorfirst', 'orifirst'],
	ssize_order: ['smallssfirst', 'largessfirst']
};

var btw_labs = ["id", ...Object.keys(btws)];

var gexpt;

var d1;


/**@param { {context:CanvasRenderingContext2D}} c */
async function run_trial(c, trialspec, responses) {
	let [cp, cx, cy, cw, ch, context] = [c.cp, c.cx, c.cy, c.cw, c.ch, c.context];
	context.clearRect(0, 0, cw, ch);
	await wait_timeout(500);
	context.save();

	//pointers necessary for response monitor
	let nexttari = { color: 0, ori: 0 };
	let curtar = { color: null, ori: null };

	//response monitor
	/**
	 * 
	 * @param {KeyboardEvent} e 
	 */
	let onresponse = function (e) {
		e.preventDefault();
		let ts = e.timeStamp;
		let ttype;
		if (e.code == 'KeyZ') ttype = 'color';
		else if (e.code == 'Slash') ttype = 'ori';
		else return;
		if (curtar[ttype] !== null && 'state' in curtar[ttype]) {
			if (!('detected' in curtar[ttype])) {
				curtar[ttype].detected = true;
				curtar[ttype].detectiontime = ts;
				if (curtar[ttype].state == 'entered') curtar[ttype].detectiontype = 'premature';
				else if (curtar[ttype].state == 'arrived') curtar[ttype].detectiontype = 'hit';
				else if (curtar[ttype].state == 'departing') curtar[ttype].detectiontype = 'late';
			}
		} else {
			responses.push({
				prev: trialspec.prev,
				ssize: trialspec.ssize,
				ttype: ttype,
				type: 'fa',
				arrivetime: null,
				detectiontime: ts,
				rt: null
			});
		}
	};
	let listenman = new ListenerManager();
	listenman.add(document.body, 'keydown', onresponse);

	//start timing
	let frame_interval = await estimate_frame_interval();
	let starttime = await wait_frame_out();
	let now = starttime;

	//prepare items
	let ncol, nrow;
	if (trialspec.ssize == 4) {
		ncol = 2;
		nrow = 2;
	} else if (trialspec.ssize == 9) {
		ncol = 3;
		nrow = 3;
	} else if (trialspec.ssize == 12) {
		ncol = 4;
		nrow = 3;
	}
	let tablew = ncol * 10 * cp;
	let tableh = nrow * 10 * cp;
	let itemw = 1.5 * cp;
	let itemh = 4.5 * cp;

	//initialize item states
	let items = [];
	for (let r = 0; r < nrow; r++)
		for (let c = 0; c < ncol; c++) {
			//make item
			let item = {
				r: r,
				c: c,
				curhue: {},
				nexthue: {},
				lastarrivetime: {}
			};
			//determine stopping state
			for (let ttype of ivs.ttype) {
				let curhue = rand_hue();
				let ocurhue = curhue;
				let nexthue = rand_hue();
				let direction = nexthue - curhue;
				direction /= Math.abs(direction);
				let lastarrivetime = 0;
				let totalduration = trialspec.stopduration + direction * (nexthue - curhue) / trialspec.colorspeed;
				let curtime = rand_between(0, totalduration);
				curhue += direction * curtime * trialspec.colorspeed;
				let ncurhue = curhue;
				let diff = curhue - nexthue;
				if (diff * direction > 0) {
					curhue = nexthue;
					let timediff = diff * direction / trialspec.colorspeed;
					lastarrivetime = now - trialspec.stopduration + timediff;
				}
				item.curhue[ttype] = curhue;
				item.nexthue[ttype] = nexthue;
				item.lastarrivetime[ttype] = lastarrivetime;
			}
			//push
			items.push(item);
		}

	//set target
	let target = {
		color: [],
		ori: []
	};

	//schedule target time
	let tar_ttype_arr = [];
	for (let ttype of ivs.ttype)
		for (let i = 0; i < trialspec.numtar[ttype]; i++)
			tar_ttype_arr.push(ttype);
	shuffle(tar_ttype_arr);
	let tarperiod = trialspec.duration / tar_ttype_arr.length - trialspec.stopduration - 180 / trialspec.colorspeed;
	for (let i = 0; i < tar_ttype_arr.length; i++) {
		target[tar_ttype_arr[i]].push({
			scheduledtime: i * trialspec.duration / tar_ttype_arr.length + rand_between(0, tarperiod)
		});
	}

	//trial loop
	while (now < starttime + trialspec.duration) {
		context.clearRect(0, 0, cw, ch);
		context.save();
		//draw items
		for (let item of items) {
			let itempos = [cx + tablew * (-.5 + (item.c + .5) / ncol), cy + tableh * (-.5 + (item.r + .5) / nrow)];
			context.strokeStyle = chroma.lch(lightness, sat, loop_hue(item.curhue.color + tarhue));
			context.lineWidth = itemw;
			context.stroke(path_line(...itempos, deg2rad(loop_hue(item.curhue.ori + tarori) / 2), itemh));
			for (let ttype of ivs.ttype) {
				//update hue for next frame
				if (item.curhue[ttype] == item.nexthue[ttype]) {
					//already arrived, waiting to depart
					//WORKING:FEATURE: CAN WE HAVE RANDOM STARTING STATE? WHAT IS THE EXPECTED CHANCE?
					if (now < item.lastarrivetime[ttype] + trialspec.stopduration) {
						//do nothing
					} else {
						item.nexthue[ttype] = rand_hue();
					}
				} else {
					if (advance(item, ttype, trialspec.colorspeed * frame_interval)) {
						//just arrived
						item.lastarrivetime[ttype] = now;

					} else {
						//normal advance
					}
				}
			}
		}
		//set target
		for (let ttype of ivs.ttype) {
			if (nexttari[ttype] < trialspec.numtar[ttype] && now - starttime > target[ttype][nexttari[ttype]].scheduledtime && curtar[ttype] === null) {
				curtar[ttype] = target[ttype][nexttari[ttype]];
				//randomly pick an item as target
				curtar[ttype].item = items[rand_int_between(0, items.length)];
				curtar[ttype].item.nexthue[ttype] = 0;
				nexttari[ttype]++;
			}
			//process target stage change
			if (curtar[ttype] !== null) {
				let taritem = curtar[ttype].item;
				if ('state' in curtar[ttype]) {
					if (curtar[ttype].state == 'entered') {
						if (taritem.curhue[ttype] == 0) {
							curtar[ttype].arrivetime = now;
							curtar[ttype].state = 'arrived';
						}
					} else if (curtar[ttype].state == 'arrived') {
						if (taritem.curhue[ttype] != 0) {
							curtar[ttype].state = 'departing';
						}
					} else if (curtar[ttype].state == 'departing') {
						if (outside_tar_range(taritem.curhue[ttype])) {
							if ('detected' in curtar[ttype]) {
								responses.push({
									prev: trialspec.prev,
									ssize: trialspec.ssize,
									ttype: ttype,
									type: curtar[ttype].detectiontype,
									arrivetime: curtar[ttype].arrivetime,
									detectiontime: curtar[ttype].detectiontime,
									rt: curtar[ttype].detectiontime - curtar[ttype].arrivetime
								});
							} else {
								responses.push({
									prev: trialspec.prev,
									ssize: trialspec.ssize,
									ttype: ttype,
									type: 'miss',
									arrivetime: curtar[ttype].arrivetime,
									detectiontime: null,
									rt: null
								});
							}
							curtar[ttype] = null;
						}
					}
				} else {
					//no state implies travelling
					if (!outside_tar_range(taritem.curhue[ttype])) {
						curtar[ttype].entertime = now;
						curtar[ttype].state = 'entered';
					}
				}
			}
		}

		context.restore();
		now = await wait_frame_out();
	}
	listenman.removeall();

	context.clearRect(0, 0, cw, ch);
	context.restore();
}
async function p_run_trial(trialspec, responses) {
	//set up canvas
	let canvas = add({ ele: d1, tag: 'canvas', style: 'width:100vw;height:100vh;position:absolute;background-color:white;' });

	//set up canvas and get context
	let c = expt_setup_canvas(canvas, 'none');
	let [cp, cx, cy, cw, ch, context] = [c.cp, c.cx, c.cy, c.cw, c.ch, c.context];

	//run experiment
	await run_trial(c, trialspec, responses);

	//remove canvas
	canvas.remove();
}

/** @returns {Promise<void>} */
async function do_expt(expt, prev, ssize, blocki) {
	{ // expt
		{
			let d1upper = add({ ele: d1, tag: 'div', class: 'instructiondiv' });
			addhtml(d1upper, `
			<h2>Target-rate effect in continuous visual search</h2>
			<h3>Online demo of Figure 5a</h3>
			<p->This is an online demo of the stimulus used in Experiments 3 and 4.</p->
			<p->In Experiment 3, the participant needs to find a color target and an orientation target in the same time.</p->
			<p->In Experiment 4, the participant only needs to find an orientation target. Different from this demo, no color targets was shown in Experiment 4, and the color variations was irrelevant to the task. </p->
			<p->This demo illustrates a <u>small set size</u> session.</p->
			<p->
			The target color was green: <canvas id='tarcolorcanvas'></canvas> <br>
			, and these colors were not green: 
			<canvas id='dist1colorcanvas'></canvas> <canvas id='dist2colorcanvas'></canvas> <canvas id='dist3colorcanvas'></canvas> <canvas id='dist4colorcanvas'></canvas>
			</p->
			<p->The target orientation was vertical: <canvas id='taroricanvas'></canvas><br>
			, and these orientations were not vertical: 
			<canvas id='dist1oricanvas'></canvas> <canvas id='dist2oricanvas'></canvas> <canvas id='dist3oricanvas'></canvas> <canvas id='dist4oricanvas'></canvas></p->
			<p->Participants were instructed to press the <key->z</key-> key when they saw a green target, and press the <key->/</key-> key when they saw a vertical target.</p->
			<p->They were reminded to response as quickly and as accurately as possible, and not to press any key when neither target was seen.</p->
			<p->In this demo, both targets will occur equally often at a medium frequency. In the actual experiment, one target would occur more frequently, and the other target would occur more rarely.</p->
			<p->Press start to start the demo. No data will be recorded or analyzed.</p->
				<p->&nbsp; </p->
			`);

			replaceitemcircle('tarcolorcanvas', loop_hue(tarhue));
			replaceitemcircle('dist1colorcanvas', loop_hue(tarhue - 2 * huezone));
			replaceitemcircle('dist2colorcanvas', loop_hue(tarhue - huezone));
			replaceitemcircle('dist3colorcanvas', loop_hue(tarhue + huezone));
			replaceitemcircle('dist4colorcanvas', loop_hue(tarhue + 2 * huezone));
			replaceitembar('taroricanvas', loop_hue(tarori));
			replaceitembar('dist1oricanvas', loop_hue(tarori - 2 * huezone));
			replaceitembar('dist2oricanvas', loop_hue(tarori - huezone));
			replaceitembar('dist3oricanvas', loop_hue(tarori + huezone));
			replaceitembar('dist4oricanvas', loop_hue(tarori + 2 * huezone));

			let trybut = add({ ele: d1upper, tag: 'button', text: 'Start' });
			await wait_event({ ele: trybut, type: 'click' });
			d1upper.remove();
		}
		//practice experiment setting
		let trialspec = {
			numtar: { color: 35, ori: 35 },
			prev: prev,
			ssize: ssize,
			duration: 10 * 60 * 1000,
			stopduration: expt_stopduration,
			colorspeed: colorspeed,
		};
		await p_run_trial(trialspec, expt.responses);
	} //end expt
}

//entry point
async function start_expt() {
	d1 = add({ tag: 'div' });

	// let param = parse_url_params();
	let param = {
		id: "test",
		ttype_order: "orifirst",
		ssize_order: "smallssfirst"
	};

	if (!('id' in param) || !('ttype_order' in param) || !('ssize_order' in param)) {
		await wait_instruction(d1, "<h2>Sorry</h2>Access denied.", { type: 'forever' });
	}

	let expt = {
		exptcode: 'color3',
		datetimestr: get_datetime_str(),
		id: param.id,
		btw: param,
		responses: [], //array of trials
		summary: {} //each key correspond to one file for table output
	};
	// gexpt = expt;

	while (1){
		await do_expt(expt, 'equalrate', 4, 0);
	}


	d1.remove();
}