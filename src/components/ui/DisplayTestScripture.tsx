import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SCRIPTURE } from "../../../data/scriptures";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, Platform } from "react-native";

function getRandomIndices(n: number, count = 5) {
    const uniqueNumbers: number[] = [];
    const targetCount = Math.min(count, n);

    while (uniqueNumbers.length < targetCount) {
        const randomNumber = Math.floor(Math.random() * n);
        if (!uniqueNumbers.includes(randomNumber)) {
            uniqueNumbers.push(randomNumber);
        }
    }

    return uniqueNumbers;
}

function shuffleArray<T>(items: T[]) {
    const shuffled = [...items];

    for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}

function getAnswerChoices(pool: string[], correctAnswer: string, wrongCount = 5) {
    const distractors = shuffleArray(pool.filter((item) => item !== correctAnswer)).slice(
        0,
        wrongCount
    );

    return shuffleArray([correctAnswer, ...distractors]);
}

function cleanWord(word: string) {
    return word.replace(/[.,;:!?]+$/g, "");
}

const WORD_POOL = Array.from(
    new Set(
        SCRIPTURE.flatMap((entry) =>
            entry.text
                .split(" ")
                .map((word) => cleanWord(word.trim()))
                .filter(Boolean)
        )
    )
);

export const DisplayTestScripture = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [activeBlankIndex, setActiveBlankIndex] = useState<number | null>(null);
    const [resultsChecked, setResultsChecked] = useState(false);
    const allowLeaveRef = useRef(false);

    const { id } = useLocalSearchParams<{ id?: string | string[] }>();
    const scriptIndex = Array.isArray(id) ? Number(id[0]) : Number(id);
    const scripture = SCRIPTURE[scriptIndex];

    if (!scripture) {
        return (
            <View>
                <Text>No scripture found.</Text>
            </View>
        );
    }

    const words = useMemo(() => scripture.text.split(" "), [scripture.text]);
    const hiddenIndices = useMemo(() => getRandomIndices(words.length), [scripture.text]);
    const answerChoices = useMemo(() => {
        if (activeBlankIndex === null) {
            return [];
        }

        return getAnswerChoices(WORD_POOL, cleanWord(words[activeBlankIndex]));
    }, [activeBlankIndex, words]);

    const allBlanksFilled = hiddenIndices.every((index) => selectedAnswers[index] !== undefined);
    const correctCount = hiddenIndices.filter(
        (index) => selectedAnswers[index] === cleanWord(words[index])
    ).length;
    const quizLocked = resultsChecked;

    useEffect(() => {
        if (Platform.OS === "web") {
            window.history.pushState(null, "", window.location.href);

            const onPopState = () => {
                if (allowLeaveRef.current) {
                    return;
                }

                const shouldLeave = window.confirm(
                    "Leave this quiz? Your current answers will be lost."
                );

                if (shouldLeave) {
                    allowLeaveRef.current = true;
                    window.removeEventListener("popstate", onPopState);
                    window.history.back();
                    return;
                }

                window.history.pushState(null, "", window.location.href);
            };

            const onBeforeUnload = (event: BeforeUnloadEvent) => {
                if (allowLeaveRef.current) {
                    return;
                }

                event.preventDefault();
                event.returnValue = "";
            };

            window.addEventListener("popstate", onPopState);
            window.addEventListener("beforeunload", onBeforeUnload);
            return () => {
                window.removeEventListener("popstate", onPopState);
                window.removeEventListener("beforeunload", onBeforeUnload);
            };
        }

        const onBackPress = () => true;
        const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);

        return () => subscription.remove();
    }, []);

    const openModalForBlank = (blankIndex: number) => {
        if (quizLocked) {
            return;
        }

        setActiveBlankIndex(blankIndex);
        setModalVisible(true);
    };

    const handleWordPick = (word: string) => {
        if (quizLocked || activeBlankIndex === null) {
            return;
        }

        setSelectedAnswers((current) => ({
            ...current,
            [activeBlankIndex]: word,
        }));

        setResultsChecked(false);
        setModalVisible(false);
        setActiveBlankIndex(null);
    };

    const handleCheckAnswers = () => {
        if (!allBlanksFilled) {
            return;
        }

        setResultsChecked(true);
    };

    const handleTryAgain = () => {
        setSelectedAnswers({});
        setResultsChecked(false);
        setActiveBlankIndex(null);
        setModalVisible(false);
    };

    return (
        <View>
            <Text style={{ color: "black", fontSize: 18, marginBottom: 10, fontWeight: "bold" }}>
                {scripture.book} {scripture.chapter} : {scripture.verse}
            </Text>
            <View style={styles.scriptureLine}>
                {words.map((word, index) => {
                    const isBlank = hiddenIndices.includes(index);

                    if (!isBlank) {
                        return (
                            <Text style={styles.visibleWord} key={index}>
                                {word + " "}
                            </Text>
                        );
                    }

                    const selectedWord = selectedAnswers[index];
                    const displayedWord = selectedWord !== undefined ? selectedWord : "_____";
                    const correctWord = cleanWord(words[index]);
                    const isCorrect = resultsChecked && selectedWord === correctWord;
                    const isWrong =
                        resultsChecked &&
                        selectedWord !== undefined &&
                        selectedWord !== correctWord;

                    return (
                        <TouchableOpacity
                            key={index}
                            style={styles.blankWord}
                            disabled={quizLocked}
                            onPress={() => openModalForBlank(index)}
                        >
                            <Text
                                style={[
                                    styles.blankWordText,
                                    isCorrect && styles.correctWordText,
                                    isWrong && styles.wrongWordText,
                                ]}
                            >
                                {displayedWord + " "}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {allBlanksFilled ? (
                <Pressable style={styles.checkButton} onPress={handleCheckAnswers}>
                    <Text style={styles.checkButtonText}>
                        {resultsChecked
                            ? `Checked: ${correctCount}/${hiddenIndices.length}`
                            : "Check Answers"}
                    </Text>
                </Pressable>
            ) : (
                <Text style={styles.progressText}>Fill all blanks to check your answers.</Text>
            )}

            {resultsChecked && correctCount !== hiddenIndices.length ? (
                <Pressable style={styles.tryAgainButton} onPress={handleTryAgain}>
                    <Text style={styles.tryAgainButtonText}>Try Again</Text>
                </Pressable>
            ) : null}

            {resultsChecked && correctCount === hiddenIndices.length ? (
                <Pressable
                    style={styles.nextButton}
                    onPress={() => {
                        allowLeaveRef.current = true;
                        router.replace({
                            pathname: "/",
                            params: { index: String(scriptIndex + 1) },
                        });
                    }}
                >
                    <Text style={styles.nextButtonText}>Next</Text>
                </Pressable>
            ) : null}

            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Scripture Test</Text>
                        <Text style={styles.modalBody}>
                            Choose the answer for the selected blank.
                        </Text>

                        {activeBlankIndex !== null ? (
                            <Text style={styles.activeBlankText}>Blank selected</Text>
                        ) : null}

                        <View style={styles.wordList}>
                            {answerChoices.map((answer) => (
                                <TouchableOpacity
                                    key={answer}
                                    style={styles.wordChip}
                                    disabled={quizLocked}
                                    onPress={() => handleWordPick(answer)}
                                >
                                    <Text style={styles.wordChipText}>{answer}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Pressable
                            style={styles.closeButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    scriptureLine: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "flex-start",
    },
    blankWord: {
        marginRight: 2,
    },
    blankWordText: {
        color: "blue",
        fontSize: 24,
    },
    correctWordText: {
        color: "green",
    },
    wrongWordText: {
        color: "red",
    },
    visibleWord: {
        color: "grey",
        fontSize: 24,
    },
    progressText: {
        marginTop: 16,
        fontSize: 14,
        color: "#374151",
    },
    checkButton: {
        marginTop: 16,
        alignSelf: "flex-start",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: "#1f2937",
    },
    checkButtonText: {
        color: "#fff",
        fontWeight: "700",
    },
    tryAgainButton: {
        marginTop: 12,
        alignSelf: "flex-start",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: "#b91c1c",
    },
    tryAgainButtonText: {
        color: "#fff",
        fontWeight: "700",
    },
    nextButton: {
        marginTop: 12,
        alignSelf: "flex-start",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: "#166534",
    },
    nextButtonText: {
        color: "#fff",
        fontWeight: "700",
    },
    activeBlankText: {
        marginBottom: 12,
        fontSize: 15,
        fontWeight: "600",
        color: "#111827",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
    },
    modalContent: {
        width: "100%",
        maxWidth: 360,
        borderRadius: 20,
        backgroundColor: "#fff8ef",
        padding: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 10,
        color: "#1f2937",
    },
    modalBody: {
        fontSize: 16,
        lineHeight: 22,
        color: "#374151",
        marginBottom: 16,
    },
    wordList: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 16,
    },
    wordChip: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: "#e0e7ff",
    },
    wordChipText: {
        color: "#1d4ed8",
        fontWeight: "700",
    },
    closeButton: {
        alignSelf: "flex-end",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: "#b45309",
    },
    closeButtonText: {
        color: "#fff",
        fontWeight: "700",
    },
});
