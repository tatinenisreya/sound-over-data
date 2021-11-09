$(function() {
    $('#received_text').hide();
    $('#btnSend').click(function () {});

    $('#btnReceive').click(function () {
        $('#received_text').show();
    });

    /**
     * Convert a string to array buffer in UTF8
     * @function str2ab
     * @param {string} s - string to be converted
     * @returns {ArrayBuffer} buf - converted arraybuffer
     */
    function str2ab(s) {
        var s_utf8 = unescape(encodeURIComponent(s));
        var buf = new ArrayBuffer(s_utf8.length);
        var bufView = new Uint8Array(buf);
        for (var i = 0; i < s_utf8.length; i++) {
            bufView[i] = s_utf8.charCodeAt(i);
        }
        return buf;
    }

    /**
     * Convert an array buffer in UTF8 to string
     * @function ab2str
     * @param {ArrayBuffer} ab - array buffer to be converted
     * @returns {string} s - converted string
     */
    function ab2str(ab) {
        return decodeURIComponent(escape(String.fromCharCode.apply(null, new Uint8Array(ab))));
    }

    /**
     * Convert text to bytearray - output will be binary value array (0's and 1s)
     * Run bytearray through crc32 for checksum safety - output will be a buffer padded bytearray
     * Convert crc32 padded byte array to audio signal using libquit native library - output is bytearray of audio stream
     * - Convert bytearray to audio byte array using javascript/browser native audio lib
     * - Convert audio byte array to needed frequency (~14Khz for audible, ~19Khz for Ultrasonic)
     * Play audio data through javascript/browser native library
     * @param send-text-trigger
     */
    function sendText(e) {
        var inputText = e.target.innerText; // Fetch input text from html input box

        // Convert inputText to Binary byte array
        var s_utf8 = unescape(encodeURIComponent(s));
        var buf = new ArrayBuffer(s_utf8.length);
        var arrayBuffer = new Uint8Array(buf);
        for (var i = 0; i < s_utf8.length; i++) {
            arrayBuffer[i] = s_utf8.charCodeAt(i);
        }
        // Converstion to Binary byte array complete

        // Run through CRC32 library for
        var crc32SafeValue = CRC32.bstr(arrayBuffer);

        var audibleAudioFreq = audioCtx.createJavaScriptNode(crc32SafeValue, profileFrequency); // Generate frequency (14/19) based audio data
        transmit.transmit(audibleAudioFreq); // Generate Audio

        var payload = textbox.value;
        if (payload === "") {
            onTransmitFinish();
            return;
        }
    }

    /**
     * Using javascript native audio libs, convert audio stream to bytearray based on profile (audible/ultrasonic)
     * Run bytearray through CRC32 checksum extracter - outputs bytearray buffer
     * Convert binary bytearray to text using Quiet lib based implementation
     * Output extracted text to html
     * @param emicrophone-audio-event
     */
    function recieveText(e) {
        var inputAudioStream = e.target.value;
        var byteArrayWithoutCRC = CRC32.buf(inputAudioStream);
        var visibleText = decodeURIComponent(escape(String.fromCharCode.apply(null, new Uint8Array(byteArrayWithoutCRC))));

        textbox.value(visibleText);
    }

    /**
     * Initialization function
     */
    function domReady() {
        let profileFrequency = 19; // 19 Khz - default to ultrasonic
        var audioProfile=$('data-quiet-profile-name').value();
        if (audioProfile == 'audible') {
            profileFrequency = 14; // 14 Khz - Audio frequency range (Below 7k - need good speakers to support it)
        }

        Quiet.receiver({profile: profilename,
            onReceive: recieveText,
            onCreateFail: onReceiverCreateFail,
            onReceiveFail: onReceiveFail
        });
    }


});

