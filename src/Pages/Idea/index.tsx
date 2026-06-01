import { useMemo, useRef, useState } from "react";
import { FileText, Loader2, Mic, RotateCcw, Send, Square } from "lucide-react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { IdeaSideMenu } from "../../components/ui/idea-side-menu";
import { useTheme } from "../../context/ThemeContext";
import { createIdea, transcribeIdeaAudio } from "../../../apiClient/IdeaClient";

type SubmitStatus = "idle" | "recording" | "transcribing" | "planning" | "done" | "error";

const IdeaPage = () => {
    const { currentTheme } = useTheme();
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

    const ideaDescription = useMemo(() => {
        const speechText = transcript.trim();
        if (speechText.length > 0) {
            return speechText;
        }
        return description.trim();
    }, [description, transcript]);

    const isBusy = status === "recording" || status === "transcribing" || status === "planning";
    const canSubmit = title.trim().length > 0 && (description.trim().length > 0 || transcript.trim().length > 0 || recordedAudio);

    const startRecording = async () => {
        setMessage("");
        setRefinement("");
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
        resetTranscript();
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
            const response = await createIdea({
                title: title.trim(),
                description: finalDescription,
            });

            setRefinement(response.refinement ?? "");
            setMessage(response.message);
            setStatus("done");
        } catch (error) {
            setStatus("error");
            setMessage(error instanceof Error ? error.message : "Could not submit idea.");
        }
    };

    return (
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
                                <h1 className="text-2xl font-semibold">Capture idea</h1>
                            </div>
                            <button
                                type="button"
                                onClick={resetIdea}
                                className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-opacity hover:opacity-80"
                                style={{ borderColor: currentTheme.colors.border }}
                            >
                                <RotateCcw size={16} />
                                Reset
                            </button>
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
                                        Plan idea
                                    </button>

                                    <span className="text-sm opacity-70">
                                        {status === "recording" && "Recording audio..."}
                                        {status === "transcribing" && "Transcribing voice note..."}
                                        {status === "planning" && "Generating prioritized steps..."}
                                        {status === "idle" && recordedAudio && "Recording ready"}
                                    </span>
                                </div>
                            </div>

                            <aside
                                className="rounded-lg border p-5"
                                style={{
                                    background: currentTheme.colors.secondary_background,
                                    borderColor: currentTheme.colors.border,
                                }}
                            >
                                <h2 className="mb-3 text-lg font-semibold">Input status</h2>
                                <div className="flex flex-col gap-3 text-sm opacity-80">
                                    <p>Speech recognition: {browserSupportsSpeechRecognition ? "available" : "not available"}</p>
                                    <p>Voice recording: {recordedAudio ? `${Math.round(recordedAudio.size / 1024)} KB captured` : "none yet"}</p>
                                    <p>Characters: {ideaDescription.length}</p>
                                </div>
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
                </div>
            </main>
        </div>
    );
};

export default IdeaPage;
