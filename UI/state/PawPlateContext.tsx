import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  clearSavedBowlResults,
  emptyBowlResults,
  loadSavedBowlResults,
  saveBowlResults,
  type BowlId,
  type BowlResults,
} from "../services/bowlStorageService";
import {
  clearHistoryEvents,
  createDetectionHistoryEvent,
  loadHistoryEvents,
  saveHistoryEvents,
  type HistoryEvent,
} from "../services/historyStorageService";
import {
  loadSchedules,
  saveSchedules,
  type FeedingSchedule,
} from "../services/scheduleStorageService";
import {
  detectFood,
  getPawPlateStatus,
  PawPlateApiError,
  type PawPlateStatus,
} from "../services/pawplateApi";

export type ConnectionState =
  | "connected"
  | "connecting"
  | "disconnected"
  | "unknown";

type BowlErrors = Record<BowlId, string | null>;

type PawPlateContextValue = {
  bowlResults: BowlResults;
  bowlErrors: BowlErrors;
  scanningBowlId: BowlId | null;
  scanBowl: (bowlId: BowlId) => Promise<void>;
  clearBowlResults: () => Promise<void>;
  status: PawPlateStatus | null;
  statusError: string | null;
  connectionState: ConnectionState;
  isStatusLoading: boolean;
  refreshStatus: () => Promise<void>;
  historyEvents: HistoryEvent[];
  clearHistory: () => Promise<void>;
  schedules: FeedingSchedule[];
  addSchedule: () => Promise<void>;
  toggleSchedule: (id: string) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
};

const PawPlateContext = createContext<PawPlateContextValue | null>(null);

const emptyBowlErrors: BowlErrors = {
  1: null,
  2: null,
  3: null,
};

export function PawPlateProvider({ children }: { children: ReactNode }) {
  const [bowlResults, setBowlResults] = useState<BowlResults>(emptyBowlResults);
  const [bowlErrors, setBowlErrors] = useState<BowlErrors>(emptyBowlErrors);
  const [scanningBowlId, setScanningBowlId] = useState<BowlId | null>(null);
  const [status, setStatus] = useState<PawPlateStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("unknown");
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [historyEvents, setHistoryEvents] = useState<HistoryEvent[]>([]);
  const [schedules, setSchedules] = useState<FeedingSchedule[]>([]);
  const isMounted = useRef(true);
  const scanInFlight = useRef(false);

  useEffect(() => {
    isMounted.current = true;

    void loadSavedBowlResults().then((savedResults) => {
      if (isMounted.current) {
        setBowlResults(savedResults);
      }
    });
    void loadHistoryEvents().then((savedEvents) => {
      if (isMounted.current) {
        setHistoryEvents(savedEvents);
      }
    });
    void loadSchedules().then((savedSchedules) => {
      if (isMounted.current) {
        setSchedules(savedSchedules);
      }
    });

    return () => {
      isMounted.current = false;
    };
  }, []);

  const refreshStatus = useCallback(async () => {
    setIsStatusLoading(true);
    setStatusError(null);
    setConnectionState("connecting");

    try {
      const nextStatus = await getPawPlateStatus();

      if (isMounted.current) {
        setStatus(nextStatus);
        setConnectionState(nextStatus.connected ? "connected" : "disconnected");
      }
    } catch (error) {
      console.warn("PawPlate status check failed", error);

      if (isMounted.current) {
        setStatusError(getStatusErrorMessage(error));
        setConnectionState("disconnected");
      }
    } finally {
      if (isMounted.current) {
        setIsStatusLoading(false);
      }
    }
  }, []);

  const scanBowl = useCallback(
    async (bowlId: BowlId) => {
      if (scanInFlight.current) {
        return;
      }

      scanInFlight.current = true;
      setScanningBowlId(bowlId);
      setBowlErrors((currentErrors) => ({
        ...currentErrors,
        [bowlId]: null,
      }));

      try {
        const detection = await detectFood(bowlId);

        if (!isMounted.current) {
          return;
        }

        setBowlResults((currentResults) => {
          const nextResults = {
            ...currentResults,
            [bowlId]: detection,
          };

          void saveBowlResults(nextResults);
          return nextResults;
        });

        setConnectionState("connected");
        setHistoryEvents((currentEvents) => {
          const nextEvents = [
            createDetectionHistoryEvent(bowlId, detection),
            ...currentEvents,
          ];

          void saveHistoryEvents(nextEvents);
          return nextEvents;
        });
      } catch (error) {
        console.warn(`PawPlate scan failed for Bowl ${bowlId}`, error);

        if (isMounted.current) {
          setBowlErrors((currentErrors) => ({
            ...currentErrors,
            [bowlId]: getDetectionErrorMessage(error),
          }));

          if (error instanceof PawPlateApiError && error.kind === "network") {
            setConnectionState("disconnected");
          }
        }
      } finally {
        scanInFlight.current = false;

        if (isMounted.current) {
          setScanningBowlId(null);
        }
      }
    },
    []
  );

  const clearBowlResults = useCallback(async () => {
    await clearSavedBowlResults();
    setBowlResults(emptyBowlResults);
    setBowlErrors(emptyBowlErrors);
  }, []);

  const clearHistory = useCallback(async () => {
    await clearHistoryEvents();
    setHistoryEvents([]);
  }, []);

  const addSchedule = useCallback(async () => {
    const nextBowlId = ((schedules.length % 3) + 1) as BowlId;
    const nextSchedule: FeedingSchedule = {
      id: `${Date.now()}`,
      bowlId: nextBowlId,
      time: "8:00 AM",
      enabled: true,
    };
    const nextSchedules = [...schedules, nextSchedule];

    setSchedules(nextSchedules);
    await saveSchedules(nextSchedules);
  }, [schedules]);

  const toggleSchedule = useCallback(
    async (id: string) => {
      const nextSchedules = schedules.map((schedule) =>
        schedule.id === id
          ? { ...schedule, enabled: !schedule.enabled }
          : schedule
      );

      setSchedules(nextSchedules);
      await saveSchedules(nextSchedules);
    },
    [schedules]
  );

  const deleteSchedule = useCallback(
    async (id: string) => {
      const nextSchedules = schedules.filter((schedule) => schedule.id !== id);

      setSchedules(nextSchedules);
      await saveSchedules(nextSchedules);
    },
    [schedules]
  );

  const value = useMemo(
    () => ({
      bowlResults,
      bowlErrors,
      scanningBowlId,
      scanBowl,
      clearBowlResults,
      status,
      statusError,
      connectionState,
      isStatusLoading,
      refreshStatus,
      historyEvents,
      clearHistory,
      schedules,
      addSchedule,
      toggleSchedule,
      deleteSchedule,
    }),
    [
      addSchedule,
      bowlErrors,
      bowlResults,
      clearBowlResults,
      clearHistory,
      connectionState,
      deleteSchedule,
      historyEvents,
      isStatusLoading,
      refreshStatus,
      scanBowl,
      scanningBowlId,
      schedules,
      status,
      statusError,
      toggleSchedule,
    ]
  );

  return (
    <PawPlateContext.Provider value={value}>
      {children}
    </PawPlateContext.Provider>
  );
}

export function usePawPlate() {
  const context = useContext(PawPlateContext);

  if (!context) {
    throw new Error("usePawPlate must be used inside PawPlateProvider.");
  }

  return context;
}

function getStatusErrorMessage(error: unknown) {
  if (error instanceof PawPlateApiError && error.kind === "network") {
    return "Unable to connect to PawPlate. Make sure the Raspberry Pi and this device are on the same network.";
  }

  return "Unable to load Raspberry Pi status.";
}

function getDetectionErrorMessage(error: unknown) {
  if (error instanceof PawPlateApiError) {
    switch (error.kind) {
      case "network":
        return "Unable to connect to PawPlate. Make sure the Raspberry Pi and this device are on the same network.";
      case "timeout":
        return "Food detection took too long. Please try again.";
      case "busy":
        return "PawPlate is already analyzing the bowl. Please wait and try again.";
      case "invalid-json":
        return "PawPlate sent an invalid detection response. Please try again.";
      default:
        return "Food detection failed. Please try again.";
    }
  }

  return "Food detection failed. Please try again.";
}
