/**
 * The approval window. SheetConsole opens it, in a small window of its own,
 * when the user asks to allow a spreadsheet. It shows Google's file chooser,
 * already pointing at that spreadsheet; choosing it there is what lets
 * SheetConsole use the file. Then it tells SheetConsole, which closes the
 * window and carries on.
 *
 * SheetConsole hands over two things in the address:
 *   ?file=<ID>     the spreadsheet to point the chooser at;
 *   #token=<pass>  SheetConsole's own pass from Google, so the user isn't
 *                  asked to sign in a second time. It sits after "#", the part
 *                  of an address a browser never sends to the website.
 */


// The key for Google's file chooser, limited in Google Cloud to this website
// and to the chooser - so it's safe to show here.
const API_KEY = 'AIzaSyC6VQb4RLQbUbyX5bww3daOcGvxN6jFzxg';

// SheetConsole's Google Cloud project number. A file chosen with it becomes
// usable by that project - and so by SheetConsole, which belongs to it.
const APP_ID = '754574846118';

// Room left, across and down, for the border Google draws around its chooser.
const CHOOSER_BORDER = 32;

// SheetConsole's ID in the Chrome Web Store, to send it the news.
const EXTENSION_ID = 'kehadelpnliejfajoffbfmijffdfhdcd';


const fileId = new URLSearchParams(location.search).get('file');
const token = new URLSearchParams(location.hash.slice(1)).get('token');
const status = document.getElementById('status');
const againButton = document.getElementById('again');

// Take the pass out of the address bar and the window's history at once.
history.replaceState(null, '', location.pathname + location.search);


if (!fileId || !token) {
  status.textContent = 'Open this page from SheetConsole, with "Allow this spreadsheet".';
} else {
  gapi.load('picker', showPicker);
}

againButton.addEventListener('click', showPicker);


// The chooser, pointing at the one spreadsheet, so the user only has to
// confirm it.
function showPicker() {
  againButton.hidden = true;
  status.textContent = "Opening Google's file chooser…";
  const view = new google.picker.DocsView(google.picker.ViewId.SPREADSHEETS)
    .setFileIds(fileId);
  new google.picker.PickerBuilder()
    .addView(view)
    .setOAuthToken(token)
    .setDeveloperKey(API_KEY)
    .setAppId(APP_ID)
    // Fill the window, so the chooser is all the user sees - not a box
    // floating in an empty page. Google draws a border around the size asked
    // for, so a little is held back for it.
    .setSize(window.innerWidth - CHOOSER_BORDER, window.innerHeight - CHOOSER_BORDER)
    .setCallback(onChooserDone)
    .build()
    .setVisible(true);
}


function onChooserDone(data) {
  if (data.action === google.picker.Action.PICKED) {
    // Chrome only lets this page reach SheetConsole if SheetConsole is
    // installed and has named this website as allowed to; otherwise the user
    // just closes the window themselves.
    if (window.chrome?.runtime?.sendMessage) {
      status.textContent = 'Allowed. Returning to SheetConsole…';
      chrome.runtime.sendMessage(EXTENSION_ID, { type: 'file-allowed', fileId: data.docs[0].id });
    } else {
      status.textContent = 'Allowed. You can close this window.';
    }
  } else if (data.action === google.picker.Action.CANCEL) {
    status.textContent = "Nothing was allowed. SheetConsole can't use this spreadsheet until it is.";
    againButton.hidden = false;
  }
}
