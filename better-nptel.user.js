// ==UserScript==
// @name         BetterNPTEL
// @namespace    https://ujwl.in/
// @version      1.0
// @description  Adds extra features to the NPTEL website, including dark mode and mock assignment tests
// @author       ujjujjuj
// @match        https://onlinecourses.nptel.ac.in/*/unit
// @match        https://onlinecourses.nptel.ac.in/*/student/mentor
// @match        https://onlinecourses.nptel.ac.in/*/student/home
// @match        https://onlinecourses.nptel.ac.in/*/course
// @grant        GM_addStyle
// ==/UserScript==

const MOCK_TEST_KEY = "betternptel_mock_test_enabled";
let quiz_answers = [];

const mock_reset = () => {
  mock_setShowAns(false);
  document.querySelectorAll(".readonly-assessment input").forEach((inp) => {
    inp.checked = false;
    inp.disabled = false;
    inp.value = "";
  });
};

const mock_setShowAns = (shouldShow) => {
  const feedbackElems = document.querySelectorAll(
    ".qt-feedback:not(.qt-hidden)"
  );
  if (shouldShow) {
    const marked = Array.from(
      document.querySelectorAll(".gcb-question-row")
    ).map((row) =>
      Array.from(
        row.querySelectorAll("input:checked, input[type='number']")
      ).map((inp) => {
        if (inp.type === "number") {
          return inp.value.trim();
        } else {
          const txt = inp.parentElement
            .querySelector("label")
            .textContent.trim();
          if (txt.includes("MathJax")) {
            return inp.parentElement
              .querySelector("script[type='math/tex']")
              .textContent.trim();
          } else {
            return txt;
          }
        }
      })
    );

    const answers = marked.map(
      (arr, idx) =>
        arr.length === quiz_answers[idx].length &&
        arr.every((ans, idx2) => ans === quiz_answers[idx][idx2])
    );

    feedbackElems.forEach((fb, idx) => {
      const span = document.createElement("span");
      if (answers[idx]) {
        span.textContent = "Correct answer";
        span.style.color = "green";
      } else {
        span.textContent = `Incorrect, the correct answer is: ${quiz_answers[
          idx
        ].join(", ")}`;
        span.style.color = "red";
      }
      fb.insertAdjacentElement("beforeend", span);
    });

    const score = answers.filter((x) => x).length;
    alert(`You scored ${score} out of ${answers.length}`);
  } else {
    feedbackElems.forEach((fb) => (fb.innerHTML = ""));
  }
};

const mock_main = () => {
  const resetBtn = document.createElement("button");
  resetBtn.textContent = "Reset";
  resetBtn.addEventListener("click", mock_reset);

  const checkBtn = document.createElement("button");
  checkBtn.textContent = "Check answers";
  checkBtn.style.marginLeft = "8px";
  checkBtn.addEventListener("click", () => {
    mock_setShowAns(false);
    mock_setShowAns(true);
  });

  checkBtn.classList.add("gcb-button");
  resetBtn.classList.add("gcb-button");

  const quesDivs = document.querySelectorAll(".qt-question-group");
  const quesDiv = quesDivs[quesDivs.length - 1];
  quesDiv.insertAdjacentElement("afterend", resetBtn);
  resetBtn.insertAdjacentElement("afterend", checkBtn);

  quiz_answers = Array.from(
    document.querySelectorAll("div.faculty-answer")
  ).map((ans) => {
    if (ans.children.length === 0) {
      return [ans.textContent.replace(/^\(Type: Numeric\)/, "").trim()];
    } else {
      return Array.from(ans.querySelectorAll("label")).map((l) => {
        const txt = l.textContent.trim();
        if (txt.includes("MathJax")) {
          return l.querySelector("script[type='math/tex']").textContent.trim();
        } else {
          return txt;
        }
      });
    }
  });

  mock_reset();
};

(function () {
  "use strict";

  GM_addStyle(`
    body, #gcb-main-body, .gcb-aside, #video-transcript-container, .p1, .p2, .modal-header, .collapsible, .yui-wk-div {
      background-color: #121212 !important;
      color: #fbfbfa !important;
    }
    .gcb-col-12, .subunit_current, .subunit_other, .modal-body, .collapsible {
      background-color: #1b1816 !important;
    }
    .gcb-aside {
      border: 1px solid #fff2;
    }
    a {
      color: #fbfbfa !important;
    }
    #gcb-nav-left li {
      border-bottom: 1px solid #fff2;
    }
    .unit_heading {
      border-top: 1px solid #fff3;
    }
    .unit_heading:hover, .subunit_current:hover, .subunit_other:hover {
      background-color: #1b1816 !important;
      filter: brightness(150%);
    }
    #video-transcript-container {
      border: 1px solid #fff3;
    }
    #gcb-nav-x {
      background-color: #1b1816 !important;
      border-top: 1px solid #fff3;
      border-bottom: 1px solid #fff3;
    }
    code {
      background-color: #121212 !important;
      color: indianred !important;
    }
    .correct, .faculty-answer {
      color: #20C55F !important;
    }
    .dropdown-menu {
      background-color: #121212 !important;
    }
    .profileName {
      color: white !important;
    }
    a[target="_blank"] {
      color: lightblue !important;
    }

    #betternptel-toggle {
      font-size: 14px;
      outline: none;
      border: none;
      border-radius: 4px;
      background-color: indianred;
      color: white;
      margin-right: 12px;
      padding: 2px 8px;
      font-weight: 600;
    }
    #betternptel-toggle.on {
      background-color: #20C55F;
    }
    #betternptel-toggle:hover {
      filter: brightness(120%);
    }
    .top-navigation {
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }
  `);

  const swayamLogo = document.querySelector(".navbar-brand");
  if (swayamLogo) swayamLogo.remove();

  const newItemImage = document.querySelector(
    'img[src="https://storage.googleapis.com/swayam2-node/assets/gif/recommendation.gif"]'
  );
  if (newItemImage) newItemImage.remove();

  if (
    new URLSearchParams(window.location.search).has("assessment") &&
    Array.from(document.querySelectorAll("h1")).every(
      (elem) => !elem.textContent.includes("(Non Graded)")
    )
  ) {
    const insertPoint = document.querySelector(".top-navigation");
    if (insertPoint) {
      const isActivated = !!sessionStorage.getItem(MOCK_TEST_KEY);

      const btn = document.createElement("button");
      btn.id = "betternptel-toggle";
      btn.textContent = `Mock test mode: ${isActivated ? "ON" : "OFF"}`;
      if (isActivated) {
        btn.classList.add("on");
      }
      btn.addEventListener("click", () => {
        if (isActivated) {
          sessionStorage.removeItem(MOCK_TEST_KEY);
        } else {
          sessionStorage.setItem(MOCK_TEST_KEY, "1");
        }
        window.location.reload();
      });

      insertPoint.insertAdjacentElement("afterbegin", btn);

      if (isActivated) {
        mock_main();
      }
    }
  }
})();
