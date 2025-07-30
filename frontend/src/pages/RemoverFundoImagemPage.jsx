import React, { useState, useRef } from "react";
import styles from "../components/DocumentRecognizerForm.module.css";

const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
const maxSize = 5 * 1024 * 1024; // 5MB

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
    if (selected.size > maxSize) {
      setError("Arquivo muito grande. Máximo permitido: 5MB.");
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
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/remove-background/`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        // Fallback: Remoção de fundo no cliente usando U2Net WASM
        try {
          const u2netModule = await import("u2net");
          const { U2NET } = u2netModule;
          const u2net = await U2NET.load();
          const imgBitmap = await createImageBitmap(file);
          const result = await u2net.segment(imgBitmap);
          const canvas = document.createElement("canvas");
          canvas.width = result.width;
          canvas.height = result.height;
          const ctx = canvas.getContext("2d");
          ctx.putImageData(result, 0, 0);
          const imageUrl = canvas.toDataURL("image/png");
          setBgRemovedImage(imageUrl);
        } catch {
          setError("Falha no servidor e o pacote u2net não está instalado ou não é suportado no ambiente Render.");
        }
        setLoading(false);
        return;
      }
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
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
