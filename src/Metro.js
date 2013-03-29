/*
 * METRONOME
 *
 * keeps tempo
 */

( function() {
	//create an audio context in the window
	//should do this in some future proof way
	window.audioContext = window.audioContext || new webkitAudioContext();
	var audioContext = window.audioContext;

	//some audio globals
	var sampleRate = audioContext.sampleRate;
	var bufferSize = 2048;
	var bufferTime = bufferSize / sampleRate;
	var samplesToSeconds = 1 / sampleRate;

	//the METRONOME object
	window.METRO = window.METRO || {};

	/**************************************************************************
	 BEATS
	 *************************************************************************/

	//the count of all of the beats of the metronome
	var beats = {
		"1n" : 0,
		"2n" : 0,
		"2t" : 0,
		"4n" : 0,
		"4t" : 0,
		"8n" : 0,
		"8t" : 0,
		"16n" : 0,
		"16t" : 0,
		"32n" : 0,
		"32t" : 0,
	}
	//translates the subdivisions of the measure into the strings
	var subdivisionToString = {
		1 : '1n',
		2 : '2n',
		3 : '2t',
		4 : '4n',
		6 : '4t',
		8 : '8n',
		12 : '8t',
		16 : '16n',
		24 : '16t',
		32 : '32n',
		48 : '32t',
	}

	/**************************************************************************
	 TEMPO and TIME SIGNATURE
	 *************************************************************************/

	//some default values
	var bpm = 120;
	var timeSignature = [4, 4];

	//the tatum is the smallest time increment;
	var tatum = 0;
	//the number of tatums in a measure
	var tatumsPerMeasure = (96 * timeSignature[0]) / timeSignature[1];

	//sets the tempo, either instantly or over a period of time
	METRO.setTempo = function(bpm, curveTime) {
		bpm = bpm;
		//set the clock (with the optional curveTime)
		var now = audioContext.currentTime;
		var curve = curveTime || 0;
		if(oscillator) {
			oscillator.frequency.value = (bpm / 60) * (tatumsPerMeasure / 4);
		}
	};
	//updates the time siganture
	METRO.setTimeSignature = function() {
		var args = Array.prototype.slice.call(arguments);
		if(args.length === 2) {
			timeSignature = [args[0], args[1]];
		} else if(args.length === 1) {
			var arr = args[0];
			if(arr.length === 2) {
				timeSignature = [arr[0], arr[1]];
			}
		}
		//updates the tatums per measure when the time sig changes
		tatumsPerMeasure = (96 * timeSignature[0]) / timeSignature[1];
		//update the oscillator
		METRO.setTempo(bpm);
	};
	//state is either 'counting', 'stopped', or 'paused'
	var state = 'stopped';

	/**************************************************************************
	 TICK
	 *************************************************************************/

	function tick(sampleTime) {
		//test the whole note case first
		if(tatum === 0) {
			var count = beats['1n'] = beats['1n'] + 1;
			var msg = new o.msg({
				address : "/metro/1n",
				data : count,
				timetag : sampleTime,
			})
		}
		//update each of the subdivisions
		var measurePosition = tatum / tatumsPerMeasure;
		var subdivisions = [2, 3, 4, 6, 8, 12, 16, 24, 32, 48];
		for(var i = 0, len = subdivisions.length; i < len; i++) {
			var sub = subdivisions[i];
			if(measurePosition * sub % 1 === 0) {
				var subString = subdivisionToString[sub];
				//increment the beat
				var count = beats[subString] = beats[subString] + 1;
				//shedule the o.msg for that beat
				var msg = new o.msg({
					address : "/metro/" + subString,
					data : count,
					timetag : sampleTime,
				})
				//roll back to 0 if it's reached the end of the measure
				//make an exception for 1n so that we have a measure counter
				if(count === sub && sub !== 1) {
					beats[subString] = 0;
				}
			}
		}
		//increment the tatum
		tatum++;
		if(tatum === tatumsPerMeasure) {
			tatum = 0;
		}
	}

	/**************************************************************************
	 OSCILLATOR
	 *************************************************************************/

	var oscillator;

	METRO.start = function(optionalBPM) {
		var tempoBPM = optionalBPM || bpm;
		var now = audioContext.currentTime;
		//create an oscillator at the right resolution
		oscillator = audioContext.createOscillator();
		//square wave
		oscillator.type = 1;
		//this.phase = 0;
		tatum = 0;
		//set bpm
		METRO.setTempo(tempoBPM);
		//connect the oscillator
		oscillator.connect(scriptNode);
		oscillator.noteOn(now);
		state = 'counting';
	};

	METRO.stop = function(when) {
		when = when | audioContext.currentTime;
		if(oscillator) {
			oscillator.noteOff(when);
			state = 'stopped';
		}
		//reset the beat counters
	};

	METRO.pause = function(when) {
		when = when | audioContext.currentTime;
		if(oscillator) {
			oscillator.noteOff(when);
			state = 'paused';
		}
	};
	/**************************************************************************
	 OSCILLATOR WATCHER
	 *************************************************************************/

	//the phase of the oscillator
	var phase = 0;
	//watch the oscillator
	var scriptNode = audioContext.createJavaScriptNode(bufferSize, 1, 1);
	scriptNode.connect(audioContext.destination);
	scriptNode.onaudioprocess = function(event) {
		if(state === 'counting') {
			//timing
			var playbackTime = event.playbackTime || audioContext.currentTime;
			//process samples
			var inputBuffer = event.inputBuffer.getChannelData(0);
			for(var i = 0, len = inputBuffer.length; i < len; ++i) {
				var sample = inputBuffer[i];
				if(sample > 0) {
					if(!phase) {
						var sampleTime = samplesToSeconds * i + playbackTime;
						tick(sampleTime);
						phase = 1;
					}
				} else {
					if(phase) {
						phase = 0;
					}
				}
			}
		}
	};
	//utility function for converting subdivisions to milliseconds
	subdivisionToMilliseconds = function(subdivisionString) {
		//remove the "n" from the end
		subdivisionString.substring(0, subdivisionString.length - 1);
		var subdivision = parseInt(subdivisionString);
		var beatToMS = (60 / this.get("bpm")) * (4 / subdivision) * 1000;
		return beatToMS;
	};
}());
