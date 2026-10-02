import { useEffect, useState } from "react";
import api from "../../lib/api";
import { unwrapApiData } from "../../lib/candidate";
import { collectPaginatedItems } from "../../lib/pagination";
import { getDemoRepository, MEMBERSHIP_EVENT } from "./demoRepository";

export default function useTalentProfile(userId) {
  const [state, setState] = useState({
    loading: true,
    resume: null,
    jobs: [],
    membership: null,
    profileError: "",
    jobsError: "",
    storageError: "",
  });
  const [reload, setReload] = useState(0);
  useEffect(() => {
    if (!userId) return undefined;
    const controller = new AbortController();
    let active = true;
    async function load() {
      const [profile, jobs] = await Promise.allSettled([
        api.get("/curriculos/me", { signal: controller.signal }),
        collectPaginatedItems((page) =>
          api.get("/vagas", {
            params: { page, per_page: 50 },
            signal: controller.signal,
          }),
        ),
      ]);
      if (!active) return;
      let membership = null;
      let storageError = "";
      try {
        membership = getDemoRepository().get(userId);
      } catch {
        storageError =
          "Não foi possível ler suas preferências neste navegador. Verifique se o armazenamento local está disponível.";
      }
      setState({
        loading: false,
        resume:
          profile.status === "fulfilled" ? unwrapApiData(profile.value) : null,
        jobs: jobs.status === "fulfilled" ? jobs.value : [],
        membership,
        storageError,
        profileError:
          profile.status === "rejected"
            ? "Não foi possível carregar seu currículo. Tente novamente antes de continuar."
            : "",
        jobsError:
          jobs.status === "rejected"
            ? "As áreas das vagas estão indisponíveis. Você ainda pode informar uma área de interesse."
            : "",
      });
    }
    function updateMembership() {
      try {
        const membership = getDemoRepository().get(userId);
        setState((current) => ({ ...current, membership, storageError: "" }));
      } catch {
        setState((current) => ({
          ...current,
          storageError: "Não foi possível ler suas preferências locais.",
        }));
      }
    }
    load();
    window.addEventListener(MEMBERSHIP_EVENT, updateMembership);
    window.addEventListener("storage", updateMembership);
    return () => {
      active = false;
      controller.abort();
      window.removeEventListener(MEMBERSHIP_EVENT, updateMembership);
      window.removeEventListener("storage", updateMembership);
    };
  }, [userId, reload]);
  function retry() {
    setState((current) => ({ ...current, loading: true }));
    setReload((current) => current + 1);
  }
  return { ...state, retry };
}
