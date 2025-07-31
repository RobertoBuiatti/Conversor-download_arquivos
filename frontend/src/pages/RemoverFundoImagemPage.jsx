import React, { useState, useRef } from "react";
import styles from "../components/DocumentRecognizerForm.module.css";

const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
const RemoverFundoImagemPage = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bgRemovedImage, setBgRemovedImage] = useState(null);
  const inputRef = useRef();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    if (!allowedTypes.includes(selected.type)) {
      setError("Tipo de arquivo não suportado. Use JPEG, PNG ou GIF.");
      setFile(null);
      return;
    }
    setFile(selected);
    setError("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      handleFileChange({ target: { files: [dropped] } });
    }
  };

  const handleRemoveBackground = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    setBgRemovedImage(null);
    try {
      // Redimensiona a imagem para envio seguro ao backend
      const img = await new Promise((resolve, reject) => {
        const image = new window.Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = URL.createObjectURL(file);
      });

      // Define largura máxima para processamento (ex: 1024px)
      const maxWidth = 1024;
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      const newWidth = Math.round(img.width * scale);
      const newHeight = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Converte para blob para envio
      const resizedBlob = await new Promise((resolve) =>
        canvas.toBlob(resolve, file.type)
      );

      const formData = new FormData();
      formData.append("file", resizedBlob, file.name);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/remove-background/`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        setError("Falha ao remover fundo pelo servidor.");
        setLoading(false);
        return;
      }
      const blob = await response.blob();
      // Exibe resultado nas dimensões originais
      const resultImg = await new Promise((resolve, reject) => {
        const image = new window.Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = URL.createObjectURL(blob);
      });

      const outCanvas = document.createElement("canvas");
      outCanvas.width = img.width;
      outCanvas.height = img.height;
      const outCtx = outCanvas.getContext("2d");
      outCtx.drawImage(resultImg, 0, 0, img.width, img.height);

      const imageUrl = outCanvas.toDataURL("image/png");
      setBgRemovedImage(imageUrl);
    } catch (err) {
      setError(err.message || "Erro ao remover fundo.");
    }
    setLoading(false);
  };

  return (
    <div className={styles.wrapper}>
      <form className={styles.form} onSubmit={handleRemoveBackground}>
        <label className={styles.label}>
          Selecione uma imagem:
          <div
            className={styles.dropzone}
            onClick={() => inputRef.current.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              type="file"
              ref={inputRef}
              style={{ display: "none" }}
              accept={allowedTypes.join(",")}
              onChange={handleFileChange}
            />
            {file ? (
              <span className={styles.filename}>{file.name}</span>
            ) : (
              <span className={styles.droptext}>
                Arraste e solte aqui ou clique para selecionar
              </span>
            )}
          </div>
        </label>
        <button
          type="submit"
          disabled={loading || !file}
          className={styles.removeBgButton}
          aria-busy={loading}
        >
          {loading ? "Processando..." : "Remover Fundo Imagem"}
        </button>
        {error && (
          <div className={styles.error}>{error}</div>
        )}
        {bgRemovedImage && (
          <div className={styles.resultSection}>
            <img
              src={bgRemovedImage}
              alt="Imagem sem fundo"
              className={styles.bgPreview}
            />
            <div className={styles.actions}>
              <a
                href={bgRemovedImage}
                download="imagem-sem-fundo.png"
                className={styles.downloadButton}
              >
                Baixar Imagem sem Fundo
              </a>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default RemoverFundoImagemPage;
