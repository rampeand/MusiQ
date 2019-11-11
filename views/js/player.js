var tag = document.createElement('script');
    
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: '',
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerReady(event) {
  event.target.playVideo();
}

var done = false;
function onPlayerStateChange(event) {
  // if (event.data == YT.PlayerState.PLAYING && !done) {
  //   setTimeout(stopVideo, 6000);
  //   done = true;
  //   console.log("Video state changed.")
  // }

  if (event.data == YT.PlayerState.ENDED){
    //console.log("video ended");

    //update playlist elements
    //nextSong();
    endedState();
  }
 
}
function stopVideo() {
  player.stopVideo();
  //console.log(position);
}

function getYTVID(vidFromSearch) {
    playYTVID(vidFromSearch, 0);
}

function playYTVID(videoID, startTimeSec){
    player.loadVideoById(videoID, startTimeSec, "large");
}

function nextSong(){
  batchDecrementPlaylist();
  loadSong();
}

function prevSong(){
  batchIncrementPlaylist();
  loadSong();
}

function clearPlaylist(){
  player.stopVideo();

  batchClearPlaylist();
}
