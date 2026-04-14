<?php

namespace App\Http\Controllers;

use App\Models\Vaga;
use Illuminate\Http\Request;

class VagaController extends Controller
{
    public function index()
    {
        return Vaga::all();
    }

    public function store(Request $request)
    {
        $request->validate([
            'titulo' => 'required',
            'descricao' => 'required'
        ]);

        return Vaga::create($request->all());
    }

    public function show($id)
    {
        return Vaga::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $vaga = Vaga::findOrFail($id);
        $vaga->update($request->all());
        return $vaga;
    }

    public function destroy($id)
    {
        Vaga::destroy($id);
        return response()->json(['mensagem' => 'Deletado com sucesso']);
    }
}