var stopduration = 2000;
var colorspeed = 100 / 1000;

var d1;


/**@param { {context:CanvasRenderingContext2D}} c */
async function run_trial(c, trialspec, responses) {
	let [cp, cx, cy, cw, ch, context] = [c.cp, c.cx, c.cy, c.cw, c.ch, c.context];
	context.clearRect(0, 0, cw, ch);
	await wait_timeout(500);
	context.save();
	let isprac = trialspec.cond == 'practice';
	//set items
	let ncol = isprac ? 5 : 7;
	let nrow = isprac ? 4 : 5;
	let tablew = isprac ? 100 * cp : 65 / 5 * 7 * cp;
	let tableh = isprac ? 80 * cp : 65 * cp;
	let itemr = isprac ? 4 * cp : 2 * cp;
	let items = [];
	for (let r = 0; r < nrow; r++)
		for (let c = 0; c < ncol; c++)
			items.push({
				r: r,
				c: c,
				curhue: rand_hue(),
				nexthue: rand_hue(),
				lastarrivetime: 0
			});
	//set target
	let target = [];
	let tarsperiod = trialspec.duration - trialspec.stopduration - 360 / trialspec.colorspeed;
	let tarperiod = tarsperiod / trialspec.numtar;
	for (let i = 0; i < trialspec.numtar; i++) {
		target.push({
			scheduledtime: i * tarperiod + rand_between(0, tarperiod)
		});
	}
	let nexttar = 0;
	let curtar = null;

	//response monitor
	let onspacebar = function (e) {
		let ts = e.timeStamp;
		if (curtar !== null && 'state' in curtar) {
			if (!('detected' in curtar)) {
				if (curtar.state == 'entered') {
					curtar.pendingresponse = {
						cond: trialspec.cond,
						type: 'premature',
						time: ts
					};
					curtar.detected = true;
					trialspec.hitcb();
				}
				if (curtar.state == 'arrived') {
					responses.push({
						cond: trialspec.cond,
						type: 'hit',
						time: ts,
						rt: ts - curtar.arrivetime
					});
					curtar.detected = true;
					trialspec.hitcb();
				}
			}
		} else {
			responses.push({
				cond: trialspec.cond,
				type: 'fa',
				time: ts,
				rt: 0
			});
			trialspec.facb();
		}
	};
	let listenman = new ListenerManager();
	listenman.add(document.body, 'keydown', onspacebar);

	//trial loop
	let frame_interval = await estimate_frame_interval();
	let starttime = await wait_frame_out();
	let now = starttime;
	while (now < starttime + trialspec.duration) {
		context.save();
		//draw items
		for (let item of items) {
			let itempos = [cx + tablew * (-.5 + (item.c + .5) / ncol), cy + tableh * (-.5 + (item.r + .5) / nrow)];
			context.fillStyle = chroma.lch(lightness, sat, item.curhue);
			context.fill(path_circle(...itempos, itemr));
			//update hue for next frame
			if (item.curhue == item.nexthue) {
				//already arrived, waiting to depart
				if (now < item.lastarrivetime + trialspec.stopduration) {
					//do nothing
				} else {
					item.nexthue = rand_hue();
				}
			} else {
				if (advance(item, trialspec.colorspeed * frame_interval)) {
					//just arrived
					item.lastarrivetime = now;

				} else {
					//normal advance
				}
			}
		}
		//set target
		if (nexttar < trialspec.numtar && now - starttime > target[nexttar].scheduledtime && curtar === null) {
			curtar = target[nexttar];
			//randomly pick an item as target
			curtar.item = items[rand_int_between(0, items.length)];
			curtar.item.nexthue = tarhue;
			nexttar++;
		}
		//process target
		if (curtar !== null) {
			let taritem = curtar.item;
			if ('state' in curtar) {
				if (curtar.state == 'entered') {
					if (taritem.curhue == tarhue) {
						curtar.arrivetime = now;
						curtar.state = 'arrived';
						if ('pendingresponse' in curtar) {
							curtar.pendingresponse.rt = curtar.pendingresponse.time - curtar.arrivetime
							responses.push(curtar.pendingresponse);
							delete curtar['pendingresponse'];
						}
					}
				} else if (curtar.state == 'arrived') {
					if (taritem.curhue != tarhue) {
						curtar.state = 'departing';
					}
				} else if (curtar.state == 'departing') {
					if (noncrossdist(taritem.curhue, tarhue) > huezone) {
						if (!('detected' in curtar))
							responses.push({
								cond: trialspec.cond,
								type: 'miss',
								time: curtar.arrivetime,
								rt: now - curtar.arrivetime
							});
						curtar = null;
					}
				}
			} else {
				//no state implies travelling
				if (noncrossdist(taritem.curhue, tarhue) < huezone) {
					curtar.entertime = now;
					curtar.state = 'entered';
				}
			}
		}

		// console.log(responses);
		context.restore();
		now = await wait_frame_out();
	}
	listenman.removeall();

	context.clearRect(0, 0, cw, ch);
	context.restore();
}

async function p_run_trial(trialspec, responses) {
	//set up canvas
	let canvas = add({ ele: d1, tag: 'canvas', style: 'width:100vw;height:100vh;position:absolute;background-color:' + chroma.lch(lightness, 0, 0) + ';' });

	//set up canvas and get context
	let c = expt_setup_canvas(canvas, 'none');
	let [cp, cx, cy, cw, ch, context] = [c.cp, c.cx, c.cy, c.cw, c.ch, c.context];

	//run experiment
	await run_trial(c, trialspec, responses);

	//remove canvas
	canvas.remove();
}

/** @returns {Promise<void>} */
async function do_expt(expt, freq, blocki) {
	{ //expt instruction
		let d1upper = add({ ele: d1, tag: 'div', class: 'instructiondiv' });
		addhtml(d1upper, `
		<h2>Target-rate effect in continuous visual search</h2>
		<h3>Online demo of Figure 1</h3>
		<p->This is an online demo of the stimulus used in Experiment 1.</p->
		<p->In Experiment 1, the task was to detect a <b>green</b> color: <span style='background-color:${chroma.lch(lightness, sat, tarhue)};'>&nbsp;&nbsp;&nbsp;&nbsp;</span>. The participant has to press the <key->space</key-> key once when they saw this color, as quickly and as accurately as possible.</p->
		<p->Other colors, such as: 
		<span style='background-color:${chroma.lch(lightness, sat, tarhue - 2 * huezone)};'>&nbsp;&nbsp;&nbsp;&nbsp;</span>
		<span style='background-color:${chroma.lch(lightness, sat, tarhue - huezone)};'>&nbsp;&nbsp;&nbsp;&nbsp;</span>
		<span style='background-color:${chroma.lch(lightness, sat, tarhue + huezone)};'>&nbsp;&nbsp;&nbsp;&nbsp;</span>
		<span style='background-color:${chroma.lch(lightness, sat, tarhue + 2 * huezone)};'>&nbsp;&nbsp;&nbsp;&nbsp;</span>
		, were not the target green color, and the participants were reminded not to respond to these colors.</p->
		<p->This demo mimics the <b>frequent target condition</b> of the experiment.</p->
		<p->Press start to start the demo. No data will be recorded or analyzed.</p->
		<br>
		`);

		let trybut = add({ ele: d1upper, tag: 'button', text: 'Start' });
//		trybut.focus();
		await wait_event({ ele: trybut, type: 'click' });
		d1upper.remove();
	}
	{// run block
		//experiment setting
		let trialspec = {
			numtar: freq == 1 ? 60 : 10,
			duration: 900 * 1000,
			stopduration: stopduration,
			colorspeed: colorspeed,
			hitcb: function () { },
			facb: function () { },
			cond: (freq == 1 ? 'freq' : 'rare'),
		};
		if (expt.debug == 1) {
			trialspec.numtar /= 10; trialspec.duration /= 10;
		}

		await p_run_trial(trialspec, expt.responses);
	}
}



//entry point
async function start_expt() {

	d1 = add({ tag: 'div' });
	//	let param = parse_url_params();
	let param = {
		id: "test",
		freq_first: 1
	};



	if (!('id' in param) || !('freq_first' in param)) {
		let d2 = add({ ele: d1, tag: 'div', class: 'instructiondiv' });
		addhtml(d2, "\
            <h2>Sorry</h2>\
            Access denied.\
        ");
		await wait_forever();
		d2.remove();
	}


	let expt = {
		expt: 'vslab2020',
		datetimestr: get_datetime_str(),
		id: param.id,
		freq_first: param.freq_first, //0 is rare, 1 is freq
		debug: param.debug,
		responses: []
	};

	while(1){
		await do_expt(expt, expt.freq_first, 0);
		// await do_expt(expt, 1 - expt.freq_first, 1);
	}


	// d1.remove();
}