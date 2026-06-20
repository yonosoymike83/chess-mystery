let puzzle;
let board;
let game;
let currentStep = 0;

let language = localStorage.getItem("language");

if (!language) {

const browserLang =
    navigator.language.toLowerCase();

if (browserLang.startsWith("ca")) {

    language = "ca";

} else if (browserLang.startsWith("en")) {

    language = "en";

} else {

    language = "es";
}

}

const translations = {

es: {
    pending: "Pendiente",
    wrong: "❌ No es la solución",
    solvedTitle: "✅ Puzzle resuelto",
    copyButton: "📋 Copiar coordenadas"
},

ca: {
    pending: "Pendent",
    wrong: "❌ No és la solució",
    solvedTitle: "✅ Puzle resolt",
    copyButton: "📋 Copiar coordenades"
},

en: {
    pending: "Pending",
    wrong: "❌ Not the solution",
    solvedTitle: "✅ Puzzle solved",
    copyButton: "📋 Copy coordinates"
}

};

function t(key) {

return translations[language][key];

}

function setLanguage(lang) {

localStorage.setItem(
    "language",
    lang
);

location.reload();

}

async function loadPuzzle() {

const id =
    new URLSearchParams(
        location.search
    ).get("p") || "cache01";

const response =
    await fetch(
        `puzzles/${id}.json`
    );

puzzle =
    await response.json();

document.getElementById(
    "title"
).textContent =
    puzzle.title[language];

document.getElementById(
    "description"
).textContent =
    puzzle.description[language];

document.getElementById(
    "status"
).textContent =
    t("pending");

document.querySelector(
    "#success h2"
).textContent =
    t("solvedTitle");

document.getElementById(
    "copyBtn"
).textContent =
    t("copyButton");

game =
    new Chess(
        puzzle.fen
    );

await customElements.whenDefined(
    "chess-board"
);

board =
    document.getElementById(
        "board"
    );

board.position =
    game.fen();

board.draggablePieces = true;

board.addEventListener(
    "drop",
    handleMove
);

document
    .getElementById(
        "copyBtn"
    )
    .addEventListener(
        "click",
        copyCoords
    );

}

function resetBoard() {

currentStep = 0;

game =
    new Chess(
        puzzle.fen
    );

board.position =
    game.fen();

document.getElementById(
    "status"
).style.display =
    "block";

document.getElementById(
    "status"
).textContent =
    t("pending");

}

function handleMove(event) {

const from =
    event.detail.source;

const to =
    event.detail.target;

const move =
    game.move({
        from,
        to,
        promotion: "q"
    });

if (!move) {

    setTimeout(() => {

        board.position =
            game.fen();

    }, 10);

    return;
}

if (puzzle.moves) {

    const expectedMove =
        puzzle.moves[
            currentStep
        ];

    if (
        move.san !==
        expectedMove
    ) {

        document.getElementById(
            "status"
        ).textContent =
            t("wrong");

        setTimeout(
            resetBoard,
            1000
        );

        return;
    }

    currentStep++;

    board.position =
        game.fen();

    if (
        currentStep >=
        puzzle.moves.length
    ) {

        solvePuzzle();

        return;
    }

    const reply =
        puzzle.moves[
            currentStep
        ];

    setTimeout(() => {

        game.move(
            reply
        );

        board.position =
            game.fen();

        currentStep++;

        if (
            currentStep >=
            puzzle.moves.length
        ) {

            solvePuzzle();
        }

    }, 500);

    return;
}

const solved =

    typeof puzzle.solution ===
    "string"

        ? move.san ===
          puzzle.solution

        : (
            from ===
                puzzle.solution.from &&
            to ===
                puzzle.solution.to
        );

if (solved) {

    solvePuzzle();

    return;
}

document.getElementById(
    "status"
).textContent =
    t("wrong");

setTimeout(
    resetBoard,
    500
);

}

function solvePuzzle() {

document.getElementById(
    "status"
).style.display =
    "none";

document.getElementById(
    "success"
).classList.remove(
    "hidden"
);

document.getElementById(
    "coordinates"
).innerHTML =
    `<p>${puzzle.coordinates.lat} ${puzzle.coordinates.lon}</p>`;

}

function copyCoords() {

navigator.clipboard.writeText(
    document.getElementById(
        "coordinates"
    ).innerText.trim()
);

const btn =
    document.getElementById(
        "copyBtn"
    );

btn.textContent =
    "📋 ✓";

setTimeout(() => {

    btn.textContent =
        t("copyButton");

}, 2000);

}

window.onload =
loadPuzzle;
