const files = [
	{ name: "mutt", url: "mutt.mp3" },
];

let channels = [];
const channelsContainer = document.getElementById("channels")

const startBtn = document.querySelector(".startBtn");

startBtn.addEventListener("click", async () => {
	await Tone.start();
	console.log("Audio context started.");

	startBtn.disabled = true;
	setupPlayers();
});

let pInstance;

function setupPlayers() {
	files.forEach((file, i) => {
		const player = new Tone.Player({
			url: file.url,
			loop: true,
			autostart: true,
		});

		Tone.Listener.positionX.value = 0;
		Tone.Listener.positionY.value = 0;
		Tone.Listener.positionZ.value = 0;
		Tone.Listener.forwardX.value = 0;
		Tone.Listener.forwardY.value = 0;
		Tone.Listener.forwardZ.value = -1;
		Tone.Listener.upX.value = 0;
		Tone.Listener.upY.value = 1;
		Tone.Listener.upZ.value = 0;

		const panner = new Tone.Panner3D({
			panningModel: "HRTF",
			distanceModel: "inverse",
			positionX: 0,
			positionY: 0,
			positionZ: 1,
		})

		const pitchShift = new Tone.PitchShift(0);

		const gain = new Tone.Gain(1).toDestination();

		// analyser node
		const analyser = new Tone.Analyser("fft", 256);

		player.connect(pitchShift);
		pitchShift.connect(panner);
		panner.connect(analyser);
		analyser.connect(gain)

		const channel = { player, pitchShift, panner, gain, analyser, name: file.name, muted: false };
		channels.push(channel);

		createChannelUI(channel, i);
	});
}

function createChannelUI(channel, index) {
	const div = document.createElement("div");
	div.className = "channel";

	const title = document.createElement("h3");
	title.textContent = channel.name;

	const muteBtn = document.createElement("button");
	muteBtn.textContent = "Mute";
	muteBtn.onclick = () => {
		channel.muted = !channel.muted;
		channel.gain.gain.rampTo(channel.muted ? 0 : channel._targetVol || 1);
		muteBtn.classList.toggle("active", channel.muted);
		muteBtn.textContent = channel.muted ? "Unmute" : "Mute";
	};

	// --- Volume Control ---
	const volLabel = document.createElement("label");
	volLabel.textContent = "Volume";

	const volumeSlider = document.createElement("input");
	volumeSlider.type = "range";
	volumeSlider.min = 0;
	volumeSlider.max = 1;
	volumeSlider.step = 0.01;
	volumeSlider.value = 1;
	volumeSlider.oninput = (e) => {
		const val = parseFloat(e.target.value);
		channel._targetVol = val;
		if (!channel.muted) {
			channel.gain.gain.rampTo(val, 0.1);
		}
	};


	div.append(title, muteBtn, volumeSlider, volLabel);
	channelsContainer.appendChild(div);
}

// 🎹 Spacebar event: randomize channel params + gradient
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();

    // Randomize all channels
    channels.forEach((channel) => {
      // Random volume (0.1–1)
      const newVol = Math.random() * 0.9 + 0.1;
      channel._targetVol = newVol;
      if (!channel.muted) channel.gain.gain.rampTo(newVol, 0.2);

			// Update the **volume slider visually**
      const volumeSlider = channelsContainer
        .querySelectorAll(".channel")[channels.indexOf(channel)]
        .querySelector("input[type=range]");
      if (volumeSlider) volumeSlider.value = newVol;

      // Random playback rate (0.5–2)
      channel.player.playbackRate = 0.5 + Math.random() * 1.5;

      // Random pitch (-5 to +5 semitones)
      channel.pitchShift.pitch = Math.random() * 10 - 5;

      // Random panning (-4 to +4)
      channel.panner.positionX.value = Math.random() * 8 - 4;
    });

    // Randomize gradient colors
    const randColor = () =>
      `hsl(${Math.floor(Math.random() * 360)}, ${70 + Math.random() * 20}%, ${
        40 + Math.random() * 20
      }%)`;

    const colorA = randColor();
    const colorB = randColor();

    // Store colors for p5 draw loop to use
    if (pInstance) {
      pInstance.gradientA = colorA;
      pInstance.gradientB = colorB;
    }

    console.log("🔀 Randomized all channels + gradient!");
  }
});

//
// 🎨 Basic p5.js canvas setup
//
let font;
let points = [];
let txt = "T I M E";
let txtX = 0, txtY = 250;
let fontSize = 120;
let maxSize = 15;
let speed = 2;
pInstance = new p5((p) => {

	p.preload = () => {
		font = p.loadFont("Roboto-Regular.ttf");
	}

	p.setup = () => {
		const cnv = p.createCanvas(500, 500);
		cnv.parent("p5-holder");
		p.rectMode(p.CENTER);
		p.angleMode(p.DEGREES);
		txtX = p.width/2;
  	txtY = p.height/2;
	};

	p.mouseMoved = () => {
		if (channels.length) {
			// 
			channels.forEach((channel, index) => {
				if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
					channels[index].player.playbackRate = p.map(p.mouseX, 0, p.width, 0.5, 2);
					channels[index].pitchShift.pitch = -1 * p.map(p.mouseY, 0, p.height, -5, 5); // invert because p canvas y-axis
					// channels[index].panner.positionX.value = p.map(p.mouseX, 0, p.width, -2,2);

					const normalizedX = p.map(p.mouseX, 0, p.width, -1, 1); // -1 = far left, +1 = far right
					const normalizedY = p.map(p.mouseY, 0, p.height, 1, -1); // flip Y so top = positive
					channels[index].panner.positionX.value = normalizedX * 2; // narrower range = tighter stereo field
					channels[index].panner.positionY.value = normalizedY * 1; // subtle up/down
					channels[index].panner.positionZ.value = 1 - Math.abs(normalizedX) * 0.3; // keep mostly in front
				}
			})
		}
	}

	p.draw = () => {
		// p.background(80);
		// Draw background gradient
		const c1 = p.color(p.gradientA || "#333");
		const c2 = p.color(p.gradientB || "#111");

		for (let y = 0; y < p.height; y++) {
			const inter = p.map(y, 0, p.height, 0, 1);
			const c = p.lerpColor(c1, c2, inter);
			p.stroke(c);
			p.line(0, y, p.width, y);
		}

		// p.background(80);

		p.noStroke();

		// Draw a few moving circles for base song
		if (channels.length) {
			const fftValues = channels[0].analyser.getValue();
			// Get average of low frequencies (~bass)
			// Lower indices = lower frequencies
			const bassBins = fftValues.slice(0, 40); // ~20 lowest bins
			const bassLevel = bassBins.reduce((sum, v) => sum + Math.abs(v), 0) / bassBins.length;
			const rawBass = bassBins.reduce((sum, v) => sum + Math.abs(v), 0) / bassBins.length;


			// Base square size (driven by bass)
			// Normalize bass into 0..1 (tweak 'maxBass' to taste)
			const maxBass = 0.6; // adjust if your signal is louder/quieter
			const bassNorm = p.constrain(rawBass / maxBass, 0, 1);
			const baseSize = p.lerp(40, 220, bassNorm); // 40 -> 220 px depending on bass

			// Get pan value (source code maps p.mouseX -> panner.positionX.value elsewhere)
			// We assume panner positionX is in roughly [-2, 2]; tune maxPan if different
			const pan = channels[0].panner.positionX.value;
			const maxPan = 2; // maximum absolute panner X you expect
			const panNorm = p.constrain(pan / maxPan, -1, 1); // -1 .. 1

			// Horizontal stretch amount based on absolute pan
			const maxStretch = baseSize * 1.5; // how much extra width at full pan
			const extraWidth = Math.abs(panNorm) * maxStretch;

			// Final rectangle width/height (height stays baseSize to remain square-ish)
			const rectW = baseSize + extraWidth;
			const rectH = baseSize;

			// Center position on the canvas
			const centerX = p.width / 2;
			const centerY = p.height / 2;

			// To bias the stretch toward left or right, shift the drawn center
			// If pan < 0 (left), move center left by half of the extraWidth so the rect stretches to the left.
			// If pan > 0 (right), move center right by half of the extraWidth to bias to the right.
			const biasX = (panNorm < 0 ? -1 : 1) * (extraWidth / 2) * Math.abs(panNorm);
			const drawX = centerX + biasX;

			// Draw the main reactive rectangle
			p.push();
			p.rectMode(p.CENTER);
			p.stroke(255);
			p.noFill();
			p.strokeWeight(2);
			p.rect(drawX, centerY, rectW, rectH);
			p.pop();

			p.noStroke();
			p.strokeWeight(1);
			for (let i = 0; i < 5; i++) {
				const x = (p.width / 5) * i + (Math.sin(p.frameCount * 0.02 + i) * 30);
				const y = p.height / 2 + Math.sin((channels.length ? channels[0].player.playbackRate : 1) * p.frameCount * 0.05 + i) * 50;
				p.fill(150 + i * 20, 100, 200);
				p.ellipse(x, y, 30 + 10 * Math.sin(p.frameCount * 0.1 + i), p.map(channels[0].pitchShift.pitch, -5, 5, 10, 50));
			}


			// Text points
			computePoints(0.06);
			p.stroke(255);
			p.fill(pInstance.gradientA || 0);
			let d = 0;
			let shift = 0;
			for(let i=0; i<points.length; i++) {
				shift = p.dist(p.mouseX, p.mouseY, points[i].x, points[i].y);
				d = maxSize * p.sin(speed * p.frameCount + shift);
				p.circle(points[i].x, points[i].y, p.map(shift, 0, p.width,0,d));
			}
		}
	};

	function computePoints(factor) {
		if (!font) {
			console.log('no font loaded')
			return;
		} else {
			// console.log(font)
		}
		points = font.textToPoints(txt, txtX, txtY, fontSize, {
			sampleFactor: factor || 0.1
		})
		let bounds = font.textBounds(txt, txtX, txtY, fontSize);
		for(let i=0; i<points.length; i++) {
			let p = points[i];
			p.x = p.x - (bounds.x - txtX + bounds.w/2);
			p.y = p.y + (bounds.h/2);
		}
	}
});