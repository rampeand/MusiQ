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
//var playlistCount;
var firestore = firebase.firestore();  //grab ref to firestore
var songRef = firestore.collection("playlist");

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

function authenticateAndLoadClient() {
    //authenticate();
    loadClient();
  }
  
  //OAuth to be implemented later
  function authenticate() {
    return gapi.auth2.getAuthInstance()
        .signIn({scope: "https://www.googleapis.com/auth/youtube.force-ssl"})
        .then(function() { console.log("Sign-in successful"); },
              function(err) { console.error("Error signing in", err); });
  }

function renderButton() {
    gapi.signin2.render('my-signin2', {
        'scope': 'profile email',
        'width': '240',
        'height': '50',
        'longtitle': true,
        'theme': 'dark',
        'onsuccess': onSuccess,
        'onfailure': onFailure
    });
}

function loadClient() {
    gapi.client.setApiKey("AIzaSyBKE9MzjNBkMIf3eyh69uYo8aDBc3VD_5o");
    return gapi.client.load("https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest")
        .then(function() { console.log("GAPI client loaded for API"); },
              function(err) { console.error("Error loading GAPI client for API", err); });
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