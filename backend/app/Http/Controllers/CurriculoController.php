<?php

namespace App\Http\Controllers;

use App\Models\Curriculo;
use Illuminate\Http\Request;

class CurriculoController extends Controller
{
    public function index(Request $request)
    {
        if ($request->user()->role === 'recrutador') {
            return Curriculo::with('user')->get();
        }

        return Curriculo::where('user_id', $request->user()->id)->get();
    }

    public function store(Request $request)
    {
        $curriculo = Curriculo::create([
            'user_id' => $request->user()->id,
            'nome_completo' => $request->nome_completo,
            'area_atuacao' => $request->area_atuacao,
            'telefone' => $request->telefone,
            'email' => $request->email,
            'cidade_estado' => $request->cidade_estado,
            'links' => $request->links,
            'resumo' => $request->resumo,
            'foto' => $request->foto,
        ]);
    
        // EXPERIENCIAS
        if ($request->experiencias) {
            foreach ($request->experiencias as $exp) {
                $curriculo->experiencias()->create($exp);
            }
        }
    
        // FORMAÇÕES
        if ($request->formacoes) {
            foreach ($request->formacoes as $form) {
                $curriculo->formacoes()->create($form);
            }
        }
    
        // CURSOS
        if ($request->cursos) {
            foreach ($request->cursos as $curso) {
                $curriculo->cursos()->create($curso);
            }
        }
    
        // HABILIDADES
        if ($request->habilidades) {
            foreach ($request->habilidades as $hab) {
                $curriculo->habilidades()->create($hab);
            }
        }
    
        // IDIOMAS
        if ($request->idiomas) {
            foreach ($request->idiomas as $idioma) {
                $curriculo->idiomas()->create($idioma);
            }
        }
    
        return $curriculo->load([
            'experiencias',
            'formacoes',
            'cursos',
            'habilidades',
            'idiomas'
        ]);
    }

    public function show($id)
    {
        return Curriculo::with('user')->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $curriculo = Curriculo::findOrFail($id);

        if ($curriculo->user_id !== $request->user()->id) {
            return response()->json(['erro' => 'Não autorizado'], 403);
        }

        $curriculo->update($request->all());
        return $curriculo;
    }

    public function destroy(Request $request, $id)
    {
        $curriculo = Curriculo::findOrFail($id);

        if ($curriculo->user_id !== $request->user()->id) {
            return response()->json(['erro' => 'Não autorizado'], 403);
        }

        $curriculo->delete();
        return response()->json(['mensagem' => 'Deletado com sucesso']);
    }
}