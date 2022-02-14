/** play audio: create an audio ele, play the source, and remove the audio ele.
 * @returns {Promise<void>} */
function play_audio(source) {
    return new Promise(
        function(resolve) {
            let audioele = document.createElement('audio');
            audioele.style.display = 'none';
            audioele.appendChild(source);
            document.body.appendChild(audioele);
            audioele.play();
            audioele.onended = () => {
                audioele.remove();
                resolve();
            };
        }
    );
}

/** load audio: load audio and return source ele
 * @returns {Promise<{
 * ele: HTMLAudioElement ,
 * source: HTMLSourceElement }>} */
function load_audio(audiopath, type = 'audio/mp3') {
    return new Promise(
        function(resolve) {
            let audioele = document.createElement('audio');
            audioele.preload = 'auto';
            audioele.style.display = 'none';
            let source = document.createElement('source');
            source.src = audiopath;
            source.type = type;
            audioele.appendChild(source);
            audioele.oncanplaythrough = () => {
                resolve({ ele: audioele, source: source });
            };
            document.body.appendChild(audioele);
        }
    );
}

/** load image: load img and return img obj
 * @returns {Promise<HTMLImageElement>} */
function load_img(imgpath) {
    return new Promise(
        function(resolve) {
            let img;
            img = new Image();
            img.src = imgpath;
            img.onload = () => {
                resolve(img);
            };
        }
    );
}