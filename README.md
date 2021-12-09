# CS410 FINAL PROJECT

Sections:
- Overview
- How it works
- How to test
- Example run

## Overview

Abstract: MOOCs will come with an integrated course chat, for a more integrated cohesive system where students may post questions in real time (as people sometimes do in twitch or youtube live), and they are linked to the video lecture's timestamp. This can help them communicate with other students, e.g. as a student, seeing a classmate's sentiments could help them feel less isolated, feel understood and optionally reading through students' concerns about the material is enlightening, without having to open another tool. As a teacher, this can provide valuable feedback to improve. This project will analyze real-time video-synced students' comments on any given lecture to provide insight on which phrases are confusing, helpful or make students feel in any given way to incorporate into the current communication or future lectures.

The project is split into two portions:
1. The coursera.org chrome extension. This portion can be tested up to some degree (optional).
2. The LDA association for the feedback. This portion is run in a command line and can be tested.

The main idea is that while the students are watching lectures in coursera, their feedback can be immediately saved in a shared table. The feedback includes:
1. The date and time of the feedback.
2. The user's identifier: their email.
3. The video they're watching. This includes the class, module and video name.
4. The moment in the video they submitted the feedback.
5. The kind of feedback they left.
6. The free-form text comments if any.
7. The transcribed text of the lecture at the moment in the video they submitted the feedback.

And all of this is done with only 1-2 inputs from the user: their comment (optional) and the click of a button.
Then this data can be associated with the lectures for the professor to understand their students' feedback.

## How it works

### Chrome extension
All the code tries to be self-explanatory via structure, naming and comments, but it's not obvious how it works in combination, hence the explanation of each file's purpose:

- The file `manifest.json` declares the script info, and also that it'll run a script called inject when the user navigates to coursera.org, and will run a background site `background.html` which just calls `background.js`.
- The file `inject.js` will run after the page is loaded, and then wait until the "VideoMiniPlayer" is loaded in order to inject the feedback input and buttons. The buttons have a script which sends a message to an event listener and this will in turn call the background script. All of this is done in order to call complicated API calls such as updating a Google sheet.
  - The buttons copy the css style from the other buttons, which is why they look so similar. On click, they look through the entire html document to find all of the relevant data to scrap:
    - The video path is under spans with the class=breadcrumb-title. They're joined with " > "
    - The playback time is under a span with the class=current-time-display.
    - The input comment is found by the id=sentiment-feedback. 
    - The current transcript paragraph is the one with a phrase marked as class=active. Then the script looks for its siblings by looking up all the children of its parents, and concatenating all the phrases.
- The file `background.js` tries to get the Google API permissions in order to successfully make calls to the spreadsheets API. When it starts, it tries to get the email of the user logged in to Chrome. Then it sets up a listener for messages from the injected code, and when it gets one, it bundles everything together in an array, and tries to call the spreadsheets API to append it to the sheet whose ID is hardcoded.

### LDA association
The script `compute_topics.py` is more straight-forward to read because it's a single file. It loads all of the transcripts and separates it into different sections (videos), which is assumed that they are generated from a single topic. A dictionary is created from all the words in the transcript, and then LDA is run with a fixed number of topics (10). This could vary but it should depend on the class, and let's keep in mind that it's not necessarily intended to represent the actual topics defined by the teacher, but rather to understand topic associations between videos in different weeks in case that the professor connected topics in a lecture.

The filtering done is the following:
- From the lemmatized tokens, use only the ones which aren't short words or very common, that are at least twice in the corpus, but not in more than 25% of the lectures.
Then the corpus and the student's document are converted to bag-of-words and LDA runs on top of it with specific parameters. After tweaking the filtering and some parameters, they were left with a fixed random seed because the results represented different topics appropriately.

After LDA analysis is done, the results are sorted in decreasing probability and printed to the user for interpretation.

## How to test
### Chrome extension (optional, without sheets integration)

The implementation of the first portion is a chrome extension loaded from my local computer. It may be used by any tester but it's complicated to set up due to google permissions due to privacy (unless it's published). And for the same reason, the oauth client ID and API key are redacted as PRIVATE_REDACTED in the code, but they were obtained from my personal Google console for the whole integration to work in the demo.
If you still want to try it out but without the Google sheets integration, follow the following steps to install:

- Copy the ProjectLda folder locally.
- Navigate to chrome://extensions/ and enable developer mode in the top right.
- Clic on 'Load unpacked' and select the directory you just copied.
- Copy the extension ID (looks like 'nfhkhbdalcjdfefebiijigodllnnonfi') and replace the top line of inject.js.
- Go back to chrome://extensions/ and refresh the extension.
- Navigate to any coursera video and after it loads, if the feedback buttons aren't there, refresh the page.
- Play the video and at some point submit feedback. An alert will show you what would be sent to the spreadsheet if it was set up with API keys.

### LDA association
This one is easier, first to setup dependencies, run:
`pip install gensim termcolor nltk`
Then run the command:
`python compute_topics.py easy_lecture_transcript_for_student.txt`
You should see associations from the transcript of all the sections of the lectures that this particular student found easy and their probability scores. Alternatively, feel free to run any section of the lectures and test it to see its match!

## Example run

### Output
This is an example output from the script:
```
Topic 5: p=0.9784311
Topic 0: p=0.010926375
Topic 2: p=0.010264926
The best topic match was number 5 with 0.978 probability.
These are the word probabilities for that topic:
0.048*"rating" + 0.046*"aspect" + 0.037*"prior" + 0.022*"hotel" + 0.021*"reviewer" + 0.011*"sport" + 0.011*"preference" + 0.010*"plsa" + 0.010*"posterior" + 0.010*"latent"
```
### Interpretation
Notice that for easy_lecture_transcript_for_student.txt it's very certain that it belongs to that topic, and the reason is that the topic clearly is about PLSA, ratings, etc. which corresponds clearly to the topic in the text file, which is from the LDA lecture.
When running the script with the topics that were confusing to this student, the topics aren't as clear-cut because they were taken from topics not extremely related to the topic of the video! Then this could tell the professor that a topic seen previously wasn't mastered by the student and it's worth it to follow up with them to review that topic. If the student can see this, they can also individually improve their understanding by looking at the topic associations.

