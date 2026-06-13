import { useCallback, useReducer, useEffect } from "react";
import api from "../api/axios";

const init = {
  interview: null,
  question: null,
  roundNumber: 1,
  totalRounds: 0,
  evaluation: null,
  phase: "loading",
  error: null,
  isSubmitting: false, // Added to prevent double submission
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, phase: "loading", error: null };
    case "SET_INTERVIEW":
      return {
        ...state,
        interview: action.payload,
        totalRounds:
          action.payload?.maxRounds || action.payload?.totalRounds || 0,
      };
    case "SET_QUESTION":
      return {
        ...state,
        question: action.payload.question ?? action.payload,
        roundNumber: action.payload.roundNumber,
        totalRounds: action.payload.totalRounds ?? state.totalRounds,
        evaluation: null,
        phase: "question",
        error: null,
        isSubmitting: false,
      };
    case "EVALUATING":
      return { ...state, phase: "evaluating", isSubmitting: true };
    case "SET_EVALUATION":
      return {
        ...state,
        evaluation: action.payload,
        phase: "feedback",
        isSubmitting: false,
      };
    case "DONE":
      return { ...state, phase: "done", isSubmitting: false };
    case "ERROR":
      return {
        ...state,
        phase: "error",
        error: action.payload,
        isSubmitting: false,
      };
    case "RESET_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
}

export function useInterview(interviewId) {
  const [state, dispatch] = useReducer(reducer, init);

  // Load interview data
  const fetchInterview = useCallback(async () => {
    if (!interviewId) {
      dispatch({ type: "ERROR", payload: "No interview ID provided" });
      return;
    }

    dispatch({ type: "SET_LOADING" });

    try {
      const { data } = await api.get(`/interviews/${interviewId}`);
      const interview = data.interview ?? data.data ?? data;

      if (!interview) {
        throw new Error("Interview not found");
      }

      dispatch({ type: "SET_INTERVIEW", payload: interview });

      // If interview has a current question, load it
      if (interview.currentQuestion) {
        dispatch({
          type: "SET_QUESTION",
          payload: {
            question: interview.currentQuestion,
            roundNumber: (interview.currentRound ?? 0) + 1,
            totalRounds: interview.maxRounds ?? interview.totalRounds ?? 5,
          },
        });
      } else if (interview.status === "completed") {
        dispatch({ type: "DONE" });
      }

      return interview;
    } catch (err) {
      const msg = err.response?.data?.message ?? "Failed to load interview.";
      dispatch({ type: "ERROR", payload: msg });
      throw err;
    }
  }, [interviewId]);

  // Auto-load interview on mount
  useEffect(() => {
    if (interviewId) {
      fetchInterview();
    }
  }, [interviewId, fetchInterview]);

  // Load first question (for text mode)
  const loadQuestion = useCallback((questionData) => {
    if (!questionData) {
      dispatch({ type: "ERROR", payload: "No question data provided" });
      return;
    }

    dispatch({ type: "SET_QUESTION", payload: questionData });
  }, []);

  // Submit an answer
  const submitAnswer = useCallback(
    async (answerText) => {
      // Prevent double submission
      if (state.isSubmitting || state.phase === "evaluating") {
        return null;
      }

      if (!answerText || answerText.trim().length === 0) {
        dispatch({ type: "ERROR", payload: "Answer cannot be empty" });
        return null;
      }

      dispatch({ type: "EVALUATING" });

      try {
        const { data } = await api.post(`/interviews/${interviewId}/answer`, {
          answer: answerText.trim(),
        });

        const payload = data.data || data;

        if (!payload) {
          throw new Error("Empty response from server");
        }

        const evaluation = payload.evaluation;

        if (!evaluation) {
          throw new Error("No evaluation received from server");
        }

        dispatch({ type: "SET_EVALUATION", payload: evaluation });

        return {
          evaluation,
          nextQuestion: payload.nextQuestion ?? null,
          isCompleted: payload.isCompleted ?? false,
          currentRound: payload.currentRound ?? state.roundNumber,
          maxRounds: payload.maxRounds ?? state.totalRounds,
          overallScore: payload.overallScore ?? null,
        };
      } catch (err) {
        const msg =
          err.response?.data?.message ??
          err.message ??
          "Failed to submit answer.";
        dispatch({ type: "ERROR", payload: msg });
        throw err;
      }
    },
    [
      interviewId,
      state.roundNumber,
      state.totalRounds,
      state.isSubmitting,
      state.phase,
    ],
  );

  // End interview early
  const endInterview = useCallback(async () => {
    if (state.isSubmitting) {
      // wait for current answer to submmitting
      return null;  
    }

    try {
      const { data } = await api.post(`/interviews/${interviewId}/end`);
      dispatch({ type: "DONE" });

      // Return the report data if available
      return data.data ?? data ?? null;
    } catch (err) {
      const msg = err.response?.data?.message ?? "Failed to end interview.";
      dispatch({ type: "ERROR", payload: msg });
      throw err;
    }
  }, [interviewId, state.isSubmitting]);

  // Advance to next question
  const advanceToNext = useCallback((nextQuestion) => {
    if (!nextQuestion) {
      return;
    }

    dispatch({ type: "SET_QUESTION", payload: nextQuestion });
  }, []);

  // Mark interview as done
  const markDone = useCallback(() => {
    dispatch({ type: "DONE" });
  }, []);

  // Reset error
  const resetError = useCallback(() => {
    dispatch({ type: "RESET_ERROR" });
  }, []);

  return {
    state,
    fetchInterview, // Expose this for manual refresh
    loadQuestion,
    submitAnswer,
    endInterview,
    advanceToNext,
    markDone,
    resetError,
  };
}
