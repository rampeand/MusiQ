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
var ytSearchResults;
var savresponse;

//YT API Auth
gapi.load("client:auth2", function() {
    gapi.auth2.init({client_id: "637157888993-l9178kevdkdrfpoqbckmgkdck4ljvjvk.apps.googleusercontent.com"});
  });

function loadClient() {
    gapi.client.setApiKey("AIzaSyBKE9MzjNBkMIf3eyh69uYo8aDBc3VD_5o");
    return gapi.client.load("https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest")
        .then(function() { console.log("GAPI client loaded for API"); },
              function(err) { console.error("Error loading GAPI client for API", err); });
  }


function getPlayerID(){
    var playerid = document.getElementById("playerid").value;
    return playerid;
}

  //var playlistCount;
var firestore = firebase.firestore();  //grab ref to firestore
var songRef = firestore.collection(getPlayerID());

const outputHeader = document.querySelector("#headerTest");
const inputTextField = document.querySelector("#searchTextField");

searchButton.addEventListener("click", function() {
    const ytSearchQuery = inputTextField.value;
    searchYouTube(ytSearchQuery);
})

function modModal (response){
    const searchResultList = document.querySelector('#searchResultList');
    searchResultList.innerHTML = '';//clear results from previous search.

    var i, title, videoID, thumbnails,titleTextNode;
    
    var ul = document.createElement('ul');
    searchResultList.appendChild(ul);

    for (i=0;i<response.result.items.length; i++){
        title = response.result.items[i].snippet.title;
        videoID = response.result.items[i].id.videoId;
        thumbnails = response.result.items[i].snippet.thumbnails.default.url;
        testres =  response.result.items[i];
        var li = document.createElement('li');
        ul.appendChild(li);
        
        titleTextNode = document.createTextNode(title);

        var button=document.createElement('input');
        button.setAttribute('type','button');
        button.setAttribute('value', 'Play ' + title);
        button.setAttribute('onclick','addSongToTRDB(ytSearchResults.result.items['+ i +'])');

        var img = document.createElement('img');
        img.setAttribute("src", thumbnails);
        img.setAttribute("style","padding:2%")
        li.appendChild(img);
        li.appendChild(button);
    }
}

  function searchYouTube(ytQuery) {
    console.log(ytQuery);
    return gapi.client.youtube.search.list({
        "part"              : "snippet",
        "maxResults"        : 5,
        "q"                 : ytQuery,
        "type"              : "video",
        "videoCategoryId"   : 10 //locks down search results to music related results
    })
        .then(function(response) {
            ytSearchResults = response;
            modModal(ytSearchResults);
        },
            function(err) { console.error("Execute error", err); });
  }
  
  function addSongToTRDB(selectedSong){
    $('#ytSearchResultModal').modal('hide');

    var selSongTitle = selectedSong.snippet.title;
    var selVideoID = selectedSong.id.videoId;
    var selThumbnails = selectedSong.snippet.thumbnails.default.url;

    var query = songRef.where("position", ">=", 0); //returns count of unplayed songs including currently playing

    query.get().then(snap => {
        size = snap.size
        console.log("Active songs in playlist : "+ snap.size);
        
        songRef.add({
            position    : size,
            songTitle   : selSongTitle,
            videoID     : selVideoID,
            thumbnails  : selThumbnails,
            vidArray    : selectedSong
        })
        .then(function(songRef) {
            console.log("Document written with ID: ", songRef.id);
        })
        .catch(function(error) {
            console.error("Error updating playlist with adding song document: ", error);
        });

    });

  }

//Playlist functions below

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