const API_KEY = 'PRIVATE_REDACTED';
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
const SPREADSHEET_ID = '1ASmvEhb9O-CqZ1PLzEVGSJos36tfGcxiSWEBG_GxnkM';
const SPREADSHEET_TAB_NAME = 'Students';

function onGAPILoad() {
  gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: DISCOVERY_DOCS,
  }).then(function () {
    console.log('gapi initialized')
  }, function(error) {
    console.log('error', error)
  });
}

user_email = "unknown";
chrome.identity.getProfileUserInfo(function(userInfo) {
  user_email = userInfo.email;
});

// This listener gets called when the injected code calls chrome.runtime.sendMessage()
chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    // Get token
    chrome.identity.getAuthToken({interactive: true}, function(token) {
      // Set token in GAPI library
      gapi.auth.setToken({
        'access_token': token,
      });

      var date = new Date();
      // Example: "2011-10-05T14:48:00.000Z" -> "2011-10-05 14:48:00.000"
      var dateParts = date.toISOString().split(/[TZ]/, 2)
      var dateString = dateParts[0] + ' ' + dateParts[1];

      const body = {values: [[
        dateString,
        user_email,
        request.path,
        request.time,
        request.button,
        request.comment,
        request.paragraph
      ]]};

      // Append values to the spreadsheet
      gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: SPREADSHEET_TAB_NAME,
        valueInputOption: 'USER_ENTERED',
        resource: body
      }).then((response) => {
        console.log(`${response.result.updates.updatedCells} cells appended.`)
        sendResponse({success: true});
      });
    })

    return true;
  }
);
