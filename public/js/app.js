/* ============================================
   MusiQ — Main Application Logic
   Firebase + YouTube IFrame API + Playlist
   ============================================ */

// ──────────────── Firebase Config ────────────────
const firebaseConfig = {
    apiKey: "AIzaSyBTqfXKuw1uWdccdOVREHa3BLqED74JQRs",
    authDomain: "white-airship-245101.firebaseapp.com",
    databaseURL: "https://white-airship-245101.firebaseio.com",
    projectId: "white-airship-245101",
    storageBucket: "white-airship-245101.appspot.com",
    messagingSenderId: "637157888993",
    appId: "1:637157888993:web:0dea7bc79bbf01e2"
};

firebase.initializeApp(firebaseConfig);

const firestore = firebase.firestore();
const timestamp = firebase.firestore.FieldValue.serverTimestamp();

// ──────────────── State ────────────────
let ytPlayer = null;
let ytSearchResults = null;
let currentPlaylistId = '';
let isPlaying = false;

// ──────────────── Init ────────────────
(function init() {
    // Extract playlist ID from URL: /player/MyPlaylist or /queue/MyPlaylist
    const parts = window.location.pathname.split('/');
    currentPlaylistId = decodeURIComponent(parts[parts.length - 1]) || 'DefaultPlaylist';
    const isQueueMode = window.location.pathname.includes('/queue/');

    // Update header
    document.getElementById('playlistNameDisplay').textContent = currentPlaylistId + (isQueueMode ? ' (Guest)' : '');
    document.title = 'MusiQ — ' + currentPlaylistId;

    if (!isQueueMode) {
        // Load YouTube IFrame API only in player mode
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const first = document.getElementsByTagName('script')[0];
        first.parentNode.insertBefore(tag, first);
    } else {
        // Queue mode: specific UI adjustments
        document.body.classList.add('queue-mode');
        // Poll for current song to update "Now Playing" card
        listenToCurrentSong();
    }

    // Load Google API client for YouTube Data search
    loadGapiClient();

    // Start listening to playlist changes
    updatePlaylist(isQueueMode);

    // Track playlist activity for Admin Dashboard
    trackPlaylistActivity();

    // Enter key on search input
    document.getElementById('searchTextField').addEventListener('keyup', function (e) {
        if (e.key === 'Enter') doSearch();
    });
})();

// ──────────────── YouTube IFrame API ────────────────

// Called automatically by the IFrame API script
function onYouTubeIframeAPIReady() {
    ytPlayer = new YT.Player('player', {
        height: '100%',
        width: '100%',
        videoId: '',
        playerVars: {
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            autoplay: 0
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    loadSong();
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        isPlaying = true;
        updatePlayPauseIcon();
    } else if (event.data === YT.PlayerState.PAUSED) {
        isPlaying = false;
        updatePlayPauseIcon();
    } else if (event.data === YT.PlayerState.ENDED) {
        endedState();
    }
}

function playYTVID(videoID, startTimeSec) {
    if (ytPlayer && ytPlayer.loadVideoById) {
        ytPlayer.loadVideoById(videoID, startTimeSec || 0, 'large');
    }
}

function togglePlayPause() {
    if (!ytPlayer) return;
    if (isPlaying) {
        ytPlayer.pauseVideo();
    } else {
        ytPlayer.playVideo();
    }
}

function updatePlayPauseIcon() {
    const icon = document.getElementById('playPauseIcon');
    if (icon) icon.textContent = isPlaying ? 'pause' : 'play_arrow';
}

// ──────────────── Google API Client ────────────────

function loadGapiClient() {
    gapi.load('client', function () {
        gapi.client.setApiKey('AIzaSyBKE9MzjNBkMIf3eyh69uYo8aDBc3VD_5o');
        gapi.client.load('https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest')
            .then(function () { console.log('YouTube Data API loaded'); })
            .catch(function (err) { console.error('Error loading YT API', err); });
    });
}

// ──────────────── Search ────────────────

function doSearch() {
    const query = document.getElementById('searchTextField').value.trim();
    if (!query) return;

    gapi.client.youtube.search.list({
        part: 'snippet',
        maxResults: 6,
        q: query,
        type: 'video',
        videoCategoryId: 10
    }).then(function (response) {
        ytSearchResults = response;
        renderSearchResults(response);
    }).catch(function (err) {
        console.error('Search error', err);
        showToast('Search failed — check your connection');
    });
}

function renderSearchResults(response) {
    const list = document.getElementById('searchResultList');
    const container = document.getElementById('searchResults');
    list.innerHTML = '';

    const items = response.result.items;
    if (!items || items.length === 0) {
        list.innerHTML = '<li style="color:var(--text-muted);padding:1rem;text-align:center">No results found</li>';
        container.classList.add('visible');
        return;
    }

    items.forEach(function (item, i) {
        const title = item.snippet.title;
        const thumb = item.snippet.thumbnails.default.url;
        const li = document.createElement('li');
        li.className = 'search-result-item';
        li.style.animation = 'slideInRight 0.3s ease ' + (i * 0.05) + 's both';
        li.innerHTML =
            '<img src="' + thumb + '" class="search-result-thumb" alt="">' +
            '<div class="search-result-info"><h4>' + escapeHtml(title) + '</h4></div>' +
            '<button class="btn-add" title="Add to playlist" data-index="' + i + '">+</button>';

        li.querySelector('.btn-add').addEventListener('click', function () {
            addSongToPlaylist(ytSearchResults.result.items[i]);
        });
        list.appendChild(li);
    });

    container.classList.add('visible');
}

function closeSearchResults() {
    document.getElementById('searchResults').classList.remove('visible');
}

// ──────────────── Playlist CRUD (Firestore) ────────────────

function getCollection() {
    return firestore.collection(currentPlaylistId);
}

function addSongToPlaylist(selectedSong) {
    const col = getCollection();
    const selSongTitle = selectedSong.snippet.title;
    const selVideoID = selectedSong.id.videoId;
    const selThumbnails = selectedSong.snippet.thumbnails.default.url;

    // Update tracker song count
    firestore.collection('musiq_playlists_tracker').doc(currentPlaylistId).set({
        lastActive: firebase.firestore.FieldValue.serverTimestamp(),
        songCount: firebase.firestore.FieldValue.increment(1)
    }, { merge: true });

    col.where('position', '>=', 0).get().then(function (snap) {
        const size = snap.size;
        col.add({
            position: size,
            addedOn: timestamp,
            lastPlayed: timestamp,
            songTitle: selSongTitle,
            videoID: selVideoID,
            thumbnails: selThumbnails,
            vidArray: selectedSong
        }).then(function () {
            showToast('🎵 Added: ' + selSongTitle);
            closeSearchResults();
            document.getElementById('searchTextField').value = '';
        }).catch(function (err) {
            console.error('Error adding song', err);
            showToast('Failed to add song');
        });
    });
}

function loadSong() {
    getCollection().where('position', '==', 0)
        .onSnapshot(function (querySnapshot) {
            querySnapshot.docs.forEach(function (doc) {
                const data = doc.data();
                playYTVID(data.videoID, 0);
                document.getElementById('nowPlayingTitle').textContent = data.songTitle;
                document.getElementById('nowPlayingInfo').style.display = 'flex';
            });
            if (querySnapshot.empty) {
                document.getElementById('nowPlayingInfo').style.display = 'none';
            }
        });

    // Update lastPlayed timestamp
    getCollection().where('position', '==', 0).get()
        .then(function (snap) {
            snap.docs.forEach(function (doc) {
                getCollection().doc(doc.id).update({ lastPlayed: timestamp });
            });
        });
}

function endedState() {
    getCollection().where('position', '>', 0).get()
        .then(function (snap) {
            if (snap.size <= 0) {
                loopPlaylist();
            } else {
                batchDecrementPlaylist();
                loadSong();
            }
        });
}

function loopPlaylist() {
    var i = 0;
    var batch = firestore.batch();
    getCollection().orderBy('position').get().then(function (snap) {
        snap.forEach(function (doc) {
            batch.update(getCollection().doc(doc.id), { position: i });
            i++;
        });
        batch.commit();
    });
}

function nextSong() {
    batchDecrementPlaylist();
    loadSong();
}

function prevSong() {
    batchIncrementPlaylist();
    loadSong();
}

function batchDecrementPlaylist() {
    const dec = firebase.firestore.FieldValue.increment(-1);
    var batch = firestore.batch();
    getCollection().get().then(function (snap) {
        snap.forEach(function (doc) {
            batch.update(getCollection().doc(doc.id), { position: dec });
        });
        batch.commit();
    });
}

function batchIncrementPlaylist() {
    const inc = firebase.firestore.FieldValue.increment(1);
    var batch = firestore.batch();
    getCollection().get().then(function (snap) {
        snap.forEach(function (doc) {
            batch.update(getCollection().doc(doc.id), { position: inc });
        });
        batch.commit();
    });
}

function clearPlaylist() {
    if (!confirm('Clear the entire playlist?')) return;
    if (ytPlayer && ytPlayer.stopVideo) ytPlayer.stopVideo();
    var batch = firestore.batch();
    getCollection().get().then(function (snap) {
        snap.forEach(function (doc) {
            batch.delete(getCollection().doc(doc.id));
        });
        batch.commit();
    });
    showToast('Playlist cleared');
}

function deleteSong(docID, position) {
    const dec = firebase.firestore.FieldValue.increment(-1);
    var batch = firestore.batch();
    getCollection().where('position', '>=', position).get().then(function (snap) {
        snap.forEach(function (doc) {
            const ref = getCollection().doc(doc.id);
            if (ref.id === docID) {
                batch.delete(ref);
            } else {
                batch.update(ref, { position: dec });
            }
        });
        batch.commit();
        if (position === 0) loadSong();
    });
}

function changeSongPosition(action, docID, position) {
    const dec = firebase.firestore.FieldValue.increment(-1);
    const inc = firebase.firestore.FieldValue.increment(1);
    var batch = firestore.batch();

    if (action === 'up' && position > 0) {
        getCollection().where('position', '>=', position - 1).where('position', '<=', position)
            .get().then(function (snap) {
                snap.forEach(function (doc) {
                    const ref = getCollection().doc(doc.id);
                    if (ref.id === docID) {
                        batch.update(ref, { position: dec });
                    } else {
                        batch.update(ref, { position: inc });
                    }
                });
                batch.commit();
                if (position === 1) loadSong();
            });
    } else if (action === 'down') {
        getCollection().where('position', '>=', position).where('position', '<=', position + 1)
            .get().then(function (snap) {
                snap.forEach(function (doc) {
                    const ref = getCollection().doc(doc.id);
                    if (ref.id === docID) {
                        batch.update(ref, { position: inc });
                    } else {
                        batch.update(ref, { position: dec });
                    }
                });
                batch.commit();
                if (position === 0) loadSong();
            });
    } else if (action === 'play') {
        getCollection().get().then(function (snap) {
            snap.forEach(function (doc) {
                const ref = getCollection().doc(doc.id);
                if (ref.id === docID) {
                    batch.update(ref, { position: 0 });
                } else if (doc.data().position === 0) {
                    batch.update(ref, { position: position });
                }
            });
            batch.commit();
            loadSong();
        });
    }
}

// ──────────────── Playlist UI (Real-time) ────────────────

function updatePlaylist(isQueueMode) {
    getCollection().orderBy('position').onSnapshot(function () {
        if (!isQueueMode) navigationSanityCheck();
        renderPlaylist(isQueueMode);
    });
}

function renderPlaylist(isQueueMode) {
    const listEl = document.getElementById('playlistList');
    const emptyEl = document.getElementById('playlistEmpty');
    const countEl = document.getElementById('playlistCount');

    getCollection().orderBy('position').get().then(function (snap) {
        const total = snap.size;
        countEl.textContent = total + (total === 1 ? ' song' : ' songs');

        if (total === 0) {
            listEl.innerHTML = '';
            listEl.appendChild(emptyEl);
            emptyEl.style.display = 'flex';
            return;
        }

        listEl.innerHTML = '';
        let idx = 0;

        snap.forEach(function (doc) {
            const data = doc.data();
            const pos = data.position;
            const isActive = pos === 0;
            const isLast = idx === total - 1;
            const thumb = data.thumbnails || (data.vidArray && data.vidArray.snippet && data.vidArray.snippet.thumbnails && data.vidArray.snippet.thumbnails.default.url) || '';

            const item = document.createElement('div');
            item.className = 'playlist-item' + (isActive ? ' active' : '');
            item.style.animation = 'slideInRight 0.2s ease ' + (idx * 0.03) + 's both';

            let actionsHtml = '';

            // Only show actions if NOT in queue mode
            if (!isQueueMode) {
                actionsHtml += '<div class="playlist-item-actions">';
                if (pos > 0) {
                    actionsHtml += '<button class="playlist-action-btn" title="Move up" data-action="up">▲</button>';
                }
                if (!isLast) {
                    actionsHtml += '<button class="playlist-action-btn" title="Move down" data-action="down">▼</button>';
                }
                if (!isActive) {
                    actionsHtml += '<button class="playlist-action-btn play" title="Play now" data-action="play">▶</button>';
                }
                actionsHtml += '<button class="playlist-action-btn delete" title="Remove" data-action="delete">✕</button>';
                actionsHtml += '</div>';
            }

            item.innerHTML =
                '<span class="playlist-item-position">' + (isActive ? '♪' : (pos + 1)) + '</span>' +
                (thumb ? '<img src="' + thumb + '" class="playlist-item-thumb" alt="">' : '') +
                '<div class="playlist-item-info"><span class="playlist-item-title">' + escapeHtml(data.songTitle) + '</span></div>' +
                actionsHtml;

            if (!isQueueMode) {
                // Event delegation for action buttons
                item.querySelectorAll('.playlist-action-btn').forEach(function (btn) {
                    btn.addEventListener('click', function (e) {
                        e.stopPropagation();
                        const action = btn.dataset.action;
                        if (action === 'delete') deleteSong(doc.id, pos);
                        else changeSongPosition(action, doc.id, pos);
                    });
                });
            }

            listEl.appendChild(item);
            idx++;
        });
    });
}

function navigationSanityCheck() {
    const col = getCollection();
    col.where('position', '>', 0).get().then(function (snap) {
        const btn = document.getElementById('btnNext');
        if (btn) btn.disabled = snap.size <= 0;
    });
    col.where('position', '<', 0).get().then(function (snap) {
        const btn = document.getElementById('btnPrev');
        if (btn) btn.disabled = snap.size <= 0;
    });
}

// ──────────────── Share ────────────────

function sharePlaylist() {
    // Generate guest queue link (queue mode) if checking from player, or same link if already in queue
    let url = window.location.origin + '/queue/' + encodeURIComponent(currentPlaylistId);

    // If we are already in queue mode, share the same queue link. 
    // If we are in player mode, share the queue link (as requested by user to invite guests).

    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () {
            showToast('📋 Guest invite link copied!');
        }).catch(function () {
            prompt('Copy this guest invite link:', url);
        });
    } else {
        prompt('Copy this guest invite link:', url);
    }
}

function listenToCurrentSong() {
    getCollection().where('position', '==', 0)
        .onSnapshot(function (querySnapshot) {
            if (querySnapshot.empty) {
                document.getElementById('nowPlayingTitle').textContent = '—';
                document.getElementById('nowPlayingImg').src = '';
                return;
            }
            querySnapshot.docs.forEach(function (doc) {
                const data = doc.data();
                document.getElementById('nowPlayingTitle').textContent = data.songTitle;
                const thumb = data.thumbnails || (data.vidArray && data.vidArray.snippet && data.vidArray.snippet.thumbnails && data.vidArray.snippet.thumbnails.high.url) || '';
                document.getElementById('nowPlayingImg').src = thumb.replace('default.jpg', 'hqdefault.jpg');
            });
        });
}

// ──────────────── Utilities ────────────────

function trackPlaylistActivity() {
    // Upsert to tracker collection
    firestore.collection('musiq_playlists_tracker').doc(currentPlaylistId).set({
        playlistId: currentPlaylistId,
        lastActive: firebase.firestore.FieldValue.serverTimestamp(), // use server timestamp
        lastAccessedBy: 'client'
    }, { merge: true });
}

function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 2800);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}
