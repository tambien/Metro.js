/*
 * METRONOME
 *
 * keeps tempo
 */

( function() {

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

	//the durations of all the beats
	var beatDurations = {
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

	//the durations of all the beats
	var beatsPerMeasure = {
		"1n" : 1,
		"2n" : 2,
		"2t" : 3,
		"4n" : 4,
		"4t" : 6,
		"8n" : 8,
		"8t" : 12,
		"16n" : 16,
		"16t" : 24,
		"32n" : 32,
		"32t" : 48,
	}

	//translates the subdivisions of the measure into the strings
	var subdivisionStrings = {
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

	//the default subdivisions which the metronome tics on
	var subdivisions = ["1n", '4n'];

	/**************************************************************************
	 TEMPO and TIME SIGNATURE
	 *************************************************************************/

	//some default values
	var bpm = 120;
	var timeSignature = [4, 4];

	//sets the tempo, either instantly or over a period of time
	function setTempo(bpm) {
		var timeSigRatio = timeSignature[0] / timeSignature[1];
		var measureInSeconds = (60 / bpm) * 4 * timeSigRatio;
		//set the durations of all the subdivisions
		for(subdivision in subdivisionStrings) {
			var sub = subdivisionStrings[subdivision];
			var BperM = beatsPerMeasure[sub];
			var subTime = measureInSeconds / BperM;
			beatDurations[sub] = subTime;
		}
		console.log(beatDurations);
	};

	//updates the time siganture
	function setTimeSignature(timeSig) {
		timeSignature = timeSig;
		//update the beats per measure object
		for(subdivision in subdivisionStrings) {
			//don't count 1n since that's always 1
			if(subdivision !== '1') {
				var beatCount = parseInt(subdivision * (timeSig[0] / timeSig[1]));
				beatsPerMeasure[subdivisionStrings[subdivision]] = beatCount;
			}
		}
	};

	//state is either 'counting', 'stopped', or 'paused'
	var state = 'stopped';

	/**************************************************************************
	 ECHO
	 *************************************************************************/

	//this function schedules a new message when one is recieved
	function echo(msg) {
		//get the subdivision from the address
		var sub = msg.address.split("/")[2];
		//increment the counter
		var count = msg.data + 1;
		//roll over when the counter has reached it's max
		if(sub !== '1n') {
			var max = beatsPerMeasure[sub];
			count = count % max;
		}
		//get the next beat time
		var nextTime = msg.timetag + beatDurations[sub];
		//schedule the new msg
		var msg = new o.msg({
			address : msg.address,
			timetag : nextTime,
			data : count,
		})
	}

	/**************************************************************************
	 CONTROLS
	 *************************************************************************/

	METRO.start = function(args) {
		args = args || {};
		var tempo = args.bpm || bpm;
		var timeSig = args.timeSignature || timeSignature;
		var subdivision = args.subdivision || subdivisions;
		setTimeSignature(timeSig);
		setTempo(tempo);
		//set the state
		state = 'counting';
		//schedule the first messages
		var now = audioContext.currentTime;
		for(var s = 0; s < subdivision.length; s++) {
			var sub = subdivision[s];
			var msg = new o.msg({
				address : "/metro/" + sub,
				timetag : now,
				//starts with a count of 0
				data : 0,
			})
		}
		//add the msg listener
		o.route("/metro/*", echo);
	};

	METRO.stop = function(when) {

	};

	METRO.pause = function(when) {

	};
}());
