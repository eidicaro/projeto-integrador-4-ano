<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Curriculo extends Model
{
    protected $fillable = [
        'user_id',
        'nome_completo',
        'area_atuacao',
        'telefone',
        'email',
        'cidade_estado',
        'links',
        'resumo',
        'foto'
    ];
    
    public function experiencias()
    {
        return $this->hasMany(Experiencia::class);
    }
    
    public function formacoes()
    {
        return $this->hasMany(Formacao::class);
    }
    
    public function cursos()
    {
        return $this->hasMany(Curso::class);
    }
    
    public function habilidades()
    {
        return $this->hasMany(Habilidade::class);
    }
    
    public function idiomas()
    {
        return $this->hasMany(Idioma::class);
    }
    public function candidaturas()
    {
        return $this->hasMany(Candidatura::class);
    }
}