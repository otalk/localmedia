var test = require('tape');
var LocalMedia = require('../localmedia');

test('test one audiomonitor', function (t) {
    var media = new LocalMedia({media: {audio: true}, detectSpeakingEvents: true});
    media.on('localStream', function () {
        t.equal(media._audioMonitors.length, 1);
    });
    media.on('localStreamStopped', function() {
        t.equal(media._audioMonitors.length, 0);
        t.end();
    });

    media.start(null, function (err, stream) {
        if (err) {
            t.fail('start failed', err);
            return;
        }

        stream.getTracks().forEach(function (track) { track.stop(); });
    });
});

test('test multiple audiomonitors', function (t) {
    var media = new LocalMedia({media: {audio: true}, detectSpeakingEvents: true});

    media.on('localStream', function () {
        t.equal(media._audioMonitors.length, media.localStreams.length + media.localScreens.length, 'audioMonitor count should match stream count at localStream event');
    });

    media.on('localStreamStopped', function() {
        t.equal(media._audioMonitors.length, media.localStreams.length + media.localScreens.length, 'audioMonitor count should match stream count at localStreamStopped event');
        if (media.localStreams.length + media.localScreens.length === 0) {
            t.end();
        }
    });

    media.start(null, function (e1, s1) {
        if (e1) {
            t.fail('startLocalMedia1 failed', e1);
            return;
        }

        media.start(null, function (e2, s2) {
            if (e2) {
                t.fail('startLocalMedia2 failed', e2);
                return;
            }

            media.on('localStreamStopped', function(s) {
                if (s === s2) {
                    s1.getTracks().forEach(function (track) { track.stop(); });
                }
            });

            s2.getTracks().forEach(function (track) { track.stop(); });
        });
    });
});

