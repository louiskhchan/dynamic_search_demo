var stopduration = 2000;
var colorspeed = 100 / 1000;

var d1;

async function do_upload(expt) {
	let upload_result;

	let d1upper = add({ ele: d1, tag: 'div', class: 'instructiondiv' });
	//display result summary
	{
		addhtml(d1upper, "<h3>你的實驗結果:</h3>");
		let formatnum = function (n) {
			if (typeof (n) == 'number') return n.toFixed(0);
			else return '--';
		};

		let summary = expt.summary.results;
		let summarytable = {
			'頻密': {
				'反應時間': formatnum(summary.freq_hitrt) + '毫秒',
				'成功率': formatnum(summary.freq_hitrate * 100) + '%',
				'錯誤回應': formatnum(summary.freq_fa)
			},
			'稀疏': {
				'反應時間': formatnum(summary.rare_hitrt) + '毫秒',
				'成功率': formatnum(summary.rare_hitrate * 100) + '%',
				'錯誤回應': formatnum(summary.rare_fa)
			}
		};

		let table = addtable(d1upper, summarytable);
	}
	//upload data
	for (; ;) {
		addhtml(d1upper, '<h2>正在上載數據...</h2>');
		upload_result = await upload({
			url: 'receive.php',
			body: JSON.stringify(expt)
		});
		if (upload_result.success) {
			addhtml(d1upper, "<h2>上載完成！謝謝你參與這實驗。</h2>");
			await wait_forever();
		} else {
			addhtml(d1upper, "<h2>上載失敗。請檢查連線，然後再試一次</h2>");
			let but = add({ ele: d1upper, tag: 'button', text: '再試一次' });
			await wait_event({ ele: but, type: 'click' });
		}
		d1upper.remove();
	}
}

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
	let canvas = add({ ele: d1, tag: 'canvas', style: 'width:100vw;height:100vh;position:absolute;cursor:none;background-color:' + chroma.lch(lightness, 0, 0) + ';' });

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
		<h2>實驗：第${(blocki + 1)}部份</h2>
		<h3>做法</h3>
		<p->這個實驗中，你會看到一些不同顏色的圓點在變色。 </p->
		<p->你需要留意有沒有這種<b>綠色</b>: <span style='background-color:${chroma.lch(lightness, sat, tarhue)};'>&nbsp;&nbsp;&nbsp;&nbsp;</span>。每當你看見它，請按一次<key->space</key-> 鍵。</p->
		其他顏色，例如：
		<span style='background-color:${chroma.lch(lightness, sat, tarhue - 2 * huezone)};'>&nbsp;&nbsp;&nbsp;&nbsp;</span>
		<span style='background-color:${chroma.lch(lightness, sat, tarhue - huezone)};'>&nbsp;&nbsp;&nbsp;&nbsp;</span>
		<span style='background-color:${chroma.lch(lightness, sat, tarhue + huezone)};'>&nbsp;&nbsp;&nbsp;&nbsp;</span>
		<span style='background-color:${chroma.lch(lightness, sat, tarhue + 2 * huezone)};'>&nbsp;&nbsp;&nbsp;&nbsp;</span>
		，都不算是綠色。如果你沒有看見綠色，請不要按鍵。</p->
		<h3>注意</h3>
		<p->這部份需時15分鐘。</p->
		<p->在這部份中，綠色會出現得比較<b>${freq == 1 ? "頻密" : "稀疏"}</b>。</p->
		<p->反應速度和準確度是<b>同樣重要</b>的。</p->
		<br>
		`);

		let trybut = add({ ele: d1upper, tag: 'button', text: '開始' });
		trybut.focus();
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

//analyze data
function do_analysis(expt) {
	//variable for condition summaries 
	let conds = { freq: {}, rare: {} };
	for (let key in conds) {
		let cond = conds[key];
		let responses = expt.responses.filter(response => response.cond == key);
		let hits = responses.filter(response => response.type == 'hit');
		cond.hit = hits.length;
		cond.hitrt = 0;
		for (let response of hits) cond.hitrt += response.rt;
		cond.hitrt /= cond.hit;
		cond.miss = responses.filter(response => response.type == 'miss').length;
		cond.fa = responses.filter(response => response.type == 'fa').length;
	}

	//summary, each key each file. define between subj var first
	let summary = {
		results: {
			id: expt.id,
			freq_first: expt.freq_first
		}
	};
	//for each condition, calc subj accumulated data to summary
	for (let key in conds) {
		let cond = conds[key];
		summary.results[key + "_hitrt"] = cond.hitrt;
		summary.results[key + "_hitrate"] = cond.hit / (cond.hit + cond.miss);
		summary.results[key + "_missrate"] = cond.miss / (cond.hit + cond.miss);
		summary.results[key + "_fa"] = cond.fa;
	}
	//output
	expt.summary = summary;
}

/** 0 is rare, 1 is freq 
 * @returns {Promise<void>} */
async function do_practice(expt) {
	{
		let d1upper = add({ ele: d1, tag: 'div', class: 'instructiondiv mediumfont', style: 'padding-top:20px' });
		addhtml(d1upper, `
    <h2>練習</h2>
    <p->首先，我們先練習一下這個實驗。</p->
    <p->這個實驗中，你會看到一些不同顏色的圓點在變色。 </p->
    <p->你需要留意有沒有這種<b>綠色</b>: <span style='background-color:${chroma.lch(lightness, sat, tarhue)};'>&nbsp;&nbsp;&nbsp;&nbsp;</span>。每當你看見它，請按一次<key->space</key-> 鍵。</p->
    其他顏色，例如：
	<span style='background-color:${chroma.lch(lightness, sat, tarhue - 2 * huezone)};'>&nbsp;&nbsp;&nbsp;&nbsp;</span>
	<span style='background-color:${chroma.lch(lightness, sat, tarhue - huezone)};'>&nbsp;&nbsp;&nbsp;&nbsp;</span>
	<span style='background-color:${chroma.lch(lightness, sat, tarhue + huezone)};'>&nbsp;&nbsp;&nbsp;&nbsp;</span>
	<span style='background-color:${chroma.lch(lightness, sat, tarhue + 2 * huezone)};'>&nbsp;&nbsp;&nbsp;&nbsp;</span>
	，都不算是綠色。如果你沒有看見綠色，請不要按鍵。</p->
    <halfem-></halfem->
    `);

		//set up canvas
		let canvas = add({ ele: d1upper, tag: 'canvas', style: 'width:100%;height:100%;border:2px solid darkgrey;border-radius:5px;cursor:none;background-color:' + chroma.lch(lightness, 0, 0) + ';' });

		let d1lower = add({ ele: d1upper, tag: 'div', style: 'width:100%;font-size: medium;' });
		let feedback = add({ ele: d1lower, tag: 'p-' });
		feedback.innerHTML = "<p->如果明白上述做法，請按<key->space</key->鍵開始練習。是次練習約長半分鐘。</p->";

		//set up canvas and get context
		let c = expt_setup_canvas(canvas, 'none');
		let [cp, cx, cy, cw, ch, context] = [c.cp, c.cx, c.cy, c.cw, c.ch, c.context];

		//specify correct and incorrect callback for practice feedback
		let hitcb = function () { feedback.innerHTML += '正確。'; };
		let facb = function () { feedback.innerHTML += '錯誤。'; };

		//experiment loop
		let trialspec = {
			numtar: 3,
			duration: 30000,
			stopduration: stopduration,
			colorspeed: colorspeed,
			hitcb: hitcb,
			facb: facb,
			cond: 'practice'
		};
		let responses = [];

		let ndone = 0;
		let miss = 2;
		let fa = 2;
		while (miss > 0 || fa > 0) {
			if (ndone > 0) {
				let html = "不夠準確。<b>你";
				if (miss > 0) html += "錯過了" + miss + "次";
				if (miss > 0 && fa > 0) html += "，";
				if (fa > 0) html += "多按了" + fa + "次";
				html += "。</b>請再練習一次。";
				html += "<p->按<key->space</key->鍵繼續。</p->";
				feedback.innerHTML = html;
			}
			ndone++;
			while ((await wait_event({ type: 'keydown' })).code != 'Space');
			feedback.innerHTML = "";
			responses = [];
			await run_trial(c, trialspec, responses);
			miss = responses.filter(response => (response.type == 'miss')).length;
			fa = responses.filter(response => (response.type == 'fa')).length;
		}

		//good job
		feedback.innerHTML = `做得好。現在進入實驗環節。按<key->space</key->鍵繼續。</p->`;
		while ((await wait_event({ type: 'keydown' })).code != 'Space');

		//remove welcome canvas
		feedback.remove();
		d1upper.remove();
		canvas.remove();
		d1lower.remove();
	}
	{ //starting instruction
		let d1upper = add({ ele: d1, tag: 'div', class: 'instructiondiv' });
		addhtml(d1upper, `
		<h2>實驗</h2>
		<p->
		本實驗總共有2部份，為時約30分鐘。在每一部份之間，你可以先休息一下才繼續。</p-><p->
		請確保這段時間不會受外界騷擾。</p-><p->
		在實驗結束前，請不要離開全螢幕模式。	
		</p->
		`);

		let trybut = add({ ele: d1upper, tag: 'button', text: '繼續' });
		trybut.focus();
		await wait_event({ ele: trybut, type: 'click' });
		d1upper.remove();
	}

}

//show welcome screen
async function do_welcome(expt) {
	let d2 = add({ ele: d1, tag: 'div', class: 'instructiondiv' });
	addhtml(d2, `
    <h1>浸大心理</h1>
    <h2>視覺認知研究</h2>
    <h3>實驗編號: COLOR1</h3>
    <br>
    請用鍵盤按 <key->space</key-> 開始
    <br>
    <br>
    請注意：現在即將進入全螢幕。在未完成實驗前，請<b>不要離開</b>全螢幕模式。
        `);

	//press space
	let space_event;
	while ((space_event = await wait_event({ type: 'keydown' })).code != 'Space');
	d2.remove();

	//check if response timing correct
	if (Math.abs(space_event.timeStamp - performance.now()) > 1000) {
		let d2 = add({ ele: d1, tag: 'div', class: 'instructiondiv' });
		addhtml(d2, `
            <h2>Sorry</h2>
            This computer is not supported. Please try another computer.
        `);
		await wait_forever();
	}

	//save timing diagnostics
	expt.timing_diag = {
		keydown_ts: space_event.timeStamp,
		perfnow_ts: performance.now(),
		frameout_ts: await wait_frame_out()
	};

	//go full screen
	d1.classList.add('full');
	let fullscreenok = await openFullscreen();
	if (!fullscreenok) {
		addhtml(b1, "<br><br><span style='color:darkred;'>Sorry. Can't enter fullscreen on your computer.</span>");
		wait_forever();
	}

}

//consent form
async function consent_form(expt) {
	let html = '<h1>實驗同意書</h1><h2>Hong Kong Baptist University</h2> <h2>CONSENT TO PARTICIPATE IN RESEARCH</h2> <h3>Human performance in dynamic visual search</h3>  <p>You are invited to participate in a research study conducted by Louis Chan from the Psychology Unit of the Hong Kong Baptist University. The aim of this research is to study the characteristics of human performance in real-life visual search. This experiment will be a computer-based task, in which you monitor for a particular color in a number of color-changing circles. You will make your responses by using a computer keyboard. The whole experiment will last for about 30 minutes.</p>  <p>This experiment should not cause any psychological or physical hazard to you. In order to minimize fatigue or discomforts, you are advised to take short breaks between the two experimental blocks.</p> <p>Your participation is voluntary. If you decide to participate, you are free to withdraw at any time. Upon completion of the experiment, you will receive a monetary compensation of HK$50. </p><p>Any personal information obtained in this study will remain confidential. Data recorded in the experiment will be used for research purposes only. </p>  <h2>QUESTIONS AND CONCERNS</h2> <p>If you have any questions or concerns about this research, please feel free to contact Louis Chan by email (clouis@hkbu.edu.hk) or by phone (3411-3063). If you have questions about your rights as a research participant, please contact Research Ethics Committee by email (hkbu_rec@hkbu.edu.hk) or by mail to Graduate School, Hong Kong Baptist University, Kowloon Tong, Hong Kong.</p>  <h2>DECLARATION</h2> <p>I understand the procedures described above and agree to participate in this study.</p><p> <button id="consentbut">AGREE</button>  </p>';
	let d1upper = add({ ele: d1, tag: 'div', class: 'instructiondiv mediumfont' });
	addhtml(d1upper, html);
	await wait_event({ ele: document.getElementById("consentbut"), type: 'click' });
	d1upper.remove();
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

	// await do_welcome(expt);
	// await consent_form(expt);
	// await do_practice(expt);
	await do_expt(expt, expt.freq_first, 0);
	// await do_expt(expt, 1 - expt.freq_first, 1);

	// //leave fullscreen
	// expt.leavefullscreenok = await closeFullscreen();
	// do_analysis(expt);

	// //upload
	// await do_upload(expt);

	// d1.remove();
}