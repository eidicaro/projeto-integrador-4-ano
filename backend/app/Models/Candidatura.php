<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Candidatura extends Model
{
    protected $fillable = [
        'user_id',
        'vaga_id',
        'curriculo_id',
        'status'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function vaga()
    {
        return $this->belongsTo(Vaga::class);
    }

    public function curriculo()
    {
        return $this->belongsTo(Curriculo::class);
    }
}