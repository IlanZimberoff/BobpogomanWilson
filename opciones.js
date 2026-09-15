const keybinds = document.querySelectorAll(".keybind");

keybinds.forEach(function(boton) {

    boton.addEventListener("click", function() {

        keybinds.forEach(function(otroBoton) {
            otroBoton.classList.remove("esperando");
        });

        boton.classList.add("esperando");
        boton.textContent = "Presioná una tecla...";

        document.addEventListener("keydown", detectarTecla);

        function detectarTecla(evento) {

            evento.preventDefault();

            let tecla = evento.key;

            if (tecla === " ") {
                tecla = "SPACE";
            } else if (tecla === "ArrowLeft") {
                tecla = "←";
            } else if (tecla === "ArrowRight") {
                tecla = "→";
            } else if (tecla === "ArrowUp") {
                tecla = "↑";
            } else if (tecla === "ArrowDown") {
                tecla = "↓";
            } else {
                tecla = tecla.toUpperCase();
            }

            boton.textContent = tecla;
            boton.classList.remove("esperando");

            document.removeEventListener("keydown", detectarTecla);
        }
    });
});