var firebaseConfig = {
    apiKey: "AIzaSyBTqfXKuw1uWdccdOVREHa3BLqED74JQRs",
    authDomain: "white-airship-245101.firebaseapp.com",
    databaseURL: "https://white-airship-245101.firebaseio.com",
    projectId: "white-airship-245101",
    storageBucket: "white-airship-245101.appspot.com",
    messagingSenderId: "637157888993",
    appId: "1:637157888993:web:0dea7bc79bbf01e2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const firestore = firebase.firestore();  //grab ref to firestore

function getPlayerID(){
    var playerid = document.getElementById("playerid").value;
    return playerid;
}

function initPlayer(getPlayerID){
    console.log("initPlayer()");
    updatePlaylist(getPlayerID);
    loadSong();
}

function loopPlaylist(){
    console.log("loopPlaylist()");
    var i = 0;
    var batch = firestore.batch();
    firestore.collection(getPlayerID()).orderBy("position").get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
            var songRef = firestore.collection(getPlayerID()).doc(doc.id);
            batch.update(songRef, {
                position: i
            });
            i++;
        });
    batch.commit();
    });
}

function endedState(){
    console.log("endedState()");
    console.log("video ended naturally on playback");

    var songRef = firestore.collection(getPlayerID());
    var query = songRef.where("position", ">", 0);
    query.get().then(function(querySnapshot) {
        console.log("Songs left in playlist: " + querySnapshot.size);

        if(querySnapshot.size <= 0){
            console.log("End of playlist detected");
            loopPlaylist();
        }else{ //songs left in playlist
            batchDecrementPlaylist();
            loadSong();
        }
    });   
}

function loadSong(){

    firestore.collection(getPlayerID()).where("position", "==", 0)
    .onSnapshot(function(querySnapshot) {

        querySnapshot.docs.map(function(song) {

            console.log("Playing: " + song.data().songTitle);
            getYTVID(song.data().videoID);
        });

    });   
      
}

function navigationSanityCheck(){
    console.log("navigationSanityCheck() - performing sanity checks on player control buttons");
        var songRef = firestore.collection(getPlayerID());
        var lastSongQuery = songRef.where("position", ">", 0);
        var firstSongQuery = songRef.where("position", "<", 0);
        lastSongQuery.get().then(function(querySnapshot) {
            
            console.log("Songs after current position: " + querySnapshot.size);
    
            if(querySnapshot.size <= 0){
                console.log("End of playlist detected - disaable 'Next Song' button");
                document.getElementById("btnNext").disabled = true;
            }else{
                document.getElementById("btnNext").disabled = false;
            }
        });

        firstSongQuery.get().then(function(querySnapshot) {
            console.log("Songs ahead of current position: " + querySnapshot.size);
    
            if(querySnapshot.size <= 0){
                console.log("Top of playlist detected - disaable 'Previous Song' button");
                document.getElementById("btnPrev").disabled = true;
            }else{
                document.getElementById("btnPrev").disabled = false;
            }
        });  
}

function updatePlaylist(){
    console.log("updatePlaylist()");
    firestore.collection(getPlayerID()).orderBy('position').onSnapshot(function() {//on db update
        console.log("playlist changed")
        //temporary player controls for dev purposes
        //const playerControls = document.querySelector('#playerControls');
        // playerControls.innerHTML = "<button onclick='loadSong()'>Start Playlist</button>";
        // playerControls.innerHTML += "<button onclick='player.stopVideo()'>Stop Playlist</button>";
        // playerControls.innerHTML += "<button id='btnPrev' onclick='prevSong()'>Previous Song</button>";
        // playerControls.innerHTML += "<button id='btnNext' onclick='nextSong()'>Next Song</button>";
        // playerControls.innerHTML += "<button onclick='clearPlaylist()' style='color: red'>Clear Playlist</button>";

        navigationSanityCheck();

        const songsList = document.querySelector('#songsList');
        const iconSize = "175%"
        var songTitle, videoID, thumbnail, position;
        var ul = document.createElement('ul');
        songsList.innerHTML = ''
        songsList.appendChild(ul);
        ul.setAttribute("class","list-group");
        
        var i=0;
        firestore.collection(getPlayerID()).orderBy("position").get().then(function(querySnapshot) {
            console.log("Number of songs in playlist: " + querySnapshot.size);
            querySnapshot.forEach(function(doc) {
                i++;
                position = (doc.id, " => ", doc.data().position);
                songTitle = (doc.id, " => ", doc.data().songTitle);
                thumbnail = (doc.id, " => ", doc.data().vidArray.snippet.thumbnails.default.url);
                videoID = (doc.id, " => ", doc.data().videoID);
    
                var li = document.createElement('li');
                var thumbImg = document.createElement('img');
                thumbImg.setAttribute("src", thumbnail);
                thumbImg.setAttribute("width","13%");
                li.appendChild(thumbImg);

                arrowUpIcon = document.createElement('i');
                arrowUpIcon.setAttribute("class", "material-icons");
                arrowUpIcon.setAttribute("style", "font-size:"+iconSize+"; color:blue; padding-left:2%;");
                arrowUpIcon.textContent = "arrow_upward";
                arrowUpIcon.setAttribute("onClick","changeSongPosition('playlistUp','"+ doc.id + "'," + position +")");
                
                if (position > 0){
                    li.appendChild(arrowUpIcon);
                }
                

                removeIcon = document.createElement('i');
                removeIcon.setAttribute("class", "material-icons");
                removeIcon.setAttribute("style", "font-size:"+iconSize+"; color:red; padding-left:2%; padding-right:2%");
                removeIcon.textContent = "remove_circle_outline";
                removeIcon.setAttribute("onClick","deleteSong('"+ doc.id + "'," + position +")");
                li.appendChild(removeIcon);

                arrowDownIcon = document.createElement('i');
                arrowDownIcon.setAttribute("class", "material-icons");
                arrowDownIcon.setAttribute("style", "font-size:"+iconSize+"; color:blue; padding-right:2%;");
                arrowDownIcon.textContent = "arrow_downward";
                arrowDownIcon.setAttribute("onClick","changeSongPosition('playlistDown','"+ doc.id + "'," + position +")");
                
                //if not last element in playlist display 'down' arrow icon
                if (i != querySnapshot.size){
                    li.appendChild(arrowDownIcon);
                }
                

                playIcon = document.createElement('i');
                playIcon.setAttribute("class", "material-icons");
                playIcon.setAttribute("style", "font-size:"+iconSize+"; color:green; padding-right:2%;");
                playIcon.textContent = "play_circle_outline";
                playIcon.setAttribute("onClick","changeSongPosition('playCurrent','"+ doc.id + "'," + position +")");
                li.appendChild(playIcon);

                titleTextElement = document.createElement('text');
                titleTextNode = document.createTextNode(songTitle);
                titleTextElement.appendChild(titleTextNode);

                ul.appendChild(li);
                if (position == 0){
                    li.setAttribute("class","list-group-item active");
                }else{
                    li.setAttribute("class","list-group-item");
                }
                li.appendChild(titleTextElement);
            });
        });
    });
}

function batchDecrementPlaylist(){
    const decrement = firebase.firestore.FieldValue.increment(-1);
    var batch = firestore.batch();
    firestore.collection(getPlayerID()).get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
            var songRef = firestore.collection(getPlayerID()).doc(doc.id);
            batch.update(songRef, {
                position: decrement
            });
        });
    batch.commit();
    });
}

function batchIncrementPlaylist(){
    const increment = firebase.firestore.FieldValue.increment(1);
    var batch = firestore.batch();
    firestore.collection(getPlayerID()).get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
            var songRef = firestore.collection(getPlayerID()).doc(doc.id);
            batch.update(songRef, {
                position: increment
            });
        });
    batch.commit();
    });
}

function batchClearPlaylist(){
    var batch = firestore.batch();
    firestore.collection(getPlayerID()).get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
            var songRef = firestore.collection(getPlayerID()).doc(doc.id);
            batch.delete(songRef);
        });
    batch.commit();
    });
}

function deleteSong(docID, position){
    var songRef = firestore.collection(getPlayerID());
    var query = songRef.where("position", ">=", position);
    const decrement = firebase.firestore.FieldValue.increment(-1);
    var batch = firestore.batch();

    query.get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
            var songRef = firestore.collection(getPlayerID()).doc(doc.id);
            if(songRef.id == docID){
                console.log("delete " + songRef.id);
                batch.delete(songRef)
            }else{
                console.log("decrement " + songRef.id);
                batch.update(songRef, {
                    position: decrement
                });
            }
        });
        batch.commit();
        if (position == 0){//Play next song if song being deleted is currently playing.
            loadSong();
        }
    });
}

function changeSongPosition(action, docID, position){
    const decrement = firebase.firestore.FieldValue.increment(-1);
    const increment = firebase.firestore.FieldValue.increment(1);
    
    var batch = firestore.batch();
    var songRef = firestore.collection(getPlayerID());
    var query;
    switch(action){
        case "playlistUp": 
            query = songRef.where("position", "<=", (position)).where("position", ">=", (position-1));
            query.get().then(function(querySnapshot) {
                querySnapshot.forEach(function(doc) {
                    var songRef = firestore.collection(getPlayerID()).doc(doc.id);
                    console.log("Current song ref: " + songRef.id);
                    if(songRef.id == docID){
                        console.log("increment " + songRef.id);
                        batch.update(songRef, {
                            position: decrement
                        });
                    }else{
                        console.log("decrement " + songRef.id);
                        batch.update(songRef, {
                            position: increment
                        });
                    }
                });
                batch.commit();
                if (position == 0){//Play next song if song being deleted is currently playing.
                    loadSong();
                }
            });
            break;
        case "playlistDown":
            query = songRef.where("position", "<=", (position+1)).where("position", ">=", position);
            query.get().then(function(querySnapshot) {
                querySnapshot.forEach(function(doc) {
                    var songRef = firestore.collection(getPlayerID()).doc(doc.id);
                    console.log("Current song ref: " + songRef.id);
                    if(songRef.id == docID){
                        console.log("increment " + songRef.id);
                        batch.update(songRef, {
                            position: increment
                        });
                    }else{
                        console.log("decrement " + songRef.id);
                        batch.update(songRef, {
                            position: decrement
                        });
                    }
                });
                batch.commit();
                if (position == 0){//Play next song if song being deleted is currently playing.
                    loadSong();
                }
            });
            break;
        case "playCurrent":
            songRef.get().then(function(querySnapshot) {
                querySnapshot.forEach(function(doc) {
                    var songRef = firestore.collection(getPlayerID()).doc(doc.id);
                    if(songRef.id == docID){
                        console.log("Selected song being played now: " + doc.data().songTitle);
                        batch.update(songRef, {
                            position: 0
                        });
                    }else if(doc.id, " => ", doc.data().position == 0){
                        console.log("Currently playing song being swapped: " + doc.data().songTitle);
                        batch.update(songRef, {
                            position: position
                        });
                    }
                });
                batch.commit();
            });       
            loadSong();
            break;
    }
}