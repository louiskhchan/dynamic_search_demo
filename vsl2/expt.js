var colorspeed = 100 / 1000;
var ttlab = ['color', 'ori'];
var orifirstlab = ['colorfirst', 'orifirst'];

var d1;

/**@param { {context:CanvasRenderingContext2D}} c */
async function run_trial(c, trialspec, responses) {
	let [cp, cx, cy, cw, ch, context] = [c.cp, c.cx, c.cy, c.cw, c.ch, c.context];
	context.clearRect(0, 0, cw, ch);
	await wait_timeout(500);
	context.save();

	//set items
	let ncol = 6;
	let nrow = 4;
	let tablew = 65 / 5 * 7 * cp;
	let tableh = 65 * cp;
	let itemw = 1.5 * cp;
	let itemh = 4.5 * cp;
	let items = [];
	for (let r = 0; r < nrow; r++)
		for (let c = 0; c < ncol; c++)
			items.push({
				r: r,
				c: c,
				curhue: [rand_hue(), rand_hue()],
				nexthue: [rand_hue(), rand_hue()],
				lastarrivetime: [0, 0]
			});
	//set target
	let target = [
		[],
		[]
	];
	let tarsperiod = trialspec.duration - trialspec.stopduration - 360 / trialspec.colorspeed;

	// //allow overlap
	// for (let tt = 0; tt < 2; tt++) {
	//     let tarperiod = tarsperiod / trialspec.numtar[tt];
	//     for (let i = 0; i < trialspec.numtar[tt]; i++) {
	//         target[tt].push({
	//             scheduledtime: i * tarperiod + rand_between(0, tarperiod)
	//         });
	//     }
	// }
	{ //no overlap
		let tts = [];
		for (let tt = 0; tt < 2; tt++)
			for (let i = 0; i < trialspec.numtar[tt]; i++)
				tts.push(tt);
		shuffle(tts);
		let tarperiod = tarsperiod / tts.length;
		for (let i = 0; i < tts.length; i++) {
			target[tts[i]].push({
				scheduledtime: i * tarperiod + rand_between(0, tarperiod)
			});
		}
	}

	let nexttari = [0, 0];
	let curtar = [null, null];

	//response monitor
	let onresponse = function (e) {
		e.preventDefault();
		let ts = e.timeStamp;
		let tt;
		if (e.code == 'KeyZ') tt = 0;
		else if (e.code == 'Slash') tt = 1; //BUG: WAS e.code='Slash'
		else return;
		if (curtar[tt] !== null && 'state' in curtar[tt]) {
			if (!('detected' in curtar[tt])) {
				curtar[tt].detected = true;
				curtar[tt].detectiontime = ts;
				if (curtar[tt].state == 'entered') curtar[tt].detectiontype = 'premature';
				else if (curtar[tt].state == 'arrived') curtar[tt].detectiontype = 'hit';
				else if (curtar[tt].state == 'departing') curtar[tt].detectiontype = 'late';
			}
		} else {
			responses.push({
				cond: trialspec.cond,
				tt: tt,
				type: 'fa',
				arrivetime: null,
				detectiontime: ts,
				rt: null
			});
		}
	};
	let listenman = new ListenerManager();
	listenman.add(document.body, 'keydown', onresponse);

	//trial loop
	let frame_interval = await estimate_frame_interval();
	let starttime = await wait_frame_out();
	let now = starttime;
	while (now < starttime + trialspec.duration) {
		context.clearRect(0, 0, cw, ch);
		context.save();
		//draw items
		for (let item of items) {
			let itempos = [cx + tablew * (-.5 + (item.c + .5) / ncol), cy + tableh * (-.5 + (item.r + .5) / nrow)];
			context.strokeStyle = chroma.lch(lightness, sat, loop_hue(item.curhue[0] + tarhue));
			context.lineWidth = itemw;
			context.stroke(path_line(...itempos, deg2rad(loop_hue(item.curhue[1] + tarori) / 2), itemh));
			for (let tt = 0; tt < 2; tt++) {
				//update hue for next frame
				if (item.curhue[tt] == item.nexthue[tt]) {
					//already arrived, waiting to depart
					if (now < item.lastarrivetime[tt] + trialspec.stopduration) {
						//do nothing
					} else {
						item.nexthue[tt] = rand_hue();
					}
				} else {
					if (advance(item, tt, trialspec.colorspeed * frame_interval)) {
						//just arrived
						item.lastarrivetime[tt] = now;

					} else {
						//normal advance
					}
				}
			}
		}
		//set target
		for (let tt = 0; tt < 2; tt++) {
			if (nexttari[tt] < trialspec.numtar[tt] && now - starttime > target[tt][nexttari[tt]].scheduledtime && curtar[tt] === null) {
				curtar[tt] = target[tt][nexttari[tt]];
				//randomly pick an item as target
				curtar[tt].item = items[rand_int_between(0, items.length)];
				curtar[tt].item.nexthue[tt] = 0;
				nexttari[tt]++;
			}
			//process target stage change
			if (curtar[tt] !== null) {
				let taritem = curtar[tt].item;
				if ('state' in curtar[tt]) {
					if (curtar[tt].state == 'entered') {
						if (taritem.curhue[tt] == 0) {
							curtar[tt].arrivetime = now;
							curtar[tt].state = 'arrived';
						}
					} else if (curtar[tt].state == 'arrived') {
						if (taritem.curhue[tt] != 0) {
							curtar[tt].state = 'departing';
						}
					} else if (curtar[tt].state == 'departing') {
						if (outside_tar_range(taritem.curhue[tt])) {
							if ('detected' in curtar[tt]) {
								responses.push({
									cond: trialspec.cond,
									tt: tt,
									type: curtar[tt].detectiontype,
									arrivetime: curtar[tt].arrivetime,
									detectiontime: curtar[tt].detectiontime,
									rt: curtar[tt].detectiontime - curtar[tt].arrivetime
								});
							} else {
								responses.push({
									cond: trialspec.cond,
									tt: tt,
									type: 'miss',
									arrivetime: curtar[tt].arrivetime,
									detectiontime: null,
									rt: null
								});
							}
							curtar[tt] = null;
						}
					}
				} else {
					//no state implies travelling
					if (!outside_tar_range(taritem.curhue[tt])) {
						curtar[tt].entertime = now;
						curtar[tt].state = 'entered';
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
async function do_expt(expt, orimore, blocki) {
	{ // expt
		{
			let d1upper = add({ ele: d1, tag: 'div', class: 'instructiondiv' });
			addhtml(d1upper, `
			<h2>Target-rate effect in continuous visual search</h2>
			<h3>Online demo of Figure 3</h3>
			<p->This is an online demo of the stimulus used in Experiment 2.</p->
			<p->In Experiment 2, the participant needs to find a color target and an orientation target in the same time.</p->
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
			numtar: [35, 35],
			cond: 'equalrate',
			duration: 15 * 60 * 1000,
			stopduration: 2 * 1000,
			colorspeed: colorspeed,
		};
		await p_run_trial(trialspec, expt.responses);
	} //end expt
}


//entry point
async function start_expt() {
	d1 = add({ tag: 'div' });

	//    let param = parse_url_params();
	let param = {
		id: "test",
		orifirst: 1
	};

	if (!('id' in param) || !('orifirst' in param)) {
		let d2 = add({ ele: d1, tag: 'div', class: 'instructiondiv' });
		addhtml(d2, "\
            <h2>Sorry</h2>\
            Access denied.\
        ");
		await wait_forever();
		d2.remove();
	}

	let expt = {
		expt: 'color2',
		datetimestr: get_datetime_str(),
		id: param.id,
		orifirst: param.orifirst,
		debug: param.debug,
		responses: []
	};

	while(1){
		await do_expt(expt, expt.orifirst, 0);
	}


	d1.remove();
}