var util = require('util');
var hark = require('hark');
var webrtc = require('webrtcsupport');
var getUserMedia = require('getusermedia');
var getScreenMedia = require('getscreenmedia');
var WildEmitter = require('wildemitter');
var GainController = require('mediastream-gain');
var mockconsole = require('mockconsole');


function LocalMedia(opts) {
    var self = this;
    var options = opts || {};
    var config = this.config = {
        autoAdjustMic: false,
        detectSpeakingEvents: true,
        media: {
            audio: true,
            video: true
        },
        logger: mockconsole
    };

    var item;
    for (item in opts) {
        this.config[item] = opts[item];
    }

    this.screenSharingSupport = webrtc.screenSharing;

    if (!webrtc.support) {
        this.logger.error('Your browser does not support local media capture.');
    }

    WildEmitter.call(this);

    this.localStreams = [];
    this.localScreens = [];
}


util.inherits(LocalMedia, WildEmitter);


LocalMedia.prototype.startLocalMedia = function (mediaConstraints, cb) {
    var self = this;
    var constraints = mediaConstraints || this.config.media;

    getUserMedia(constraints, function (err, stream) {
        if (!err) {
            if (constraints.audio && self.config.detectSpeakingEvents) {
                self.setupAudioMonitor(stream);
            }
            self.localStreams.push(stream);

            if (self.config.autoAdjustMic) {
                self.gainController = new GainController(stream);
                // start out somewhat muted if we can track audio
                self.setMicIfEnabled(0.5);
            }

            self.emit('localStream', stream);
        }
        if (cb) cb(err, stream);
    });
};

LocalMedia.prototype.stopLocalMedia = function (stream) {
    var self = this;
    if (stream) {
        stream.stop();
        self.emit('localStreamStopped', stream);
        var idx = self.localStreams.indexOf(stream);
        if (idx > -1) {
            self.localStreams = self.localStreams.splice(idx, 1);
        }
    } else {
        this.localStreams.forEach(function (stream) {
            stream.stop();
            self.emit('localStreamStopped', stream);
        });
        this.localStreams = [];
    }
};

LocalMedia.prototype.startScreenShare = function (cb) {
    var self = this;
    getScreenMedia(function (err, stream) {
        if (!err) {
            self.localScreens.push(stream);
             
            // TODO: might need to migrate to the video tracks onended
            stream.onended = function () {
                self.emit('localScreenRemoved', stream);
                self.stopScreenShare();
                var idx = self.localScreens.indexOf(stream);
                if (idx > -1) {
                    self.localScreens = self.localScreens.splice(idx, 1);
                }
            };

            self.emit('localScreen', stream);
        }

        // enable the callback
        if (cb) cb(err, stream);
    });
};

LocalMedia.prototype.stopScreenShare = function (stream) {
    var self = this;
    if (stream) {
        stream.stop();
        self.emit('localScreenStopped', stream);
        var idx = self.localScreens.indexOf(stream);
        if (idx > -1) {
            self.localScreens = self.localScreens.splice(idx, 1);
        }
    } else {
        this.localScreens.forEach(function (stream) {
            stream.stop();
            self.emit('localScreenStopped', stream);
        });
        this.localScreens = [];
    }
};

// Audio controls
LocalMedia.prototype.mute = function () {
    this._audioEnabled(false);
    this.hardMuted = true;
    this.emit('audioOff');
};

LocalMedia.prototype.unmute = function () {
    this._audioEnabled(true);
    this.hardMuted = false;
    this.emit('audioOn');
};

LocalMedia.prototype.setupAudioMonitor = function (stream) {
    this.logger.log('Setup audio');
    var audio = hark(stream);
    var self = this;
    var timeout;

    audio.on('speaking', function () {
        if (self.hardMuted) return;
        self.setMicIfEnabled(1);
        self.emit('speaking');
    });

    audio.on('stopped_speaking', function () {
        if (self.hardMuted) return;
        if (timeout) clearTimeout(timeout);

        timeout = setTimeout(function () {
            self.setMicIfEnabled(0.5);
            self.emit('stoppedSpeaking');
        }, 1000);
    });
};

// We do this as a seperate method in order to
// still leave the "setMicVolume" as a working
// method.
LocalMedia.prototype.setMicIfEnabled = function (volume) {
    if (!this.config.autoAdjustMic) return;
    this.gainController.setGain(volume);
};

// Video controls
LocalMedia.prototype.pauseVideo = function () {
    this._videoEnabled(false);
    this.emit('videoOff');
};
LocalMedia.prototype.resumeVideo = function () {
    this._videoEnabled(true);
    this.emit('videoOn');
};

// Combined controls
LocalMedia.prototype.pause = function () {
    this._audioEnabled(false);
    this.pauseVideo();
};
LocalMedia.prototype.resume = function () {
    this._audioEnabled(true);
    this.resumeVideo();
};

// Internal methods for enabling/disabling audio/video
LocalMedia.prototype._audioEnabled = function (bool) {
    // work around for chrome 27 bug where disabling tracks
    // doesn't seem to work (works in canary, remove when working)
    this.setMicIfEnabled(bool ? 1 : 0);
    this.localStream.getAudioTracks().forEach(function (track) {
        track.enabled = !!bool;
    });
};
LocalMedia.prototype._videoEnabled = function (bool) {
    this.localStream.getVideoTracks().forEach(function (track) {
        track.enabled = !!bool;
    });
};


module.exports = LocalMedia;
