# Treino de português

App de práctica de portugués brasileño, alimentada con lo que se enseña en clase.

👉 **https://kpbara.github.io/portu/**

No es un curso general. El banco de preguntas está cargado hacia los errores que
de verdad cometemos los hispanohablantes con este material: *eu gosta* en lugar
de *eu gosto*, *onde* contra *aonde*, *que* contra *o que*, comerse el *de* antes
de un infinitivo, el género en *do/da* y los cuatro *porquês*.

**No se recoge nada.** Sin cuentas, sin correo, sin analítica, sin nada cargado
desde el servidor de otra persona. Tu progreso se guarda en tu propio teléfono y
nunca sale de ahí.

---

## Origen y créditos

Este es un **proyecto personal de estudio**. Lo armé para practicar entre una
clase y la siguiente, a partir de los temas del curso de portugués del
**Instituto Guimarães Rosa**: lo que vimos en clase, los tomados y los errores marcados en las hojas de ejercicios.

Dicho eso, y para que no quede ninguna duda:

- **No es material oficial del Instituto.** No está avalado, revisado ni
  patrocinado por él. Cualquier error encontrado aquí es mío, no de la clase.
- **No reemplaza la clase.** Es práctica de repaso y nada más. Las explicaciones,
  las correcciones y el curso en sí vienen del Instituto.
- **Los documentos del curso no se muestran aquí.** La app no contiene, ni
  enseña, ni reparte los documentos: nada de escaneos, fotos, PDF ni copias del
  texto de clase. Las hojas solo sirvieron de **base** — de ahí salieron los
  temas y los errores que había que atacar. Los ejercicios, las mini-lecciones y
  las pistas se redactaron después a partir de eso, con Claude , y no son
  transcripciones del material de clase. Muchas frases tampoco son fijas: la app
  las arma sola en cada ronda a partir de listas de palabras.
- **El crédito del contenido del curso es del Instituto** y de quien lo enseña.
  Lo que no viene del Instituto es la app en sí: el código y la forma de
  practicar.
- **Es gratis y sin fines de lucro.** Sin anuncios, sin cobros, sin cuentas.
- **Si el Instituto o la profesora del curso prefieren que esto no esté público,
  se borra.** Basta con pedirlo, por un issue en este repositorio o
  directamente.

Lo comparto con mis compañeros porque nos sirve a todos, no para repartir material ajeno.

---

## Cómo instalarlo en tu teléfono

**Abre el enlace en tu teléfono y la app te dice qué hacer.** Detecta tu teléfono
y tu navegador y muestra los pasos correctos abajo de la pantalla de inicio.

👉 https://kpbara.github.io/portu/

- **Android** (Chrome, Brave, Samsung, Opera): normalmente sale un botón
  **Instalar**. Un toque y listo.
- **Android con Firefox**, o si no sale el botón: menú **⋮** arriba a la derecha →
  **Instalar aplicación** / **Añadir a pantalla de inicio**. El nombre cambia según
  el navegador, pero siempre está en ese menú.
- **iPhone**: tiene que ser **Safari**. Botón de compartir (abajo en el centro) →
  **Añadir a pantalla de inicio** → **Añadir**.

Queda con ícono propio, se abre en pantalla completa y funciona sin internet.
Después puedes cerrar el navegador; la app abre sola desde el ícono.

> Si actualizamos el contenido, tu app se actualiza sola la próxima vez que la
> abras — **sin perder tus puntos**.

---

## Qué trae

Hasta ahora, 13 handouts de clase convertidos en práctica:

- **215 ejercicios** repartidos en **14 assuntos**.
- **13 generadores de frases**, que escriben oraciones nuevas en cada ronda en
  lugar de repetir siempre la misma.
- **20 mini-lecciones**: doce explican un assunto y ocho atacan un error que se
  cruza entre varios. *Os números* lleva cuatro seguidas, porque contar de cero
  a cien no cabe en una sola.

Los assuntos viven dentro de **cuatro categorías fijas** — Verbos, Palavras
pequenas, Som e letras, Vocabulário. Los assuntos crecen con el curso; las
categorías no, para que la pantalla siga siendo legible en la clase número treinta.

## Cómo funciona

La app tiene tres pestañas:

- **Treinar** — la ronda de práctica.
- **Falhas** — tus errores, agrupados por el tipo de fallo, no por el tema.
- **Assuntos** — todo el material, por categoría, para repasar lo que quieras.

Y dentro de una ronda:

- **10 preguntas**, sacadas del banco y cargadas hacia lo que *tú* fallaste. Dos
  personas no reciben la misma ronda.
- **Una respuesta equivocada te da una pregunta, no la respuesta.** Tienes un
  segundo intento que vale la mitad; ahí sí se revela.
- **Lo que fallaste vuelve** al final de la ronda. El puntaje se sigue contando
  sobre las diez originales, como una hoja calificada: *8 de 10*.
- Las mini-lecciones se abren desde la lista de assuntos, desde una respuesta
  equivocada y desde el resumen final.

---

## Para quien quiera ver el código

Es un solo archivo HTML, sin framework, sin dependencias y sin paso de
compilación. Los detalles técnicos — estructura, pruebas, cómo se agrega el
material de cada clase y cómo correrlo localmente — están en
[DEVELOPING.md](DEVELOPING.md).
