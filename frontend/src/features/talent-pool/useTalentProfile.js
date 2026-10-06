import { useEffect, useState } from "react";
import api from "../../lib/api";
import { unwrapApiData } from "../../lib/candidate";
import { collectPaginatedItems } from "../../lib/pagination";
import talentPoolApi from "./talentPoolApi";

export default function useTalentProfile(userId) {
  const [state, setState] = useState({
    loading: true, resume: null, jobs: [], membership: null,
    profileError: "", jobsError: "", membershipError: "",
  });
  const [reload, setReload] = useState(0);
  useEffect(() => {
    if (!userId) return undefined;
    const controller = new AbortController();
    let active = true;
    async function load() {
      const [profile, jobs, membership] = await Promise.allSettled([
        api.get("/curriculos/me", { signal: controller.signal }),
        collectPaginatedItems((page) => api.get("/vagas", {
          params: { page, per_page: 50 }, signal: controller.signal,
        })),
        talentPoolApi.getMembership(controller.signal),
      ]);
      if (!active) return;
      setState({
        loading: false,
        resume: profile.status === "fulfilled" ? unwrapApiData(profile.value) : null,
        jobs: jobs.status === "fulfilled" ? jobs.value : [],
        membership: membership.status === "fulfilled" ? membership.value : null,
        membershipError: membership.status === "rejected"
          ? "Não foi possível consultar sua participação no Banco de Talentos. Tente novamente." : "",
        profileError: profile.status === "rejected"
          ? "Não foi possível carregar seu currículo. Tente novamente para atualizar seu perfil." : "",
        jobsError: jobs.status === "rejected"
          ? "As sugestões das vagas estão indisponíveis. Você ainda pode informar uma área de interesse." : "",
      });
    }
    load();
    return () => { active = false; controller.abort(); };
  }, [userId, reload]);
  function retry() {
    setState((current) => ({ ...current, loading: true }));
    setReload((current) => current + 1);
  }
  function setMembership(membership) {
    setState((current) => ({ ...current, membership, membershipError: "" }));
  }
  return { ...state, retry, setMembership };
}
