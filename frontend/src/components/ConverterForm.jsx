import React, { useState, useRef } from "react";
import styles from "./ConverterForm.module.css";

/**
 * Formulário para conversão de arquivos (Word, PDF, vídeo, áudio, imagem, XML).
 * Permite converter, juntar, remover páginas de PDFs, converter vídeo/áudio, imagens, XML.
 */
const operations = [
	{ value: "word-to-pdf", label: "Word para PDF", accept: ".doc,.docx" },
	{ value: "pdf-to-word", label: "PDF para Word", accept: ".pdf" },
	{
		value: "merge-pdfs",
		label: "Juntar PDFs",
		accept: ".pdf",
		multiple: true,
	},
	{
		value: "remove-pdf-pages",
		label: "Remover páginas do PDF",
		accept: ".pdf",
	},
	{
		value: "video-audio",
		label: "Vídeo ↔ Áudio",
		accept: ".mp4,.webm,.avi,.mov,.mkv,.mp3,.wav,.aac,.m4a,.ogg",
	},
	{
		value: "image",
		label: "Converter Imagem",
		accept: ".jpg,.jpeg,.png,.webp,.bmp,.tiff",
	},
	{ value: "xml", label: "Converter/Validar XML", accept: ".xml" },
];

const formatOptions = {
	"video-audio": [
		"mp3",
		"wav",
		"aac",
		"m4a",
		"ogg",
		"mp4",
		"webm",
		"avi",
		"mov",
		"mkv",
	],
	image: ["jpg", "jpeg", "png", "webp", "bmp", "tiff"],
};

const ConverterForm = () => {
	const [file, setFile] = useState(null);
	const [files, setFiles] = useState([]);
	const [operation, setOperation] = useState("word-to-pdf");
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState(null);
	const [pages, setPages] = useState("");
	const [targetFormat, setTargetFormat] = useState("");
	const [xmlAction, setXmlAction] = useState("to_json");
	const inputRef = useRef();
	const multiInputRef = useRef();

	const handleFileChange = (e) => {
		setFile(e.target.files[0]);
	};

	const handleMultiFileChange = (e) => {
		setFiles(Array.from(e.target.files));
	};

	const handleOperationChange = (e) => {
		setOperation(e.target.value);
		setResult(null);
		setFiles([]);
		setFile(null);
		setPages("");
		setTargetFormat("");
		setXmlAction("to_json");
		setReportFiles([]);
	};

	const handlePagesChange = (e) => setPages(e.target.value);

	const handleTargetFormatChange = (e) => setTargetFormat(e.target.value);

	const handleXmlActionChange = (e) => setXmlAction(e.target.value);


	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setResult(null);

		const formData = new FormData();
		let endpoint = "";
		let filesData = null;

		switch (operation) {
			case "word-to-pdf":
				if (!file) return setLoading(false);
				formData.append("file", file);
				endpoint = "/api/converter/word-to-pdf/";
				break;
			case "pdf-to-word":
				if (!file) return setLoading(false);
				formData.append("file", file);
				endpoint = "/api/converter/pdf-to-word/";
				break;
			case "merge-pdfs":
				if (!files.length) return setLoading(false);
				files.forEach((f) => formData.append("file", f));
				endpoint = "/api/converter/merge-pdfs/";
				break;
			case "remove-pdf-pages":
				if (!file) return setLoading(false);
				formData.append("file", file);
				formData.append(
					"pages",
					JSON.stringify(
						pages
							.split(",")
							.map((p) => parseInt(p.trim()))
							.filter((p) => !isNaN(p))
					)
				);
				endpoint = "/api/converter/remove-pdf-pages/";
				break;
			case "video-audio":
				if (!file || !targetFormat) return setLoading(false);
				formData.append("file", file);
				formData.append("target_format", targetFormat);
				endpoint = "/api/converter/video-audio/";
				break;
			case "image":
				if (!file || !targetFormat) return setLoading(false);
				formData.append("file", file);
				formData.append("target_format", targetFormat);
				endpoint = "/api/converter/image/";
				break;
			case "xml":
				if (!file) return setLoading(false);
				formData.append("file", file);
				formData.append("action", xmlAction);
				endpoint = "/api/converter/xml/";
				break;
default:
endpoint = "";
}

		try {
			const res = await fetch(import.meta.env.VITE_API_URL + endpoint, {
				method: "POST",
				body: formData,
			});
			if (res.ok) {
				if (operation === "xml") {
					const json = await res.json();
					setResult(JSON.stringify(json, null, 2));
				} else {
					const blob = await res.blob();
					setResult(URL.createObjectURL(blob));
				}
			} else {
				try {
					const errorJson = await res.json();
					setResult(
						(errorJson.detail
							? `Detalhe: ${errorJson.detail}\n`
							: "") +
							(errorJson.trace
								? `Trace:\n${errorJson.trace}`
								: "") || "Erro ao converter arquivo."
					);
				} catch {
					setResult("Erro ao converter arquivo.");
				}
			}
		} catch {
			setResult("Erro de conexão.");
		}
		setLoading(false);
	};

	return (
		<div className={styles.wrapper}>
			<form className={styles.form} onSubmit={handleSubmit}>
				<label className={styles.label}>
					Operação:
					<select
						value={operation}
						onChange={handleOperationChange}
						className={styles.select}
					>
						{operations.map((op) => (
							<option key={op.value} value={op.value}>
								{op.label}
							</option>
						))}
					</select>
				</label>

				{/* Upload de arquivo único */}
				{[
					"word-to-pdf",
					"pdf-to-word",
					"remove-pdf-pages",
					"video-audio",
					"image",
					"xml",
				].includes(operation) && (
					<div
						className={styles.dropzone}
						onClick={() => inputRef.current.click()}
					>
						<input
							type="file"
							ref={inputRef}
							style={{ display: "none" }}
							accept={
								operations.find((op) => op.value === operation)
									?.accept || "*"
							}
							onChange={handleFileChange}
						/>
						{file ? (
							<span className={styles.filename}>{file.name}</span>
						) : (
							<span className={styles.droptext}>
								Arraste e solte o arquivo aqui ou clique para
								selecionar
							</span>
						)}
					</div>
				)}

				{/* Upload múltiplo para merge-pdfs */}
				{operation === "merge-pdfs" && (
					<div
						className={styles.dropzone}
						onClick={() => multiInputRef.current.click()}
					>
						<input
							type="file"
							ref={multiInputRef}
							style={{ display: "none" }}
							multiple
							accept=".pdf"
							onChange={handleMultiFileChange}
						/>
						<span className={styles.droptext}>
							Arraste e solte os PDFs aqui ou clique para
							selecionar
						</span>
						{files.length > 0 && (
							<div className={styles.filelist}>
								{files.map((f, idx) => (
									<div key={idx} className={styles.fileitem}>
										<span className={styles.filename}>
											{f.name}
										</span>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{/* Seleção de páginas para remover */}
				{operation === "remove-pdf-pages" && (
					<label className={styles.label}>
						Páginas para remover (ex: 0,2,4):
						<input
							type="text"
							value={pages}
							onChange={handlePagesChange}
							className={styles.select}
							placeholder="Ex: 0,2,4"
						/>
					</label>
				)}

				{/* Seleção de formato de destino para vídeo/áudio e imagem */}
				{["video-audio", "image"].includes(operation) && (
					<label className={styles.label}>
						Formato de destino:
						<select
							value={targetFormat}
							onChange={handleTargetFormatChange}
							className={styles.select}
						>
							<option value="">Selecione</option>
							{formatOptions[operation].map((fmt) => (
								<option key={fmt} value={fmt}>
									{fmt.toUpperCase()}
								</option>
							))}
						</select>
					</label>
				)}

				{/* Seleção de ação para XML */}
				{operation === "xml" && (
					<label className={styles.label}>
						Ação:
						<select
							value={xmlAction}
							onChange={handleXmlActionChange}
							className={styles.select}
						>
							<option value="to_json">Converter para JSON</option>
							<option value="validate">Validar XML</option>
						</select>
					</label>
				)}


				<button
					type="submit"
					disabled={loading}
					className={styles.button}
					aria-busy={loading}
				>
					{loading ? "Processando..." : "Converter"}
				</button>
				{result && (
					<>
						{typeof result === "string" &&
						(result.startsWith("http") ||
							result.startsWith("blob:")) ? (
							<a
								href={result}
								download
								className={styles.download}
							>
								Baixar arquivo convertido
							</a>
						) : (
							<div
								className={styles.error}
								style={{ whiteSpace: "pre-wrap" }}
							>
								{String(result)}
							</div>
						)}
					</>
				)}
			</form>
			{/* Pré-visualização para PDF/Word/XML */}
{result &&
[
"word-to-pdf",
"remove-pdf-pages",
"merge-pdfs",
].includes(operation) &&
typeof result === "string" &&
(result.startsWith("http") || result.startsWith("blob:")) && (
<div className={styles.preview}>
<span className={styles.previewTitle}>
Pré-visualização do PDF:
</span>
<iframe
src={result}
title="Pré-visualização PDF"
className={styles.iframe}
width="100%"
height="500px"
style={{
borderRadius: "12px",
border: "2px solid #23262f",
background: "#23262f",
}}
aria-label="Pré-visualização PDF"
/>
</div>
)}
			{result &&
				operation === "pdf-to-word" &&
				typeof result === "string" &&
				(result.startsWith("http") || result.startsWith("blob:")) && (
					<div className={styles.preview}>
						<span className={styles.previewTitle}>
							Arquivo Word convertido:
						</span>
						<a
							href={result}
							download
							className={styles.download}
							aria-label="Baixar arquivo Word convertido"
						>
							Baixar arquivo convertido
						</a>
					</div>
				)}
			{result &&
				operation === "xml" &&
				typeof result === "string" &&
				!result.startsWith("http") &&
				!result.startsWith("blob:") && (
					<div className={styles.preview}>
						<span className={styles.previewTitle}>
							Resultado XML:
						</span>
						<pre className={styles.json}>{result}</pre>
					</div>
				)}
		</div>
	);
};

export default ConverterForm;
