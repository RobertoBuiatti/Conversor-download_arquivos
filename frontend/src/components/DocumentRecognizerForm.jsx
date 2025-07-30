import React, { useState, useRef } from "react";
import styles from "./DocumentRecognizerForm.module.css";

/**
 * Formulário para reconhecimento de documentos (RG, CPF, CNH, Certidão, CNPJ).
 * Permite enviar imagem, reconhece via API Gemini e exibe resultado em JSON.
 */
const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
const maxSize = 5 * 1024 * 1024; // 5MB

const DocumentRecognizerForm = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
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

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result.split(",")[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setResult("");
    setError("");
    try {
      const base64Image = await fileToBase64(file);
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyA8_mnMJCeRNBtddv8Js4L94HNsZ4_7NxM",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text:
                      "Analise esta imagem de documento (RG, CPF, CNH, Certidão de Nascimento, Certidão de Casamento ou CNPJ) e retorne um JSON com os campos obrigatórios: nome, dataNascimento, nacionalidade, naturalidade, sexo, rg, cpf, nomePai, nomeMae, endereco, cidade, estado, cep. Para CNH: numeroRegistro, dataValidade, categoria. Para Certidão de Casamento: nomeConjuge, dataRegistro, cartorio. Para CNPJ: razaoSocial, nomeFantasia, cnpj, dataAbertura, atividadePrincipal. Se algum campo não for encontrado ou não se aplicar, deixe como string vazia."
                  },
                  {
                    inline_data: {
                      mime_type: file.type,
                      data: base64Image,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              topP: 1,
              topK: 32,
            },
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "Erro na chamada da API");
      }
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Resposta da API em formato inválido");
      // Tenta extrair JSON da string
      const matches = text.match(/\{[\s\S]*\}/);
      let jsonData;
      if (matches) {
        jsonData = JSON.parse(matches[0]);
      } else {
        jsonData = { texto: text };
      }
      setResult(JSON.stringify(jsonData, null, 2));
    } catch (err) {
      setError(err.message || "Erro ao analisar documento.");
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (result)
      navigator.clipboard.writeText(result);
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resultado.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  return (
    <div className={styles.wrapper}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label}>
          Selecione uma imagem de documento:
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
          className={styles.button}
          aria-busy={loading}
        >
          {loading ? "Processando..." : "Reconhecer Documento"}
        </button>
        {error && (
          <div className={styles.error}>{error}</div>
        )}
        {result && (
          <div className={styles.resultSection}>
            <pre className={styles.result}>{result}</pre>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.copyButton}
                onClick={handleCopy}
              >
                Copiar
              </button>
              <button
                type="button"
                className={styles.downloadButton}
                onClick={handleDownload}
              >
                Baixar JSON
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default DocumentRecognizerForm;
