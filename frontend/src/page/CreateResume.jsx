import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Logo from "../assets/logo-invertida.png";
import { useAuth } from "../context/AuthContext";
import api, { getApiErrorMessage } from "../lib/api";
import {
    getLaravelValidationErrors,
    unwrapApiData,
} from "../lib/candidate";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PHOTO_MAX_SIZE = 2 * 1024 * 1024;

const SECTION_CONFIG = {
    experiencias: {
        limit: 20,
        required: ["cargo", "empresa", "periodo"],
        fields: ["cargo", "empresa", "periodo", "descricao"],
        create: () => ({
            cargo: "",
            empresa: "",
            periodo: "",
            descricao: "",
        }),
    },
    formacoes: {
        limit: 20,
        required: ["curso", "instituicao", "periodo"],
        fields: ["curso", "instituicao", "periodo"],
        create: () => ({ curso: "", instituicao: "", periodo: "" }),
    },
    cursos: {
        limit: 30,
        required: ["nome", "instituicao", "periodo"],
        fields: ["nome", "instituicao", "periodo"],
        create: () => ({ nome: "", instituicao: "", periodo: "" }),
    },
    idiomas: {
        limit: 20,
        required: ["idioma", "nivel"],
        fields: ["idioma", "nivel"],
        create: () => ({ idioma: "", nivel: "" }),
    },
};

let nextClientRowId = 0;

function createRow(section, values = {}) {
    nextClientRowId += 1;

    return {
        _clientId: `resume-row-${nextClientRowId}`,
        ...SECTION_CONFIG[section].create(),
        ...values,
    };
}

function createInitialForm(user = {}) {
    return {
        nome_completo: user?.name || "",
        area_atuacao: "",
        telefone: user?.telefone || "",
        email: user?.email || "",
        cidade_estado: "",
        links: "",
        resumo: "",
        experiencias: [createRow("experiencias")],
        formacoes: [createRow("formacoes")],
        cursos: [createRow("cursos")],
        habilidades: "",
        idiomas: [createRow("idiomas")],
    };
}

function normalizeRows(section, rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
        return [createRow(section)];
    }

    return rows.map((row) => createRow(section, row));
}

function normalizeResume(resume, user) {
    if (!resume) return createInitialForm(user);

    return {
        nome_completo: resume.nome_completo || user?.name || "",
        area_atuacao: resume.area_atuacao || "",
        telefone: resume.telefone || user?.telefone || "",
        email: resume.email || user?.email || "",
        cidade_estado: resume.cidade_estado || "",
        links: Array.isArray(resume.links)
            ? resume.links.join("\n")
            : resume.links || "",
        resumo: resume.resumo || "",
        experiencias: normalizeRows(
            "experiencias",
            resume.experiencias,
        ),
        formacoes: normalizeRows("formacoes", resume.formacoes),
        cursos: normalizeRows("cursos", resume.cursos),
        habilidades: Array.isArray(resume.habilidades)
            ? resume.habilidades
                  .map((skill) =>
                      typeof skill === "string" ? skill : skill?.nome,
                  )
                  .filter(Boolean)
                  .join(", ")
            : resume.habilidades || "",
        idiomas: normalizeRows("idiomas", resume.idiomas),
    };
}

function splitList(value) {
    return String(value || "")
        .split(/[,;\n]+/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function cleanSectionRows(section, rows, errors) {
    const config = SECTION_CONFIG[section];
    const cleanedRows = [];

    rows.forEach((row, visualIndex) => {
        const cleaned = Object.fromEntries(
            config.fields.map((field) => [field, String(row[field] || "").trim()]),
        );
        const hasAnyValue = Object.values(cleaned).some(Boolean);

        if (!hasAnyValue) return;

        config.required.forEach((field) => {
            if (!cleaned[field]) {
                errors[`${section}.${visualIndex}.${field}`] =
                    "Preencha este campo ou remova esta linha.";
            }
        });

        cleanedRows.push(cleaned);
    });

    if (cleanedRows.length > config.limit) {
        errors[section] = `Adicione no máximo ${config.limit} itens.`;
    }

    return cleanedRows;
}

function isValidHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

function prepareSubmission(form) {
    const errors = {};
    const nomeCompleto = form.nome_completo.trim();
    const links = splitList(form.links);
    const skills = splitList(form.habilidades);

    if (nomeCompleto.length < 3) {
        errors.nome_completo = "Informe seu nome completo.";
    } else if (nomeCompleto.length > 150) {
        errors.nome_completo = "Use no máximo 150 caracteres.";
    }

    if (form.area_atuacao.length > 120) {
        errors.area_atuacao = "Use no máximo 120 caracteres.";
    }

    if (form.telefone.length > 20) {
        errors.telefone = "Use no máximo 20 caracteres.";
    }

    if (form.email && !EMAIL_REGEX.test(form.email.trim())) {
        errors.email = "Informe um e-mail válido.";
    }

    if (form.email.length > 254) {
        errors.email = "Use no máximo 254 caracteres.";
    }

    if (form.cidade_estado.length > 150) {
        errors.cidade_estado = "Use no máximo 150 caracteres.";
    }

    if (form.resumo.length > 5000) {
        errors.resumo = "Use no máximo 5.000 caracteres.";
    }

    if (links.length > 10) {
        errors.links = "Informe no máximo 10 links.";
    } else if (links.some((link) => !isValidHttpUrl(link))) {
        errors.links = "Use links completos iniciados por http:// ou https://.";
    }

    if (skills.length > 50) {
        errors.habilidades = "Informe no máximo 50 habilidades.";
    } else if (skills.some((skill) => skill.length > 80)) {
        errors.habilidades = "Cada habilidade deve ter até 80 caracteres.";
    }

    const normalizedSkillNames = skills.map((skill) =>
        skill.toLocaleLowerCase("pt-BR"),
    );
    if (new Set(normalizedSkillNames).size !== normalizedSkillNames.length) {
        errors.habilidades = "Não repita a mesma habilidade.";
    }

    const payload = {
        nome_completo: nomeCompleto,
        area_atuacao: form.area_atuacao.trim(),
        telefone: form.telefone.trim(),
        email: form.email.trim().toLowerCase(),
        cidade_estado: form.cidade_estado.trim(),
        links,
        resumo: form.resumo.trim(),
        experiencias: cleanSectionRows(
            "experiencias",
            form.experiencias,
            errors,
        ),
        formacoes: cleanSectionRows(
            "formacoes",
            form.formacoes,
            errors,
        ),
        cursos: cleanSectionRows("cursos", form.cursos, errors),
        habilidades: skills.map((nome) => ({ nome })),
        idiomas: cleanSectionRows("idiomas", form.idiomas, errors),
    };

    return { payload, errors };
}

function safeReturnPath(value) {
    return typeof value === "string" &&
        value.startsWith("/") &&
        !value.startsWith("//")
        ? value
        : "/homeUser";
}

export default function CreateResume() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const formRef = useRef(null);
    const objectPreviewUrlRef = useRef(null);
    const [form, setForm] = useState(() => createInitialForm(user));
    const [resumeId, setResumeId] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        const controller = new AbortController();
        let active = true;

        api.get("/curriculos/me", { signal: controller.signal })
            .then((response) => {
                if (!active) return;

                const resume = unwrapApiData(response);
                setResumeId(resume?.id || null);
                setForm(normalizeResume(resume, user));
                setPhotoPreview(resume?.foto || "");
                setPhotoFile(null);
                setLoadError("");
            })
            .catch((error) => {
                if (!active || error?.code === "ERR_CANCELED") return;

                if (error?.response?.status === 404) {
                    setResumeId(null);
                    setForm(createInitialForm(user));
                    setPhotoPreview("");
                    setLoadError("");
                    return;
                }

                setLoadError(
                    getApiErrorMessage(
                        error,
                        "Não foi possível carregar seu currículo.",
                    ),
                );
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
            controller.abort();
        };
    }, [reloadKey, user]);

    useEffect(
        () => () => {
            if (objectPreviewUrlRef.current) {
                URL.revokeObjectURL(objectPreviewUrlRef.current);
            }
        },
        [],
    );

    function clearError(field) {
        setErrors((currentErrors) => {
            if (!currentErrors[field]) return currentErrors;

            const nextErrors = { ...currentErrors };
            delete nextErrors[field];
            return nextErrors;
        });
        setSubmitError("");
        setSuccessMessage("");
    }

    function updateField(field, value) {
        setForm((currentForm) => ({
            ...currentForm,
            [field]: value,
        }));
        clearError(field);
    }

    function updateSectionField(section, clientId, field, value) {
        const rowIndex = form[section].findIndex(
            (row) => row._clientId === clientId,
        );

        setForm((currentForm) => ({
            ...currentForm,
            [section]: currentForm[section].map((row) =>
                row._clientId === clientId
                    ? { ...row, [field]: value }
                    : row,
            ),
        }));

        if (rowIndex >= 0) {
            clearError(`${section}.${rowIndex}.${field}`);
        }
    }

    function addSectionRow(section) {
        const config = SECTION_CONFIG[section];

        if (form[section].length >= config.limit) {
            setErrors((currentErrors) => ({
                ...currentErrors,
                [section]: `Adicione no máximo ${config.limit} itens.`,
            }));
            return;
        }

        setForm((currentForm) => ({
            ...currentForm,
            [section]: [...currentForm[section], createRow(section)],
        }));
        clearError(section);
    }

    function removeSectionRow(section, clientId) {
        setForm((currentForm) => ({
            ...currentForm,
            [section]: currentForm[section].filter(
                (row) => row._clientId !== clientId,
            ),
        }));
        setErrors({});
        setSubmitError("");
    }

    function handlePhotoChange(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!PHOTO_TYPES.includes(file.type)) {
            setErrors((currentErrors) => ({
                ...currentErrors,
                foto: "Escolha uma imagem JPG, PNG ou WebP.",
            }));
            event.target.value = "";
            return;
        }

        if (file.size > PHOTO_MAX_SIZE) {
            setErrors((currentErrors) => ({
                ...currentErrors,
                foto: "A foto deve ter no máximo 2 MB.",
            }));
            event.target.value = "";
            return;
        }

        if (objectPreviewUrlRef.current) {
            URL.revokeObjectURL(objectPreviewUrlRef.current);
        }

        const objectUrl = URL.createObjectURL(file);
        objectPreviewUrlRef.current = objectUrl;
        setPhotoFile(file);
        setPhotoPreview(objectUrl);
        clearError("foto");
    }

    function handleRetry() {
        setLoading(true);
        setLoadError("");
        setReloadKey((currentKey) => currentKey + 1);
    }

    function focusFirstError() {
        window.requestAnimationFrame(() => {
            formRef.current
                ?.querySelector('[aria-invalid="true"]')
                ?.focus();
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (saving) return;

        const prepared = prepareSubmission(form);

        if (Object.keys(prepared.errors).length > 0) {
            setErrors(prepared.errors);
            setSubmitError("Revise os campos destacados antes de continuar.");
            focusFirstError();
            return;
        }

        setSaving(true);
        setErrors({});
        setSubmitError("");
        setSuccessMessage("");

        let savedResumeId = resumeId;

        try {
            const response = resumeId
                ? await api.put(`/curriculos/${resumeId}`, prepared.payload)
                : await api.post("/curriculos", prepared.payload);
            const savedResume = unwrapApiData(response);
            savedResumeId = savedResume?.id || resumeId;

            if (!savedResumeId) {
                throw new Error(
                    "A API não retornou o identificador do currículo salvo.",
                );
            }

            setResumeId(savedResumeId);

            if (photoFile) {
                const photoData = new FormData();
                photoData.append("foto", photoFile);

                try {
                    await api.post(
                        `/curriculos/${savedResumeId}/foto`,
                        photoData,
                    );
                } catch (photoError) {
                    setSuccessMessage(
                        "Os dados do currículo foram salvos.",
                    );
                    setSubmitError(
                        getApiErrorMessage(
                            photoError,
                            "A foto não pôde ser enviada. Escolha outra imagem e tente novamente.",
                        ),
                    );
                    return;
                }
            }

            const message = resumeId
                ? "Currículo atualizado com sucesso."
                : "Currículo criado com sucesso.";
            const destination = safeReturnPath(
                location.state?.redirectTo,
            );

            navigate(destination, {
                replace: true,
                state: {
                    feedback: message,
                    openJobId: location.state?.vagaId || null,
                },
            });
        } catch (error) {
            const validationErrors = getLaravelValidationErrors(error);
            setErrors(validationErrors);
            setSubmitError(
                Object.keys(validationErrors).length > 0
                    ? "Revise os campos informados e tente novamente."
                    : getApiErrorMessage(
                          error,
                          "Não foi possível salvar seu currículo.",
                      ),
            );
            focusFirstError();
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div style={styles.page}>
                <style>{responsiveStyles}</style>
                <div style={styles.topCircle} aria-hidden="true" />
                <div style={styles.bottomCircle} aria-hidden="true" />
                <div style={styles.logo}>
                    <img src={Logo} alt="Banco de Talentos" style={styles.image} />
                </div>
                <main style={styles.loadingPanel} role="status">
                    <span style={styles.spinner} aria-hidden="true" />
                    <h1 style={styles.loadingTitle}>Carregando currículo</h1>
                    <p style={styles.loadingText}>
                        Aguarde enquanto buscamos seus dados.
                    </p>
                </main>
            </div>
        );
    }

    if (loadError) {
        return (
            <div style={styles.page}>
                <style>{responsiveStyles}</style>
                <div style={styles.topCircle} aria-hidden="true" />
                <div style={styles.bottomCircle} aria-hidden="true" />
                <div style={styles.logo}>
                    <img src={Logo} alt="Banco de Talentos" style={styles.image} />
                </div>
                <main style={styles.loadingPanel} role="alert">
                    <h1 style={styles.loadingTitle}>
                        Não foi possível carregar
                    </h1>
                    <p style={styles.loadingText}>{loadError}</p>
                    <div style={styles.stateActions}>
                        <button
                            type="button"
                            style={styles.secondaryButton}
                            onClick={() => navigate("/homeUser")}
                        >
                            Voltar às vagas
                        </button>
                        <button
                            type="button"
                            style={styles.createButton}
                            onClick={handleRetry}
                        >
                            Tentar novamente
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <>
            <style>{responsiveStyles}</style>

            <div style={styles.page}>
                <div style={styles.topCircle} aria-hidden="true" />
                <div style={styles.bottomCircle} aria-hidden="true" />

                <div style={styles.logo}>
                    <img
                        src={Logo}
                        alt="Banco de Talentos"
                        style={styles.image}
                    />
                </div>

                <form
                    ref={formRef}
                    style={styles.container}
                    onSubmit={handleSubmit}
                    noValidate
                >
                    {(submitError || successMessage) && (
                        <div style={styles.messages} aria-live="polite">
                            {successMessage && (
                                <p style={styles.successMessage} role="status">
                                    {successMessage}
                                </p>
                            )}
                            {submitError && (
                                <p style={styles.errorMessage} role="alert">
                                    {submitError}
                                </p>
                            )}
                        </div>
                    )}

                    <section style={styles.section}>
                        <h1 style={styles.title}>Informações Pessoais</h1>

                        <div style={styles.personalGrid} className="personal-grid">
                            <div style={styles.column}>
                                <FormInput
                                    label="Nome completo"
                                    name="nome_completo"
                                    value={form.nome_completo}
                                    error={errors.nome_completo}
                                    maxLength={150}
                                    autoComplete="name"
                                    required
                                    disabled={saving}
                                    onChange={(value) =>
                                        updateField("nome_completo", value)
                                    }
                                />
                                <FormInput
                                    label="Telefone"
                                    name="telefone"
                                    value={form.telefone}
                                    error={errors.telefone}
                                    maxLength={20}
                                    inputMode="tel"
                                    autoComplete="tel"
                                    disabled={saving}
                                    onChange={(value) =>
                                        updateField("telefone", value)
                                    }
                                />
                                <FormInput
                                    label="Cidade/Estado"
                                    name="cidade_estado"
                                    value={form.cidade_estado}
                                    error={errors.cidade_estado}
                                    maxLength={150}
                                    autoComplete="address-level2"
                                    disabled={saving}
                                    onChange={(value) =>
                                        updateField("cidade_estado", value)
                                    }
                                />
                            </div>

                            <div style={styles.column}>
                                <FormInput
                                    label="Área de trabalho"
                                    name="area_atuacao"
                                    value={form.area_atuacao}
                                    error={errors.area_atuacao}
                                    maxLength={120}
                                    disabled={saving}
                                    onChange={(value) =>
                                        updateField("area_atuacao", value)
                                    }
                                />
                                <FormInput
                                    label="E-mail"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    error={errors.email}
                                    maxLength={254}
                                    autoComplete="email"
                                    disabled={saving}
                                    onChange={(value) =>
                                        updateField("email", value)
                                    }
                                />
                                <FormInput
                                    label="Links, separados por vírgula ou linha"
                                    name="links"
                                    value={form.links}
                                    error={errors.links}
                                    placeholder="https://linkedin.com/in/seu-perfil"
                                    disabled={saving}
                                    onChange={(value) =>
                                        updateField("links", value)
                                    }
                                />
                            </div>

                            <div>
                                <label
                                    style={{
                                        ...styles.uploadBox,
                                        ...(errors.foto
                                            ? styles.inputError
                                            : {}),
                                    }}
                                >
                                    <input
                                        type="file"
                                        name="foto"
                                        accept="image/jpeg,image/png,image/webp"
                                        aria-label="Enviar foto do currículo"
                                        aria-invalid={Boolean(errors.foto)}
                                        aria-describedby={
                                            errors.foto
                                                ? "resume-foto-error"
                                                : undefined
                                        }
                                        style={styles.uploadInput}
                                        disabled={saving}
                                        onChange={handlePhotoChange}
                                    />

                                    {photoPreview ? (
                                        <>
                                            <img
                                                src={photoPreview}
                                                alt="Prévia da foto do currículo"
                                                style={styles.uploadImage}
                                            />
                                            <span style={styles.uploadCaption}>
                                                Trocar foto
                                            </span>
                                        </>
                                    ) : (
                                        <span>
                                            Enviar foto
                                            <br />
                                            <small>JPG, PNG ou WebP · até 2 MB</small>
                                        </span>
                                    )}
                                </label>
                                <FieldError
                                    id="resume-foto-error"
                                    message={errors.foto}
                                />
                            </div>
                        </div>
                    </section>

                    <section style={styles.section}>
                        <h2 style={styles.title}>Resumo Profissional</h2>
                        <FormTextarea
                            label="Resumo profissional"
                            name="resumo"
                            value={form.resumo}
                            error={errors.resumo}
                            maxLength={5000}
                            placeholder="Profissional com experiência em..., com foco em..."
                            disabled={saving}
                            onChange={(value) => updateField("resumo", value)}
                        />
                    </section>

                    <section style={styles.section}>
                        <h2 style={styles.title}>Experiência Profissional</h2>
                        <FieldError message={errors.experiencias} />

                        {form.experiencias.length === 0 && (
                            <p style={styles.emptySectionText}>
                                Nenhuma experiência adicionada.
                            </p>
                        )}

                        {form.experiencias.map((experience, index) => (
                            <div key={experience._clientId} style={styles.itemBlock}>
                                <ItemHeader
                                    label={`Experiência ${index + 1}`}
                                    disabled={saving}
                                    onRemove={() =>
                                        removeSectionRow(
                                            "experiencias",
                                            experience._clientId,
                                        )
                                    }
                                />
                                <div style={styles.row} className="responsive-row">
                                    <FormInput
                                        compact
                                        label="Cargo"
                                        name={`experiencias.${index}.cargo`}
                                        value={experience.cargo}
                                        error={errors[`experiencias.${index}.cargo`]}
                                        maxLength={120}
                                        disabled={saving}
                                        onChange={(value) =>
                                            updateSectionField(
                                                "experiencias",
                                                experience._clientId,
                                                "cargo",
                                                value,
                                            )
                                        }
                                    />
                                    <FormInput
                                        compact
                                        label="Empresa"
                                        name={`experiencias.${index}.empresa`}
                                        value={experience.empresa}
                                        error={errors[`experiencias.${index}.empresa`]}
                                        maxLength={150}
                                        disabled={saving}
                                        onChange={(value) =>
                                            updateSectionField(
                                                "experiencias",
                                                experience._clientId,
                                                "empresa",
                                                value,
                                            )
                                        }
                                    />
                                    <FormInput
                                        compact
                                        label="Período"
                                        name={`experiencias.${index}.periodo`}
                                        value={experience.periodo}
                                        error={errors[`experiencias.${index}.periodo`]}
                                        maxLength={100}
                                        disabled={saving}
                                        onChange={(value) =>
                                            updateSectionField(
                                                "experiencias",
                                                experience._clientId,
                                                "periodo",
                                                value,
                                            )
                                        }
                                    />
                                </div>
                                <FormTextarea
                                    label="Descrição da experiência"
                                    name={`experiencias.${index}.descricao`}
                                    value={experience.descricao}
                                    error={errors[`experiencias.${index}.descricao`]}
                                    maxLength={3000}
                                    highlight
                                    placeholder="Conte brevemente suas principais atividades e resultados"
                                    disabled={saving}
                                    onChange={(value) =>
                                        updateSectionField(
                                            "experiencias",
                                            experience._clientId,
                                            "descricao",
                                            value,
                                        )
                                    }
                                />
                            </div>
                        ))}

                        <AddButton
                            label="Adicionar mais Experiências +"
                            disabled={saving}
                            onClick={() => addSectionRow("experiencias")}
                        />
                    </section>

                    <ResumeRowsSection
                        title="Formação Acadêmica"
                        section="formacoes"
                        rows={form.formacoes}
                        fields={[
                            ["curso", "Curso", 150],
                            ["instituicao", "Instituição", 150],
                            ["periodo", "Período", 100],
                        ]}
                        errors={errors}
                        disabled={saving}
                        onChange={updateSectionField}
                        onAdd={addSectionRow}
                        onRemove={removeSectionRow}
                    />

                    <ResumeRowsSection
                        title="Cursos Complementares"
                        section="cursos"
                        rows={form.cursos}
                        fields={[
                            ["nome", "Nome do Curso", 150],
                            ["instituicao", "Instituição", 150],
                            ["periodo", "Período", 100],
                        ]}
                        errors={errors}
                        disabled={saving}
                        onChange={updateSectionField}
                        onAdd={addSectionRow}
                        onRemove={removeSectionRow}
                    />

                    <section style={styles.section}>
                        <h2 style={styles.title}>Habilidades</h2>
                        <FormInput
                            label="Habilidades separadas por vírgula"
                            name="habilidades"
                            value={form.habilidades}
                            error={errors.habilidades}
                            placeholder="React, Laravel, Comunicação"
                            disabled={saving}
                            onChange={(value) =>
                                updateField("habilidades", value)
                            }
                        />
                    </section>

                    <ResumeRowsSection
                        title="Idiomas"
                        section="idiomas"
                        rows={form.idiomas}
                        fields={[
                            ["idioma", "Idioma", 80],
                            ["nivel", "Nível", 80],
                        ]}
                        errors={errors}
                        disabled={saving}
                        onChange={updateSectionField}
                        onAdd={addSectionRow}
                        onRemove={removeSectionRow}
                    />

                    <div style={styles.footer}>
                        <button
                            type="button"
                            style={styles.secondaryButton}
                            disabled={saving}
                            onClick={() => navigate("/homeUser")}
                        >
                            Voltar às vagas
                        </button>
                        <button
                            type="submit"
                            style={{
                                ...styles.createButton,
                                ...(saving ? styles.buttonDisabled : {}),
                            }}
                            disabled={saving}
                            onMouseEnter={(event) => {
                                if (saving) return;
                                event.currentTarget.style.transform =
                                    "translateY(-3px)";
                                event.currentTarget.style.boxShadow =
                                    "0 10px 25px rgba(107,164,232,0.4)";
                            }}
                            onMouseLeave={(event) => {
                                if (saving) return;
                                event.currentTarget.style.transform =
                                    "translateY(0)";
                                event.currentTarget.style.boxShadow = "none";
                            }}
                        >
                            {saving
                                ? "Salvando..."
                                : resumeId
                                  ? "Atualizar Currículo"
                                  : "Criar Currículo"}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

function FormInput({
    label,
    name,
    value,
    error,
    onChange,
    compact = false,
    type = "text",
    placeholder = label,
    ...inputProps
}) {
    const errorId = `resume-${name.replace(/[^a-zA-Z0-9]+/g, "-")}-error`;

    return (
        <label style={{ ...styles.fieldGroup, ...(compact ? styles.fieldGrow : {}) }}>
            <span style={styles.visuallyHidden}>{label}</span>
            <input
                {...inputProps}
                className="resume-field"
                type={type}
                name={name}
                value={value}
                placeholder={placeholder}
                aria-label={label}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                style={{
                    ...(compact ? styles.smallInput : styles.input),
                    ...(error ? styles.inputError : {}),
                }}
                onChange={(event) => onChange(event.target.value)}
            />
            <FieldError id={errorId} message={error} />
        </label>
    );
}

function FormTextarea({
    label,
    name,
    value,
    error,
    onChange,
    highlight = false,
    ...textareaProps
}) {
    const errorId = `resume-${name.replace(/[^a-zA-Z0-9]+/g, "-")}-error`;

    return (
        <label style={styles.fieldGroup}>
            <span style={styles.visuallyHidden}>{label}</span>
            <textarea
                {...textareaProps}
                className="resume-field"
                name={name}
                value={value}
                aria-label={label}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                style={{
                    ...(highlight
                        ? styles.highlightTextarea
                        : styles.textarea),
                    ...(error ? styles.inputError : {}),
                }}
                onChange={(event) => onChange(event.target.value)}
            />
            <FieldError id={errorId} message={error} />
        </label>
    );
}

function FieldError({ id, message }) {
    if (!message) return null;

    return (
        <span id={id} style={styles.fieldError}>
            {message}
        </span>
    );
}

function ItemHeader({ label, disabled, onRemove }) {
    return (
        <div style={styles.itemHeader}>
            <span style={styles.itemLabel}>{label}</span>
            <button
                type="button"
                style={styles.removeButton}
                disabled={disabled}
                onClick={onRemove}
            >
                Remover
            </button>
        </div>
    );
}

function AddButton({ label, disabled, onClick }) {
    return (
        <div style={styles.addButtonContainer}>
            <button
                type="button"
                style={styles.addButton}
                disabled={disabled}
                onClick={onClick}
            >
                {label}
            </button>
        </div>
    );
}

function ResumeRowsSection({
    title,
    section,
    rows,
    fields,
    errors,
    disabled,
    onChange,
    onAdd,
    onRemove,
}) {
    return (
        <section style={styles.section}>
            <h2 style={styles.title}>{title}</h2>
            <FieldError message={errors[section]} />

            {rows.length === 0 && (
                <p style={styles.emptySectionText}>Nenhum item adicionado.</p>
            )}

            {rows.map((row, index) => (
                <div key={row._clientId} style={styles.itemBlock}>
                    <ItemHeader
                        label={`${title} ${index + 1}`}
                        disabled={disabled}
                        onRemove={() => onRemove(section, row._clientId)}
                    />
                    <div style={styles.row} className="responsive-row">
                        {fields.map(([field, label, maxLength]) => (
                            <FormInput
                                key={field}
                                compact
                                label={label}
                                name={`${section}.${index}.${field}`}
                                value={row[field] || ""}
                                error={errors[`${section}.${index}.${field}`]}
                                maxLength={maxLength}
                                disabled={disabled}
                                onChange={(value) =>
                                    onChange(
                                        section,
                                        row._clientId,
                                        field,
                                        value,
                                    )
                                }
                            />
                        ))}
                    </div>
                </div>
            ))}

            <AddButton
                label={`Adicionar mais ${title} +`}
                disabled={disabled}
                onClick={() => onAdd(section)}
            />
        </section>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #020617 0%, #0f172a 100%)",
        padding: "50px 20px",
        fontFamily: "Poppins, sans-serif",
        position: "relative",
        overflow: "hidden",
    },
    topCircle: {
        position: "absolute",
        width: "450px",
        height: "450px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
        top: "-150px",
        right: "-150px",
        opacity: 0.5,
        filter: "blur(20px)",
    },
    bottomCircle: {
        position: "absolute",
        width: "500px",
        height: "500px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
        bottom: "-250px",
        left: "-250px",
        opacity: 0.4,
        filter: "blur(20px)",
    },
    logo: {
        position: "relative",
        zIndex: 2,
        marginBottom: "40px",
        textAlign: "center",
    },
    image: {
        width: "190px",
        maxWidth: "70%",
        height: "auto",
    },
    container: {
        maxWidth: "1100px",
        margin: "0 auto",
        position: "relative",
        zIndex: 2,
    },
    messages: {
        marginBottom: "35px",
        display: "grid",
        gap: "12px",
    },
    errorMessage: {
        margin: 0,
        padding: "15px 18px",
        borderRadius: "14px",
        background: "rgba(254, 226, 226, 0.96)",
        border: "1px solid #fecaca",
        color: "#991b1b",
        fontWeight: "700",
        lineHeight: 1.5,
    },
    successMessage: {
        margin: 0,
        padding: "15px 18px",
        borderRadius: "14px",
        background: "rgba(220, 252, 231, 0.96)",
        border: "1px solid #86efac",
        color: "#166534",
        fontWeight: "700",
        lineHeight: 1.5,
    },
    section: {
        marginBottom: "60px",
    },
    title: {
        color: "#fff",
        marginBottom: "24px",
        fontSize: "clamp(28px, 5vw, 36px)",
        fontWeight: "700",
        letterSpacing: "-1px",
    },
    personalGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr 250px",
        gap: "20px",
        alignItems: "start",
    },
    column: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    fieldGroup: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        minWidth: 0,
    },
    fieldGrow: {
        flex: 1,
    },
    visuallyHidden: {
        position: "absolute",
        width: "1px",
        height: "1px",
        padding: 0,
        margin: "-1px",
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: 0,
    },
    input: {
        width: "100%",
        padding: "18px 22px",
        borderRadius: "18px",
        border: "2px solid rgba(96,165,250,0.35)",
        outline: "none",
        fontSize: "15px",
        transition: "0.3s",
        background: "rgba(255,255,255,0.92)",
        boxSizing: "border-box",
        color: "#0f172a",
    },
    smallInput: {
        width: "100%",
        minWidth: 0,
        padding: "18px 22px",
        borderRadius: "18px",
        border: "2px solid rgba(96,165,250,0.35)",
        outline: "none",
        fontSize: "15px",
        background: "rgba(255,255,255,0.92)",
        boxSizing: "border-box",
        color: "#0f172a",
    },
    inputError: {
        borderColor: "#fb7185",
        boxShadow: "0 0 0 3px rgba(251,113,133,0.18)",
    },
    fieldError: {
        display: "block",
        marginTop: "7px",
        color: "#fecdd3",
        fontSize: "13px",
        fontWeight: "600",
        lineHeight: 1.4,
    },
    textarea: {
        width: "100%",
        minHeight: "160px",
        padding: "22px",
        borderRadius: "24px",
        border: "2px solid rgba(96,165,250,0.35)",
        resize: "vertical",
        outline: "none",
        fontSize: "15px",
        background: "rgba(255,255,255,0.92)",
        boxSizing: "border-box",
        color: "#0f172a",
    },
    highlightTextarea: {
        width: "100%",
        minHeight: "140px",
        padding: "22px",
        borderRadius: "24px",
        border: "2px solid rgba(96,165,250,0.35)",
        resize: "vertical",
        outline: "none",
        marginTop: "15px",
        fontSize: "15px",
        background: "rgba(255,255,255,0.92)",
        marginBottom: "4px",
        boxSizing: "border-box",
        color: "#0f172a",
    },
    row: {
        display: "flex",
        gap: "20px",
        alignItems: "flex-start",
    },
    itemBlock: {
        padding: "18px",
        marginBottom: "20px",
        borderRadius: "24px",
        border: "1px solid rgba(148,163,184,0.25)",
        background: "rgba(15,23,42,0.28)",
    },
    itemHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "16px",
        marginBottom: "14px",
    },
    itemLabel: {
        color: "#cbd5e1",
        fontSize: "14px",
        fontWeight: "700",
    },
    removeButton: {
        border: "1px solid rgba(251,113,133,0.5)",
        borderRadius: "10px",
        background: "rgba(136,19,55,0.28)",
        color: "#fecdd3",
        padding: "7px 11px",
        fontWeight: "700",
        cursor: "pointer",
    },
    uploadBox: {
        position: "relative",
        overflow: "hidden",
        background: "rgba(255,255,255,0.92)",
        borderRadius: "28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: "#0f172a",
        fontWeight: "600",
        minHeight: "216px",
        cursor: "pointer",
        transition: "0.3s",
        fontSize: "18px",
        border: "2px dashed rgba(96,165,250,0.5)",
        padding: "20px",
        boxSizing: "border-box",
    },
    uploadInput: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity: 0,
        cursor: "pointer",
        zIndex: 2,
    },
    uploadImage: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },
    uploadCaption: {
        position: "absolute",
        left: "12px",
        right: "12px",
        bottom: "12px",
        padding: "9px 12px",
        borderRadius: "12px",
        background: "rgba(15,23,42,0.78)",
        color: "white",
        fontSize: "13px",
        fontWeight: "700",
    },
    emptySectionText: {
        margin: "-8px 0 20px",
        color: "#cbd5e1",
        fontSize: "14px",
    },
    addButtonContainer: {
        display: "flex",
        justifyContent: "flex-end",
        marginTop: "10px",
    },
    addButton: {
        background: "none",
        border: "none",
        color: "#60a5fa",
        fontWeight: "700",
        cursor: "pointer",
        fontSize: "15px",
        transition: "0.3s",
    },
    footer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "18px",
        marginTop: "80px",
        marginBottom: "50px",
    },
    createButton: {
        width: "100%",
        maxWidth: "380px",
        background: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
        color: "#fff",
        border: "none",
        padding: "20px 40px",
        borderRadius: "20px",
        fontWeight: "700",
        fontSize: "20px",
        cursor: "pointer",
        transition: "0.3s",
        boxSizing: "border-box",
    },
    secondaryButton: {
        width: "100%",
        maxWidth: "260px",
        background: "rgba(255,255,255,0.08)",
        color: "#e2e8f0",
        border: "1px solid rgba(255,255,255,0.25)",
        padding: "17px 28px",
        borderRadius: "18px",
        fontWeight: "700",
        fontSize: "16px",
        cursor: "pointer",
    },
    buttonDisabled: {
        cursor: "not-allowed",
        opacity: 0.65,
    },
    loadingPanel: {
        width: "min(100%, 620px)",
        minHeight: "250px",
        margin: "0 auto",
        padding: "36px 28px",
        position: "relative",
        zIndex: 2,
        borderRadius: "28px",
        background: "rgba(15,23,42,0.72)",
        border: "1px solid rgba(255,255,255,0.12)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
    },
    loadingTitle: {
        margin: "0 0 12px",
        color: "white",
        fontSize: "clamp(25px, 6vw, 34px)",
    },
    loadingText: {
        margin: 0,
        color: "#cbd5e1",
        fontSize: "16px",
        lineHeight: 1.6,
    },
    spinner: {
        width: "42px",
        height: "42px",
        marginBottom: "20px",
        border: "4px solid rgba(255,255,255,0.2)",
        borderTopColor: "#60a5fa",
        borderRadius: "50%",
        animation: "resume-spin 0.8s linear infinite",
    },
    stateActions: {
        width: "100%",
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "14px",
        marginTop: "26px",
    },
};

const responsiveStyles = `
* {
    box-sizing: border-box;
}

input,
textarea,
button {
    font-family: Poppins, sans-serif;
}

.resume-field:focus {
    border-color: #60a5fa !important;
    box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.18);
}

@keyframes resume-spin {
    to { transform: rotate(360deg); }
}

@media (max-width: 1024px) {
    .personal-grid {
        grid-template-columns: 1fr !important;
    }
}

@media (max-width: 768px) {
    .responsive-row {
        flex-direction: column !important;
    }
}

@media (max-width: 640px) {
    body {
        overflow-x: hidden;
    }
}
`;
