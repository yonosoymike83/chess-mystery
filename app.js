let puzzle;
let board;
let game;
let currentStep = 0;
let currentStage = 0;
/* JAQUE: resaltado directo mediante ::part de chess-board. También elimina el resaltado amarillo del arrastre. */
let checkHighlightStyle = null;
const chessSquares = [];
for (let r=1;r<=8;r++){for(const f of 'abcdefgh')chessSquares.push(f+r);}
function updateCheckHighlight(){
 if(!checkHighlightStyle)return;
 let css=chessSquares.map(s=>`chess-board::part(${s}){box-shadow:none !important;}`).join('\n');
 if(game&&board){
  let check=false;
  try{check=typeof game.isCheck==='function'?game.isCheck():(typeof game.inCheck==='function'?game.inCheck():typeof game.in_check==='function'?game.in_check():false);}catch(e){}
  if(check){const a=game.board(),c=game.turn();let k=null;for(let r=0;r<8&&!k;r++){for(let f=0;f<8;f++){const q=a[r][f];if(q&&q.type==='k'&&q.color===c){k='abcdefgh'[f]+(8-r);break;}}}if(k)css+=`\nchess-board::part(${k}){box-shadow:inset 0 0 0 4px #e53935 !important;}`;}
 }
 checkHighlightStyle.textContent=css;
}
function installCheckHighlight(){if(checkHighlightStyle)return;checkHighlightStyle=document.createElement('style');checkHighlightStyle.id='checkHighlightStyle';document.head.appendChild(checkHighlightStyle);updateCheckHighlight();}


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
        explanationTitle: "💡 Explicación",
        stageSuccess: "✅ ¡Correcto! Siguiente posición…"
    },

    ca: {
        pending: "Pendent",
        wrong: "❌ No és la solució",
        solvedTitle: "✅ Puzle resolt",
        copyButton: "📋 Copiar coordenades",
        explanationTitle: "💡 Explicació",
        stageSuccess: "✅ Correcte! Següent posició…"
    },

    en: {
        pending: "Pending",
        wrong: "❌ Not the solution",
        solvedTitle: "✅ Puzzle solved",
        copyButton: "📋 Copy coordinates",
        explanationTitle: "💡 Explanation",
        stageSuccess: "✅ Correct! Next position…"
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
   COMPROBAR ANIMACIÓN
   ========================================================= */

function hasAnimation(type) {

    return (
        puzzle &&
        puzzle.animation &&
        puzzle.animation.type === type
    );

}


/* =========================================================
   COMPROBAR SI ES PUZZLE POR STAGES
   ========================================================= */

function hasStages() {

    return (
        puzzle &&
        Array.isArray(puzzle.stages) &&
        puzzle.stages.length > 0
    );

}


/* =========================================================
   OBTENER STAGE ACTUAL
   ========================================================= */

function getCurrentStage() {

    if (!hasStages()) {
        return null;
    }

    return puzzle.stages[currentStage];

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


    /* -----------------------------------------------------
       Título
       ----------------------------------------------------- */

    document.getElementById("title")
        .textContent =
        puzzle.title[language];


    /* -----------------------------------------------------
       Descripción
       ----------------------------------------------------- */

    document.getElementById("description")
        .textContent =
        puzzle.description[language];


    /* -----------------------------------------------------
       Estado inicial
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
       Inicializar índices
       ----------------------------------------------------- */

    currentStep = 0;
    currentStage = 0;


    /* -----------------------------------------------------
       Determinar FEN inicial
       ----------------------------------------------------- */

    let initialFen = puzzle.fen;

    if (hasStages()) {

        initialFen =
            puzzle.stages[0].fen;

    }


    /* -----------------------------------------------------
       Inicializar Chess.js
       ----------------------------------------------------- */

    game =
        new Chess(
            initialFen
        );


    await customElements.whenDefined(
        "chess-board"
    );


    board =
        document.getElementById(
            "board"
        );

    installCheckHighlight();


    /*
     * Posición inicial.
     *
     * Mantenemos setAttribute porque es el sistema
     * que ya funciona correctamente en tu proyecto.
     */

    board.setAttribute(
        "position",
        game.fen()
    );

    updateCheckHighlight();


    board.draggablePieces = true;


    board.addEventListener(
        "drop",
        handleMove
    );


    /* -----------------------------------------------------
       Botón copiar coordenadas
       ----------------------------------------------------- */

    document
        .getElementById("copyBtn")
        .addEventListener(
            "click",
            copyCoords
        );


    /* -----------------------------------------------------
       Animación opcional
       ----------------------------------------------------- */

    if (
        hasAnimation("pawn-square") ||
        hasAnimation("critical-squares") ||
        hasAnimation("reti")
    ) {

        createOverlay();

        setTimeout(() => {

            updateAnimation();

        }, 150);

    }

}


/* =========================================================
   CARGAR SIGUIENTE STAGE
   ========================================================= */

function loadNextStage() {

    currentStage++;

    currentStep = 0;


    /* -----------------------------------------------------
       Comprobar si todavía quedan stages
       ----------------------------------------------------- */

    if (
        currentStage >=
        puzzle.stages.length
    ) {

        solvePuzzle();

        return;
    }


    const stage =
        puzzle.stages[currentStage];


    /* -----------------------------------------------------
       Crear nueva posición Chess.js
       ----------------------------------------------------- */

    game =
        new Chess(
            stage.fen
        );


    /* -----------------------------------------------------
       Actualizar tablero
       ----------------------------------------------------- */

    board.setPosition(
        game.fen(),
        true
    );

    updateCheckHighlight();


    /* -----------------------------------------------------
       Estado
       ----------------------------------------------------- */

    const status =
        document.getElementById(
            "status"
        );

    status.style.display =
        "block";

    status.textContent =
        t("stageSuccess");


    /* -----------------------------------------------------
       Actualizar animación si existe
       ----------------------------------------------------- */

    if (
        hasAnimation("pawn-square")
    ) {

        setTimeout(() => {

            updatePawnSquare();

        }, 100);

    }


    /*
     * Pequeña pausa para que el jugador vea
     * la nueva posición antes de poder mover.
     */

    setTimeout(() => {

        status.textContent =
            t("pending");

    }, 1000);

}


/* =========================================================
   REINICIAR TABLERO
   ========================================================= */

function resetBoard() {

    currentStep = 0;


    /*
     * En puzzles por stages debemos reiniciar
     * únicamente el stage actual.
     */

    if (hasStages()) {

        const stage =
            puzzle.stages[currentStage];

        game =
            new Chess(
                stage.fen
            );

    } else {

        game =
            new Chess(
                puzzle.fen
            );

    }


    board.setPosition(
        game.fen()
    );

    updateCheckHighlight();


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
     * El cuadrado solo se actualiza si este puzzle
     * tiene configurada esta animación.
     */

    if (
        hasAnimation("pawn-square")
    ) {

        updatePawnSquare();

    }

}


/* =========================================================
   MANEJAR MOVIMIENTO
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
       PUZZLES POR STAGES
       ===================================================== */

    if (hasStages()) {

        const stage =
            getCurrentStage();


        const expectedMove =
            stage.moves[currentStep];


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
         * Actualizar tablero.
         *
         * También fuerza correctamente las promociones.
         */

        board.setPosition(
            game.fen(),
            true
        );

        updateCheckHighlight()


        /*
         * Actualizar animación
         */

        if (
            hasAnimation("pawn-square") ||
            hasAnimation("critical-squares") ||
            hasAnimation("reti")
        ) {

            setTimeout(() => {

                updateAnimation();
                updateCheckHighlight();

            }, 50);

        }


        /* -------------------------------------------------
           ¿Era el último movimiento del stage?
           ------------------------------------------------- */

        if (
            currentStep >=
            stage.moves.length
        ) {

            /*
             * Si es el último stage, resolver puzzle.
             */

            if (
                currentStage >=
                puzzle.stages.length - 1
            ) {

                setTimeout(() => {

                    board.setPosition(
                        game.fen(),
                        false
                    );

                        updateCheckHighlight()


                    solvePuzzle();

                }, 350);


                return;
            }


            /*
             * Todavía quedan stages.
             */

            setTimeout(() => {

                loadNextStage();

            }, 900);


            return;
        }


        /* -------------------------------------------------
           Movimiento automático del oponente
           ------------------------------------------------- */

        const reply =
            stage.moves[currentStep];


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

            // Actualizar el indicador también después de la jugada automática.
            // Esto evita que un jaque quede marcado hasta la siguiente jugada del jugador.
            updateCheckHighlight();


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
               ¿Stage terminado?
               --------------------------------------------- */

            if (
                currentStep >=
                stage.moves.length
            ) {

                /*
                 * Último stage
                 */

                if (
                    currentStage >=
                    puzzle.stages.length - 1
                ) {

                    setTimeout(() => {

                        board.setPosition(
                            game.fen(),
                            false
                        );


                        solvePuzzle();

                    }, 350);

                }

                /*
                 * Todavía quedan stages
                 */

                else {

                    setTimeout(() => {

                        loadNextStage();

                    }, 900);

                }

            }

        }, 650);


        return;
    }


    /* =====================================================
       PUZZLES CON SECUENCIA NORMAL
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
         * Actualizar tablero.
         *
         * También fuerza correctamente las promociones.
         */

        board.setPosition(
            game.fen(),
            true
        );

        updateCheckHighlight()


        /*
         * Actualizar animación
         */

        if (
            hasAnimation("pawn-square") ||
            hasAnimation("critical-squares") ||
            hasAnimation("reti")
        ) {

            setTimeout(() => {

                updateAnimation();
                updateCheckHighlight();

            }, 50);

        }


        /* -------------------------------------------------
           ¿Era el último movimiento?
           ------------------------------------------------- */

        if (
            currentStep >=
            puzzle.moves.length
        ) {

            setTimeout(() => {

                board.setPosition(
                    game.fen(),
                    false
                );

                    updateCheckHighlight()


                solvePuzzle();

            }, 350);


            return;
        }


        /* -------------------------------------------------
           Movimiento automático del oponente
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

            // Actualizar el indicador después de la respuesta automática.
            updateCheckHighlight();


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

                        updateCheckHighlight()


                    solvePuzzle();

                }, 350);

            }

        }, 650);


        return;
    }


    /* =====================================================
       PUZZLES ANTIGUOS DE UNA SOLA SOLUCIÓN

       Mantiene compatibilidad con cacheXX.
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

        updateCheckHighlight()


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
       EXPLICACIÓN OPCIONAL
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
       ----------------------------------------------------- */

    if (
        hasAnimation("pawn-square") ||
        hasAnimation("critical-squares")
    ) {

        hidePawnSquare();

    }

    if (hasAnimation("reti")) {
        updateRetiAnimation();
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
     * Evitar duplicados.
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
        updateAnimation
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

                    file:
                        fileIndex,

                    rank:
                        7 - rankIndex

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


    /*
     * Número de movimientos que necesita el peón
     * para llegar a la octava fila.
     *
     * a2 -> 6
     * a3 -> 5
     * a4 -> 4
     * a5 -> 3
     * a6 -> 2
     * a7 -> 1
     */

    const size =
        8 - pawn.rank;


    if (size <= 0) {

        return null;
    }


    /*
     * El cuadrado se extiende desde la casilla
     * del peón hacia arriba y hacia la derecha.
     *
     * Ejemplo:
     *
     * peón en a4:
     *
     * a4 ─── d4
     * │       │
     * │       │
     * │       │
     * a7 ─── d7
     *
     * 4 × 4 casillas.
     */

    const leftFile =
        pawn.file;


    const rightFile =
        pawn.file +
        size -
        1;


    const bottomRank =
        pawn.rank;


    const topRank =
        pawn.rank +
        size -
        1;


    /*
     * Si se sale del tablero, no dibujamos
     * un cuadrado incompleto.
     */

    if (
        rightFile > 7 ||
        topRank > 7
    ) {

        return null;
    }


    return {

        leftFile:
            leftFile,

        rightFile:
            rightFile,

        bottomRank:
            bottomRank,

        topRank:
            topRank

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


    /*
     * file:
     * a = 0
     * b = 1
     * ...
     * h = 7
     *
     * rank:
     * 1 = 0
     * ...
     * 8 = 7
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

        x:
            x,

        y:
            y

    };

}


/* =========================================================
   ACTUALIZAR CUADRADO
   ========================================================= */

function updatePawnSquare() {

    /*
     * Protección:
     * si el JSON no solicita el cuadrado,
     * no hacemos nada.
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


    /*
     * Esquina superior izquierda
     */

    const topLeft =
        squarePoint(
            square.leftFile,
            square.topRank,
            boardRect,
            parentRect
        );


    /*
     * Esquina inferior derecha.
     *
     * +1 en file y -1 en rank porque necesitamos
     * la esquina exterior de la última casilla.
     */

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
     * Limpiar cuadrado anterior.
     */

    overlaySvg.innerHTML =
        "";


    /*
     * Crear rectángulo SVG.
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
     * Animación de aparición.
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

}


/* =========================================================
   ACTUALIZAR ANIMACIÓN SEGÚN EL TIPO
   ========================================================= */

function updateAnimation() {

    if (
        hasAnimation("pawn-square")
    ) {

        updatePawnSquare();

        return;
    }


    if (
        hasAnimation("critical-squares")
    ) {

        updateCriticalSquares();

    }

}


/* =========================================================
   ACTUALIZAR CASILLAS CRÍTICAS
   ========================================================= */

function updateCriticalSquares() {

    if (
        !hasAnimation("critical-squares")
    ) {

        return;
    }


    if (
        !board ||
        !overlaySvg
    ) {

        return;
    }


    const boardRect =
        board.getBoundingClientRect();


    const parentRect =
        board.parentElement
            .getBoundingClientRect();


    /*
     * Rectángulo fijo sobre e6-f6-g6.
     * e = file 4, g = file 6, rank 6.
     */

    const topLeft =
        squarePoint(
            4,
            6,
            boardRect,
            parentRect
        );


    const bottomRight =
        squarePoint(
            7,
            5,
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
     * Limpiar el rectángulo anterior.
     */

    overlaySvg.innerHTML =
        "";


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
   ANIMACIÓN DEL FINAL DE RÉTI
   ========================================================= */

function updateRetiAnimation() {

    if (!hasAnimation("reti") || !board || !overlaySvg || !game) {
        return;
    }

    const stage = getCurrentStage();
    if (!stage || !Array.isArray(stage.moves)) {
        return;
    }

    const step = currentStep;
    const finalStep = stage.moves.length;

    /* Antes de la primera jugada no mostramos nada. */
    if (step < 1) {
        overlaySvg.innerHTML = "";
        return;
    }

    const boardRect = board.getBoundingClientRect();
    const parentRect = board.parentElement.getBoundingClientRect();

    overlaySvg.innerHTML = "";

    const ns = "http://www.w3.org/2000/svg";

    /* -----------------------------------------------------
       Flechas SVG
       ----------------------------------------------------- */
    const defs = document.createElementNS(ns, "defs");

    const blueMarker = document.createElementNS(ns, "marker");
    blueMarker.setAttribute("id", "retiBlueArrow");
    blueMarker.setAttribute("viewBox", "0 0 10 10");
    blueMarker.setAttribute("refX", "8");
    blueMarker.setAttribute("refY", "5");
    blueMarker.setAttribute("markerWidth", "7");
    blueMarker.setAttribute("markerHeight", "7");
    blueMarker.setAttribute("orient", "auto-start-reverse");

    const bluePath = document.createElementNS(ns, "path");
    bluePath.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
    bluePath.setAttribute("fill", "#4169a1");
    blueMarker.appendChild(bluePath);

    const greenMarker = document.createElementNS(ns, "marker");
    greenMarker.setAttribute("id", "retiGreenArrow");
    greenMarker.setAttribute("viewBox", "0 0 10 10");
    greenMarker.setAttribute("refX", "8");
    greenMarker.setAttribute("refY", "5");
    greenMarker.setAttribute("markerWidth", "7");
    greenMarker.setAttribute("markerHeight", "7");
    greenMarker.setAttribute("orient", "auto-start-reverse");

    const greenPath = document.createElementNS(ns, "path");
    greenPath.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
    greenPath.setAttribute("fill", "#4f9d5d");
    greenMarker.appendChild(greenPath);

    defs.appendChild(blueMarker);
    defs.appendChild(greenMarker);
    overlaySvg.appendChild(defs);

    function center(file, rank) {
        const p = squarePoint(file, rank, boardRect, parentRect);
        const size = boardRect.width / 8;
        return { x: p.x + size / 2, y: p.y + size / 2 };
    }

    function drawArrow(fromFile, fromRank, toFile, toRank, color, markerId, width) {
        const a = center(fromFile, fromRank);
        const b = center(toFile, toRank);
        const line = document.createElementNS(ns, "line");
        line.setAttribute("x1", a.x);
        line.setAttribute("y1", a.y);
        line.setAttribute("x2", b.x);
        line.setAttribute("y2", b.y);
        line.setAttribute("stroke", color);
        line.setAttribute("stroke-width", width || "10");
        line.setAttribute("stroke-linecap", "round");
        line.setAttribute("marker-end", `url(#${markerId})`);
        line.setAttribute("opacity", "0.88");
        overlaySvg.appendChild(line);
    }

    function drawCircle(file, rank, color) {
        const p = center(file, rank);
        const size = boardRect.width / 8;
        const circle = document.createElementNS(ns, "circle");
        circle.setAttribute("cx", p.x);
        circle.setAttribute("cy", p.y);
        circle.setAttribute("r", size * 0.34);
        circle.setAttribute("fill", "none");
        circle.setAttribute("stroke", color);
        circle.setAttribute("stroke-width", "5");
        circle.setAttribute("opacity", "0.9");
        overlaySvg.appendChild(circle);
    }

    function drawSquare(file, rank, color) {
        const p = squarePoint(file, rank, boardRect, parentRect);
        const size = boardRect.width / 8;
        const rect = document.createElementNS(ns, "rect");
        rect.setAttribute("x", p.x);
        rect.setAttribute("y", p.y);
        rect.setAttribute("width", size);
        rect.setAttribute("height", size);
        rect.setAttribute("fill", color);
        rect.setAttribute("fill-opacity", "0.28");
        overlaySvg.appendChild(rect);
    }

    const blue = "#4169a1";
    const green = "#4f9d5d";

    if (step >= 2 && step < finalStep) {
        /* La primera animación desaparece justo después del segundo movimiento. */
        overlaySvg.innerHTML = "";
        overlaySvg.style.opacity = "0";
        return;
    }

    if (step < finalStep) {

        /* Ruta diagonal del rey: h8-g7-f6-e5-d6. */
        drawArrow(7, 8, 6, 7, green, "retiGreenArrow", 10);
        drawArrow(6, 7, 5, 6, green, "retiGreenArrow", 10);
        drawArrow(5, 6, 4, 5, green, "retiGreenArrow", 10);
        drawArrow(4, 5, 3, 6, green, "retiGreenArrow", 10);
        drawCircle(3, 6, green);

        /* Ruta del peón negro alrededor del tablero. */
        drawArrow(7, 5, 4, 5, blue, "retiBlueArrow", 10);
        drawArrow(4, 5, 4, 1, blue, "retiBlueArrow", 10);
        drawArrow(4, 1, 7, 1, blue, "retiBlueArrow", 10);
        drawArrow(7, 1, 7, 5, blue, "retiBlueArrow", 10);

        /* Pequeño ciclo defensivo del rey negro. */
        drawArrow(1, 7, 2, 8, blue, "retiBlueArrow", 10);
        drawArrow(2, 8, 1, 7, blue, "retiBlueArrow", 10);

    } else {

        /* Tras la última jugada: casillas clave del rey. */
        drawSquare(4, 5, green); // e5
        drawSquare(5, 4, green); // f4

        /* Ruta final del peón negro. */
        drawArrow(7, 4, 7, 1, blue, "retiBlueArrow", 10);
        drawArrow(7, 1, 5, 1, blue, "retiBlueArrow", 10);
        drawArrow(5, 1, 5, 3, blue, "retiBlueArrow", 10);
        drawArrow(5, 3, 7, 3, blue, "retiBlueArrow", 10);
        drawArrow(7, 3, 7, 4, blue, "retiBlueArrow", 10);
    }

    overlaySvg.style.opacity = "1";
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
            hasAnimation("pawn-square") ||
            hasAnimation("critical-squares") ||
            hasAnimation("reti")
        ) {

            updateAnimation();

        }

    }
);


/* =========================================================
   INICIAR
   ========================================================= */

window.onload =
    loadPuzzle;
