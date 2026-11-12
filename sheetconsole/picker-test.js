/**
 * Test of the drive.file plan: sign in on this page, then pick one spreadsheet in
 * Google's file chooser. Picking it is what gives SheetConsole's Google Cloud
 * project access to that one file - the question the test answers is whether the
 * extension, which belongs to the same project, can then use it too.
 *
 * The spreadsheet's ID comes from the address: picker-test.html?file=<ID>.
 */


// The project's web sign-in client and its key for the file chooser, both
// limited to this website in Google Cloud - so they're safe to show here.
const CLIENT_ID = '754574846118-jfjcv9i3hr29amq6iit5rpg07rns7ohk.apps.googleusercontent.com';
const API_KEY = 'AIzaSyC6VQb4RLQbUbyX5bww3daOcGvxN6jFzxg';

// The project number. The chooser grants access to the project with this
// number, which is what lets the extension (same project) use the file.
const APP_ID = '754574846118';

// Only the files the user chooses - not all their spreadsheets.
const SCOPE = 'https://www.googleapis.com/auth/drive.file';


const fileId = new URLSearchParams(location.search).get('file');
const fileIdLine = document.getElementById('file-id');
const chooseButton = document.getElementById('choose');
const result = document.getElementById('result');

fileIdLine.textContent = fileId ?? '(none - add ?file=<ID> to the address)';
chooseButton.disabled = !fileId;


chooseButton.addEventListener('click', () => {
  // Sign in first: the chooser needs a token to show the user's files.
  const tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPE,
    callback: (answer) => {
      if (answer.error) {
        result.textContent = `Sign-in failed: ${answer.error}`;
        return;
      }
      gapi.load('picker', () => showPicker(answer.access_token));
    },
  });
  tokenClient.requestAccessToken();
});


// The chooser, opened already pointing at the one spreadsheet, so the user only
// has to confirm it.
function showPicker(token) {
  const view = new google.picker.DocsView(google.picker.ViewId.SPREADSHEETS)
    .setFileIds(fileId);
  new google.picker.PickerBuilder()
    .addView(view)
    .setOAuthToken(token)
    .setDeveloperKey(API_KEY)
    .setAppId(APP_ID)
    .setCallback(onPicked)
    .build()
    .setVisible(true);
}


function onPicked(data) {
  if (data.action === google.picker.Action.PICKED) {
    result.textContent = `Chosen: ${data.docs[0].name}. Now run the check in the extension again.`;
  } else if (data.action === google.picker.Action.CANCEL) {
    result.textContent = 'Cancelled - nothing was chosen.';
  }
}
