let puzzle;
let board;
let game;
let currentStep = 0;

let language =
    localStorage.getItem("language");

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


/* =========================================================
   TRADUCCIONES
   ========================================================= */

const translations = {

    es: {
        pending: "Pendiente",
        wrong: "❌ No es la solución",
        solvedTitle: "✅ Puzzle resuelto",
        copyButton: "📋 Copiar coordenadas",
        explanationTitle: "💡 Explicación"
    },

    ca: {
        pending: "Pendent",
        wrong: "❌ No és la solució",
        solvedTitle: "✅ Puzle resolt",
        copyButton: "📋 Copiar coordenades",
        explanationTitle: "💡 Explicació"
    },

    en: {
        pending: "Pending",
        wrong: "❌ Not the solution",
        solvedTitle: "✅ Puzzle solved",
        copyButton: "📋 Copy coordinates",
        explanationTitle: "💡 Explanation"
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


/* =========================================================
   ID DEL PUZZLE
   ========================================================= */

let puzzleId;


/* =========================================================
   COMPROBAR SI TIENE ANIMACIÓN
   ========================================================= */

function hasAnimation(type) {

    return (
        puzzle &&
        puzzle.animation &&
        puzzle.animation.type === type
    );

}


/* =========================================================
   CARGAR PUZZLE
   ========================================================= */

async function loadPuzzle() {

    puzzleId =
        new URLSearchParams(location.search)
            .get("p") || "cache01";

    puzzle =
        await (
            await fetch(
                `puzzles/${puzzleId}.json`
            )
        ).json();


    /* -----------------------------------------------------
       Título y descripción
       ----------------------------------------------------- */

    document.getElementById("title")
        .textContent =
        puzzle.title[language];

    document.getElementById("description")
        .textContent =
        puzzle.description[language];


    /* -----------------------------------------------------
       Estado
       ----------------------------------------------------- */

    document.getElementById("status")
        .style.display =
        "block";

    document.getElementById("status")
        .textContent =
        t("pending");


    /* -----------------------------------------------------
       Pantalla de éxito
       ----------------------------------------------------- */

    document.querySelector(
        "#success h2"
    ).textContent =
        t("solvedTitle");

    document.getElementById(
        "copyBtn"
    ).textContent =
        t("copyButton");


    /* -----------------------------------------------------
       Chess.js
       ----------------------------------------------------- */

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


    /*
     * Posición inicial.
     *
     * Mantenemos esta forma porque es la que
     * funciona con tu versión actual.
     */

    board.setAttribute(
        "position",
        game.fen()
    );


    board.draggablePieces = true;


    board.addEventListener(
        "drop",
        handleMove
    );


    /* -----------------------------------------------------
       Botón copiar
       ----------------------------------------------------- */

    document
        .getElementById("copyBtn")
        .addEventListener(
            "click",
            copyCoords
        );


    /* -----------------------------------------------------
       ANIMACIONES
       
       Solo se crea la capa si el JSON
       la solicita.
       ----------------------------------------------------- */

    if (
        hasAnimation("pawn-square")
    ) {

        createOverlay();

        setTimeout(() => {

            updatePawnSquare();

        }, 150);

    }

}


/* =========================================================
   REINICIAR TABLERO
   ========================================================= */

function resetBoard() {

    currentStep = 0;

    game =
        new Chess(
            puzzle.fen
        );


    board.setPosition(
        game.fen()
    );


    document.getElementById(
        "status"
    ).style.display =
        "block";


    document.getElementById(
        "status"
    ).textContent =
        t("pending");


    document.getElementById(
        "success"
    ).classList.add(
        "hidden"
    );


    /*
     * Solo actualizar animación si este
     * puzzle la tiene configurada.
     */

    if (
        hasAnimation("pawn-square")
    ) {

        updatePawnSquare();

    }

}


/* =========================================================
   MOVIMIENTO
   ========================================================= */

function handleMove(event) {

    const from =
        event.detail.source;

    const to =
        event.detail.target;


    const move =
        game.move({
            from: from,
            to: to,
            promotion: "q"
        });


    /* -----------------------------------------------------
       Movimiento ilegal
       ----------------------------------------------------- */

    if (!move) {

        setTimeout(() => {

            board.setPosition(
                game.fen()
            );

        }, 10);

        return;
    }


    /* =====================================================
       PUZZLES CON SECUENCIA DE MOVIMIENTOS
       ===================================================== */

    if (puzzle.moves) {

        const expectedMove =
            puzzle.moves[currentStep];


        /* -------------------------------------------------
           Movimiento incorrecto
           ------------------------------------------------- */

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


        /* -------------------------------------------------
           Movimiento correcto
           ------------------------------------------------- */

        currentStep++;


        /*
         * Actualizar tablero inmediatamente.
         *
         * Esto es especialmente importante para
         * promociones como a8=Q.
         */

        board.setPosition(
            game.fen(),
            true
        );


        /*
         * Actualizar animación únicamente
         * si el JSON la solicita.
         */

        if (
            hasAnimation("pawn-square")
        ) {

            setTimeout(() => {

                updatePawnSquare();

            }, 50);

        }


        /* -------------------------------------------------
           ¿Último movimiento?
           ------------------------------------------------- */

        if (
            currentStep >=
            puzzle.moves.length
        ) {

            /*
             * Damos tiempo a la animación de
             * promoción antes de mostrar el resultado.
             */

            setTimeout(() => {

                /*
                 * Forzar nuevamente la posición final.
                 * Esto garantiza que la pieza promovida
                 * quede representada correctamente.
                 */

                board.setPosition(
                    game.fen(),
                    false
                );


                solvePuzzle();

            }, 350);


            return;
        }


        /* -------------------------------------------------
           RESPUESTA AUTOMÁTICA
           ------------------------------------------------- */

        const reply =
            puzzle.moves[currentStep];


        setTimeout(() => {

            const replyMove =
                game.move(
                    reply
                );


            if (!replyMove) {

                console.error(
                    "Movimiento automático inválido:",
                    reply
                );

                return;
            }


            /*
             * Actualizar tablero
             */

            board.setPosition(
                game.fen(),
                true
            );


            currentStep++;


            /*
             * Actualizar animación
             */

            if (
                hasAnimation("pawn-square")
            ) {

                setTimeout(() => {

                    updatePawnSquare();

                }, 50);

            }


            /* ---------------------------------------------
               ¿Puzzle terminado?
               --------------------------------------------- */

            if (
                currentStep >=
                puzzle.moves.length
            ) {

                setTimeout(() => {

                    board.setPosition(
                        game.fen(),
                        false
                    );


                    solvePuzzle();

                }, 350);

            }

        }, 650);


        return;
    }


    /* =====================================================
       PUZZLES ANTIGUOS DE UNA SOLA SOLUCIÓN
       
       Esto mantiene la compatibilidad con cacheXX.
       ===================================================== */

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

        /*
         * Actualizar posición final.
         */

        board.setPosition(
            game.fen(),
            true
        );


        solvePuzzle();

        return;
    }


    /* -----------------------------------------------------
       Movimiento incorrecto
       ----------------------------------------------------- */

    document.getElementById(
        "status"
    ).textContent =
        t("wrong");


    setTimeout(
        resetBoard,
        500
    );

}


/* =========================================================
   PUZZLE RESUELTO
   ========================================================= */

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


    /* -----------------------------------------------------
       EXPLICACIÓN
       
       Solo aparece si el JSON contiene solutionText.
       ----------------------------------------------------- */

    const coordinates =
        document.getElementById(
            "coordinates"
        );


    let explanation =
        document.getElementById(
            "solutionText"
        );


    if (
        puzzle.solutionText
    ) {

        if (!explanation) {

            explanation =
                document.createElement(
                    "div"
                );

            explanation.id =
                "solutionText";


            coordinates.parentNode.insertBefore(
                explanation,
                coordinates
            );

        }


        explanation.innerHTML =

            `<h3>${t("explanationTitle")}</h3>
             <p>${puzzle.solutionText[language]}</p>`;

    }


    /* -----------------------------------------------------
       COORDENADAS
       ----------------------------------------------------- */

    coordinates.innerHTML =
        `<p>${puzzle.coordinates.lat} ${puzzle.coordinates.lon}</p>`;


    /* -----------------------------------------------------
       Ocultar animación
       
       Solo si existe.
       ----------------------------------------------------- */

    if (
        hasAnimation("pawn-square")
    ) {

        hidePawnSquare();

    }

}


/* =========================================================
   COPIAR COORDENADAS
   ========================================================= */

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


/* =========================================================
   SISTEMA DE ANIMACIÓN
   ========================================================= */

let overlay;
let overlaySvg;


function createOverlay() {

    /*
     * Evitar crear dos overlays.
     */

    if (overlay) {

        return;
    }


    const parent =
        board.parentElement;


    const computed =
        window.getComputedStyle(
            parent
        );


    if (
        computed.position ===
        "static"
    ) {

        parent.style.position =
            "relative";

    }


    overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "chessOverlay";


    overlay.style.position =
        "absolute";

    overlay.style.left =
        "0";

    overlay.style.top =
        "0";

    overlay.style.width =
        "100%";

    overlay.style.height =
        "100%";

    overlay.style.pointerEvents =
        "none";

    overlay.style.zIndex =
        "20";


    overlaySvg =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );


    overlaySvg.style.width =
        "100%";

    overlaySvg.style.height =
        "100%";

    overlaySvg.style.overflow =
        "visible";


    overlay.appendChild(
        overlaySvg
    );


    parent.appendChild(
        overlay
    );


    window.addEventListener(
        "resize",
        updatePawnSquare
    );

}


/* =========================================================
   BUSCAR PEÓN BLANCO
   ========================================================= */

function findWhitePawn() {

    if (!game) {

        return null;

    }


    const boardState =
        game.board();


    for (
        let rankIndex = 0;
        rankIndex < 8;
        rankIndex++
    ) {

        for (
            let fileIndex = 0;
            fileIndex < 8;
            fileIndex++
        ) {

            const piece =
                boardState[
                    rankIndex
                ][
                    fileIndex
                ];


            if (
                piece &&
                piece.color === "w" &&
                piece.type === "p"
            ) {

                return {
                    file: fileIndex,
                    rank: 7 - rankIndex
                };

            }

        }

    }


    return null;

}


/* =========================================================
   CALCULAR CUADRADO DEL PEÓN
   ========================================================= */

function getPawnSquare() {

    const pawn =
        findWhitePawn();


    if (!pawn) {

        return null;

    }


    const distance =
        8 - pawn.rank;


    if (distance <= 0) {

        return null;

    }


    let minFile =
        pawn.file;


    let maxFile =
        pawn.file + distance;


    /*
     * No salir del tablero.
     */

    if (maxFile > 7) {

        maxFile = 7;

    }


    return {

        leftFile:
            minFile,

        rightFile:
            maxFile,

        bottomRank:
            pawn.rank,

        topRank:
            7

    };

}


/* =========================================================
   CONVERTIR CASILLA A COORDENADAS
   ========================================================= */

function squarePoint(
    file,
    rank,
    boardRect,
    parentRect
) {

    const squareSize =
        boardRect.width / 8;


    const x =
        (
            boardRect.left -
            parentRect.left
        ) +
        (
            file *
            squareSize
        );


    const y =
        (
            boardRect.top -
            parentRect.top
        ) +
        (
            (7 - rank) *
            squareSize
        );


    return {
        x,
        y
    };

}


/* =========================================================
   ACTUALIZAR CUADRADO
   ========================================================= */

function updatePawnSquare() {

    /*
     * Protección adicional:
     * si este puzzle no tiene la animación,
     * no hacemos absolutamente nada.
     */

    if (
        !hasAnimation("pawn-square")
    ) {

        return;

    }


    if (
        !board ||
        !overlaySvg ||
        !game
    ) {

        return;

    }


    const square =
        getPawnSquare();


    if (!square) {

        hidePawnSquare();

        return;

    }


    const boardRect =
        board.getBoundingClientRect();


    const parentRect =
        board.parentElement
            .getBoundingClientRect();


    const topLeft =
        squarePoint(
            square.leftFile,
            square.topRank,
            boardRect,
            parentRect
        );


    const bottomRight =
        squarePoint(
            square.rightFile + 1,
            square.bottomRank - 1,
            boardRect,
            parentRect
        );


    const x =
        topLeft.x;


    const y =
        topLeft.y;


    const width =
        bottomRight.x -
        topLeft.x;


    const height =
        bottomRight.y -
        topLeft.y;


    /*
     * Limpiar dibujo anterior.
     */

    overlaySvg.innerHTML =
        "";


    /*
     * Crear rectángulo.
     */

    const rect =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
        );


    rect.setAttribute(
        "x",
        x
    );

    rect.setAttribute(
        "y",
        y
    );

    rect.setAttribute(
        "width",
        width
    );

    rect.setAttribute(
        "height",
        height
    );


    rect.setAttribute(
        "fill",
        "none"
    );


    rect.setAttribute(
        "stroke",
        "#2e8b57"
    );


    rect.setAttribute(
        "stroke-width",
        "3"
    );


    rect.setAttribute(
        "stroke-linejoin",
        "round"
    );


    rect.setAttribute(
        "stroke-dasharray",
        "10 6"
    );


    rect.style.opacity =
        "0";


    rect.style.transition =
        "opacity 0.25s ease";


    overlaySvg.appendChild(
        rect
    );


    requestAnimationFrame(() => {

        rect.style.opacity =
            "0.9";

    });

}


/* =========================================================
   OCULTAR CUADRADO
   ========================================================= */

function hidePawnSquare() {

    if (
        overlaySvg
    ) {

        overlaySvg.innerHTML =
            "";

    }

}


/* =========================================================
   REDIBUJAR AL CAMBIAR TAMAÑO
   ========================================================= */

window.addEventListener(
    "resize",
    () => {

        if (
            hasAnimation("pawn-square")
        ) {

            updatePawnSquare();

        }

    }
);


/* =========================================================
   INICIAR
   ========================================================= */

window.onload =
    loadPuzzle;
