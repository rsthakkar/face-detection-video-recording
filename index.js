const mediaSelector = document.getElementById("media");

const webCamContainer =
	document.getElementById("web-cam-container");

let selectedMedia = null;
let model;
let interval;
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

// This array stores the recorded media data
let chunks = [];

// Handler function to handle the "change" event
// when the user selects some option
mediaSelector.addEventListener("change", (e) => {

	// Takes the current value of the mediaSeletor
	selectedMedia = e.target.value;

	document.getElementById(
		`${selectedMedia}-recorder`)
		.style.display = "block";

	document.getElementById(
		`${otherRecorderContainer(
			selectedMedia)}-recorder`)
		.style.display = "none";
});

function otherRecorderContainer(
	selectedMedia) {

	return selectedMedia === "vid" ?
		"aud" : "vid";
}

// This constraints object tells
// the browser to include only
// the audio Media Track
const audioMediaConstraints = {
	audio: true,
	video: false,
};

// This constraints object tells
// the browser to include
// both the audio and video
// Media Tracks
const videoMediaConstraints = {

	// or you can set audio to
	// false to record
	// only video
	audio: true,
	video: {width: 600, height: 400},
};

// When the user clicks the "Start
// Recording" button this function
// gets invoked
function startRecording(
	thisButton, otherButton) {

	// Access the camera and microphone
	navigator.mediaDevices.getUserMedia(
		selectedMedia === "vid" ?
			videoMediaConstraints :
			audioMediaConstraints)
		.then((mediaStream) => {

			// Create a new MediaRecorder instance
			const mediaRecorder =
				new MediaRecorder(mediaStream);

			//Make the mediaStream global
			window.mediaStream = mediaStream;
			//Make the mediaRecorder global
			window.mediaRecorder = mediaRecorder;

			mediaRecorder.start();

			// Whenever (here when the recorder
			// stops recording) data is available
			// the MediaRecorder emits a "dataavailable"
			// event with the recorded media data.
			mediaRecorder.ondataavailable = (e) => {

				// Push the recorded media data to
				// the chunks array
				chunks.push(e.data);
			};

			// When the MediaRecorder stops
			// recording, it emits "stop"
			// event
			mediaRecorder.onstop = () => {

				/* A Blob is a File like object.
				In fact, the File interface is
				based on Blob. File inherits the
				Blob interface and expands it to
				support the files on the user's
				systemThe Blob constructor takes
				the chunk of media data as the
				first parameter and constructs
				a Blob of the type given as the
				second parameter*/
				const blob = new Blob(
					chunks, {
					type: selectedMedia === "vid" ?
						"video/mp4" : "audio/mpeg"
				});
				chunks = [];

				// Create a video or audio element
				// that stores the recorded media
				const recordedMedia = document.createElement(
					selectedMedia === "vid" ? "video" : "audio");
				recordedMedia.controls = true;

				// You can not directly set the blob as
				// the source of the video or audio element
				// Instead, you need to create a URL for blob
				// using URL.createObjectURL() method.
				const recordedMediaURL = URL.createObjectURL(blob);

				// Now you can use the created URL as the
				// source of the video or audio element
				recordedMedia.src = recordedMediaURL;

				// Create a download button that lets the
				// user download the recorded media
				const downloadButton = document.createElement("a");

				// Set the download attribute to true so that
				// when the user clicks the link the recorded
				// media is automatically gets downloaded.
				downloadButton.download = "Recorded-Media";

				downloadButton.href = recordedMediaURL;
				downloadButton.innerText = "Download it!";

				downloadButton.onclick = () => {

					/* After download revoke the created URL
					using URL.revokeObjectURL() method to
					avoid possible memory leak. Though,
					the browser automatically revokes the
					created URL when the document is unloaded,
					but still it is good to revoke the created
					URLs */
					URL.revokeObjectURL(recordedMedia);
				};

				document.getElementById(
					`${selectedMedia}-recorder`).append(
						recordedMedia, downloadButton);
			};

			if (selectedMedia === "vid") {

				// Remember to use the srcObject
				// attribute since the src attribute
				// doesn't support media stream as a value
				webCamContainer.srcObject = mediaStream;
			}

			document.getElementById(
				`${selectedMedia}-record-status`)
				.innerText = "Recording";

			thisButton.disabled = true;
			otherButton.disabled = false;
		});
}

function stopRecording(thisButton, otherButton) {
	clearInterval(interval);
	// Stop the recording
	window.mediaRecorder.stop();

	// Stop all the tracks in the
	// received media stream
	window.mediaStream.getTracks()
		.forEach((track) => {
			track.stop();
		});

	document.getElementById(
		`${selectedMedia}-record-status`)
		.innerText = "Recording done!";
	thisButton.disabled = true;
	otherButton.disabled = false;
}

const detectFace = async () => {
	const prediction = await model.estimateFaces(webCamContainer, false);
	console.log(prediction);

	ctx.drawImage(webCamContainer, 0, 0, 600, 400);

	prediction.forEach((pred) => {
		console.log(ctx);
		ctx.beginPath();
		ctx.lineWidth = "4";
		ctx.strokeStyle = "blue";
		ctx.rect(
			pred.topLeft[0],
			pred.topLeft[1],
			pred.bottomRight[0] - pred.topLeft[0],
			pred.bottomRight[1] - pred.topLeft[1]
		);
		ctx.stroke();
		console.log(ctx);
	});
}

webCamContainer.addEventListener("loadeddata", async () => {
	model = await blazeface.load();
	interval = setInterval(detectFace, 100);
})

