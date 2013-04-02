Metro.js uses MSG.js to create a metronome for Web Audio. 

Features: 
- Count up to 32nd triplets
- Any tempo and time signature. 
- Callbacks always happen before the beat and have the exact timetag of the beat 

Metro.js has one dependecy: MSG.js (a small library for audio-rate scheduling).

https://github.com/tambien/MSG.js

# Basic Usage

Use the 'start' method to start ticking with optional arguments
```javascript
//these are the default values
METRO.start({
	bpm : 120,
	timeSignature : [4,4],
	//specifies which subdivisions the metronome should tick on 
	subdivisions : ['1n', '4n', '8n'],
});
``` 
On every tick, the metronome will schedule a MSG. Use MSG.route to listen to these messages.
```javascript
MSG.route("/metro/4n", function(msg){
	//get the relevant data from the msg
	var beatCount = msg.data;
	var beatTime = msg.timetag;
});
MSG.route("/metro/1n", function(msg){
	var measureNumber = msg.data;
	var measureTime = msg.timetag;
});
``` 

# Subdivisions

For duple subdivisions use 'n' at the end of the number such as '8n' for a straight eighth note. 
Metro.js can also handle triplet subdivisions using 't' notation. For example, '4t' is a quarter note triplet.