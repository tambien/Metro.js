Metronome.js creates a metronome with the Web Audio API. It uses the odot.js library to issue callbacks on metronome ticks. 
Add a listener to one of the beats to recieve an o.msg with the precise timetag of the beat.  


Features: 
- up to 32nd duples and triplets.
- Any tempo, and time signature. 
- Callbacks always happen before the beat

Uses odot.js for message scheduling. 