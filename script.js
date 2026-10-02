// =====================================================
// ScamShield - frontend
// Connects the page to backend/server.js
// =====================================================


// ---------- 1. Get page elements ----------

var messageBox = document.getElementById("message");
var linkBox = document.getElementById("link");
var sampleBtn = document.getElementById("sampleBtn");
var analyzeBtn = document.getElementById("analyzeBtn");
var statusMessage = document.getElementById("status");

var languageSelect = document.getElementById("language");
var langStatus = document.getElementById("langStatus");

var audioInput = document.getElementById("audioFile");
var audioBtn = document.getElementById("audioBtn");
var audioStatus = document.getElementById("audioStatus");
var audioBadge = document.querySelector(".badge");

var BACKEND_URL = "http://localhost:3000";


// ---------- 2. All English page text ----------

var UI_TEXT = {
  en: {
    heading: "Think Before You Invest.",
    intro: "Check suspicious investment messages, links and offers before taking action.",
    labelLanguage: "Language",
    labelMessage: "Message",
    placeholderMessage: "Paste a suspicious message here…",
    sample: "Try a sample scam message",
    labelLink: "Link (optional)",
    placeholderLink: "Paste a suspicious link here…",
    analyze: "Analyze for Risk",

    audioTitle: "Got a suspicious call recording?",
    audioHelp: "Choose a recording of the call.",
    audioBadge: "Coming soon",
    labelAudio: "Audio file",
    audioAnalyze: "Analyze recording",

    note: "ScamShield provides educational risk signals. It does not provide investment advice.",

    translating: "Translating...",
    translateFailed: "Could not translate the page. It is shown in English.",
    analyzing: "Analyzing...",
    emptyInput: "Please paste a message or link to analyze.",
    noConnection: "Could not connect to ScamShield backend.",

    level_low: "LOW RISK",
    level_medium: "MEDIUM RISK",
    level_high: "HIGH RISK",

    scoreLabel: "Risk Score",
    headingRisk: "Potential risk detected",
    headingNoRisk: "No major warning signs detected",
    noSigns: "No major warning signals were detected. This does not guarantee that the message is safe.",

    whyHeading: "Why this looks suspicious",
    stayHeading: "Stay safe",

    tip1: "Do not transfer money until independently verified.",
    tip2: "Do not share OTP, PIN, passwords or banking information.",
    tip3: "Verify the organization through an independent official source.",
    tip4: "Talk to someone you trust before acting on an offer.",

    notePrefix: "Note:",

    limits: "This check looks for keywords and cannot understand context. It shows potential risk only and is not proof that something is or is not a scam.",
    limitsAI: "This analysis is made by AI and can make mistakes. It shows potential risk only and is not proof that something is or is not a scam.",

    notTranslated: "Some explanations could not be translated and are shown in English.",

    audioChoose: "Please choose an audio file first.",
    audioTooBig: "This file is too big. Please choose a file under 25 MB.",
    audioNeedsSetup: "Audio analysis is not set up on the server yet.",
    audioSending: "Sending your recording for speech-to-text...",
    audioDone: "Done. The text from the recording was put in the message box.",
    audioNoSpeech: "No speech was found in this recording.",
    audioFailed: "Could not turn this recording into text. Please try again."
  }
};


// ---------- 3. Get translated text ----------

function t(key) {
  var lang = languageSelect.value;

  if (UI_TEXT[lang] && UI_TEXT[lang][key]) {
    return UI_TEXT[lang][key];
  }

  return UI_TEXT.en[key] || key;
}


// ---------- 4. Apply language to the page ----------

function applyLanguage() {

  document.documentElement.lang = languageSelect.value;

  var textItems = document.querySelectorAll("[data-i18n]");

  for (var i = 0; i < textItems.length; i++) {

    var key = textItems[i].getAttribute("data-i18n");

    textItems[i].textContent = t(key);
  }


  var placeholderItems =
    document.querySelectorAll("[data-i18n-placeholder]");

  for (var j = 0; j < placeholderItems.length; j++) {

    var placeholderKey =
      placeholderItems[j].getAttribute("data-i18n-placeholder");

    placeholderItems[j].placeholder = t(placeholderKey);
  }
}


// ---------- 5. Translate page ----------

async function fetchTranslation(language) {

  var response = await fetch(
    BACKEND_URL + "/translate",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        language: language,
        texts: UI_TEXT.en
      })
    }
  );


  if (!response.ok) {
    throw new Error("Translation failed");
  }


  var data = await response.json();

  return data.texts;
}


// ---------- 6. Language dropdown ----------

languageSelect.addEventListener("change", async function () {

  var lang = languageSelect.value;


  // Clear old results

  var oldResults = document.getElementById("results");

  if (oldResults) {
    oldResults.innerHTML = "";
  }


  statusMessage.textContent = "";
  audioStatus.textContent = "";
  langStatus.textContent = "";


  // English needs no API call

  if (lang === "en") {

    applyLanguage();

    return;
  }


  // If we don't already have this language

  if (!UI_TEXT[lang]) {

    langStatus.textContent = t("translating");

    languageSelect.disabled = true;

    try {

      UI_TEXT[lang] = await fetchTranslation(lang);

      langStatus.textContent = "";

    } catch (error) {

      console.log("Translation failed:", error);

      langStatus.textContent = t("translateFailed");

    }

    languageSelect.disabled = false;
  }


  applyLanguage();
});


// ---------- 7. Create HTML elements safely ----------

function makeEl(tag, className, text) {

  var el = document.createElement(tag);

  if (className) {
    el.className = className;
  }

  if (text !== undefined) {
    el.textContent = text;
  }

  return el;
}


// ---------- 8. Results box ----------

function getResultsBox() {

  var box = document.getElementById("results");

  if (!box) {

    box = makeEl("section", "results");

    box.id = "results";

    var audioCard = document.getElementById("audioCard");

    audioCard.parentNode.insertBefore(box, audioCard);
  }

  return box;
}


// ---------- 9. Show analysis results ----------

function showResults(result) {

  var box = getResultsBox();

  box.innerHTML = "";


  // Score

  var top = makeEl("div", "score-row");

  top.appendChild(
    makeEl(
      "p",
      "score",
      t("scoreLabel") + ": " + result.score + "/100"
    )
  );


  top.appendChild(
    makeEl(
      "span",
      "level " + result.level,
      t("level_" + result.level)
    )
  );


  box.appendChild(top);


  // Progress bar

  var bar = makeEl("div", "bar");

  var fill = makeEl(
    "div",
    "bar-fill " + result.level
  );

  fill.style.width = result.score + "%";

  bar.appendChild(fill);

  box.appendChild(bar);


  // Main risk heading

  if (result.level === "low") {

    box.appendChild(
      makeEl(
        "h2",
        "risk-heading",
        t("headingNoRisk")
      )
    );

  } else {

    box.appendChild(
      makeEl(
        "h2",
        "risk-heading",
        t("headingRisk")
      )
    );
  }


  // Why suspicious

  box.appendChild(
    makeEl(
      "h2",
      "",
      t("whyHeading")
    )
  );


  if (!result.details || result.details.length === 0) {

    box.appendChild(
      makeEl(
        "p",
        "",
        t("noSigns")
      )
    );

  } else {

    var list = makeEl("ul", "signs");


    for (var i = 0; i < result.details.length; i++) {

      var sign = result.details[i];

      var item = makeEl("li");


      item.appendChild(
        makeEl(
          "strong",
          "",
          sign.name + " (+" + sign.points + ")"
        )
      );


      item.appendChild(
        makeEl(
          "span",
          "detail",
          sign.found
        )
      );


      item.appendChild(
        makeEl(
          "span",
          "why",
          sign.why
        )
      );


      list.appendChild(item);
    }


    box.appendChild(list);
  }


  // Backend notes

  if (result.notes) {

    for (var n = 0; n < result.notes.length; n++) {

      box.appendChild(
        makeEl(
          "p",
          "extra-note",
          t("notePrefix") + " " + result.notes[n]
        )
      );
    }
  }


  // Safety tips

  box.appendChild(
    makeEl(
      "h2",
      "",
      t("stayHeading")
    )
  );


  var tips = [
    t("tip1"),
    t("tip2"),
    t("tip3"),
    t("tip4")
  ];


  var tipList = makeEl("ul", "tips");


  for (var k = 0; k < tips.length; k++) {

    tipList.appendChild(
      makeEl(
        "li",
        "",
        tips[k]
      )
    );
  }


  box.appendChild(tipList);


  // Honest explanation of the engine

  if (result.engine === "ai") {

    box.appendChild(
      makeEl(
        "p",
        "extra-note",
        t("limitsAI")
      )
    );

  } else {

    box.appendChild(
      makeEl(
        "p",
        "extra-note",
        t("limits")
      )
    );
  }


  box.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


// ---------- 10. Sample message ----------

sampleBtn.addEventListener("click", function () {

  messageBox.value =
    "Congratulations! You've been selected for our private VIP trading group. " +
    "Our AI bot guarantees 30% returns every week with zero risk. " +
    "Deposit just $250 today to unlock your spot. Only 3 places left, offer ends in 2 hours!";


  linkBox.value =
    "http://vip-profit-signals.top/join";


  statusMessage.textContent = "";
});


// ---------- 11. Analyze button ----------

async function runAnalysis() {

  var message = messageBox.value.trim();

  var link = linkBox.value.trim();


  if (message === "" && link === "") {

    statusMessage.textContent =
      t("emptyInput");

    var old = document.getElementById("results");

    if (old) {
      old.innerHTML = "";
    }

    return;
  }


  statusMessage.textContent =
    t("analyzing");

  analyzeBtn.disabled = true;


  try {

    var response = await fetch(
      BACKEND_URL + "/analyze",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          message: message,
          link: link,
          language: languageSelect.value
        }),

        signal: AbortSignal.timeout(120000)
      }
    );


    if (!response.ok) {
      throw new Error(
        "Backend returned " + response.status
      );
    }


    var result = await response.json();


    console.log("Analysis result:", result);


    showResults(result);

    statusMessage.textContent = "";


  } catch (error) {

    console.error("Analysis error:", error);

    statusMessage.textContent =
      t("noConnection");
  }


  analyzeBtn.disabled = false;
}


analyzeBtn.addEventListener(
  "click",
  runAnalysis
);


// ---------- 12. Audio ----------

audioBtn.addEventListener(
  "click",
  async function () {

    if (audioInput.files.length === 0) {

      audioStatus.textContent =
        t("audioChoose");

      return;
    }


    var file = audioInput.files[0];


    if (file.size > 25 * 1024 * 1024) {

      audioStatus.textContent =
        t("audioTooBig");

      return;
    }


    audioStatus.textContent =
      t("audioSending");

    audioBtn.disabled = true;


    try {

      var response = await fetch(
        BACKEND_URL + "/transcribe",
        {
          method: "POST",

          headers: {
            "Content-Type":
              file.type || "application/octet-stream",

            "X-File-Name":
              encodeURIComponent(file.name)
          },

          body: file,

          signal: AbortSignal.timeout(150000)
        }
      );


      if (response.status === 503) {

        audioStatus.textContent =
          t("audioNeedsSetup");

        audioBtn.disabled = false;

        return;
      }


      if (!response.ok) {
        throw new Error("Transcription failed");
      }


      var data = await response.json();


      if (!data.text || data.text.trim() === "") {

        audioStatus.textContent =
          t("audioNoSpeech");

        audioBtn.disabled = false;

        return;
      }


      // Put transcript into message box

      messageBox.value = data.text;


      audioStatus.textContent =
        t("audioDone");


      // Analyze transcript

      await runAnalysis();


    } catch (error) {

      console.error("Audio error:", error);

      audioStatus.textContent =
        t("audioFailed");
    }


    audioBtn.disabled = false;
  }
);


// ---------- 13. Check backend status ----------

async function checkBackendStatus() {

  try {

    var response = await fetch(
      BACKEND_URL + "/status"
    );


    if (!response.ok) {
      throw new Error("Status request failed");
    }


    var status = await response.json();


    console.log("Backend status:", status);


    // If audio is connected, remove Coming soon badge

    if (status.audio && audioBadge) {

      audioBadge.style.display = "none";
    }


  } catch (error) {

    console.log(
      "Could not check backend status."
    );
  }
}


// ---------- 14. Page startup ----------

applyLanguage();

checkBackendStatus();