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
   CARGAR PUZZLE
   ========================================================= */

async function loadPuzzle() {

    const id =
        new URLSearchParams(location.search)
            .get("p") || "cache01";

    puzzle =
        await (
            await fetch(
                `puzzles/${id}.json`
            )
        ).json();

    document.getElementById("title")
        .textContent =
        puzzle.title[language];

    document.getElementById("description")
        .textContent =
        puzzle.description[language];

    document.getElementById("status")
        .style.display =
        "block";

    document.getElementById("status")
        .textContent =
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

    /*
     * Posición inicial
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

    document
        .getElementById("copyBtn")
        .addEventListener(
            "click",
            copyCoords
        );

    /*
     * Crear la capa gráfica del cuadrado
     */
    createOverlay();

    /*
     * Mostrar el cuadrado inicial
     */
    setTimeout(() => {

        updatePawnSquare();

    }, 150);
}


/* =========================================================
   REINICIAR
   ========================================================= */

function resetBoard() {

    currentStep = 0;

    game =
        new Chess(
            puzzle.fen
        );

    board.setPosition(
        game.fen(),
        false
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

    updatePawnSquare();

}


/* =========================================================
   MOVIMIENTO DEL JUGADOR
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

    /*
     * Movimiento ilegal
     */
    if (!move) {

        event.detail.setAction(
            "snapback"
        );

        setTimeout(() => {

            board.setPosition(
                game.fen()
            );

        }, 50);

        return;
    }


    /* =====================================================
       PUZZLE CON SECUENCIA DE MOVIMIENTOS
       ===================================================== */

    if (puzzle.moves) {

        const expectedMove =
            puzzle.moves[currentStep];

        /*
         * Movimiento incorrecto
         */
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


        /*
         * Movimiento correcto del jugador
         */
        currentStep++;

        /*
         * IMPORTANTE:
         *
         * Actualizamos inmediatamente el tablero
         * con el FEN de chess.js.
         *
         * Esto hace que una promoción:
         *
         * a8=Q
         *
         * aparezca realmente como Dama.
         */
        board.setPosition(
            game.fen(),
            true
        );


        /*
         * Actualizar animación
         */
        setTimeout(() => {

            updatePawnSquare();

        }, 50);


        /*
         * ¿Era el último movimiento?
         */

        if (
            currentStep >=
            puzzle.moves.length
        ) {

            /*
             * Esperamos a que termine
             * la animación de la promoción.
             */
            setTimeout(() => {

                board.setPosition(
                    game.fen(),
                    false
                );

                solvePuzzle();

            }, 350);

            return;
        }


        /*
         * Siguiente movimiento:
         * respuesta automática del "oponente".
         */

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


            /*
             * Avanzar secuencia
             */
            currentStep++;


            /*
             * Actualizar cuadrado
             */
            setTimeout(() => {

                updatePawnSquare();

            }, 50);


            /*
             * ¿Se ha terminado el puzzle?
             */

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
       PUZZLE ANTIGUO DE UN SOLO MOVIMIENTO
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

        board.setPosition(
            game.fen(),
            true
        );

        solvePuzzle();

        return;
    }


    /*
     * Movimiento incorrecto
     */

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


    /*
     * Mostrar explicación
     */

    const coordinates =
        document.getElementById(
            "coordinates"
        );


    /*
     * Crear bloque de explicación
     * si todavía no existe.
     */

    let explanation =
        document.getElementById(
            "solutionText"
        );


    if (!explanation) {

        explanation =
            document.createElement(
                "div"
            );

        explanation.id =
            "solutionText";

        /*
         * Lo colocamos antes
         * de las coordenadas.
         */

        coordinates.parentNode.insertBefore(
            explanation,
            coordinates
        );
    }


    /*
     * Texto de explicación
     */

    if (puzzle.solutionText) {

        explanation.innerHTML =

            `<h3>${t("explanationTitle")}</h3>
             <p>${puzzle.solutionText[language]}</p>`;

    } else {

        explanation.innerHTML = "";

    }


    /*
     * Coordenadas
     */

    coordinates.innerHTML =
        `<p>${puzzle.coordinates.lat} ${puzzle.coordinates.lon}</p>`;


    /*
     * Después de resolver ya no necesitamos
     * el cuadrado del peón.
     */

    hidePawnSquare();

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
   ANIMACIÓN DEL CUADRADO
   ========================================================= */

/*
 * Creamos un SVG por encima del tablero.
 *
 * No modificamos el interior de <chess-board>,
 * porque chessboard-element utiliza Shadow DOM.
 *
 * Esto nos permite dibujar nuestra propia
 * capa gráfica por encima del tablero.
 */

let overlay;
let overlaySvg;
let squareAnimationId = null;


function createOverlay() {

    if (overlay) {

        return;
    }


    const parent =
        board.parentElement;


    /*
     * El contenedor debe poder alojar
     * una capa absoluta.
     */

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
   ENCONTRAR PEÓN BLANCO
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
   CALCULAR CUADRADO
   ========================================================= */

function getPawnSquare() {

    const pawn =
        findWhitePawn();


    if (!pawn) {

        return null;
    }


    /*
     * Para un peón blanco:
     *
     * a2 -> lado 6
     * a3 -> lado 5
     * a4 -> lado 4
     * a5 -> lado 3
     * a6 -> lado 2
     * a7 -> lado 1
     *
     * La esquina superior derecha
     * se calcula a partir de esa distancia.
     */

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
     * Evitar salir del tablero.
     */

    if (maxFile > 7) {

        maxFile = 7;

    }


    /*
     * En el caso habitual del Puzzle 01:
     *
     * a2 -> g8
     * a4 -> e8
     * a5 -> d8
     * a6 -> c8
     * a7 -> b8
     */

    return {
        leftFile: minFile,
        rightFile: maxFile,
        bottomRank: pawn.rank,
        topRank: 7
    };

}


/* =========================================================
   COORDENADAS DE UNA CASILLA
   ========================================================= */

function squarePoint(
    file,
    rank,
    boardRect,
    parentRect
) {

    const squareSize =
        boardRect.width / 8;


    /*
     * chess-board está orientado
     * con blancas abajo.
     *
     * file:
     * a=0 ... h=7
     *
     * rank:
     * 1=0 ... 8=7
     */

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


    const squareSize =
        boardRect.width / 8;


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
     * Limpiar dibujo anterior
     */

    overlaySvg.innerHTML = "";


    /*
     * Rectángulo
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


    /*
     * Animación de aparición
     */

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


    /*
     * Guardar para poder animarlo
     */

    squareAnimationId =
        rect;

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

    squareAnimationId =
        null;

}


/* =========================================================
   REDIBUJAR CUANDO CAMBIA EL TAMAÑO
   ========================================================= */

window.addEventListener(
    "resize",
    () => {

        if (
            game &&
            board
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
