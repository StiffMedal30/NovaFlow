import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileText, Globe2, Loader2, Mic, RotateCcw, Send, Square, Trash2 } from "lucide-react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { useNavigate, useParams } from "react-router-dom";
import { IdeaSideMenu } from "../../components/ui/idea-side-menu";
import { useTheme } from "../../context/ThemeContext";
import {
    createIdea,
    deleteIdea,
    fetchIdea,
    generateFeasibilityStudy,
    transcribeIdeaAudio,
    updateIdea,
    updateIdeaStep,
} from "../../../apiClient/IdeaClient";
import type { IdeaStep } from "../../app/Types";
import { downloadTextPdf } from "../../utils/downloadPdf";

type SubmitStatus = "idle" | "loading" | "recording" | "transcribing" | "planning" | "feasibility" | "deleting" | "done" | "error";

const REGION_EXCLUSIONS = new Set(["AC", "CP", "DG", "EA", "EU", "EZ", "IC", "QO", "TA", "UN", "XA", "XB"]);

function getCountryNames(): string[] {
    const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
    const countries: string[] = [];

    for (let first = 65; first <= 90; first += 1) {
        for (let second = 65; second <= 90; second += 1) {
            const code = String.fromCharCode(first, second);
            const name = displayNames.of(code);
            if (name && name !== code && name !== "Unknown Region" && !REGION_EXCLUSIONS.has(code)) {
                countries.push(name);
            }
        }
    }

    return [...new Set(countries)].sort((left, right) => left.localeCompare(right));
}

const IdeaPage = () => {
    const { currentTheme } = useTheme();
    const navigate = useNavigate();
    const { ideaId } = useParams();
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition,
    } = useSpeechRecognition();

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
    const [status, setStatus] = useState<SubmitStatus>("idle");
    const [message, setMessage] = useState("");
    const [refinement, setRefinement] = useState("");
    const [feasibilityCountry, setFeasibilityCountry] = useState("");
    const [studyCountry, setStudyCountry] = useState("");
    const [feasibilityStudy, setFeasibilityStudy] = useState("");
    const [planSteps, setPlanSteps] = useState<IdeaStep[]>([]);
    const [savedPlanSteps, setSavedPlanSteps] = useState<IdeaStep[]>([]);
    const [savingStepId, setSavingStepId] = useState<string | null>(null);
    const [stepError, setStepError] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const countries = useMemo(getCountryNames, []);

    const ideaDescription = useMemo(() => {
        const speechText = transcript.trim();
        if (speechText.length > 0) {
            return speechText;
        }
        return description.trim();
    }, [description, transcript]);

    const isBusy = status === "loading"
        || status === "recording"
        || status === "transcribing"
        || status === "planning"
        || status === "feasibility"
        || status === "deleting";
    const canSubmit = title.trim().length > 0 && (description.trim().length > 0 || transcript.trim().length > 0 || recordedAudio);

    useEffect(() => {
        let active = true;

        if (!ideaId) {
            return () => {
                active = false;
            };
        }

        setStatus("loading");
        setMessage("");
        setRefinement("");
        setFeasibilityCountry("");
        setStudyCountry("");
        setFeasibilityStudy("");
        setPlanSteps([]);
        setSavedPlanSteps([]);
        setStepError("");
        setRecordedAudio(null);
        resetTranscript();

        fetchIdea(ideaId)
            .then((idea) => {
                if (!active) {
                    return;
                }
                setTitle(idea.title);
                setDescription(idea.description);
                setRefinement(idea.aiResponse ?? "");
                setFeasibilityCountry(idea.feasibilityCountry ?? "");
                setStudyCountry(idea.feasibilityCountry ?? "");
                setFeasibilityStudy(idea.feasibilityResponse ?? "");
                setPlanSteps(idea.steps ?? []);
                setSavedPlanSteps(idea.steps ?? []);
                setMessage(idea.aiProcessed ? "Continuing from the latest saved plan." : "This idea was saved before planning completed.");
                setStatus("done");
            })
            .catch((error) => {
                if (!active) {
                    return;
                }
                setTitle("");
                setDescription("");
                setStatus("error");
                setMessage(error instanceof Error ? error.message : "Could not load idea.");
            });

        return () => {
            active = false;
        };
    }, [ideaId, resetTranscript]);

    const startRecording = async () => {
        setMessage("");
        setRefinement("");
        setFeasibilityCountry("");
        setStudyCountry("");
        setFeasibilityStudy("");
        setPlanSteps([]);
        setSavedPlanSteps([]);
        setStepError("");
        setRecordedAudio(null);
        audioChunksRef.current = [];

        if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
            setStatus("error");
            setMessage("Voice recording is not supported by this browser.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
                setRecordedAudio(audioBlob);
                stream.getTracks().forEach((track) => track.stop());
                setStatus("idle");
            };

            recorder.start();
            setStatus("recording");

            if (browserSupportsSpeechRecognition) {
                resetTranscript();
                SpeechRecognition.startListening({ continuous: true, language: "en-US" });
            }
        } catch (error) {
            setStatus("error");
            setMessage(error instanceof Error ? error.message : "Could not start recording.");
        }
    };

    const stopRecording = () => {
        if (listening) {
            SpeechRecognition.stopListening();
        }

        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
        } else {
            setStatus("idle");
        }
    };

    const resetIdea = () => {
        if (listening) {
            SpeechRecognition.stopListening();
        }
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
        }

        setTitle("");
        setDescription("");
        setRecordedAudio(null);
        setStatus("idle");
        setMessage("");
        setRefinement("");
        setPlanSteps([]);
        setSavedPlanSteps([]);
        setStepError("");
        resetTranscript();
        if (ideaId) {
            navigate("/idea");
        }
    };

    const submitIdea = async () => {
        if (!canSubmit || isBusy) {
            return;
        }

        setMessage("");
        setRefinement("");

        try {
            let finalDescription = ideaDescription;

            if (!finalDescription && recordedAudio) {
                setStatus("transcribing");
                const transcription = await transcribeIdeaAudio(recordedAudio);
                finalDescription = transcription.text.trim();
                setDescription(finalDescription);
            }

            if (!finalDescription) {
                throw new Error("Add an idea description or record a voice note first.");
            }

            setStatus("planning");
            const idea = {
                title: title.trim(),
                description: finalDescription,
            };
            const response = ideaId
                ? await updateIdea(ideaId, idea)
                : await createIdea(idea);

            setRefinement(response.refinement ?? "");
            setPlanSteps(response.steps ?? []);
            setSavedPlanSteps(response.steps ?? []);
            setStepError("");
            setFeasibilityCountry("");
            setStudyCountry("");
            setFeasibilityStudy("");
            setMessage(response.message);
            setStatus("done");
            if (!ideaId && response.ideaId) {
                navigate(`/idea/${response.ideaId}`, { replace: true });
            }
        } catch (error) {
            setStatus("error");
            setMessage(error instanceof Error ? error.message : "Could not submit idea.");
        }
    };

    const createFeasibilityStudy = async () => {
        if (!ideaId || !feasibilityCountry || isBusy) {
            return;
        }

        setStatus("feasibility");
        setMessage("");

        try {
            const response = await generateFeasibilityStudy(ideaId, feasibilityCountry);
            setFeasibilityCountry(response.country);
            setStudyCountry(response.country);
            setFeasibilityStudy(response.study);
            setMessage(`Feasibility study generated for ${response.country}.`);
            setStatus("done");
        } catch (error) {
            setStatus("error");
            setMessage(error instanceof Error ? error.message : "Could not generate feasibility study.");
        }
    };

    const downloadPlanPdf = (includeFeasibility: boolean) => {
        const sections = [
            { heading: "Idea", body: `${title}\n\n${description}` },
            { heading: "Prioritized plan", body: refinement },
        ];

        if (planSteps.length > 0) {
            sections.push({
                heading: "Action tracker",
                body: planSteps.map((step) => {
                    const assignment = [
                        step.priority,
                        step.owner ? `Owner: ${step.owner}` : "Owner: unassigned",
                        step.dueDate ? `Due: ${step.dueDate}` : "Due: not set",
                    ].join(" | ");
                    return `${step.completed ? "[x]" : "[ ]"} ${step.position}. ${step.title}\n${assignment}`;
                }).join("\n\n"),
            });
        }

        if (includeFeasibility && feasibilityStudy) {
            sections.push({
                heading: `Feasibility study: ${studyCountry}`,
                body: feasibilityStudy,
            });
        }

        downloadTextPdf(
            `${title || "novaflow-idea"}${includeFeasibility ? "-report" : "-plan"}.pdf`,
            title || "NovaFlow idea",
            sections
        );
    };

    const editPlanStep = (stepId: string, changes: Partial<IdeaStep>) => {
        setPlanSteps((current) => current.map((step) => (
            step.id === stepId ? { ...step, ...changes } : step
        )));
    };

    const savePlanStep = async (step: IdeaStep) => {
        if (!ideaId || savingStepId) {
            return;
        }

        setSavingStepId(step.id);
        setStepError("");

        try {
            const updated = await updateIdeaStep(ideaId, step.id, {
                priority: step.priority,
                owner: step.owner,
                dueDate: step.dueDate,
                completed: step.completed,
            });
            setPlanSteps((current) => current.map((item) => item.id === updated.id ? updated : item));
            setSavedPlanSteps((current) => current.map((item) => item.id === updated.id ? updated : item));
        } catch (error) {
            const savedStep = savedPlanSteps.find((item) => item.id === step.id);
            if (savedStep) {
                setPlanSteps((current) => current.map((item) => item.id === step.id ? savedStep : item));
            }
            setStepError(error instanceof Error ? error.message : "Could not update the step.");
        } finally {
            setSavingStepId(null);
        }
    };

    const hasStepChanges = (step: IdeaStep) => {
        const savedStep = savedPlanSteps.find((item) => item.id === step.id);
        return !savedStep
            || savedStep.priority !== step.priority
            || savedStep.owner !== step.owner
            || savedStep.dueDate !== step.dueDate
            || savedStep.completed !== step.completed;
    };

    const completedStepCount = planSteps.filter((step) => step.completed).length;
    const stepProgress = planSteps.length > 0
        ? Math.round((completedStepCount / planSteps.length) * 100)
        : 0;

    const confirmDeleteIdea = async () => {
        if (!ideaId || status === "deleting") {
            return;
        }

        setStatus("deleting");
        setMessage("");

        try {
            await deleteIdea(ideaId);
            navigate("/", { replace: true });
        } catch (error) {
            setShowDeleteConfirm(false);
            setStatus("error");
            setMessage(error instanceof Error ? error.message : "Could not delete idea.");
        }
    };

    return (
        <>
        <div
            className="min-h-screen"
            style={{
                background: currentTheme.colors.secondary_background,
                color: currentTheme.colors.text,
            }}
        >
            <IdeaSideMenu />

            <main className="ml-64 min-h-screen px-8 py-8">
                <div className="mx-auto flex max-w-6xl flex-col gap-6">
                    <section
                        className="rounded-lg border p-6 shadow-lg"
                        style={{
                            background: currentTheme.colors.background,
                            borderColor: currentTheme.colors.border,
                        }}
                    >
                        <div className="mb-6 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <FileText size={24} color={currentTheme.colors.primary} />
                                <div>
                                    <h1 className="text-2xl font-semibold">{ideaId ? "Continue idea" : "Capture idea"}</h1>
                                    {ideaId && <p className="mt-1 text-xs opacity-60">Saved idea #{ideaId}</p>}
                                </div>
                            </div>
                            {ideaId ? (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={isBusy}
                                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-red-400 transition-opacity hover:opacity-80 disabled:opacity-50"
                                    style={{ borderColor: "#ef4444" }}
                                >
                                    <Trash2 size={16} />
                                    Delete
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={resetIdea}
                                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-opacity hover:opacity-80"
                                    style={{ borderColor: currentTheme.colors.border }}
                                >
                                    <RotateCcw size={16} />
                                    Reset
                                </button>
                            )}
                        </div>

                        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                            <div className="flex flex-col gap-4">
                                <label className="flex flex-col gap-2">
                                    <span className="text-sm font-medium opacity-80">Title</span>
                                    <input
                                        value={title}
                                        onChange={(event) => setTitle(event.target.value)}
                                        placeholder="Inventory forecasting for independent pharmacies"
                                        className="rounded-md border px-4 py-3 outline-none"
                                        style={{
                                            background: currentTheme.colors.secondary_background,
                                            borderColor: currentTheme.colors.border,
                                            color: currentTheme.colors.text,
                                        }}
                                    />
                                </label>

                                <label className="flex flex-col gap-2">
                                    <span className="text-sm font-medium opacity-80">Idea notes</span>
                                    <textarea
                                        value={transcript || description}
                                        onChange={(event) => {
                                            resetTranscript();
                                            setDescription(event.target.value);
                                        }}
                                        placeholder="Type the rough idea here, or record a voice note and let NovaFlow use the transcript."
                                        rows={10}
                                        className="min-h-[260px] resize-none rounded-md border px-4 py-3 outline-none"
                                        style={{
                                            background: currentTheme.colors.secondary_background,
                                            borderColor: currentTheme.colors.border,
                                            color: currentTheme.colors.text,
                                        }}
                                    />
                                </label>

                                <div className="flex flex-wrap items-center gap-3">
                                    {status === "recording" ? (
                                        <button
                                            type="button"
                                            onClick={stopRecording}
                                            className="flex items-center gap-2 rounded-md px-4 py-3 font-medium"
                                            style={{
                                                background: currentTheme.colors.accent,
                                                color: currentTheme.colors.background,
                                            }}
                                        >
                                            <Square size={18} />
                                            Stop recording
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={startRecording}
                                            disabled={isBusy}
                                            className="flex items-center gap-2 rounded-md px-4 py-3 font-medium disabled:opacity-50"
                                            style={{
                                                background: currentTheme.colors.primary,
                                                color: currentTheme.colors.text,
                                            }}
                                        >
                                            <Mic size={18} />
                                            Record voice
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={submitIdea}
                                        disabled={!canSubmit || isBusy}
                                        className="flex items-center gap-2 rounded-md px-4 py-3 font-medium disabled:cursor-not-allowed disabled:opacity-50"
                                        style={{
                                            background: currentTheme.colors.text,
                                            color: currentTheme.colors.background,
                                        }}
                                    >
                                        {status === "transcribing" || status === "planning" ? (
                                            <Loader2 className="animate-spin" size={18} />
                                        ) : (
                                            <Send size={18} />
                                        )}
                                        {ideaId ? "Update plan" : "Plan idea"}
                                    </button>

                                    <span className="text-sm opacity-70">
                                        {status === "recording" && "Recording audio..."}
                                        {status === "loading" && "Loading saved idea..."}
                                        {status === "transcribing" && "Transcribing voice note..."}
                                        {status === "planning" && "Generating prioritized steps..."}
                                        {status === "feasibility" && "Generating country feasibility study..."}
                                        {status === "idle" && recordedAudio && "Recording ready"}
                                    </span>
                                </div>
                            </div>

                            <aside
                                className="self-start rounded-lg border p-5"
                                style={{
                                    background: currentTheme.colors.secondary_background,
                                    borderColor: currentTheme.colors.border,
                                }}
                            >
                                <div>
                                    <h2 className="text-lg font-semibold">Export and assess</h2>
                                    <p className="mt-1 text-sm opacity-70">
                                        Download the plan or assess it for a specific country.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => downloadPlanPdf(false)}
                                    disabled={!refinement}
                                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-medium transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                                    style={{ borderColor: currentTheme.colors.border }}
                                >
                                    <Download size={16} />
                                    Download plan PDF
                                </button>

                                {ideaId && refinement && (
                                    <div className="mt-5 flex flex-col gap-3">
                                        <label className="flex flex-col gap-2">
                                            <span className="text-sm font-medium opacity-80">Implementation country</span>
                                            <select
                                                value={feasibilityCountry}
                                                onChange={(event) => setFeasibilityCountry(event.target.value)}
                                                disabled={isBusy}
                                                className="w-full rounded-md border px-3 py-3 outline-none disabled:opacity-50"
                                                style={{
                                                    background: currentTheme.colors.background,
                                                    borderColor: currentTheme.colors.border,
                                                    color: currentTheme.colors.text,
                                                }}
                                            >
                                                <option value="">Select a country</option>
                                                {countries.map((country) => (
                                                    <option key={country} value={country}>{country}</option>
                                                ))}
                                            </select>
                                        </label>

                                        <button
                                            type="button"
                                            onClick={createFeasibilityStudy}
                                            disabled={!feasibilityCountry || isBusy}
                                            className="flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                                            style={{
                                                background: currentTheme.colors.primary,
                                                color: currentTheme.colors.text,
                                            }}
                                        >
                                            {status === "feasibility" ? <Loader2 className="animate-spin" size={18} /> : <Globe2 size={18} />}
                                            {feasibilityStudy ? "Regenerate study" : "Generate feasibility study"}
                                        </button>
                                    </div>
                                )}

                                {feasibilityStudy && (
                                    <button
                                        type="button"
                                        onClick={() => downloadPlanPdf(true)}
                                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-medium transition-opacity hover:opacity-80"
                                        style={{ borderColor: currentTheme.colors.border }}
                                    >
                                        <Download size={16} />
                                        Download full report PDF
                                    </button>
                                )}
                            </aside>
                        </div>
                    </section>

                    {(message || refinement) && (
                        <section
                            className="rounded-lg border p-6 shadow-lg"
                            style={{
                                background: currentTheme.colors.background,
                                borderColor: status === "error" ? "#ef4444" : currentTheme.colors.border,
                            }}
                        >
                            {message && (
                                <p className={status === "error" ? "text-red-400" : "text-sm opacity-80"}>
                                    {message}
                                </p>
                            )}

                            {refinement && (
                                <div className="mt-4 whitespace-pre-wrap rounded-md border p-4 text-sm leading-6" style={{ borderColor: currentTheme.colors.border }}>
                                    {refinement}
                                </div>
                            )}
                        </section>
                    )}

                    {planSteps.length > 0 && (
                        <section
                            className="rounded-lg border p-6 shadow-lg"
                            style={{
                                background: currentTheme.colors.background,
                                borderColor: currentTheme.colors.border,
                            }}
                        >
                            <div className="flex flex-wrap items-end justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold">Action tracker</h2>
                                    <p className="mt-1 text-sm opacity-70">
                                        Assign the work, set dates, and keep the plan moving.
                                    </p>
                                </div>
                                <p className="text-sm font-medium">
                                    {completedStepCount} of {planSteps.length} complete
                                </p>
                            </div>

                            <div
                                className="mt-4 h-2 overflow-hidden rounded-full"
                                style={{ background: currentTheme.colors.secondary_background }}
                                role="progressbar"
                                aria-label="Idea progress"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={stepProgress}
                            >
                                <div
                                    className="h-full rounded-full transition-[width]"
                                    style={{
                                        background: currentTheme.colors.primary,
                                        width: `${stepProgress}%`,
                                    }}
                                />
                            </div>

                            {stepError && <p className="mt-4 text-sm text-red-400">{stepError}</p>}

                            <div className="mt-4 divide-y" style={{ borderColor: currentTheme.colors.border }}>
                                {planSteps.map((step) => {
                                    const isSaving = savingStepId === step.id;
                                    const isDirty = hasStepChanges(step);

                                    return (
                                        <article key={step.id} className="py-5 first:pt-2 last:pb-0">
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={step.completed}
                                                    disabled={Boolean(savingStepId)}
                                                    onChange={(event) => {
                                                        const updated = { ...step, completed: event.target.checked };
                                                        editPlanStep(step.id, { completed: event.target.checked });
                                                        void savePlanStep(updated);
                                                    }}
                                                    className="mt-1 h-5 w-5 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                                                    style={{ accentColor: currentTheme.colors.primary }}
                                                    aria-label={`Mark ${step.title} complete`}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                                        <h3 className={`font-semibold ${step.completed ? "line-through opacity-60" : ""}`}>
                                                            {step.position}. {step.title}
                                                        </h3>
                                                        <span
                                                            className="rounded px-2 py-1 text-xs font-semibold"
                                                            style={{
                                                                background: currentTheme.colors.secondary_background,
                                                                color: currentTheme.colors.primary,
                                                            }}
                                                        >
                                                            {step.priority}
                                                        </span>
                                                    </div>
                                                    {step.details && (
                                                        <div className="mt-2 whitespace-pre-wrap text-sm leading-6 opacity-75">
                                                            {step.details}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-4 grid gap-3 pl-8 sm:grid-cols-3">
                                                <label className="flex flex-col gap-1.5">
                                                    <span className="text-xs font-medium opacity-70">Priority</span>
                                                    <select
                                                        value={step.priority}
                                                        onChange={(event) => editPlanStep(step.id, {
                                                            priority: event.target.value as IdeaStep["priority"],
                                                        })}
                                                        disabled={Boolean(savingStepId)}
                                                        className="rounded-md border px-3 py-2 text-sm outline-none disabled:opacity-50"
                                                        style={{
                                                            background: currentTheme.colors.secondary_background,
                                                            borderColor: currentTheme.colors.border,
                                                            color: currentTheme.colors.text,
                                                        }}
                                                    >
                                                        <option value="P0">P0 - Critical</option>
                                                        <option value="P1">P1 - Important</option>
                                                        <option value="P2">P2 - Later</option>
                                                    </select>
                                                </label>

                                                <label className="flex flex-col gap-1.5">
                                                    <span className="text-xs font-medium opacity-70">Owner</span>
                                                    <input
                                                        value={step.owner}
                                                        onChange={(event) => editPlanStep(step.id, { owner: event.target.value })}
                                                        disabled={Boolean(savingStepId)}
                                                        placeholder="Unassigned"
                                                        className="rounded-md border px-3 py-2 text-sm outline-none disabled:opacity-50"
                                                        style={{
                                                            background: currentTheme.colors.secondary_background,
                                                            borderColor: currentTheme.colors.border,
                                                            color: currentTheme.colors.text,
                                                        }}
                                                    />
                                                </label>

                                                <label className="flex flex-col gap-1.5">
                                                    <span className="text-xs font-medium opacity-70">Due date</span>
                                                    <input
                                                        type="date"
                                                        value={step.dueDate ?? ""}
                                                        onChange={(event) => editPlanStep(step.id, {
                                                            dueDate: event.target.value || null,
                                                        })}
                                                        disabled={Boolean(savingStepId)}
                                                        className="rounded-md border px-3 py-2 text-sm outline-none disabled:opacity-50"
                                                        style={{
                                                            background: currentTheme.colors.secondary_background,
                                                            borderColor: currentTheme.colors.border,
                                                            color: currentTheme.colors.text,
                                                        }}
                                                    />
                                                </label>
                                            </div>

                                            <div className="mt-3 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => void savePlanStep(step)}
                                                    disabled={!isDirty || Boolean(savingStepId)}
                                                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                                                    style={{ borderColor: currentTheme.colors.border }}
                                                >
                                                    {isSaving && <Loader2 className="animate-spin" size={15} />}
                                                    Save details
                                                </button>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {feasibilityStudy && (
                        <section
                            className="rounded-lg border p-6 shadow-lg"
                            style={{
                                background: currentTheme.colors.background,
                                borderColor: currentTheme.colors.border,
                            }}
                        >
                            <h2 className="mb-3 text-lg font-semibold">Feasibility study: {studyCountry}</h2>
                            <div
                                className="whitespace-pre-wrap rounded-md border p-4 text-sm leading-6"
                                style={{ borderColor: currentTheme.colors.border }}
                            >
                                {feasibilityStudy}
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
        {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-idea-title"
                    className="w-full max-w-md rounded-lg border p-6 shadow-xl"
                    style={{
                        background: currentTheme.colors.background,
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text,
                    }}
                >
                    <h2 id="delete-idea-title" className="text-lg font-semibold">Delete this idea?</h2>
                    <p className="mt-2 text-sm opacity-70">
                        It will be removed from Recent Ideas and can no longer be opened.
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={status === "deleting"}
                            className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
                            style={{ borderColor: currentTheme.colors.border }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirmDeleteIdea}
                            disabled={status === "deleting"}
                            className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                        >
                            {status === "deleting" ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                            Delete idea
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default IdeaPage;
