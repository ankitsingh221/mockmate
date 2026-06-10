import { useCallback, useReducer } from "react";
import api from "../api/axios";

const init = {
  interview:   null,
  question:    null,
  roundNumber: 0,
  totalRounds: 0,
  evaluation:  null,
  phase:       "loading",   
  error:       null,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_QUESTION":
      return {
        ...state,
        question:    action.payload.question    ?? action.payload,
        roundNumber: action.payload.roundNumber ?? state.roundNumber + 1,
        totalRounds: action.payload.totalRounds ?? state.totalRounds,
        evaluation:  null,
        phase:       "question",
        error:       null,
      };
    case "EVALUATING":
      return { ...state, phase: "evaluating" };
    case "SET_EVALUATION":
      return { ...state, evaluation: action.payload, phase: "feedback" };
    case "DONE":
      return { ...state, phase: "done" };
    case "ERROR":
      return { ...state, phase: "error", error: action.payload };
    case "SET_INTERVIEW":
      return { ...state, interview: action.payload };
    default:
      return state;
  }
}

export function useInterview(interviewId) {
  const [state, dispatch] = useReducer(reducer, init);

  // Load first question 
  const loadQuestion = useCallback((questionData) => {
    dispatch({ type: "SET_QUESTION", payload: questionData });
  }, []);

  //Submit an answer
  const submitAnswer = useCallback(async (answerText) => {
    dispatch({ type: "EVALUATING" });
    try {
      const { data } = await api.post(`/interviews/${interviewId}/answer`, {
        answer: answerText,
      });

      const payload = data.data;

      if (!payload) {
        throw new Error("Empty response from server");
      }

      const evaluation = payload.evaluation;

      dispatch({ type: "SET_EVALUATION", payload: evaluation });

      return {
        evaluation,
        nextQuestion: payload.nextQuestion  ?? null,
        isCompleted:  payload.isCompleted   ?? false,
        currentRound: payload.currentRound  ?? state.roundNumber,
        maxRounds:    payload.maxRounds     ?? state.totalRounds,
      };
    } catch (err) {
      const msg = err.response?.data?.message ?? "Failed to submit answer.";
      dispatch({ type: "ERROR", payload: msg });
      throw err;
    }
  }, [interviewId, state.roundNumber, state.totalRounds]);

  // End interview early
  const endInterview = useCallback(async () => {
    try {
      // backend returns { success, message, data: { overallScore, strengths, ... } }
      const { data } = await api.post(`/interviews/${interviewId}/end`);
      dispatch({ type: "DONE" });
      return data.data ?? null;
    } catch (err) {
      const msg = err.response?.data?.message ?? "Failed to end interview.";
      dispatch({ type: "ERROR", payload: msg });
      throw err;
    }
  }, [interviewId]);

  //Advance to next question 
  const advanceToNext = useCallback((nextQuestion) => {
    dispatch({ type: "SET_QUESTION", payload: nextQuestion });
  }, []);

  // Mark interview as done 
  const markDone = useCallback(() => {
    dispatch({ type: "DONE" });
  }, []);

  return { state, loadQuestion, submitAnswer, endInterview, advanceToNext, markDone };
}