
function onFailure(error) {
    document.getElementById("searchTextField").hidden = true;
    document.getElementById("searchButton").hidden = true;
    alert("Login failure - need to sign in first");
    console.log(error);
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

  function onSuccess(googleUser){
    var profile = googleUser.getBasicProfile();
    alert("Hello " + profile.getGivenName() + ".  You're now logged in.");
    console.log('Logged in as: ' + googleUser.getBasicProfile().getName());
    console.log("ID: " + profile.getId());
    console.log('Full Name: ' + profile.getName());
    console.log('Given Name: ' + profile.getGivenName());
    console.log('Family Name: ' + profile.getFamilyName());
    console.log("Image URL: " + profile.getImageUrl());
    console.log("Email: " + profile.getEmail());

    document.getElementById("searchTextField").hidden = false;
    document.getElementById("searchButton").hidden = false;
}