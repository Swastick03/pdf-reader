
import PSPDFKit from "pspdfkit";
import { processFiles } from "./lib/utils";
import dragDrop from "drag-drop";

let hasUnsavedAnnotations = false;
let isAlreadyLoaded = false;


const createOnAnnotationsChange = () => {
  let initialized = false;

  return () => {
    if (initialized) {
      hasUnsavedAnnotations = true;
    } else {
      initialized = true;
    }
  };
};


function load(pdfArrayBuffers) {
  const pdfArrayBuffer = pdfArrayBuffers[0];

  if (isAlreadyLoaded) {
    console.info("Destroyed previous instance");
    PSPDFKit.unload(".App");
    hasUnsavedAnnotations = false;
  }

  isAlreadyLoaded = true;

  const configuration = {
    container: ".App",
    document: pdfArrayBuffer,
  };

  PSPDFKit.load(configuration)
    .then((instance) => {
      instance.addEventListener(
        "annotations.change",
        createOnAnnotationsChange()
      );
    })
    .catch(console.error);
}


function onFail({ message }) {
  alert(message);
}

function shouldPreventLoad() {
  return (
    hasUnsavedAnnotations &&
    !window.confirm(
      "You have unsaved changes. By continuing, you will lose those changes."
    )
  );
}


let destroyListener = dragDrop("#body", {
  onDrop: (files) => {
    if (shouldPreventLoad()) {
      return;
    }

    processFiles(files)
      .then((arrayBuffers) => {
        destroyDragAndDrop();
        load(arrayBuffers);
      })
      .catch(onFail);
  },
});

function destroyDragAndDrop() {
  if (destroyListener) {
    destroyListener();
    document.querySelector(".drag-text").classList.add("is-hidden");
    destroyListener = null;
  }
}

function onFileSelectSuccess(pdfArrayBuffers) {
  destroyDragAndDrop();
  load(pdfArrayBuffers);
}

document.querySelector("#selectFile").addEventListener("change", (event) => {
  if (!event.target.files.length || shouldPreventLoad()) {
    event.target.value = null;

    return;
  }

  processFiles([...event.target.files])
    .then(onFileSelectSuccess)
    .catch(onFail);

  event.target.value = null;
});
