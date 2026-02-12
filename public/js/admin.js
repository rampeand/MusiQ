/* ============================================
   MusiQ — Admin Dashboard Logic
   ============================================ */

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

// ──────────────── State ────────────────
let activeQueues = [];
let selectedQueueId = null;

// ──────────────── Init ────────────────
(function init() {
    refreshList();
})();

// ──────────────── List Queues ────────────────

function refreshList() {
    const listEl = document.getElementById('queueList');
    const countEl = document.getElementById('queueCount');
    listEl.innerHTML = '<div style="padding:1rem;color:var(--text-muted)">Loading...</div>';

    firestore.collection('musiq_playlists_tracker').orderBy('lastActive', 'desc').get()
        .then(function (snap) {
            activeQueues = [];
            snap.forEach(function (doc) {
                activeQueues.push(doc.data());
            });

            countEl.textContent = activeQueues.length + ' active queues';
            renderQueueList();
        })
        .catch(function (err) {
            console.error(err);
            listEl.innerHTML = '<div style="padding:1rem;color:red">Error loading queues</div>';
        });
}

function renderQueueList() {
    const listEl = document.getElementById('queueList');
    listEl.innerHTML = '';

    if (activeQueues.length === 0) {
        listEl.innerHTML = '<div style="padding:1rem;color:var(--text-muted)">No active queues found.</div>';
        return;
    }

    activeQueues.forEach(function (q) {
        const item = document.createElement('div');
        item.className = 'playlist-row';
        if (q.playlistId === selectedQueueId) item.classList.add('active');

        const lastActive = q.lastActive ? new Date(q.lastActive.seconds * 1000).toLocaleString() : 'Never';
        const count = q.songCount || 0;

        item.innerHTML =
            '<div>' +
            '  <strong>' + escapeHtml(q.playlistId) + '</strong>' +
            '  <div class="playlist-meta">Last active: ' + lastActive + '</div>' +
            '</div>' +
            '<div>' +
            '  <span class="badge" style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;font-size:0.75rem">' + count + ' songs</span>' +
            '</div>';

        item.addEventListener('click', function () {
            selectedQueueId = q.playlistId;
            renderQueueList(); // re-render to update active class
            loadQueueDetails(q.playlistId);
        });

        listEl.appendChild(item);
    });
}

// ──────────────── Queue Details ────────────────

function loadQueueDetails(playlistId) {
    const mainEl = document.getElementById('adminMain');
    mainEl.innerHTML = '<div style="padding:1rem">Loading details for <b>' + escapeHtml(playlistId) + '</b>...</div>';

    firestore.collection(playlistId).orderBy('position').get()
        .then(function (snap) {
            const songs = [];
            snap.forEach(function (doc) {
                songs.push({ id: doc.id, ...doc.data() });
            });
            renderQueueDetails(playlistId, songs);
        })
        .catch(function (err) {
            mainEl.innerHTML = '<div style="padding:1rem;color:red">Error loading songs: ' + err.message + '</div>';
        });
}

function renderQueueDetails(playlistId, songs) {
    const mainEl = document.getElementById('adminMain');

    let html =
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md)">' +
        '  <h2>' + escapeHtml(playlistId) + '</h2>' +
        '  <button class="btn btn-danger" onclick="deleteQueue(\'' + escapeHtml(playlistId) + '\')">Delete Queue</button>' +
        '</div>' +
        '<div class="stat-card">' +
        '  <div><strong>Total Songs:</strong> ' + songs.length + '</div>' +
        '  <div><strong>Status:</strong> ' + (songs.length > 0 ? 'Active' : 'Empty') + '</div>' +
        '</div>';

    if (songs.length === 0) {
        html += '<p style="color:var(--text-muted)">This queue is empty.</p>';
    } else {
        html +=
            '<table class="song-table">' +
            '<thead><tr><th>Pos</th><th>Title</th><th>Added</th><th>Action</th></tr></thead>' +
            '<tbody>';

        songs.forEach(function (s) {
            const added = s.addedOn ? new Date(s.addedOn.seconds * 1000).toLocaleTimeString() : '-';
            html +=
                '<tr>' +
                '  <td>' + (s.position + 1) + '</td>' +
                '  <td>' + escapeHtml(s.songTitle) + '</td>' +
                '  <td>' + added + '</td>' +
                '  <td><button style="background:none;border:none;color:red;cursor:pointer" onclick="deleteSong(\'' + playlistId + '\', \'' + s.id + '\')">✕</button></td>' +
                '</tr>';
        });

        html += '</tbody></table>';
    }

    mainEl.innerHTML = html;
}

// ──────────────── Actions ────────────────

function deleteSong(playlistId, docId) {
    if (!confirm('Delete this song?')) return;
    firestore.collection(playlistId).doc(docId).delete()
        .then(function () {
            loadQueueDetails(playlistId);
        });
}

function deleteQueue(playlistId) {
    if (!confirm('Are you sure you want to delete queue: ' + playlistId + '? This cannot be undone.')) return;

    // 1. Delete all songs in the collection
    const colRef = firestore.collection(playlistId);
    colRef.get().then(function (snap) {
        const batch = firestore.batch();
        snap.forEach(function (doc) {
            batch.delete(doc.ref);
        });

        // 2. Delete from tracker
        const trackerRef = firestore.collection('musiq_playlists_tracker').doc(playlistId);
        batch.delete(trackerRef);

        return batch.commit();
    }).then(function () {
        showToast('Deleted queue: ' + playlistId);
        selectedQueueId = null;
        document.getElementById('adminMain').innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100%;color:var(--text-muted)">Select a queue</div>';
        refreshList();
    }).catch(function (err) {
        console.error(err);
        alert('Error deleting queue: ' + err.message);
    });
}

function autoClean() {
    if (!confirm('Auto-Clean will delete all queues that haven\'t been active in the last 24 hours. Continue?')) return;

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    let deletedCount = 0;
    const batch = firestore.batch();

    // We can't filter by date in client-side array easily if list is huge, but assuming <1000 queues it's fine.
    // Ideally we query: .where('lastActive', '<', cutoff)

    firestore.collection('musiq_playlists_tracker').where('lastActive', '<', cutoff).get()
        .then(function (snap) {
            if (snap.empty) {
                alert('No inactive queues found to clean.');
                return;
            }

            const promises = [];

            snap.forEach(function (trackerDoc) {
                const pid = trackerDoc.id;
                deletedCount++;

                // Add tracker deletion to batch
                batch.delete(trackerDoc.ref);

                // We also need to delete the actual song collection for each
                // This might exceed batch limit (500 ops). 
                // For simplicity in this version, we will just delete the tracker entry and fire off async deletes for collections.
                const p = firestore.collection(pid).get().then(function (songSnap) {
                    const songBatch = firestore.batch();
                    songSnap.forEach(function (doc) { songBatch.delete(doc.ref); });
                    return songBatch.commit();
                });
                promises.push(p);
            });

            return Promise.all(promises).then(function () {
                return batch.commit();
            });
        })
        .then(function () {
            showToast('Auto-Clean finished. Deleted ' + deletedCount + ' queues.');
            refreshList();
        })
        .catch(function (err) {
            console.error(err);
            alert('Auto-clean failed: ' + err.message);
        });
}

function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 3000);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
}
