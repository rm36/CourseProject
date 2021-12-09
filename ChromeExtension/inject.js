// This is the extension ID, which is how we communicate to the background service script.
EXTENSION_ID='bcmmfbhmdobcnadaoambmolgbojijlgc'

function modifyPage() {
  var elements = document.getElementsByClassName('rc-VideoMiniPlayer');
  if (elements.item(0) == null) {
    console.log("Waiting for the page to load completely...");
    setTimeout(function() { modifyPage(); }, 3000);
    return;
  }
  console.log('Found video: ' + elements.item(0));

  const div = document.createElement('div');
  div.className = 'cds-1 ItemLecture_Video_Feedback css-yvk02a cds-2 cds-3 cds-grid-item cds-48';
  div.innerHTML = `
  <div class="cds-1 css-0 cds-3 cds-grid-item">
    <input type="text" cols="40" style="width:400px; height:40px;"
      class="sentiment-comments" id="sentiment-feedback" value="" />
  </div>
  `;
  div.appendChild(addButton('(' + sendMsgToBackgroundFn + ')("cool")',     "Cool!"));
  div.appendChild(addButton('(' + sendMsgToBackgroundFn + ')("well")',     "Going well"));
  div.appendChild(addButton('(' + sendMsgToBackgroundFn + ')("easy")',     "Too easy"));
  div.appendChild(addButton('(' + sendMsgToBackgroundFn + ')("confused")', "Huh?"));

  elements.item(0).appendChild(div);
}

function addButton(functionToRun, text) {
  var button = document.createElement('button');
  button.setAttribute('onclick', functionToRun);
  button.setAttribute('class', "cds-134 cds-105 cds-107 css-scjjcy cds-116 cds-button-disableElevation");
  var span_button = document.createElement('span');
  span_button.setAttribute('class', "cds-106 cds-button-label");
  span_button.textContent = text;
  button.appendChild(span_button);
  return button;
}

var sendMsgToBackgroundFn = function buttonFunction(buttonKind) {
  function getVideoPath() {
    var path = ""
    Array.from(document.getElementsByClassName("breadcrumb-title")).forEach(
        function(element, index, array) {
            if (path != "") {
              path += " > "
            }
            path += element.innerText
        }
    );
    console.log('Path retrieved: ' + path);
    return path
  }

  function getPlaybackTime() {
    var timeSpan = document.getElementsByClassName('current-time-display');
    timeSpanText = timeSpan.item(0).innerText;
    return timeSpanText;
  }

  function getInputField() {
    return document.getElementById("sentiment-feedback").value;
  }

  function getParagraph() {
    // Get the parent <div> of the currently highlighted transcript phrase (marked as class=active).
    var activeDiv = document.getElementsByClassName('rc-Phrase active');
    var paragraphDiv = activeDiv.item(0).parentNode;
    var paragraph = "";
    Array.from(paragraphDiv.childNodes).forEach(
      function(element, index, array) {
        var innerText = element.getElementsByTagName('span')[0].innerHTML;
        if (paragraph != "") {
          paragraph += " "
        }
        paragraph += innerText
      }
    );

    // Uncomment for debugging. Warning: much text.
    // console.log('Paragraph retrieved: ' + paragraph);
    return paragraph;
  }

  var data = {
    type: "REQUEST",
    path: getVideoPath(),
    time: getPlaybackTime(),
    button: buttonKind,
    comment: getInputField(),
    paragraph: getParagraph()
  }
  window.postMessage(data, "*");

  // Once the message is posted, clear the comment input field.
  document.getElementById("sentiment-feedback").value = '';
};

// Listen to message events from the buttons. This function will call the background code.
window.addEventListener("message", function(event) {
    // We only accept messages from ourselves
    if (event.source != window)
        return;

    if (event.data.type && (event.data.type == "REQUEST")) {
      // Remove this line to avoid alerting the user.
      alert("Attempting to sent: " +
        "\npath:" + event.data.path + ", " +
        "\ntime:" + event.data.time + ", " +
        "\nbutton:" + event.data.button + ", " +
        "\ncomment:" + event.data.comment + ", " +
        "\nparagraph:" + event.data.paragraph);
      chrome.runtime.sendMessage(EXTENSION_ID, event.data, function(response) {
        if (response && response.success) {
          console.log('success!');
        }
      });
    }
});

// Wait 5 seconds to start modifying the page. This will be called again until the element needed is found.
// This is needed because for some reason, Coursera re-loads everything and the injected input/buttons get deleted.
setTimeout(function() { modifyPage(); }, 5000);

