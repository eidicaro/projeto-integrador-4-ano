<?php

namespace App\Http\Controllers;

use App\Models\Candidatura;
use App\Models\Vaga;
use App\Models\Curriculo;
use Illuminate\Http\Request;

class CandidaturaController extends Controller
{
    // 🔹 Criar candidatura
    public function store(Request $request)
    {
        $request->validate([
            'vaga_id' => 'required|exists:vagas,id',
            'curriculo_id' => 'required|exists:curriculos,id'
        ]);

        // Verifica se o currículo pertence ao usuário
        $curriculo = Curriculo::where('id', $request->curriculo_id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$curriculo) {
            return response()->json(['erro' => 'Currículo inválido'], 403);
        }

        // Evita candidatura duplicada
        $existe = Candidatura::where('user_id', $request->user()->id)
            ->where('vaga_id', $request->vaga_id)
            ->first();

        if ($existe) {
            return response()->json(['erro' => 'Você já se candidatou para esta vaga'], 400);
        }

        $candidatura = Candidatura::create([
            'user_id' => $request->user()->id,
            'vaga_id' => $request->vaga_id,
            'curriculo_id' => $request->curriculo_id,
            'status' => 'pendente'
        ]);

        return $candidatura->load(['vaga', 'curriculo']);
    }

    // 🔹 Listar minhas candidaturas (candidato)
    public function minhas(Request $request)
    {
        return Candidatura::where('user_id', $request->user()->id)
            ->with(['vaga'])
            ->get();
    }

    // 🔹 Ver candidatos de uma vaga (admin)
    public function candidatosPorVaga($vaga_id, Request $request)
    {
        if ($request->user()->role !== 'recrutador') {
            return response()->json(['erro' => 'Não autorizado'], 403);
        }

        return Candidatura::where('vaga_id', $vaga_id)
            ->with(['user', 'curriculo'])
            ->get();
    }

    // 🔹 Atualizar status (admin)
    public function updateStatus(Request $request, $id)
    {
        if ($request->user()->role !== 'recrutador') {
            return response()->json(['erro' => 'Não autorizado'], 403);
        }

        $request->validate([
            'status' => 'required|in:pendente,aprovado,recusado'
        ]);

        $candidatura = Candidatura::findOrFail($id);
        $candidatura->update(['status' => $request->status]);

        return $candidatura;
    }
}